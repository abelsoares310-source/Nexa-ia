import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  Target,
  Award,
  Zap,
  HelpCircle,
  Calendar,
  CheckCircle2,
  Sparkles,
  Info,
  Filter
} from "lucide-react";
import { QuestionRecord, QuestionStreakState } from "../types";

interface Accuracy30DaysChartProps {
  questionRecords?: QuestionRecord[];
  streakState?: QuestionStreakState;
  targetAccuracy?: number; // e.g. 80% default
  className?: string;
  showSubjectBreakdown?: boolean;
}

interface DayDataPoint {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "14/10"
  fullDate: string; // "14 de outubro de 2026"
  total: number;
  correct: number;
  accuracy: number | null; // percentage, null if no questions answered
  movingAvgAccuracy: number | null; // 7-day rolling average
  hasData: boolean;
}

export const Accuracy30DaysChart: React.FC<Accuracy30DaysChartProps> = ({
  questionRecords = [],
  streakState,
  targetAccuracy = 80,
  className = "",
  showSubjectBreakdown = true
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [viewType, setViewType] = useState<"accuracy" | "volume">("accuracy");

  // Extract list of subjects present in the question records
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    questionRecords.forEach((r) => {
      if (r.subject && r.subject.trim()) {
        set.add(r.subject.trim());
      }
    });
    return Array.from(set).sort();
  }, [questionRecords]);

  // Compute 30 days data series
  const { chartData, totalAnswered30d, totalCorrect30d, overallAccuracy30d, activeDaysCount, trendDelta } = useMemo(() => {
    // Generate dates for the last 30 days ending today
    const days: DayDataPoint[] = [];
    const now = new Date();

    // Aggregate records by date
    const recordsByDate: Record<string, { total: number; correct: number }> = {};

    // 1. First populate from questionRecords if present
    const filteredRecords = selectedSubject === "all"
      ? questionRecords
      : questionRecords.filter((r) => r.subject?.toLowerCase() === selectedSubject.toLowerCase());

    filteredRecords.forEach((r) => {
      const d = r.date || r.timestamp?.substring(0, 10);
      if (d) {
        if (!recordsByDate[d]) {
          recordsByDate[d] = { total: 0, correct: 0 };
        }
        recordsByDate[d].total += 1;
        if (r.isCorrect) {
          recordsByDate[d].correct += 1;
        }
      }
    });

    // 2. If records are empty or user is looking at "all", also consider streakState.history fallback
    if (selectedSubject === "all" && streakState?.history) {
      Object.entries(streakState.history).forEach(([dateStr, stats]) => {
        if (!recordsByDate[dateStr] || recordsByDate[dateStr].total === 0) {
          recordsByDate[dateStr] = {
            total: stats.total || 0,
            correct: stats.correct || 0
          };
        }
      });
    }

    let sumTotal = 0;
    let sumCorrect = 0;
    let daysWithQuestions = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = `${day}/${month}`;

      const dateObj = new Date(`${dateStr}T12:00:00`);
      const fullDate = new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(dateObj);

      const stats = recordsByDate[dateStr] || { total: 0, correct: 0 };
      const hasData = stats.total > 0;
      const accuracy = hasData ? Math.round((stats.correct / stats.total) * 100) : null;

      if (hasData) {
        sumTotal += stats.total;
        sumCorrect += stats.correct;
        daysWithQuestions += 1;
      }

      days.push({
        dateStr,
        dayLabel,
        fullDate,
        total: stats.total,
        correct: stats.correct,
        accuracy,
        movingAvgAccuracy: null, // will compute below
        hasData
      });
    }

    // Compute 7-day rolling moving average for smoother trend visualization
    for (let i = 0; i < days.length; i++) {
      let windowTotal = 0;
      let windowCorrect = 0;
      let windowDaysWithData = 0;
      const windowStart = Math.max(0, i - 6);

      for (let j = windowStart; j <= i; j++) {
        if (days[j].hasData) {
          windowTotal += days[j].total;
          windowCorrect += days[j].correct;
          windowDaysWithData++;
        }
      }

      if (windowTotal > 0) {
        days[i].movingAvgAccuracy = Math.round((windowCorrect / windowTotal) * 100);
      } else {
        days[i].movingAvgAccuracy = null;
      }
    }

    const overallAccuracy = sumTotal > 0 ? Math.round((sumCorrect / sumTotal) * 100) : 0;

    // Trend calculation: first half vs second half of the 30 days
    const firstHalf = days.slice(0, 15).filter((d) => d.hasData);
    const secondHalf = days.slice(15).filter((d) => d.hasData);

    const firstHalfAvg = firstHalf.length > 0
      ? Math.round(firstHalf.reduce((acc, d) => acc + (d.accuracy || 0), 0) / firstHalf.length)
      : null;
    const secondHalfAvg = secondHalf.length > 0
      ? Math.round(secondHalf.reduce((acc, d) => acc + (d.accuracy || 0), 0) / secondHalf.length)
      : null;

    const delta = (firstHalfAvg !== null && secondHalfAvg !== null)
      ? secondHalfAvg - firstHalfAvg
      : 0;

    return {
      chartData: days,
      totalAnswered30d: sumTotal,
      totalCorrect30d: sumCorrect,
      overallAccuracy30d: overallAccuracy,
      activeDaysCount: daysWithQuestions,
      trendDelta: delta
    };
  }, [questionRecords, streakState, selectedSubject]);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: DayDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[210px] z-50">
          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {point.dayLabel}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {point.fullDate}
            </span>
          </div>

          {point.hasData ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Precisão do Dia:
                </span>
                <span className="text-sm font-mono">{point.accuracy}%</span>
              </div>

              {point.movingAvgAccuracy !== null && (
                <div className="flex items-center justify-between text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                    Média Móvel (7d):
                  </span>
                  <span className="font-mono font-semibold">{point.movingAvgAccuracy}%</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/80 pt-1.5 text-[11px]">
                <span className="text-slate-400">Questões do Dia:</span>
                <span className="font-mono">
                  <strong className="text-white">{point.correct}</strong> acertos / {point.total} respondidas
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-[11px] py-1 text-center italic">
              Nenhuma questão registrada neste dia
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 ${className}`}>
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Evolução da Precisão (Últimos 30 Dias)</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              • Prática Deliberada & Recuperação Ativa
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Precisão Média Diária em Questões</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Acompanhe o rendimento e a estabilidade da sua taxa de acertos ao longo do último mês.
            Linha de referência definida na meta de <strong>{targetAccuracy}%</strong> de aproveitamento.
          </p>
        </div>

        {/* Filter and View Toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {showSubjectBreakdown && availableSubjects.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                aria-label="Filtrar disciplina"
              >
                <option value="all" className="bg-slate-900 text-white">Todas as Matérias</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900 text-white">{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewType("accuracy")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewType === "accuracy"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Taxa de Precisão (%)
            </button>
            <button
              type="button"
              onClick={() => setViewType("volume")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewType === "volume"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Volume de Questões
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Precisão Média 30D */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Precisão (30d)</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {overallAccuracy30d}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            {overallAccuracy30d >= targetAccuracy ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Meta de {targetAccuracy}% atingida!
              </span>
            ) : (
              <span className="text-amber-400/90 font-medium">
                Meta: {targetAccuracy}% (+{targetAccuracy - overallAccuracy30d}% p/ atingir)
              </span>
            )}
          </p>
        </div>

        {/* KPI 2: Tendência Últimas 2 Semanas */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Tendência Recente</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            trendDelta > 0 ? "text-emerald-400" : trendDelta < 0 ? "text-rose-400" : "text-slate-300"
          }`}>
            {trendDelta > 0 ? `+${trendDelta}%` : `${trendDelta}%`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {trendDelta > 0
              ? "Evolução positiva em relação ao início do mês"
              : trendDelta < 0
              ? "Pequena oscilação; intensifique revisões"
              : "Desempenho estável no período"}
          </p>
        </div>

        {/* KPI 3: Questões Resolvidas */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Questões no Mês</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
            {totalAnswered30d}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-400">{totalCorrect30d}</strong> respostas corretas
          </p>
        </div>

        {/* KPI 4: Constância */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Dias de Prática</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono tracking-tight">
            {activeDaysCount} <span className="text-sm font-sans font-medium text-slate-400">/ 30 dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeDaysCount >= 20 ? "Consistência de elite 🏆" : activeDaysCount >= 10 ? "Bom ritmo de prática 🌱" : "Comece a responder diariamente"}
          </p>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3 text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <strong className="text-emerald-300">Precisão Diária (%)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-400 border border-dashed border-teal-400 inline-block" />
              <span className="text-teal-300">Média Móvel (7d)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400/80 border-t border-dashed border-amber-400 inline-block" />
              <span className="text-amber-300">Meta ({targetAccuracy}%)</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {chartData[0]?.dayLabel} até {chartData[chartData.length - 1]?.dayLabel}
          </span>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === "accuracy" ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="accuracyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                <XAxis
                  dataKey="dayLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={window.innerWidth < 640 ? 5 : 2}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                  ticks={[0, 25, 50, 75, 80, 100]}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Reference line for Target Accuracy */}
                <ReferenceLine
                  y={targetAccuracy}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta ${targetAccuracy}%`,
                    fill: "#f59e0b",
                    fontSize: 10,
                    position: "insideTopRight"
                  }}
                />

                {/* Area under the curve */}
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  fill="url(#accuracyAreaGradient)"
                  stroke="none"
                  connectNulls={false}
                />

                {/* 7-day Moving Average Line (dashed) */}
                <Line
                  type="monotone"
                  dataKey="movingAvgAccuracy"
                  name="Média Móvel (7d)"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={true}
                  activeDot={false}
                />

                {/* Primary Daily Accuracy Line */}
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Precisão Diária"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 3, fill: "#10b981", stroke: "#0f172a", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: "#34d399", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : (
              /* Volume View: Questions answered each day */
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                <XAxis
                  dataKey="dayLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={window.innerWidth < 640 ? 5 : 2}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total de Questões"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#f59e0b", stroke: "#0f172a", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: "#fbbf24", stroke: "#ffffff", strokeWidth: 2 }}
                />

                <Line
                  type="monotone"
                  dataKey="correct"
                  name="Acertos"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#10b981", stroke: "#0f172a", strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: "#34d399", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Empty state notice if user has 0 questions in 30 days */}
        {totalAnswered30d === 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
            <p className="text-xs font-semibold text-slate-300">
              Nenhuma questão resolvida registrada nos últimos 30 dias.
            </p>
            <p className="text-[11px] text-slate-500">
              Pratique com o <strong>Tutor IA</strong>, resolva o <strong>Diagnóstico</strong> ou faça uma <strong>Prova Antiga</strong> para ver sua precisão diária ser traçada automaticamente aqui.
            </p>
          </div>
        )}
      </div>

      {/* Pedagogical Micro-Insight Footer */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-white">
            Como interpretar sua curva de precisão:
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Oscilações naturais ocorrem ao encarar conteúdos novos ou de nível difícil. O objetivo é manter a <strong>Média Móvel (linha tracejada verde-água)</strong> gradativamente acima de <strong>{targetAccuracy}%</strong>, indicando retenção na memória de longo prazo e domínio dos tópicos prioritários.
          </p>
        </div>
      </div>
    </div>
  );
};
