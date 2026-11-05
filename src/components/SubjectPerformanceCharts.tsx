import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  Flame,
  Activity,
} from "lucide-react";
import { WeeklyCheckin, UserProfile, SubjectMetric, GeneratedPlans } from "../types";

interface SubjectPerformanceChartsProps {
  checkins: WeeklyCheckin[];
  profile: UserProfile;
  plans?: GeneratedPlans | null;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
}

export const SubjectPerformanceCharts: React.FC<SubjectPerformanceChartsProps> = ({
  checkins,
  profile,
  plans,
  onLaunchTopicTutor,
}) => {
  const [activeTab, setActiveTab] = useState<"ranking" | "radar" | "timeline" | "scatter">("ranking");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "priority">("all");
  const [selectedSubjectForTimeline, setSelectedSubjectForTimeline] = useState<string>(
    profile.subjects[0] || "Matemática"
  );

  // Helper: Extract or aggregate subject performance data from checkins and profile
  const getAggregatedSubjectData = () => {
    // Collect all subjects from profile and checkins
    const allSubjects = Array.from(
      new Set([
        ...profile.subjects,
        ...checkins.flatMap((c) => (c.subjectMetrics ? c.subjectMetrics.map((sm) => sm.subject) : [])),
      ])
    );

    return allSubjects.map((sub) => {
      // Find history of this subject across all checkins
      const entries = checkins
        .map((c) => {
          const metric = c.subjectMetrics?.find(
            (m) => m.subject.toLowerCase() === sub.toLowerCase()
          );
          if (metric) {
            return {
              weekNumber: c.weekNumber,
              accuracy: metric.accuracy,
              hoursSpent: metric.hoursSpent,
              weakTopics: metric.weakTopics,
              date: c.date,
            };
          }
          // If no explicit metric, calculate proxy based on difficulties / general accuracy
          const isDifficult = profile.difficulties.toLowerCase().includes(sub.toLowerCase());
          const isStrength = profile.strengths.toLowerCase().includes(sub.toLowerCase());
          const baseAccuracy = isDifficult
            ? Math.max(45, c.accuracyRate - 15)
            : isStrength
            ? Math.min(96, c.accuracyRate + 10)
            : c.accuracyRate;

          return {
            weekNumber: c.weekNumber,
            accuracy: baseAccuracy,
            hoursSpent: +(c.completedHours / Math.max(1, allSubjects.length)).toFixed(1),
            weakTopics: isDifficult
              ? [profile.priorityTopics.split(",")[0] || `${sub} Avançado`]
              : [],
            date: c.date,
          };
        })
        .sort((a, b) => a.weekNumber - b.weekNumber);

      const latestEntry = entries[entries.length - 1];
      const avgAccuracy = entries.length > 0
        ? Math.round(entries.reduce((acc, e) => acc + e.accuracy, 0) / entries.length)
        : 70;
      const latestAccuracy = latestEntry ? latestEntry.accuracy : avgAccuracy;
      const totalHours = entries.reduce((acc, e) => acc + e.hoursSpent, 0);

      // Collect all distinct weak topics
      const allWeakTopics = Array.from(
        new Set(entries.flatMap((e) => e.weakTopics).filter(Boolean))
      );

      // Fallback weak topics from profile if none logged
      if (allWeakTopics.length === 0 && profile.difficulties.toLowerCase().includes(sub.toLowerCase())) {
        allWeakTopics.push(`Revisão de ${sub}`);
      }

      // Determine classification status
      let status: "critical" | "warning" | "good" | "mastered" = "good";
      if (latestAccuracy < 70) status = "critical";
      else if (latestAccuracy < 80) status = "warning";
      else if (latestAccuracy < 90) status = "good";
      else status = "mastered";

      const isPriority = profile.priorityTopics.toLowerCase().includes(sub.toLowerCase());

      return {
        subject: sub,
        latestAccuracy,
        avgAccuracy,
        totalHours: +totalHours.toFixed(1),
        status,
        isPriority,
        weakTopics: allWeakTopics,
        history: entries,
        needsReinforcement: latestAccuracy < 75,
      };
    });
  };

  const subjectData = getAggregatedSubjectData();

  // Filtered list
  const filteredSubjects = subjectData.filter((item) => {
    if (filterSeverity === "critical") return item.status === "critical" || item.status === "warning";
    if (filterSeverity === "priority") return item.isPriority;
    return true;
  });

  // Sort subjects: critical first for high visibility
  const sortedForRanking = [...filteredSubjects].sort((a, b) => a.latestAccuracy - b.latestAccuracy);

  // Critical subjects needing immediate AI tutoring / reinforcement
  const criticalSubjects = subjectData.filter((s) => s.needsReinforcement || s.status === "critical");

  // Timeline data for single subject
  const selectedSubjectData = subjectData.find(
    (s) => s.subject.toLowerCase() === selectedSubjectForTimeline.toLowerCase()
  ) || subjectData[0];

  const timelineChartData = selectedSubjectData?.history.map((h) => ({
    name: `Sem. ${h.weekNumber}`,
    weekNumber: h.weekNumber,
    accuracy: h.accuracy,
    hours: h.hoursSpent,
    benchmark: 80,
  })) || [];

  // Color generator based on accuracy rate
  const getBarColor = (accuracy: number) => {
    if (accuracy < 70) return "#f43f5e"; // Rose (Critical)
    if (accuracy < 80) return "#f59e0b"; // Amber (Warning)
    if (accuracy < 90) return "#10b981"; // Emerald (Good)
    return "#06b6d4"; // Cyan (Mastered)
  };

  // Custom Dark Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px] z-50">
          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{data.subject}</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: `${getBarColor(data.latestAccuracy)}20`,
                color: getBarColor(data.latestAccuracy),
              }}
            >
              {data.status === "critical"
                ? "Reforço Urgente"
                : data.status === "warning"
                ? "Atenção"
                : data.status === "good"
                ? "Bom Domínio"
                : "Consolidado"}
            </span>
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Taxa de Acertos Atual:</span>
              <strong className="text-white font-mono">{data.latestAccuracy}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Média Histórica:</span>
              <strong className="text-slate-300 font-mono">{data.avgAccuracy}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Horas Acumuladas:</span>
              <strong className="text-sky-300 font-mono">{data.totalHours}h</strong>
            </div>
          </div>
          {data.weakTopics.length > 0 && (
            <div className="pt-1 border-t border-slate-800">
              <span className="text-[10px] text-amber-300 font-semibold block mb-0.5">
                Pontos de Dificuldade:
              </span>
              <p className="text-[11px] text-slate-300 italic truncate max-w-[200px]">
                {data.weakTopics.join(", ")}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>Diagnóstico Comparativo Disciplinar & Identificação de Lacunas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Desempenho por Matéria & Mapeamento de Reforço
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analise quais disciplinas estão abaixo da meta esperada (80%) e acione tutoria socrática direta para os tópicos de maior dificuldade.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveTab("ranking")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                activeTab === "ranking"
                  ? "bg-rose-500 text-white shadow font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Comparativo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                activeTab === "radar"
                  ? "bg-indigo-500 text-white shadow font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Teia de Domínio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                activeTab === "timeline"
                  ? "bg-teal-500 text-slate-950 shadow font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Evolução Individual
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scatter")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                activeTab === "scatter"
                  ? "bg-cyan-500 text-slate-950 shadow font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Dispersão (Horas vs Retenção)
            </button>
          </div>
        </div>
      </div>

      {/* Critical Subjects Alert Banner */}
      {criticalSubjects.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                {criticalSubjects.length} {criticalSubjects.length === 1 ? "Matéria Exige" : "Matérias Exigem"} Reforço Prioritário
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Identificamos taxa de retenção abaixo de 75% em:{" "}
                <span className="font-semibold text-rose-200">
                  {criticalSubjects.map((s) => `${s.subject} (${s.latestAccuracy}%)`).join(", ")}
                </span>
                . Recomendamos priorizar sessões socráticas nestes conteúdos.
              </p>
            </div>
          </div>
          {onLaunchTopicTutor && criticalSubjects[0] && (
            <button
              type="button"
              onClick={() =>
                onLaunchTopicTutor(
                  criticalSubjects[0].weakTopics[0] || `${criticalSubjects[0].subject} - Fundamentos`,
                  criticalSubjects[0].subject
                )
              }
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow transition shrink-0 flex items-center justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tutoria IA em {criticalSubjects[0].subject}
            </button>
          )}
        </div>
      )}

      {/* TAB 1: RANKING COMPARATIVE BAR CHART */}
      {activeTab === "ranking" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filtrar por:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterSeverity("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterSeverity === "all"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas ({subjectData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSeverity("critical")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterSeverity === "critical"
                      ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Necessitam Reforço ({criticalSubjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSeverity("priority")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterSeverity === "priority"
                      ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Matérias Prioritárias do Perfil
                </button>
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>&lt;70% Crítico</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>70-79% Atenção</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>≥80% Meta</span>
              </span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedForRanking}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: "#475569" }}
                />
                <YAxis
                  type="category"
                  dataKey="subject"
                  stroke="#cbd5e1"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#475569" }}
                  width={110}
                />
                <Tooltip content={<CustomBarTooltip />} />

                {/* Target Benchmark at 80% */}
                <ReferenceLine
                  x={80}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Meta 80%",
                    fill: "#10b981",
                    fontSize: 11,
                    position: "top",
                  }}
                />
                {/* Critical Threshold at 70% */}
                <ReferenceLine
                  x={70}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Alerta 70%",
                    fill: "#f43f5e",
                    fontSize: 11,
                    position: "top",
                  }}
                />

                <Bar
                  dataKey="latestAccuracy"
                  name="Taxa de Acertos"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                >
                  {sortedForRanking.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.latestAccuracy)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: RADAR CHART (TEIA DE DOMÍNIO) */}
      {activeTab === "radar" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 text-center">
            A Teia de Domínio compara o equilíbrio do seu aprendizado. Áreas mais próximas do centro indicam lacunas que demandam compensação.
          </p>
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={subjectData.map((s) => ({
                  subject: s.subject,
                  acertos: s.latestAccuracy,
                  meta: 80,
                  fullMark: 100,
                }))}
              >
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#cbd5e1" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Radar
                  name="Sua Taxa de Acertos (%)"
                  dataKey="acertos"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Meta de Domínio (80%)"
                  dataKey="meta"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeDasharray="4 4"
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE EVOLUTION FOR SINGLE SUBJECT */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <label className="text-xs font-semibold text-slate-300">
              Selecione a Matéria para Inspecionar a Evolução Semanal:
            </label>
            <select
              value={selectedSubjectForTimeline}
              onChange={(e) => setSelectedSubjectForTimeline(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-teal-500"
            >
              {subjectData.map((s) => (
                <option key={s.subject} value={s.subject}>
                  {s.subject} (Atual: {s.latestAccuracy}%)
                </option>
              ))}
            </select>
          </div>

          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} unit="%" tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label="Meta 80%" />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name={`Taxa de Acertos em ${selectedSubjectForTimeline} (%)`}
                  stroke={getBarColor(selectedSubjectData?.latestAccuracy || 70)}
                  strokeWidth={3}
                  dot={{ r: 5, fill: getBarColor(selectedSubjectData?.latestAccuracy || 70) }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: MULTIDISCIPLINARY SCATTER PLOT */}
      {activeTab === "scatter" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Gráfico de dispersão cruzando <strong>Horas Investidas</strong> (Eixo X) vs. <strong>Taxa de Acertos</strong> (Eixo Y). Bolhas maiores indicam matérias com maior volume de tópicos.
          </p>

          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  type="number"
                  dataKey="totalHours"
                  name="Horas Investidas"
                  unit="h"
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, "dataMax + 2"]}
                  tickLine={false}
                  label={{
                    value: "Horas Acumuladas na Matéria (h)",
                    position: "insideBottom",
                    offset: -10,
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="latestAccuracy"
                  name="Taxa de Acertos"
                  unit="%"
                  domain={[30, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: "Taxa de Acertos (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <ZAxis type="number" range={[150, 450]} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label="Meta 80%" />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label="Alerta 70%" />
                <Scatter name="Matérias" data={subjectData} fill="#06b6d4">
                  {subjectData.map((entry, index) => (
                    <Cell
                      key={`scatter-sub-${index}`}
                      fill={getBarColor(entry.latestAccuracy)}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DETAILED ACTION MATRIX: SUBJECTS, WEAK TOPICS & TUTOR ACTIONS */}
      <div className="pt-5 border-t border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center">
            <Flame className="w-4 h-4 mr-1.5 text-amber-400" />
            Matriz de Tópicos que Exigem Reforço & Ação Imediata
          </span>
          <span className="text-xs font-normal text-slate-400">
            {subjectData.length} matérias catalogadas
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjectData.map((item) => {
            const isCritical = item.status === "critical";
            const isWarning = item.status === "warning";
            const isMastered = item.status === "mastered";

            return (
              <div
                key={item.subject}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  isCritical
                    ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70"
                    : isWarning
                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{item.subject}</h4>
                      {item.isPriority && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          Prioritária
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Dedicação: <strong>{item.totalHours}h</strong> • Média: {item.avgAccuracy}%
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-lg font-black font-mono block ${
                        isCritical
                          ? "text-rose-400"
                          : isWarning
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.latestAccuracy}%
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? "text-rose-400"
                          : isWarning
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {isCritical
                        ? "Reforço Crítico"
                        : isWarning
                        ? "Atenção"
                        : isMastered
                        ? "Excelente"
                        : "No Alvo"}
                    </span>
                  </div>
                </div>

                {/* Specific Weak Topics */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tópicos Mapeados para Reforço:
                  </span>
                  {item.weakTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.weakTopics.map((top, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            isCritical
                              ? "bg-rose-500/10 text-rose-200 border-rose-500/30"
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}
                        >
                          {top}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Nenhum gargalo pontual registrado.
                    </span>
                  )}
                </div>

                {/* Direct Action Button: Launch Tutor Session */}
                {onLaunchTopicTutor && (
                  <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const targetTopic =
                          item.weakTopics[0] || `${item.subject} - Questões e Teoria`;
                        onLaunchTopicTutor(targetTopic, item.subject);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                        isCritical
                          ? "bg-rose-500 hover:bg-rose-400 text-white shadow"
                          : isWarning
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Tutoria Socrática IA
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
