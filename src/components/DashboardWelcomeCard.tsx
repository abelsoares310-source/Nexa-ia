import React from "react";
import { 
  Play, 
  Sparkles, 
  Flame, 
  Clock, 
  Target, 
  BookOpenCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Calendar,
  Layers
} from "lucide-react";
import { UserProfile, QuestionStreakState, DailyChallengesState, DiagnosticResult } from "../types";
import { getStoredActiveStudySession } from "../utils/storage";

interface DashboardWelcomeCardProps {
  profile: UserProfile;
  streakState?: QuestionStreakState;
  dailyChallengesState?: DailyChallengesState;
  diagnosticResult?: DiagnosticResult | null;
  onStartStudySession: () => void;
}

export const DashboardWelcomeCard: React.FC<DashboardWelcomeCardProps> = ({
  profile,
  streakState,
  dailyChallengesState,
  diagnosticResult,
  onStartStudySession,
}) => {
  const activeSession = getStoredActiveStudySession();
  const hasActiveSession = !!activeSession && !activeSession.isCompleted;

  // Format today date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // Capitalize first letter of weekday
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Recommended questions computation
  const dailyGoal = 10;
  const todaySolved = streakState?.todayQuestionsCount || 0;
  const recommendedQuestions = Math.max(10, Math.round((profile.dailyHours || 2) * 5));

  // Estimated focus time
  const dailyHours = profile.dailyHours || 2;
  const estimatedSessionMinutes = Math.min(60, Math.max(25, Math.round(dailyHours * 20)));

  // Daily goal progress percentage
  const goalProgressPercent = Math.min(100, Math.round((todaySolved / dailyGoal) * 100));

  // Daily challenges stats
  const totalChallenges = dailyChallengesState?.challenges?.length || 3;
  const completedChallenges = dailyChallengesState?.challenges?.filter((c) => c.completed).length || 0;

  // Priority subjects (highest difficulty score >= 6 or from diagnostic attention skills)
  const prioritySubjects: { name: string; score: number; reason?: string }[] = [];

  if (profile.subjectDifficulties) {
    Object.entries(profile.subjectDifficulties)
      .filter(([_, score]) => score >= 6)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subj, score]) => {
        prioritySubjects.push({ name: subj, score, reason: "Alta Dificuldade" });
      });
  }

  // If no high difficulties found, check diagnostic attention skills or dontKnow skills
  if (prioritySubjects.length === 0 && diagnosticResult?.attentionSkills && diagnosticResult.attentionSkills.length > 0) {
    diagnosticResult.attentionSkills.slice(0, 3).forEach((w) => {
      prioritySubjects.push({ name: w, score: 8, reason: "Ponto a Reforçar (Diagnóstico)" });
    });
  } else if (prioritySubjects.length === 0 && diagnosticResult?.dontKnowSkills && diagnosticResult.dontKnowSkills.length > 0) {
    diagnosticResult.dontKnowSkills.slice(0, 3).forEach((w) => {
      prioritySubjects.push({ name: w, score: 9, reason: "Dúvida no Diagnóstico" });
    });
  }

  // Fallback to first 3 profile subjects if empty
  if (prioritySubjects.length === 0 && profile.subjects && profile.subjects.length > 0) {
    profile.subjects.slice(0, 3).forEach((s) => {
      prioritySubjects.push({ name: s, score: profile.subjectDifficulties?.[s] || 5 });
    });
  }

  // Student name fallback
  const studentName = profile.name && profile.name.trim() ? profile.name.trim() : "Estudante";

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background subtle decorative glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Row: Welcome greeting & date/streak */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel de Aprendizagem Ativa</span>
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {capitalizedDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Olá, <strong className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{studentName}</strong>!</span>
            <span className="text-2xl">👋</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Seu cockpit inteligente está calibrado para <strong>{profile.objective || "seus estudos"}</strong>. 
            Pratique recuperação ativa e consolide memórias de longo prazo.
          </p>
        </div>

        {/* Top Badges / Streak */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {streakState && (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300">
              <Flame className="w-5 h-5 text-orange-400 fill-orange-500/20" />
              <div>
                <div className="text-xs font-bold leading-none">{streakState.currentStreak} {streakState.currentStreak === 1 ? "dia" : "dias"}</div>
                <div className="text-[10px] text-orange-400/80 font-medium">Sequência Foco</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <Target className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-xs font-bold leading-none truncate max-w-[130px]">{profile.objective || "Meta Definida"}</div>
              <div className="text-[10px] text-slate-400 font-medium">Objetivo Atual</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Section (4 Pillars) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        
        {/* Metric 1: Quantidade de Questões Recomendadas */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <BookOpenCheck className="w-4 h-4 text-emerald-400" />
              Questões Recomendadas
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Hoje
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {recommendedQuestions} <span className="text-sm font-sans font-medium text-slate-400">questões</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{todaySolved}</span> resolvidas hoje (Meta: {dailyGoal})
            </div>
          </div>
        </div>

        {/* Metric 2: Tempo Estimado */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Tempo Estimado
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {dailyHours}h/dia
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              ~{estimatedSessionMinutes} <span className="text-sm font-sans font-medium text-slate-400">min</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              1 bloco Pomodoro ou Sprint Prático
            </div>
          </div>
        </div>

        {/* Metric 3: Matérias Prioritárias */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Matérias Prioritárias
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Foco Crítico
            </span>
          </div>
          <div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {prioritySubjects.length > 0 ? (
                prioritySubjects.slice(0, 3).map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold"
                    title={`Nível de Dificuldade: ${sub.score}/10`}
                  >
                    {sub.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Matérias equilibradas</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Tópicos com maior peso e dificuldade
            </div>
          </div>
        </div>

        {/* Metric 4: Progresso de Meta Diária */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-400" />
              Meta Diária
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {goalProgressPercent}%
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>{todaySolved}/{dailyGoal} questões</span>
              <span>{completedChallenges}/{totalChallenges} desafios</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Banner: ▶ COMEÇAR SESSÃO Button */}
      <div className="relative z-10 bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 text-left w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {hasActiveSession ? "Sessão Ativa em Andamento" : "Sessão Guiada por IA: Estudar Agora"}
              </h3>
              {hasActiveSession && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold animate-pulse">
                  Em Pausa / Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasActiveSession 
                ? `Continue seu foco em ${activeSession.subject} (${activeSession.topic}) de onde parou.` 
                : "Aquecimento neural, questões com dicas socráticas, flashcards mnemônicos e cronômetro integrado."}
            </p>
          </div>
        </div>

        <button
          id="dashboard-start-study-session-btn"
          type="button"
          onClick={onStartStudySession}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shrink-0 uppercase tracking-wide"
        >
          <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
          <span>{hasActiveSession ? "▶ CONTINUAR SESSÃO" : "▶ COMEÇAR SESSÃO"}</span>
        </button>
      </div>
    </div>
  );
};
