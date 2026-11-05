import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  BookOpen, 
  Layers, 
  Sparkles, 
  Award,
  Zap,
  Tag
} from "lucide-react";
import confetti from "canvas-confetti";
import { WeeklyRoutineDay, RoutineBlock, UserProfile, DailyChallengesState, DailyChallengeItem, SpacedReviewItem, FlashcardItem } from "../types";
import { getDifficultyMeta } from "./ProfileForm";
import { DailyChallengesCard } from "./DailyChallengesCard";
import { PriorityReviewCard } from "./PriorityReviewCard";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";

interface WeeklyRoutineViewProps {
  routine: WeeklyRoutineDay[];
  profile: UserProfile;
  onLaunchTopicTutor: (topic: string, subject?: string) => void;
  onToggleBlockComplete: (dayIndex: number, blockId: string) => void;
  onOpenJournal?: () => void;
  challengesState?: DailyChallengesState;
  onToggleChallenge?: (challengeId: string) => void;
  onRegenerateChallenges?: () => void;
  onExecuteChallengeAction?: (challenge: DailyChallengeItem) => void;
  streakDays?: number;
  spacedReviews?: SpacedReviewItem[];
  flashcards?: FlashcardItem[];
  onNavigateToFlashcards?: (subject?: string) => void;
  onToggleSpacedReview?: (reviewId: string) => void;
}

export const WeeklyRoutineView: React.FC<WeeklyRoutineViewProps> = ({
  routine,
  profile,
  onLaunchTopicTutor,
  onToggleBlockComplete,
  onOpenJournal,
  challengesState,
  onToggleChallenge,
  onRegenerateChallenges,
  onExecuteChallengeAction,
  streakDays = 1,
  spacedReviews = [],
  flashcards = [],
  onNavigateToFlashcards,
  onToggleSpacedReview,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(routine[0]?.day || "Segunda");
  
  // Pomodoro / Focus Timer State
  const [activeTimerBlock, setActiveTimerBlock] = useState<RoutineBlock | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeftSeconds]);

  const handleStartTimerForBlock = (block: RoutineBlock) => {
    setActiveTimerBlock(block);
    setTimeLeftSeconds((block.durationMinutes || 25) * 60);
    setIsTimerRunning(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentDayData = routine.find((r) => r.day === selectedDay) || routine[0];
  const dayIndex = routine.findIndex((r) => r.day === selectedDay);

  const calculateTotalMinutes = (blocks: RoutineBlock[]) => {
    return blocks.reduce((acc, b) => acc + (b.activityType === "Pausa" ? 0 : b.durationMinutes), 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Rotina Semanal Padrão • Alternância de Dificuldade</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Grade de Horários & Blocos de Estudo
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Intercalação estratégica de matérias difíceis e fáceis, pausas programadas e respeito estrito ao seu limite de {profile.dailyHours}h por dia.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {onOpenJournal && (
                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Registrar no Diário de Bordo</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Pomodoro Timer Widget */}
          {activeTimerBlock ? (
            <div className="bg-slate-800 border border-emerald-500/40 p-4 rounded-xl flex items-center space-x-4 shadow-lg shrink-0">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Sessão Ativa: {activeTimerBlock.subject}
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {formatTimer(timeLeftSeconds)}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2 rounded-lg font-bold text-xs transition ${
                    isTimerRunning ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500 text-slate-950"
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setTimeLeftSeconds((activeTimerBlock.durationMinutes || 25) * 60);
                    setIsTimerRunning(false);
                  }}
                  className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center space-x-3 text-xs text-slate-300 shrink-0">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Clique em <strong>Foco</strong> em qualquer bloco para acionar o cronômetro</span>
            </div>
          )}
        </div>

        {/* Daily Challenges Section */}
        {challengesState && onToggleChallenge && onRegenerateChallenges && onExecuteChallengeAction && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <DailyChallengesCard
              challengesState={challengesState}
              onToggleChallenge={onToggleChallenge}
              onRegenerateChallenges={onRegenerateChallenges}
              onExecuteAction={onExecuteChallengeAction}
              streakDays={streakDays}
            />
          </div>
        )}

        {/* Day Selector Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-none mt-6 pt-5 border-t border-slate-800">
          {routine.map((d) => {
            const isSelected = selectedDay === d.day;
            const completedCount = d.blocks.filter((b) => b.completed).length;
            const totalBlocks = d.blocks.length;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDay(d.day)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                <span>{d.day}</span>
                {totalBlocks > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? "bg-slate-950 text-emerald-400" : "bg-slate-700 text-slate-400"
                  }`}>
                    {completedCount}/{totalBlocks}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Review Section - Top 3 Overdue Subjects from Spaced Repetition */}
      <PriorityReviewCard
        spacedReviews={spacedReviews}
        flashcards={flashcards}
        profile={profile}
        onLaunchTopicTutor={onLaunchTopicTutor}
        onNavigateToFlashcards={onNavigateToFlashcards}
        onToggleSpacedReview={onToggleSpacedReview}
      />

      {/* Routine Blocks Table (Desktop) & Cards (Mobile) for Selected Day */}
      {currentDayData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
              <h2 className="text-base font-bold text-white">
                Cronograma de {currentDayData.day}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                Total: {(calculateTotalMinutes(currentDayData.blocks) / 60).toFixed(1)}h / {profile.dailyHours}h
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Intercalação: Fácil ↔ Difícil com Pausas
            </span>
          </div>

          {/* Mobile Card-Based View (< 768px) */}
          <div className="md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
            {currentDayData.blocks.map((block) => {
              const isBreak = block.activityType === "Pausa" || block.subject.toLowerCase().includes("descanso");
              const isDone = !!block.completed;

              let score = profile.subjectDifficulties?.[block.subject];
              if (typeof score !== "number") {
                if (block.difficultyLevel === "Difícil") score = 8;
                else if (block.difficultyLevel === "Fácil") score = 3;
                else score = 5;
              }
              const meta = getDifficultyMeta(score);

              return (
                <div
                  key={block.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isBreak 
                      ? "bg-slate-800/20 border-slate-800 text-slate-400" 
                      : isDone 
                      ? "bg-emerald-950/15 border-emerald-500/30" 
                      : "bg-slate-850/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleBlockComplete(dayIndex, block.id)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition"
                        aria-label="Marcar bloco como concluído"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${
                            isDone ? "text-emerald-400 fill-emerald-500/20" : ""
                          }`}
                        />
                      </button>
                      <div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {block.timeSlot}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({block.durationMinutes} min)
                          </span>
                        </div>
                        <h3 className={`text-sm font-bold mt-1 ${isBreak ? "text-slate-400 italic" : "text-white"}`}>
                          {block.subject}
                        </h3>
                      </div>
                    </div>

                    {!isBreak && (
                      <span 
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${meta.badgeColor}`}
                        title={`Dificuldade: ${score}/10 (${meta.label})`}
                      >
                        {score}/10
                      </span>
                    )}
                  </div>

                  {/* Topic / Content */}
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    {block.topic}
                  </p>

                  {/* Expected Result */}
                  {block.expectedResult && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-300 font-semibold">Meta: </span>
                      {block.expectedResult}
                    </div>
                  )}

                  {/* Bottom Activity & Action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        block.activityType.includes("Revisão")
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : block.activityType.includes("Prática")
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : block.activityType.includes("Simulado")
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          : isBreak
                          ? "bg-slate-800 text-slate-400 border-slate-700"
                          : "bg-sky-500/10 text-sky-300 border-sky-500/30"
                      }`}
                    >
                      {isBreak && <Coffee className="w-3 h-3 mr-1" />}
                      {block.activityType}
                    </span>

                    {!isBreak && (
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <YouTubeExplanationLink
                          topic={block.topic}
                          subject={block.subject}
                          variant="compact"
                          customLabel="Vídeo"
                          className="py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleStartTimerForBlock(block)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center"
                        >
                          <Play className="w-3 h-3 mr-1 text-emerald-400" />
                          <span>Foco</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onLaunchTopicTutor(block.topic, block.subject)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          <span>Tutor</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Status</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Horário</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Matéria / Habilidade</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Conteúdo</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Tipo de Atividade</th>
                  <th className="py-3.5 px-3 text-center">Duração</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Resultado Esperado</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentDayData.blocks.map((block) => {
                  const isBreak = block.activityType === "Pausa" || block.subject.toLowerCase().includes("descanso");
                  const isDone = !!block.completed;

                  let score = profile.subjectDifficulties?.[block.subject];
                  if (typeof score !== "number") {
                    if (block.difficultyLevel === "Difícil") score = 8;
                    else if (block.difficultyLevel === "Fácil") score = 3;
                    else score = 5;
                  }
                  const meta = getDifficultyMeta(score);

                  const difficultyBadge = !isBreak ? (
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${meta.badgeColor}`}
                      title={`Dificuldade: ${score}/10 (${meta.label})`}
                    >
                      {score}/10
                    </span>
                  ) : null;

                  return (
                    <tr
                      key={block.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isBreak ? "bg-slate-800/20 text-slate-400" : isDone ? "bg-emerald-950/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => onToggleBlockComplete(dayIndex, block.id)}
                          className="text-slate-500 hover:text-emerald-400 transition"
                        >
                          <CheckCircle2
                            className={`w-5 h-5 ${
                              isDone ? "text-emerald-400 fill-emerald-500/20" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* Horário */}
                      <td className="py-4 px-4 align-middle font-mono font-semibold text-slate-200">
                        {block.timeSlot}
                      </td>

                      {/* Matéria / Dificuldade */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${isBreak ? "text-slate-400 italic" : "text-white"}`}>
                            {block.subject}
                          </span>
                          {difficultyBadge}
                        </div>
                      </td>

                      {/* Conteúdo */}
                      <td className="py-4 px-4 align-middle text-slate-300">
                        {block.topic}
                      </td>

                      {/* Tipo de Atividade */}
                      <td className="py-4 px-4 align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                            block.activityType.includes("Revisão")
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : block.activityType.includes("Prática")
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : block.activityType.includes("Simulado")
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                              : isBreak
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          }`}
                        >
                          {isBreak && <Coffee className="w-3 h-3 mr-1" />}
                          {block.activityType}
                        </span>
                      </td>

                      {/* Duração */}
                      <td className="py-4 px-3 text-center align-middle font-semibold text-slate-300">
                        {block.durationMinutes} min
                      </td>

                      {/* Resultado Esperado */}
                      <td className="py-4 px-4 align-middle text-slate-300 leading-relaxed">
                        {block.expectedResult}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {!isBreak && (
                            <>
                              <YouTubeExplanationLink
                                topic={block.topic}
                                subject={block.subject}
                                variant="compact"
                                customLabel="Vídeo"
                                className="py-1 text-[11px]"
                              />
                              <button
                                type="button"
                                onClick={() => handleStartTimerForBlock(block)}
                                title="Iniciar cronômetro para este bloco"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center"
                              >
                                <Play className="w-3 h-3 mr-1 text-emerald-400" />
                                <span>Foco</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onLaunchTopicTutor(block.topic, block.subject)}
                                title="Estudar e praticar este conteúdo com o Tutor IA"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center"
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                <span>Tutor</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
