import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Clock, 
  BookOpen, 
  Layers, 
  Target, 
  Award, 
  RotateCcw, 
  BookMarked, 
  Share2, 
  Copy, 
  ArrowRight,
  Brain,
  Zap,
  Save
} from "lucide-react";
import confetti from "canvas-confetti";
import { StudyNowSession, StudyJournalEntry } from "../../types";
import { studyAudio } from "../../utils/studyAudio";

interface StudyNowSummaryStageProps {
  session: StudyNowSession;
  onSaveToJournal: (entry: Partial<StudyJournalEntry>) => void;
  onRestartNewSession: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const StudyNowSummaryStage: React.FC<StudyNowSummaryStageProps> = ({
  session,
  onSaveToJournal,
  onRestartNewSession,
  onNavigateToTab,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [savedJournal, setSavedJournal] = useState<boolean>(!!session.savedToJournal);
  const [journalReflection, setJournalReflection] = useState<string>(
    `Sessão focada em ${session.subject} (${session.topic}). Prática de resolução ativa de questões com fixação em flashcards mnemônicos.`
  );
  const [tomorrowGoal, setTomorrowGoal] = useState<string>(
    `Revisar os tópicos com maior dificuldade e avançar no cronograma de ${session.subject}.`
  );

  // Trigger celebration chimes and confetti once on mount
  useEffect(() => {
    studyAudio.playCompletionChime();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f59e0b", "#8b5cf6", "#3b82f6"],
      });
    } catch (e) {}
  }, []);

  const formatMinutesSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`;
  };

  const answeredQuestions = session.questions.filter((q) => typeof q.userSelectedIndex === "number");
  const correctQuestions = session.questions.filter((q) => q.isCorrect);
  const accuracy = answeredQuestions.length > 0
    ? Math.round((correctQuestions.length / answeredQuestions.length) * 100)
    : 100;

  const totalReviewsDone = session.reviews.filter((r) => r.completed || r.userRating).length;
  const totalCardsDone = session.flashcards.length;

  const earnedXp = Math.max(20, Math.round(session.elapsedSeconds / 60) * 2 + correctQuestions.length * 10 + totalCardsDone * 5);

  const handleCopySummary = () => {
    const summaryText = `🎓 Sessão Concluída no Plano & Tutor IA:
• Matéria: ${session.subject} (${session.topic})
• Tempo de Foco: ${formatMinutesSeconds(session.elapsedSeconds)}
• Questões: ${correctQuestions.length}/${answeredQuestions.length} (${accuracy}% de acerto)
• Flashcards Fixados: ${totalCardsDone}
• XP Conquistado: +${earnedXp} pts`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveJournalClick = () => {
    onSaveToJournal({
      title: `Sessão Ativa: ${session.subject} - ${session.topic}`,
      content: journalReflection,
      tomorrowGoal,
      entryType: "reflection",
      overallMood: accuracy >= 75 ? "confident" : "challenged",
      focusScore: 9,
      energyLevel: 4,
      tags: [session.subject, "Estudar Agora", "Sessão IA"],
    });
    setSavedJournal(true);
  };

  return (
    <div className="max-w-3xl mx-auto my-4 space-y-6">
      {/* Celebration Header Card */}
      <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center text-slate-100 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
          <Award className="w-8 h-8 text-slate-950" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
          Sessão Concluída com Sucesso!
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {session.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          {session.pedagogicalGoal}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-lg sm:text-xl font-bold text-white font-mono">
              {formatMinutesSeconds(session.elapsedSeconds)}
            </div>
            <div className="text-[11px] text-slate-400">Tempo de Foco</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <BookOpen className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              {correctQuestions.length}/{answeredQuestions.length || session.questions.length}
            </div>
            <div className="text-[11px] text-slate-400">Acertos ({accuracy}%)</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <Layers className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-lg sm:text-xl font-bold text-purple-400 font-mono">
              {totalCardsDone}
            </div>
            <div className="text-[11px] text-slate-400">Cards Fixados</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <div className="text-lg sm:text-xl font-bold text-orange-400 font-mono">
              +{earnedXp} pts
            </div>
            <div className="text-[11px] text-slate-400">XP & Sequência</div>
          </div>
        </div>
      </div>

      {/* Auto-Save & Journal Reflection Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <BookMarked className="w-4 h-4" />
            <span>Registro no Diário de Bordo (Neuro-Reflexão)</span>
          </div>

          {savedJournal ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo no Diário!
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSaveJournalClick}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Entrada no Diário</span>
            </button>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Síntese do que foi consolidado nesta sessão:
            </label>
            <textarea
              rows={2}
              value={journalReflection}
              onChange={(e) => setJournalReflection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Próximo objetivo para o próximo bloco de estudo:
            </label>
            <input
              type="text"
              value={tomorrowGoal}
              onChange={(e) => setTomorrowGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Resumo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab("weekly")}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span>Ver Rotina Semanal</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRestartNewSession}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Iniciar Nova Sessão com IA</span>
        </button>
      </div>
    </div>
  );
};
