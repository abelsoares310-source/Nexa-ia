import React, { useState } from "react";
import { 
  Flame, 
  Target, 
  Zap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  RotateCcw, 
  Award, 
  ShieldCheck, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import confetti from "canvas-confetti";
import { DailyChallengeItem, DailyChallengesState, UserProfile } from "../types";
import { getTodayWeekdayName } from "../utils/dailyChallenges";

interface DailyChallengesCardProps {
  challengesState: DailyChallengesState;
  onToggleChallenge: (challengeId: string) => void;
  onRegenerateChallenges: () => void;
  onExecuteAction: (challenge: DailyChallengeItem) => void;
  streakDays?: number;
  compact?: boolean;
}

export const DailyChallengesCard: React.FC<DailyChallengesCardProps> = ({
  challengesState,
  onToggleChallenge,
  onRegenerateChallenges,
  onExecuteAction,
  streakDays = 1,
  compact = false,
}) => {
  const { challenges, totalBonusPointsEarned, allCompletedBonusClaimed } = challengesState;
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalCount = challenges.length || 3;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isAllCompleted = completedCount === totalCount && totalCount > 0;
  const weekdayName = getTodayWeekdayName();

  const totalPossibleBonus = challenges.reduce((acc, c) => acc + c.streakBonusPoints, 0) + 50;

  const handleToggle = (id: string, wasCompleted: boolean) => {
    onToggleChallenge(id);
    if (!wasCompleted) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#10b981", "#f59e0b", "#3b82f6"],
        });
      } catch (e) {}
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "flame":
        return <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />;
      case "target":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "zap":
        return <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case "sparkles":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className={`bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm ${
      isAllCompleted 
        ? "border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 ring-1 ring-amber-500/30" 
        : "border-slate-800"
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Desafios Diários • {weekdayName}</span>
            </span>
            <span className="text-xs text-slate-400">• Prática Ativa</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <span>3 Micro-tarefas de Hoje</span>
            {isAllCompleted && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">
                🏆 100% Concluído!
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geradas automaticamente a partir dos blocos pendentes da rotina, revisões espaçadas e pontos de atenção.
          </p>
        </div>

        {/* Streak XP & Refresh Header Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bônus Ganho:</span>
            <strong className="text-emerald-400 font-mono">+{totalBonusPointsEarned} pts</strong>
          </div>

          <button
            type="button"
            onClick={onRegenerateChallenges}
            title="Recalibrar e gerar novos desafios baseados nos estudos de hoje"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Summary */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">
              Progresso Diário: {completedCount} de {totalCount} completos
            </span>
            <span className="text-slate-500">({progressPercent}%)</span>
          </div>
          <span className="text-xs font-semibold text-amber-400 flex items-center">
            <Flame className="w-3.5 h-3.5 mr-1 fill-amber-400" />
            +{(totalPossibleBonus - totalBonusPointsEarned > 0) ? totalPossibleBonus - totalBonusPointsEarned : 0} pts Streak restantes
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAllCompleted 
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 shadow-sm shadow-amber-500/50" 
                : "bg-gradient-to-r from-emerald-500 to-teal-400"
            }`}
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* All Completed Celebration Banner */}
      {isAllCompleted && (
        <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-200 block">
                🔥 Super Combo Diário Desbloqueado!
              </span>
              <p className="text-[11px] text-slate-300">
                Você finalizou as 3 micro-tarefas prioritárias e garantiu <strong>+50 pts bônus de sequência</strong> e proteção de streak para hoje!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 font-mono">
              +50 XP STREAK
            </span>
          </div>
        </div>
      )}

      {/* 3 Challenges List Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {challenges.map((challenge, idx) => {
          const isDone = challenge.completed;

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative group ${
                isDone
                  ? "bg-emerald-950/20 border-emerald-500/40 shadow-sm text-slate-300"
                  : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 text-slate-200"
              }`}
            >
              {/* Top Meta info */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-900/90 border border-slate-700/70 flex items-center justify-center shrink-0">
                      {getBadgeIcon(challenge.badgeIcon)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {challenge.subject}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    isDone 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}>
                    <Flame className="w-3 h-3 fill-current" />
                    <span>+{challenge.streakBonusPoints} pts</span>
                  </span>
                </div>

                <h4 className={`text-sm font-bold tracking-tight leading-snug ${
                  isDone ? "text-emerald-200 line-through decoration-emerald-500/50" : "text-white"
                }`}>
                  {challenge.title}
                </h4>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {challenge.description}
                </p>
              </div>

              {/* Progress Count & Action Bar */}
              <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-2.5">
                {challenge.targetCount > 1 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progresso:</span>
                    <strong className={isDone ? "text-emerald-400 font-mono" : "text-slate-200 font-mono"}>
                      {challenge.currentCount} / {challenge.targetCount}
                    </strong>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  {/* Manual Toggle Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(challenge.id, isDone)}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Feito</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Concluir</span>
                      </>
                    )}
                  </button>

                  {/* Execute Action Button */}
                  <button
                    type="button"
                    onClick={() => onExecuteAction(challenge)}
                    className={`inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 text-center ${
                      isDone
                        ? "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                    }`}
                  >
                    <span>{isDone ? "Revisar Novamente" : challenge.actionLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
