import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Target,
  Smile,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  StudyJournalEntry,
  UserProfile,
  SubjectSentimentStatus,
  JournalSubjectSentiment,
} from "../types";
import { getDifficultyMeta } from "./ProfileForm";

interface SentimentThermometerChartProps {
  journalEntries: StudyJournalEntry[];
  profile: UserProfile;
}

// Convert qualitative sentiment to numeric score for charting
// 1: Crítico / Precisa de Reforço (needs_attention)
// 2: Desafiador / Exige Atenção (challenging)
// 3: Melhorando & Em Evolução (improving)
// 4: Confiante & Dominado (confident)
export const SENTIMENT_NUMERIC_VALUE: Record<SubjectSentimentStatus, number> = {
  needs_attention: 1,
  challenging: 2,
  improving: 3,
  confident: 4,
};

export const SENTIMENT_VALUE_LABEL: Record<number, { label: string; short: string; color: string }> = {
  1: { label: "Crítico / Precisa Reforço", short: "Crítico", color: "#f43f5e" },
  2: { label: "Desafiador / Exige Atenção", short: "Desafiador", color: "#f59e0b" },
  3: { label: "Melhorando & Em Evolução", short: "Evoluindo", color: "#38bdf8" },
  4: { label: "Confiante & Dominado", short: "Confiante", color: "#10b981" },
};

// Vibrant palette for subjects in charts
const SUBJECT_COLORS = [
  "#10b981", // emerald
  "#38bdf8", // sky
  "#a855f7", // purple
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#84cc16", // lime
];

export const SentimentThermometerChart: React.FC<SentimentThermometerChartProps> = ({
  journalEntries,
  profile,
}) => {
  const [viewMode, setViewMode] = useState<"evolution" | "subject_comparison" | "distribution">("evolution");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"current_month" | "all">("current_month");

  // Extract all distinct subjects appearing in entries or profile
  const allSubjects = useMemo(() => {
    const subs = new Set<string>();
    if (profile.subjects && Array.isArray(profile.subjects)) {
      profile.subjects.forEach((s) => subs.add(s.trim()));
    }
    journalEntries.forEach((entry) => {
      entry.subjectSentiments?.forEach((ss) => {
        if (ss.subject) subs.add(ss.subject.trim());
      });
    });
    return Array.from(subs);
  }, [profile, journalEntries]);

  // Filter entries chronologically & by time range
  const sortedEntries = useMemo(() => {
    const list = [...journalEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (timeRange === "current_month") {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const filtered = list.filter((e) => e.date.startsWith(currentYearMonth));
      // If user has entries but none this month, fallback to last 30 days
      if (filtered.length === 0 && list.length > 0) {
        return list.slice(-30);
      }
      return filtered;
    }
    return list;
  }, [journalEntries, timeRange]);

  // Build daily timeline dataset for Recharts
  const timelineData = useMemo(() => {
    return sortedEntries.map((entry) => {
      // Format day/month
      const parts = entry.date.split("-");
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : entry.date;

      // Calculate average sentiment for this day across all recorded subjects
      let totalSentimentScore = 0;
      let sentimentCount = 0;
      const subjectScores: Record<string, number> = {};

      entry.subjectSentiments?.forEach((ss) => {
        const val = SENTIMENT_NUMERIC_VALUE[ss.sentiment] || 2.5;
        subjectScores[ss.subject] = val;
        totalSentimentScore += val;
        sentimentCount++;
      });

      const avgSentiment = sentimentCount > 0 
        ? Number((totalSentimentScore / sentimentCount).toFixed(2)) 
        : null;

      // Calculate confidence index as percentage (1 to 4 mapped to 25% - 100%)
      const confidenceIndex = avgSentiment !== null 
        ? Math.round((avgSentiment / 4) * 100) 
        : null;

      return {
        date: entry.date,
        formattedDate,
        title: entry.title,
        avgSentiment,
        confidenceIndex,
        focusScore: entry.focusScore || 0,
        energyLevel: (entry.energyLevel || 0) * 2, // scaled to 10 for visual harmony
        sentimentCount,
        ...subjectScores,
      };
    });
  }, [sortedEntries]);

  // Aggregate stats per subject across the month
  const subjectAggregates = useMemo(() => {
    const map: Record<
      string,
      {
        totalScore: number;
        count: number;
        history: { date: string; score: number }[];
        statusDistribution: Record<SubjectSentimentStatus, number>;
      }
    > = {};

    sortedEntries.forEach((entry) => {
      entry.subjectSentiments?.forEach((ss) => {
        if (!map[ss.subject]) {
          map[ss.subject] = {
            totalScore: 0,
            count: 0,
            history: [],
            statusDistribution: {
              confident: 0,
              improving: 0,
              challenging: 0,
              needs_attention: 0,
            },
          };
        }
        const val = SENTIMENT_NUMERIC_VALUE[ss.sentiment];
        map[ss.subject].totalScore += val;
        map[ss.subject].count++;
        map[ss.subject].history.push({ date: entry.date, score: val });
        map[ss.subject].statusDistribution[ss.sentiment] =
          (map[ss.subject].statusDistribution[ss.sentiment] || 0) + 1;
      });
    });

    return allSubjects.map((sub) => {
      const data = map[sub];
      const avg = data && data.count > 0 ? Number((data.totalScore / data.count).toFixed(2)) : 0;
      const declaredDiff = profile.subjectDifficulties?.[sub] ?? 5;
      
      // Calculate growth trend (last score - first score)
      let delta = 0;
      if (data && data.history.length > 1) {
        const first = data.history[0].score;
        const last = data.history[data.history.length - 1].score;
        delta = Number((last - first).toFixed(2));
      }

      return {
        subject: sub,
        avgScore: avg,
        avgPercentage: Math.round((avg / 4) * 100),
        count: data ? data.count : 0,
        declaredDiff,
        delta,
        statusDistribution: data ? data.statusDistribution : { confident: 0, improving: 0, challenging: 0, needs_attention: 0 },
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [sortedEntries, allSubjects, profile]);

  // Global summary metrics
  const globalSummary = useMemo(() => {
    if (timelineData.length === 0) {
      return { avgConfidence: 0, delta: 0, topSubject: null, bottleneckSubject: null, dominantStatus: "Sem dados" };
    }

    const validSentiments = timelineData.filter((d) => d.avgSentiment !== null);
    const avgScore = validSentiments.length > 0
      ? validSentiments.reduce((acc, curr) => acc + curr.avgSentiment!, 0) / validSentiments.length
      : 0;

    let delta = 0;
    if (validSentiments.length >= 2) {
      const first = validSentiments[0].avgSentiment!;
      const last = validSentiments[validSentiments.length - 1].avgSentiment!;
      delta = Number((last - first).toFixed(2));
    }

    const withData = subjectAggregates.filter((s) => s.count > 0);
    const topSubject = withData.length > 0 ? withData[0] : null;
    const bottleneckSubject = withData.length > 0 ? withData[withData.length - 1] : null;

    return {
      avgConfidence: Math.round((avgScore / 4) * 100),
      avgScore: Number(avgScore.toFixed(2)),
      delta,
      topSubject,
      bottleneckSubject,
      entriesCount: timelineData.length,
    };
  }, [timelineData, subjectAggregates]);

  if (journalEntries.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">Evolução Mensal do Termômetro de Sentimentos</h3>
          <p className="text-xs text-slate-400">
            Adicione seus primeiros registros de diário de bordo com as percepções de cada matéria para visualizar o gráfico interativo de evolução temporal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-1.5">
            <TrendingUp className="w-3 h-3" />
            <span>Análise Longitudinal & Desempenho Emocional</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Evolução do Termômetro de Sentimentos</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {timeRange === "current_month" ? "Mês Atual" : "Todo o Período"} ({sortedEntries.length} registros)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Acompanhe o ganho de confiança cognitiva e segurança matéria a matéria. O termômetro varia de 1 (Crítico) a 4 (Confiante & Dominado).
          </p>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTimeRange("current_month")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                timeRange === "current_month"
                  ? "bg-slate-800 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                timeRange === "all"
                  ? "bg-slate-800 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todo o Histórico
            </button>
          </div>

          {/* Chart View Mode */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("evolution")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                viewMode === "evolution"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Linha Temporal
            </button>
            <button
              type="button"
              onClick={() => setViewMode("subject_comparison")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                viewMode === "subject_comparison"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Comparativo por Matéria
            </button>
            <button
              type="button"
              onClick={() => setViewMode("distribution")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                viewMode === "distribution"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Distribuição de Status
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Índice Médio de Domínio</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-white">{globalSummary.avgConfidence}%</span>
            <span className="text-[11px] text-emerald-400 font-medium">({globalSummary.avgScore}/4.0)</span>
          </div>
          <p className="text-[10px] text-slate-500">Média ponderada do mês</p>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Variação no Período</span>
            {globalSummary.delta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-xl sm:text-2xl font-bold ${
                globalSummary.delta > 0
                  ? "text-emerald-400"
                  : globalSummary.delta < 0
                  ? "text-rose-400"
                  : "text-slate-300"
              }`}
            >
              {globalSummary.delta > 0 ? `+${globalSummary.delta}` : globalSummary.delta} pts
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Evolução do 1º ao último registro</p>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Matéria Mais Segura</span>
            <Smile className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {globalSummary.topSubject ? globalSummary.topSubject.subject : "Sem dados"}
          </p>
          <p className="text-[10px] text-sky-400 font-medium">
            {globalSummary.topSubject ? `${globalSummary.topSubject.avgPercentage}% de confiança` : "-"}
          </p>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Ponto de Atenção</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {globalSummary.bottleneckSubject ? globalSummary.bottleneckSubject.subject : "Nenhum gargalo"}
          </p>
          <p className="text-[10px] text-amber-400 font-medium">
            {globalSummary.bottleneckSubject ? `Média ${globalSummary.bottleneckSubject.avgScore}/4.0` : "-"}
          </p>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Secondary subject filter (only for evolution mode) */}
        {viewMode === "evolution" && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Filtrar visualização da linha:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Média Geral + Todas as Matérias</option>
                <option value="overall_only">Apenas Média Geral</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" /> 4: Confiante
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-1.5" /> 3: Evoluindo
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" /> 2: Desafiador
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5" /> 1: Crítico
              </span>
            </div>
          </div>
        )}

        {/* View 1: Timeline Evolution Chart */}
        {viewMode === "evolution" && (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  domain={[1, 4]}
                  ticks={[1, 2, 3, 4]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(val) => {
                    if (val === 4) return "4 (Confiante)";
                    if (val === 3) return "3 (Evoluindo)";
                    if (val === 2) return "2 (Desafio)";
                    if (val === 1) return "1 (Crítico)";
                    return `${val}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl space-y-2 text-xs z-50">
                          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-3">
                            <span className="font-bold text-white flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-emerald-400" />
                              {item.date}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {item.title}
                            </span>
                          </div>
                          {item.avgSentiment !== null && (
                            <div className="flex justify-between items-center text-emerald-300 font-semibold">
                              <span>Média Geral do Termômetro:</span>
                              <span className="bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                                {item.avgSentiment}/4.0 ({item.confidenceIndex}%)
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Foco Líquido:</span>
                            <span className="text-teal-400 font-mono font-bold">{item.focusScore}/10</span>
                          </div>

                          {/* Individual subjects logged on this day */}
                          <div className="pt-1.5 border-t border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Matérias Registradas:
                            </span>
                            {allSubjects.map((sub) => {
                              const score = item[sub];
                              if (typeof score !== "number") return null;
                              const cfg = SENTIMENT_VALUE_LABEL[Math.round(score)] || {
                                label: `${score}`,
                                short: `${score}`,
                                color: "#10b981",
                              };
                              return (
                                <div key={sub} className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-300 truncate max-w-[130px]">{sub}</span>
                                  <span style={{ color: cfg.color }} className="font-semibold font-mono">
                                    {cfg.short} ({score})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={3} stroke="#38bdf8" strokeDasharray="3 3" opacity={0.4} />
                <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.4} />

                {/* Overall Average Area */}
                {(selectedSubject === "all" || selectedSubject === "overall_only") && (
                  <Area
                    type="monotone"
                    dataKey="avgSentiment"
                    name="Média Geral de Sentimento"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sentimentGradient)"
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 6, fill: "#34d399", stroke: "#064e3b", strokeWidth: 2 }}
                  />
                )}

                {/* Specific Subject Lines */}
                {selectedSubject !== "overall_only" && (
                  <>
                    {selectedSubject === "all"
                      ? allSubjects.slice(0, 5).map((sub, idx) => (
                          <Line
                            key={sub}
                            type="monotone"
                            dataKey={sub}
                            name={sub}
                            stroke={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}
                            strokeWidth={1.5}
                            dot={{ r: 2 }}
                            connectNulls
                          />
                        ))
                      : (
                          <Line
                            type="monotone"
                            dataKey={selectedSubject}
                            name={selectedSubject}
                            stroke="#38bdf8"
                            strokeWidth={3}
                            dot={{ fill: "#38bdf8", r: 4 }}
                            activeDot={{ r: 7 }}
                            connectNulls
                          />
                        )}
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* View 2: Subject Comparison Bar Chart */}
        {viewMode === "subject_comparison" && (
          <div className="space-y-3">
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectAggregates}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(v) => `${v}/4`}
                  />
                  <YAxis
                    dataKey="subject"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const diffMeta = getDifficultyMeta(item.declaredDiff);
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl space-y-1.5 text-xs">
                            <p className="font-bold text-white text-sm">{item.subject}</p>
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>Sentimento Médio no Mês:</span>
                              <strong className="text-emerald-400 font-mono">{item.avgScore}/4.0 ({item.avgPercentage}%)</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>Dificuldade Cadastrada:</span>
                              <span className={`font-mono font-bold ${diffMeta.textColor}`}>
                                {item.declaredDiff}/10 ({diffMeta.shortLabel})
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>Registros no Período:</span>
                              <span className="font-bold text-slate-200">{item.count} vezes</span>
                            </div>
                            {item.delta !== 0 && (
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                                <span>Evolução:</span>
                                <span className={item.delta > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                  {item.delta > 0 ? `+${item.delta}` : item.delta} pts
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="avgScore"
                    name="Sentimento Médio"
                    radius={[0, 8, 8, 0]}
                    fill="#10b981"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject List Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {subjectAggregates.map((item) => {
                const diffMeta = getDifficultyMeta(item.declaredDiff);
                return (
                  <div
                    key={item.subject}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="font-bold text-white block truncate" title={item.subject}>
                        {item.subject}
                      </span>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                        <span className={`px-1 rounded border font-mono ${diffMeta.badgeColor}`}>
                          Dif. {item.declaredDiff}/10
                        </span>
                        <span>•</span>
                        <span>{item.count} registros</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-400 font-mono text-sm block">
                        {item.avgScore > 0 ? `${item.avgScore}/4` : "-"}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.avgPercentage}% domínio</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 3: Status Distribution Matrix */}
        {viewMode === "distribution" && (
          <div className="space-y-4">
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectAggregates.map((s) => ({
                    subject: s.subject,
                    confident: s.statusDistribution.confident || 0,
                    improving: s.statusDistribution.improving || 0,
                    challenging: s.statusDistribution.challenging || 0,
                    needs_attention: s.statusDistribution.needs_attention || 0,
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl space-y-1.5 text-xs">
                            <p className="font-bold text-white text-sm border-b border-slate-800 pb-1">{label}</p>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between items-center text-emerald-400">
                                <span>🟢 Confiante & Dominado:</span>
                                <strong>{payload.find((p) => p.dataKey === "confident")?.value || 0} vezes</strong>
                              </div>
                              <div className="flex justify-between items-center text-sky-400">
                                <span>🔵 Melhorando & Em Evolução:</span>
                                <strong>{payload.find((p) => p.dataKey === "improving")?.value || 0} vezes</strong>
                              </div>
                              <div className="flex justify-between items-center text-amber-400">
                                <span>🟡 Desafiador / Atenção:</span>
                                <strong>{payload.find((p) => p.dataKey === "challenging")?.value || 0} vezes</strong>
                              </div>
                              <div className="flex justify-between items-center text-rose-400">
                                <span>🔴 Crítico / Reforço:</span>
                                <strong>{payload.find((p) => p.dataKey === "needs_attention")?.value || 0} vezes</strong>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      if (value === "confident") return <span className="text-emerald-300 text-xs">Confiante</span>;
                      if (value === "improving") return <span className="text-sky-300 text-xs">Evoluindo</span>;
                      if (value === "challenging") return <span className="text-amber-300 text-xs">Desafiador</span>;
                      if (value === "needs_attention") return <span className="text-rose-300 text-xs">Crítico</span>;
                      return value;
                    }}
                  />
                  <Bar dataKey="confident" stackId="a" fill="#10b981" />
                  <Bar dataKey="improving" stackId="a" fill="#38bdf8" />
                  <Bar dataKey="challenging" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="needs_attention" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
