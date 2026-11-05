import React, { useState } from "react";
import {
  Flame,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  BarChart3,
  X
} from "lucide-react";
import confetti from "canvas-confetti";
import { QuestionStreakState, QuestionRecord, UserProfile, DailyChallengesState } from "../types";
import { getTodayDateStr } from "../utils/streak";

interface StreakCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakState: QuestionStreakState;
  questionRecords: QuestionRecord[];
  profile: UserProfile;
  dailyChallengesState?: DailyChallengesState;
  onNavigateToChallenges?: () => void;
}

export const StreakDetailsModal: React.FC<StreakCardModalProps> = ({
  isOpen,
  onClose,
  streakState,
  questionRecords,
  profile,
  dailyChallengesState,
  onNavigateToChallenges,
}) => {
  if (!isOpen) return null;

  const todayStr = getTodayDateStr();
  const accuracy =
    streakState.totalQuestionsAnswered > 0
      ? Math.round((streakState.totalCorrect / streakState.totalQuestionsAnswered) * 100)
      : 0;

  // Calculate days for the last 14 days
  const last14Days: { dateStr: string; dayNum: number; dayName: string; count: number; correct: number; isToday: boolean }[] = [];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const stats = streakState.history?.[dateStr] || { total: 0, correct: 0 };
    last14Days.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: dayNames[d.getDay()],
      count: stats.total,
      correct: stats.correct,
      isToday: dateStr === todayStr,
    });
  }

  const handleCelebrate = () => {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#eab308", "#10b981", "#3b82f6"],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 animate-pulse">
            <Flame className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                Sequência Diária de Questões
              </span>
              <span className="text-xs text-slate-400">• Prática Ativa</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {streakState.currentStreak} {streakState.currentStreak === 1 ? "Dia Seguido" : "Dias Seguidos"} de Questões!
            </h2>
          </div>
        </div>

        {/* Dynamic Status / Motivation */}
        <div className="bg-gradient-to-r from-orange-950/40 via-slate-800/80 to-slate-900 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-orange-300">
              {streakState.todayQuestionsCount > 0
                ? " Sequência mantida com sucesso hoje!"
                : " Resolva ao menos 1 questão hoje para continuar sua sequência!"}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Hoje você já resolveu <strong className="text-white">{streakState.todayQuestionsCount}</strong> questão(ões) com{" "}
              <strong className="text-emerald-400">{streakState.todayCorrectCount} acerto(s)</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCelebrate}
            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow transition shrink-0"
          >
            Comemorar 🎉
          </button>
        </div>

        {/* 14-Day Visual Heatmap / Streak tracker */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Histórico dos Últimos 14 Dias
            </h3>
            <span className="text-[11px] text-slate-400">Recorde: <strong className="text-amber-400">{streakState.longestStreak} dias</strong></span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            {last14Days.map((d) => {
              const hasDone = d.count > 0;
              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${d.count} questão(ões) (${d.correct} certas)`}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${
                    d.isToday
                      ? "ring-2 ring-orange-500 border-orange-400/60"
                      : "border-slate-800"
                  } ${
                    hasDone
                      ? "bg-gradient-to-b from-orange-500/20 to-amber-500/10 border-orange-500/40 text-orange-200"
                      : "bg-slate-900/50 text-slate-500"
                  }`}
                >
                  <span className="text-[9px] font-medium opacity-70">{d.dayName}</span>
                  <span className="text-xs font-bold my-0.5">{d.dayNum}</span>
                  <div className="w-4 h-4 flex items-center justify-center">
                    {hasDone ? (
                      <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Resolvidas</span>
            <div className="text-xl font-black text-white mt-0.5">
              {streakState.totalQuestionsAnswered}
            </div>
            <span className="text-[10px] text-slate-500">questões</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Taxa de Acerto</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {accuracy}%
            </div>
            <span className="text-[10px] text-slate-500">{streakState.totalCorrect} certas</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Maior Sequência</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {streakState.longestStreak}
            </div>
            <span className="text-[10px] text-slate-500">dias seguidos</span>
          </div>
        </div>

        {/* Daily Challenges Overview in Modal */}
        {dailyChallengesState && (
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Desafios Diários do Dia ({dailyChallengesState.challenges.filter((c) => c.completed).length}/3 Concluídos)
                </span>
              </div>
              <span className="text-xs font-black text-amber-300 font-mono">
                +{dailyChallengesState.totalBonusPointsEarned} pts Bônus
              </span>
            </div>

            <div className="space-y-1.5">
              {dailyChallengesState.challenges.map((ch) => (
                <div
                  key={ch.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    ch.completed
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                      : "bg-slate-950/50 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    {ch.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span className={`truncate text-xs ${ch.completed ? "line-through text-slate-400" : "font-medium"}`}>
                      {ch.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    +{ch.streakBonusPoints} pts
                  </span>
                </div>
              ))}
            </div>

            {onNavigateToChallenges && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToChallenges();
                }}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1"
              >
                <span>Ver & Praticar Desafios na Rotina Semanal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Recent Question Activity List */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Últimas Questões Registradas
          </h3>
          {questionRecords.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800">
              Nenhuma questão recente registrada ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {questionRecords.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {q.subject}
                      </span>
                      {q.topic && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {q.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 text-[11px] truncate mt-1">
                      {q.question}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center space-x-1.5">
                    {q.isCorrect ? (
                      <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Correto
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        Errou
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Como funciona o Streak:</strong> A cada dia que você responde questões no <em>Tutor Socrático</em> ou no <em>Diagnóstico</em>, sua sequência diária incrementa (+1). Dias consecutivos aumentam sua retenção de longo prazo conforme a curva de esquecimento.
          </p>
        </div>
      </div>
    </div>
  );
};
