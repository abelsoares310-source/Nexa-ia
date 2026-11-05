import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Trophy,
  Target,
  Moon,
  Volume2,
  VolumeX,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
  Flame,
  Brain,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  BookOpen
} from "lucide-react";
import { UserProfile, DailyStudySummary, QuestionStreakState, QuestionRecord, StudyNowSession } from "../types";
import {
  getStoredQuestionRecords,
  getStoredQuestionStreak,
  getStoredStudySessionsHistory,
  getStoredFlashcards,
  getStoredDailySummary,
  saveStoredDailySummary
} from "../utils/storage";
import { getTodayDateStr } from "../utils/streak";
import { speakText, stopSpeech, isSpeaking } from "../utils/speech";

interface DailySummaryCardProps {
  profile: UserProfile;
  streakState?: QuestionStreakState;
  onStartStudySession?: (subject?: string, topic?: string) => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  profile,
  streakState: propStreakState,
  onStartStudySession,
}) => {
  const [summary, setSummary] = useState<DailyStudySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  const todayStr = getTodayDateStr();

  // Format today's date in full Brazilian Portuguese
  const formattedToday = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    } catch {
      return "Hoje";
    }
  }, []);

  // Time-aware greeting / context (morning, afternoon, evening/end of day)
  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 4) {
      return {
        label: "Fechamento Noturno",
        icon: Moon,
        accent: "from-indigo-500/20 via-purple-500/10 to-slate-900",
        badge: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
        isEndOfDay: true,
      };
    } else if (hour >= 12) {
      return {
        label: "Balanço do Dia",
        icon: Sparkles,
        accent: "from-emerald-500/15 via-teal-500/10 to-slate-900",
        badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        isEndOfDay: false,
      };
    } else {
      return {
        label: "Progresso do Dia",
        icon: Zap,
        accent: "from-amber-500/15 via-emerald-500/10 to-slate-900",
        badge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        isEndOfDay: false,
      };
    }
  }, []);

  // Calculate today's real study statistics from storage
  const todayStats = useMemo(() => {
    const streak = propStreakState || getStoredQuestionStreak();
    const records = getStoredQuestionRecords();
    const sessions = getStoredStudySessionsHistory();
    const flashcards = getStoredFlashcards();

    // Filter authentic records for today (filtering out demo/sample questions)
    const realTodayRecords = records
      .filter((r) => r.date === todayStr)
      .filter((r) => !r.id?.startsWith("sample-qr-") && !r.id?.includes("sample") && !r.id?.includes("demo"));
    
    const questionsAnswered = realTodayRecords.length;
    const questionsCorrect = realTodayRecords.filter((r) => r.isCorrect).length;
    const accuracy = questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0;

    // Filter study sessions completed today
    const todaySessions = sessions.filter((s) => {
      if (!s.createdAt) return false;
      return s.createdAt.startsWith(todayStr) || (s.completedAt && s.completedAt.startsWith(todayStr));
    });

    const minutesStudied = todaySessions.reduce((acc, s) => {
      const mins = Math.round((s.elapsedSeconds || (s.targetDurationMinutes * 60)) / 60);
      return acc + (mins > 0 ? mins : (s.targetDurationMinutes || 25));
    }, 0);

    // Collect distinct subjects and topics tackled today
    const subjectSet = new Set<string>();
    const topicSet = new Set<string>();

    realTodayRecords.forEach((r) => {
      if (r.subject) subjectSet.add(r.subject);
      if (r.topic) topicSet.add(r.topic);
    });

    todaySessions.forEach((s) => {
      if (s.subject) subjectSet.add(s.subject);
      if (s.topic) topicSet.add(s.topic);
    });

    const subjectsStudied = Array.from(subjectSet);
    const topicsStudied = Array.from(topicSet);

    // Fallback to profile subjects if user just started
    if (subjectsStudied.length === 0 && profile.subjects?.length > 0) {
      subjectsStudied.push(profile.subjects[0]);
    }

    const realFlashcards = flashcards.filter(f => !f.id?.startsWith("fc-demo-") && !f.id?.includes("demo"));

    return {
      minutesStudied: minutesStudied > 0 ? minutesStudied : (realTodayRecords.length > 0 ? realTodayRecords.length * 3 : 0),
      sessionsCount: todaySessions.length,
      questionsAnswered,
      questionsCorrect,
      accuracy,
      flashcardsReviewed: realFlashcards.filter(f => f.box > 1).length,
      streak: streak?.currentStreak ?? 0,
      subjectsStudied,
      topicsStudied,
      todayRecords: realTodayRecords,
    };
  }, [propStreakState, todayStr, profile.subjects]);

  // Fetch or generate AI Daily Summary
  const fetchOrGenerateSummary = useCallback(async (forceRefresh = false) => {
    // Check cached summary for today if not force refreshing
    if (!forceRefresh) {
      const cached = getStoredDailySummary(todayStr);
      if (cached) {
        setSummary(cached);
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        profile,
        todayStats: {
          minutesStudied: todayStats.minutesStudied,
          sessionsCount: todayStats.sessionsCount,
          questionsAnswered: todayStats.questionsAnswered,
          questionsCorrect: todayStats.questionsCorrect,
          accuracy: todayStats.accuracy,
          flashcardsReviewed: todayStats.flashcardsReviewed,
          streak: todayStats.streak,
          subjectsStudied: todayStats.subjectsStudied,
          topicsStudied: todayStats.topicsStudied,
        },
        recentRecords: todayStats.todayRecords.slice(0, 8),
      };

      const res = await fetch("/api/study/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do servidor");
      }

      const data = await res.json();
      const generatedSummary: DailyStudySummary = {
        date: todayStr,
        generatedAt: new Date().toISOString(),
        biggestProgress: data.biggestProgress || "Excelente disciplina de estudos mantida hoje!",
        nextDayFocus: data.nextDayFocus || "Continue fortalecendo as matérias prioritárias amanhã.",
        motivationalBadge: data.motivationalBadge || "🏆 Alta Performance",
        suggestedTomorrowSubject: data.suggestedTomorrowSubject || todayStats.subjectsStudied[0] || "Matemática",
        suggestedTomorrowTopic: data.suggestedTomorrowTopic || "Prática e Resoluções Ativas",
        neuroTip: data.neuroTip || "O descanso de qualidade consolida o aprendizado na memória de longo prazo.",
        statsSnapshot: {
          minutesStudied: todayStats.minutesStudied,
          sessionsCount: todayStats.sessionsCount,
          questionsAnswered: todayStats.questionsAnswered,
          questionsCorrect: todayStats.questionsCorrect,
          accuracy: todayStats.accuracy,
          flashcardsReviewed: todayStats.flashcardsReviewed,
          streak: todayStats.streak,
          subjectsStudied: todayStats.subjectsStudied,
          topicsStudied: todayStats.topicsStudied,
        },
      };

      setSummary(generatedSummary);
      saveStoredDailySummary(generatedSummary);
    } catch (err) {
      console.warn("Utilizando gerador local inteligente de resumo diário:", err);

      // Local intelligent fallback generator
      const primarySubject = todayStats.subjectsStudied[0] || (profile.subjects?.[0] ?? "Matéria Prioritária");
      let fallbackProgress = "";
      let fallbackBadge = "🎯 Foco Concluído";

      if (todayStats.questionsAnswered > 0) {
        if (todayStats.accuracy >= 80) {
          fallbackProgress = `Hoje você atingiu ${todayStats.accuracy}% de precisão com ${todayStats.questionsCorrect}/${todayStats.questionsAnswered} questões corretas em ${todayStats.subjectsStudied.join(", ")}, consolidando um salto de retenção com raciocínio rápido e seguro.`;
          fallbackBadge = "🎯 Precisão de Alto Nível";
        } else {
          fallbackProgress = `Você resolveu ${todayStats.questionsAnswered} questões práticas e acumulou ${todayStats.minutesStudied} minutos de foco em ${todayStats.subjectsStudied.join(", ")}, mapeando lacunas de conteúdo e fortalecendo a memória de resgate.`;
          fallbackBadge = "⚡ Prática Deliberada";
        }
      } else if (todayStats.minutesStudied > 0) {
        fallbackProgress = `Você completou ${todayStats.minutesStudied} minutos de sessões ativas hoje em ${todayStats.subjectsStudied.join(", ")}, avançando no seu cronograma de estudos!`;
        fallbackBadge = "🔥 Foco Dedicado";
      } else {
        fallbackProgress = todayStats.streak > 0
          ? `Você manteve a rotina de planejamento diário ativa com ${todayStats.streak} dias de sequência, preparando as bases para o próximo salto de rendimento.`
          : `Pronto para começar seu dia de estudos! Resolva questões no tutor ou inicie uma sessão de foco para inaugurar sua sequência de dias.`;
        fallbackBadge = todayStats.streak > 0 ? "🚀 Ritmo Constante" : "🌱 Início de Jornada";
      }

      const diffs = profile.subjectDifficulties || {};
      let hardest = primarySubject;
      let maxD = -1;
      Object.entries(diffs).forEach(([s, d]) => {
        if (typeof d === "number" && d > maxD) {
          maxD = d;
          hardest = s;
        }
      });

      const fallbackFocus = `Sugestão Estratégica para Amanhã: Inicie sua rotina com uma bateria de 5 flashcards e questões de resgate ativo em ${hardest} para blindar os tópicos de maior peso antes de avançar na matéria.`;
      const fallbackNeuroTip = "A fixação definitiva das memórias ocorre durante as fases de sono profundo. Evite excesso de luz azul antes de dormir para consolidar os padrões de hoje.";

      const localSummary: DailyStudySummary = {
        date: todayStr,
        generatedAt: new Date().toISOString(),
        biggestProgress: fallbackProgress,
        nextDayFocus: fallbackFocus,
        motivationalBadge: fallbackBadge,
        suggestedTomorrowSubject: hardest,
        suggestedTomorrowTopic: "Revisão Espaçada e Resolução",
        neuroTip: fallbackNeuroTip,
        statsSnapshot: {
          minutesStudied: todayStats.minutesStudied,
          sessionsCount: todayStats.sessionsCount,
          questionsAnswered: todayStats.questionsAnswered,
          questionsCorrect: todayStats.questionsCorrect,
          accuracy: todayStats.accuracy,
          flashcardsReviewed: todayStats.flashcardsReviewed,
          streak: todayStats.streak,
          subjectsStudied: todayStats.subjectsStudied,
          topicsStudied: todayStats.topicsStudied,
        },
      };

      setSummary(localSummary);
      saveStoredDailySummary(localSummary);
    } finally {
      setIsLoading(false);
    }
  }, [profile, todayStats, todayStr]);

  // Load summary on mount or when stats change
  useEffect(() => {
    fetchOrGenerateSummary(false);
  }, [fetchOrGenerateSummary]);

  // Handle TTS speech readout
  const handleToggleSpeech = () => {
    if (isAudioPlaying) {
      stopSpeech();
      setIsAudioPlaying(false);
    } else {
      if (!summary) return;
      const fullText = `Resumo do dia. Maior progresso alcançado: ${summary.biggestProgress}. Sugestão de foco para amanhã: ${summary.nextDayFocus}. Dica de neurociência: ${summary.neuroTip}`;
      
      setIsAudioPlaying(true);
      speakText(fullText, {
        lang: "pt-BR",
        rate: 1.0,
        pitch: 1.0,
        onEnd: () => setIsAudioPlaying(false),
        onError: () => setIsAudioPlaying(false),
      });
    }
  };

  // Stop speech if unmounting
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Handle copy summary
  const handleCopySummary = async () => {
    if (!summary) return;
    const textToCopy = `📊 Resumo do Dia (${formattedToday})\n\n🏆 Maior Progresso:\n${summary.biggestProgress}\n\n🎯 Foco para Amanhã:\n${summary.nextDayFocus}\n\n🧠 Neurodica:\n${summary.neuroTip}\n\n📈 Estatísticas de Hoje:\n• Tempo de estudo: ${todayStats.minutesStudied} min\n• Questões resolvidas: ${todayStats.questionsAnswered} (${todayStats.accuracy}% acertos)\n• Sequência (Streak): ${todayStats.streak} dias\n• Matérias: ${todayStats.subjectsStudied.join(", ")}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const TimeIcon = timeContext.icon;

  return (
    <div
      id="dashboard-daily-summary-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40"
    >
      {/* Background soft ambient gradient */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${timeContext.accent} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />

      {/* Header: Badge, Date, Title & Action Toolbar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
            <TimeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${timeContext.badge} uppercase tracking-wider flex items-center gap-1`}>
                <Sparkles className="w-3 h-3" />
                {timeContext.label}
              </span>
              <span className="text-[11px] text-slate-400 font-medium capitalize">
                {formattedToday}
              </span>
              {summary?.motivationalBadge && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300">
                  {summary.motivationalBadge}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
              <span>Balanço de Estudos & Próximos Passos</span>
            </h3>
          </div>
        </div>

        {/* Action Controls: Audio TTS, Copy, Refresh with AI */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            id="daily-summary-audio-btn"
            onClick={handleToggleSpeech}
            disabled={isLoading || !summary}
            className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              isAudioPlaying
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 animate-pulse"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title={isAudioPlaying ? "Pausar Leitura em Áudio" : "Ouvir Resumo com Voz de IA"}
          >
            {isAudioPlaying ? <VolumeX className="w-4 h-4 text-indigo-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            id="daily-summary-copy-btn"
            onClick={handleCopySummary}
            disabled={isLoading || !summary}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
            title="Copiar resumo do dia"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            id="daily-summary-refresh-btn"
            onClick={() => fetchOrGenerateSummary(true)}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recalcular resumo com dados atualizados de estudo"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">{isLoading ? "Analisando..." : "Atualizar IA"}</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar: Real stats from today's studies */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tempo Focado</div>
            <div className="text-sm font-bold text-white tracking-tight">
              {todayStats.minutesStudied} <span className="text-[11px] font-normal text-slate-400">min</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Questões / Acerto</div>
            <div className="text-sm font-bold text-white tracking-tight">
              {todayStats.questionsAnswered} <span className="text-[11px] font-semibold text-blue-400">({todayStats.accuracy}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Flashcards & Rev.</div>
            <div className="text-sm font-bold text-white tracking-tight">
              {todayStats.flashcardsReviewed} <span className="text-[11px] font-normal text-slate-400">cards</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Sequência</div>
            <div className="text-sm font-bold text-white tracking-tight">
              {todayStats.streak} <span className="text-[11px] font-normal text-slate-400">{todayStats.streak === 1 ? "dia" : "dias"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Highlights Grid: 1. Maior Progresso Alcançado & 2. Sugestão de Foco para Amanhã */}
      <div className="relative z-10 space-y-3.5">
        {isLoading ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-medium">
              A IA está analisando todas as sessões, taxas de acertos e matérias de hoje para compor seu balanço...
            </p>
          </div>
        ) : summary ? (
          <>
            {/* Box 1: Maior Progresso Alcançado (Highlight Phrase) */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Trophy className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Maior Progresso Alcançado Hoje
                    </span>
                    {summary.statsSnapshot?.subjectsStudied?.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        {summary.statsSnapshot.subjectsStudied.join(", ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                    {summary.biggestProgress}
                  </p>
                </div>
              </div>
            </div>

            {/* Box 2: Sugestão de Foco para o Dia Seguinte (Next-Day Strategy & Quick Action) */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Target className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Sugestão de Foco para o Dia Seguinte
                      </span>
                      {summary.suggestedTomorrowSubject && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                          Alvo: {summary.suggestedTomorrowSubject}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                      {summary.nextDayFocus}
                    </p>
                  </div>
                </div>

                {onStartStudySession && (
                  <button
                    type="button"
                    id="daily-summary-start-tomorrow-btn"
                    onClick={() => onStartStudySession(summary.suggestedTomorrowSubject, summary.suggestedTomorrowTopic)}
                    className="self-stretch sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer"
                  >
                    <span>Preparar Sessão</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Box 3: Neurodica para a Noite (Memory consolidation tip) */}
            {summary.neuroTip && (
              <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="flex-1 leading-snug">
                  <span className="font-bold text-purple-300 mr-1.5">Neurociência do Sono:</span>
                  <span className="text-slate-300 font-normal">{summary.neuroTip}</span>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Accordion Footer: Detailed Breakdown of Topics and Question Records */}
      <div className="relative z-10 pt-3.5 mt-3.5 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
        >
          <span>{isDetailsOpen ? "Ocultar detalhamento de matérias de hoje" : "Ver detalhamento das matérias praticadas hoje"}</span>
          {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>Calculado em tempo real com base nos seus estudos</span>
        </div>
      </div>

      {/* Expanded Breakdown Table */}
      {isDetailsOpen && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Matérias & Tópicos Tocados Hoje
              </div>
              {todayStats.subjectsStudied.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {todayStats.subjectsStudied.map((subj, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                      {subj}
                    </span>
                  ))}
                  {todayStats.topicsStudied.map((top, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/20 text-indigo-300">
                      {top}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">Nenhum registro de matéria catalogado hoje ainda.</p>
              )}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Histórico de Resoluções de Hoje
              </div>
              {todayStats.todayRecords.length > 0 ? (
                <p className="text-slate-300 leading-snug">
                  Total de <strong className="text-white">{todayStats.todayRecords.length}</strong> questões registradas hoje, com <strong className="text-emerald-400">{todayStats.questionsCorrect} acertos</strong> e <strong className="text-slate-400">{todayStats.todayRecords.length - todayStats.questionsCorrect} erros</strong> analisados.
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  Resolva questões ou complete uma sessão para alimentar o histórico detalhado.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
