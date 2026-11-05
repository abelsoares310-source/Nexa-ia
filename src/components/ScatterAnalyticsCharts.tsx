import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  ReferenceArea,
} from "recharts";
import {
  Activity,
  Sparkles,
  Zap,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
  Info,
  Clock,
  Target,
  Gauge,
  HelpCircle,
} from "lucide-react";
import { WeeklyCheckin, UserProfile, GeneratedPlans } from "../types";

interface ScatterAnalyticsChartsProps {
  checkins: WeeklyCheckin[];
  profile: UserProfile;
  plans?: GeneratedPlans | null;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
}

export const ScatterAnalyticsCharts: React.FC<ScatterAnalyticsChartsProps> = ({
  checkins,
  profile,
  plans,
  onLaunchTopicTutor,
}) => {
  const [activeScatterTab, setActiveScatterTab] = useState<
    "timeVsProductivity" | "subjectEvolution" | "quadrants"
  >("timeVsProductivity");

  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // 1. Process data for "Time of Study vs Perceived Productivity"
  const timeVsProductivityData = useMemo(() => {
    return checkins.map((c) => {
      // Calculate or retrieve perceived productivity
      // If user hasn't explicitly set perceivedProductivity, we estimate it intelligently
      // from accuracy rate, adherence to planned hours, and focus score
      const adherence =
        c.plannedHours > 0
          ? Math.min(1.2, c.completedHours / c.plannedHours)
          : 1;
      
      const estimatedProd =
        c.perceivedProductivity ??
        Math.min(
          100,
          Math.max(
            35,
            Math.round(c.accuracyRate * 0.7 + Math.min(adherence, 1) * 30)
          )
        );

      const topicsCount = Math.max(1, c.completedTopics.length);
      const efficiencyScore = +(
        estimatedProd / Math.max(1, c.completedHours)
      ).toFixed(1);

      // Color coding based on productivity & accuracy
      let color = "#10b981"; // Green (High efficiency)
      let efficiencyBadge = "Alta Eficiência";
      if (estimatedProd < 70 || c.accuracyRate < 70) {
        color = "#f43f5e"; // Rose (Critical / Low Efficiency)
        efficiencyBadge = "Sobrecarga / Baixo Rendimento";
      } else if (estimatedProd < 82 || c.accuracyRate < 80) {
        color = "#f59e0b"; // Amber (Moderate)
        efficiencyBadge = "Moderado";
      } else {
        color = "#06b6d4"; // Cyan (Optimal)
        efficiencyBadge = "Zona de Alto Rendimento";
      }

      return {
        id: c.id,
        weekNumber: c.weekNumber,
        name: `Semana ${c.weekNumber}`,
        date: c.date,
        studyHours: Number(c.completedHours.toFixed(1)),
        plannedHours: Number(c.plannedHours.toFixed(1)),
        productivity: estimatedProd,
        accuracy: c.accuracyRate,
        topicsCount,
        topicsList: c.completedTopics,
        efficiencyScore,
        efficiencyBadge,
        color,
        difficulties: c.difficultiesFaced,
        adjustments: c.adjustmentsMade,
      };
    });
  }, [checkins]);

  // 2. Process data for "Subject Performance Evolution & Dispersion"
  const subjectScatterData = useMemo(() => {
    const allSubjects = Array.from(
      new Set([
        ...profile.subjects,
        ...checkins.flatMap((c) =>
          c.subjectMetrics ? c.subjectMetrics.map((sm) => sm.subject) : []
        ),
      ])
    );

    return allSubjects.map((sub, idx) => {
      // Collect metrics across all checkins
      const entries = checkins
        .map((c) => {
          const metric = c.subjectMetrics?.find(
            (m) => m.subject.toLowerCase() === sub.toLowerCase()
          );
          if (metric) {
            return {
              accuracy: metric.accuracy,
              hoursSpent: metric.hoursSpent,
              weakTopics: metric.weakTopics,
              weekNumber: c.weekNumber,
            };
          }
          const isDiff = profile.difficulties
            .toLowerCase()
            .includes(sub.toLowerCase());
          const isStr = profile.strengths
            .toLowerCase()
            .includes(sub.toLowerCase());
          const baseAcc = isDiff
            ? Math.max(45, c.accuracyRate - 15)
            : isStr
            ? Math.min(96, c.accuracyRate + 10)
            : c.accuracyRate;

          return {
            accuracy: baseAcc,
            hoursSpent: +(
              c.completedHours / Math.max(1, allSubjects.length)
            ).toFixed(1),
            weakTopics: isDiff ? [profile.priorityTopics.split(",")[0]] : [],
            weekNumber: c.weekNumber,
          };
        })
        .filter(Boolean);

      const totalHours = Number(
        entries.reduce((acc, e) => acc + e.hoursSpent, 0).toFixed(1)
      );
      const avgAccuracy =
        entries.length > 0
          ? Math.round(
              entries.reduce((acc, e) => acc + e.accuracy, 0) / entries.length
            )
          : 70;
      const latestEntry = entries[entries.length - 1];
      const latestAccuracy = latestEntry ? latestEntry.accuracy : avgAccuracy;
      const allWeakTopics = Array.from(
        new Set(entries.flatMap((e) => e.weakTopics).filter(Boolean))
      );

      const isPriority = profile.priorityTopics
        .toLowerCase()
        .includes(sub.toLowerCase());
      const isDifficult = profile.difficulties
        .toLowerCase()
        .includes(sub.toLowerCase());

      // Subject classification
      let statusColor = "#10b981"; // Good
      let statusLabel = "Domínio Consolidado";
      let quadrantName = "Alto Domínio / Equilíbrio";

      if (latestAccuracy < 70) {
        statusColor = "#f43f5e";
        statusLabel = "Gargalo Crítico";
        quadrantName =
          totalHours > 8
            ? "Alto Esforço / Baixa Retenção (Mudar Método)"
            : "Baixo Esforço / Baixa Retenção (Aumentar Horas)";
      } else if (latestAccuracy < 80) {
        statusColor = "#f59e0b";
        statusLabel = "Em Evolução";
        quadrantName = "Zona de Atenção";
      } else if (latestAccuracy >= 90) {
        statusColor = "#06b6d4";
        statusLabel = "Excelente Retenção";
        quadrantName = "Domínio Avançado";
      }

      // Radius scaling factor
      const zValue = Math.max(20, Math.min(100, totalHours * 10 + 20));

      return {
        id: `subject-${idx}`,
        subject: sub,
        hoursInvested: totalHours,
        accuracyRate: latestAccuracy,
        avgAccuracy,
        zValue,
        weakTopics: allWeakTopics,
        statusColor,
        statusLabel,
        quadrantName,
        isPriority,
        isDifficult,
      };
    });
  }, [checkins, profile]);

  // Filtered Subject Data
  const filteredSubjectScatter = useMemo(() => {
    if (selectedSubject === "all") return subjectScatterData;
    return subjectScatterData.filter(
      (s) => s.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
  }, [subjectScatterData, selectedSubject]);

  // Overall Statistics & Insights
  const scatterStats = useMemo(() => {
    if (timeVsProductivityData.length === 0) {
      return {
        avgHours: 0,
        avgProductivity: 0,
        optimalHoursRange: "1.5h - 3h / dia",
        bestWeek: null,
        overloadRisk: false,
      };
    }

    const totalHours = timeVsProductivityData.reduce(
      (acc, d) => acc + d.studyHours,
      0
    );
    const avgHours = +(totalHours / timeVsProductivityData.length).toFixed(1);
    const avgProductivity = Math.round(
      timeVsProductivityData.reduce((acc, d) => acc + d.productivity, 0) /
        timeVsProductivityData.length
    );

    const sortedByProd = [...timeVsProductivityData].sort(
      (a, b) => b.productivity - a.productivity
    );
    const bestWeek = sortedByProd[0];

    // Check if there are weeks with high study hours (> avg + 4) but lower productivity
    const overloadWeeks = timeVsProductivityData.filter(
      (d) => d.studyHours > avgHours * 1.25 && d.productivity < avgProductivity
    );

    return {
      avgHours,
      avgProductivity,
      optimalHoursRange: `${Math.max(1, +(avgHours / 6).toFixed(1))}h - ${+(
        (avgHours * 1.2) /
        6
      ).toFixed(1)}h diárias`,
      bestWeek,
      overloadRisk: overloadWeeks.length > 0,
    };
  }, [timeVsProductivityData]);

  // Custom Tooltip for Time vs Productivity Scatter Plot
  const CustomTimeVsProdTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl text-xs space-y-2.5 min-w-[240px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white text-sm">{data.name}</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: `${data.color}20`,
                color: data.color,
                border: `1px solid ${data.color}40`,
              }}
            >
              {data.efficiencyBadge}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">
                Tempo de Estudo
              </span>
              <strong className="text-white text-xs font-mono">
                {data.studyHours}h{" "}
                <span className="text-slate-500 font-normal">
                  / {data.plannedHours}h
                </span>
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">
                Produtividade Percebida
              </span>
              <strong className="text-emerald-400 text-xs font-mono">
                {data.productivity}%
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">
                Taxa de Acertos
              </span>
              <strong className="text-teal-300 text-xs font-mono">
                {data.accuracy}%
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">
                Tópicos Concluídos
              </span>
              <strong className="text-sky-300 text-xs font-mono">
                {data.topicsCount} tópicos
              </strong>
            </div>
          </div>

          {data.difficulties && (
            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-200">
              <strong className="text-amber-400">Dificuldades: </strong>
              <span>{data.difficulties}</span>
            </div>
          )}

          {data.adjustments && (
            <div className="text-[11px] text-slate-300">
              <strong className="text-slate-400">Ajuste Aplicado: </strong>
              <span>{data.adjustments}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Subject Scatter Plot
  const CustomSubjectTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl text-xs space-y-2.5 min-w-[250px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white text-sm">{data.subject}</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: `${data.statusColor}20`,
                color: data.statusColor,
                border: `1px solid ${data.statusColor}40`,
              }}
            >
              {data.statusLabel}
            </span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Horas Acumuladas:</span>
              <strong className="text-white font-mono">{data.hoursInvested}h</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Taxa de Acertos (Domínio):</span>
              <strong className="text-emerald-400 font-mono">
                {data.accuracyRate}%
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Classificação do Quadrante:</span>
              <strong className="text-slate-200 text-[11px]">
                {data.quadrantName}
              </strong>
            </div>
          </div>

          {data.weakTopics && data.weakTopics.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800">
              <span className="text-[10px] text-amber-300 font-bold uppercase block mb-1">
                Tópicos de Maior Dificuldade:
              </span>
              <p className="text-[11px] text-slate-300 italic">
                {data.weakTopics.join(", ")}
              </p>
            </div>
          )}

          {onLaunchTopicTutor && (
            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onLaunchTopicTutor(
                    data.weakTopics[0] || `${data.subject} - Questões e Teoria`,
                    data.subject
                  )
                }
                className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] transition flex items-center"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Iniciar Tutoria IA
              </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs mb-1">
            <Activity className="w-4 h-4" />
            <span>Análise de Dispersão Bidimensional (Recharts Scatter)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Gráficos de Dispersão: Tempo vs. Produtividade & Desempenho
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Visualize a correlação entre horas de estudo e produtividade percebida, e identifique no mapa cartesiano quais disciplinas geram alto retorno ou demandam ajustes metodológicos.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveScatterTab("timeVsProductivity")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
              activeScatterTab === "timeVsProductivity"
                ? "bg-cyan-500 text-slate-950 shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Tempo vs. Produtividade
          </button>
          <button
            type="button"
            onClick={() => setActiveScatterTab("subjectEvolution")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
              activeScatterTab === "subjectEvolution"
                ? "bg-teal-500 text-slate-950 shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Dispersão por Matéria
          </button>
          <button
            type="button"
            onClick={() => setActiveScatterTab("quadrants")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
              activeScatterTab === "quadrants"
                ? "bg-indigo-500 text-white shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Gauge className="w-3.5 h-3.5 mr-1.5" />
            Matriz de 4 Quadrantes
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Produtividade Média Percebida
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {scatterStats.avgProductivity}%
            </span>
            <span className="text-xs text-slate-400">
              ({timeVsProductivityData.length} pontos amostrais)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Média de foco e retenção percebida nas semanas avaliadas.
          </p>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ponto Ótimo de Rendimento
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {scatterStats.optimalHoursRange}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Faixa horária onde sua taxa de acertos e produtividade atingem o ápice.
          </p>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Melhor Semana de Estudo
            </span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {scatterStats.bestWeek
                ? `Sem. ${scatterStats.bestWeek.weekNumber}`
                : "N/D"}
            </span>
            {scatterStats.bestWeek && (
              <span className="text-xs text-emerald-300 font-semibold">
                ({scatterStats.bestWeek.productivity}% prod. /{" "}
                {scatterStats.bestWeek.studyHours}h)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Equilíbrio ideal entre volume concluído e assimilação.
          </p>
        </div>
      </div>

      {/* TAB 1: TIME OF STUDY VS PERCEIVED PRODUCTIVITY SCATTER */}
      {activeScatterTab === "timeVsProductivity" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-slate-300">
              <strong>Eixo X:</strong> Horas de Estudo Realizadas (h) •{" "}
              <strong>Eixo Y:</strong> Produtividade Percebida (%) •{" "}
              <strong>Tamanho da Bolha:</strong> Volume de Tópicos
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Excelente (&gt;80%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Moderado (70-79%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Sobrecarga (&lt;70%)</span>
              </span>
            </div>
          </div>

          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
                  dataKey="studyHours"
                  name="Tempo de Estudo"
                  unit="h"
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, "dataMax + 4"]}
                  tickLine={false}
                  label={{
                    value: "Tempo de Estudo Realizado (Horas / Semana)",
                    position: "insideBottom",
                    offset: -10,
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="productivity"
                  name="Produtividade Percebida"
                  unit="%"
                  domain={[30, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: "Produtividade & Rendimento (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="topicsCount"
                  range={[80, 450]}
                  name="Volume de Conteúdos"
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#475569" }}
                  content={<CustomTimeVsProdTooltip />}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "12px",
                    color: "#cbd5e1",
                  }}
                />

                {/* Reference Lines */}
                <ReferenceLine
                  y={80}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Zona de Alta Produtividade (≥80%)",
                    fill: "#10b981",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <ReferenceLine
                  x={scatterStats.avgHours}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Média ${scatterStats.avgHours}h`,
                    fill: "#38bdf8",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />

                <Scatter
                  name="Semanas Registradas"
                  data={timeVsProductivityData}
                  fill="#06b6d4"
                >
                  {timeVsProductivityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Interpretação da Dispersão: </strong>
              Se semanas com excesso de horas se deslocarem para a parte inferior direita, isso indica
              fadiga mental e a <em>Lei dos Rendimentos Decrescentes</em>. Mantenha os estudos na faixa de alta densidade sem ultrapassar o limite diário de {profile.dailyHours}h/dia.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT PERFORMANCE EVOLUTION & DISPERSION */}
      {activeScatterTab === "subjectEvolution" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <strong>Eixo X:</strong> Horas Investidas na Disciplina (h) •{" "}
              <strong>Eixo Y:</strong> Taxa de Acertos / Domínio (%)
            </div>

            {/* Subject Selector Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filtrar Matéria:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="all">Todas as Matérias ({subjectScatterData.length})</option>
                {subjectScatterData.map((s) => (
                  <option key={s.subject} value={s.subject}>
                    {s.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
                  dataKey="hoursInvested"
                  name="Horas Investidas"
                  unit="h"
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, "dataMax + 3"]}
                  tickLine={false}
                  label={{
                    value: "Horas Acumuladas Dedicadas à Disciplina (h)",
                    position: "insideBottom",
                    offset: -10,
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="accuracyRate"
                  name="Taxa de Acertos (Domínio)"
                  unit="%"
                  domain={[30, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: "Taxa de Acertos / Domínio (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="zValue"
                  range={[120, 500]}
                  name="Relevância da Disciplina"
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#475569" }}
                  content={<CustomSubjectTooltip />}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "12px",
                    color: "#cbd5e1",
                  }}
                />

                {/* Benchmark Lines */}
                <ReferenceLine
                  y={80}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Meta de Excelência (80%)",
                    fill: "#10b981",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Limiar de Alerta (70%)",
                    fill: "#f43f5e",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />

                <Scatter
                  name="Matérias Avaliadas"
                  data={filteredSubjectScatter}
                  fill="#14b8a6"
                >
                  {filteredSubjectScatter.map((entry, index) => (
                    <Cell
                      key={`cell-sub-${index}`}
                      fill={entry.statusColor}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Quick List of Dispersed Subjects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {filteredSubjectScatter.map((s) => (
              <div
                key={s.subject}
                className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{s.subject}</span>
                  <span className="text-[11px] text-slate-400">
                    {s.hoursInvested}h investidas
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="font-black font-mono text-sm block"
                    style={{ color: s.statusColor }}
                  >
                    {s.accuracyRate}%
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: s.statusColor }}
                  >
                    {s.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 4-QUADRANT ACTION MATRIX */}
      {activeScatterTab === "quadrants" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            A matriz de quadrantes segmenta suas matérias conforme a relação entre esforço investido (horas) e eficiência de retenção (taxa de acertos):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quadrant 1: Alto Esforço / Alto Retorno */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                  Q1: Alto Domínio / Consolidado
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                  ≥80% acertos
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Disciplinas com ótimo retorno. Mantenha revisões espaçadas de manutenção (7D / 15D / 30D) sem sobrecarregar a rotina.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjectScatterData
                  .filter((s) => s.accuracyRate >= 80)
                  .map((s) => (
                    <span
                      key={s.subject}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-200 text-[11px] font-semibold border border-emerald-500/30"
                    >
                      {s.subject} ({s.accuracyRate}%)
                    </span>
                  ))}
                {subjectScatterData.filter((s) => s.accuracyRate >= 80).length ===
                  0 && (
                  <span className="text-slate-500 italic text-[11px]">
                    Nenhuma matéria neste quadrante ainda.
                  </span>
                )}
              </div>
            </div>

            {/* Quadrant 2: Alto Esforço / Baixo Retorno (Gargalo Crítico) */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                  Q2: Gargalo Crítico (Mudar Método)
                </span>
                <span className="text-[11px] text-rose-400 font-semibold font-mono">
                  &lt;75% acertos
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Você dedicou horas mas o retorno está abaixo do esperado. Não adianta apenas ler mais teoria: utilize <strong>Tutoria Socrática IA</strong> e resolução guiada de exercícios.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjectScatterData
                  .filter((s) => s.accuracyRate < 75)
                  .map((s) => (
                    <span
                      key={s.subject}
                      className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-200 text-[11px] font-semibold border border-rose-500/30"
                    >
                      {s.subject} ({s.accuracyRate}%)
                    </span>
                  ))}
                {subjectScatterData.filter((s) => s.accuracyRate < 75).length ===
                  0 && (
                  <span className="text-emerald-400 italic text-[11px]">
                    Parabéns! Não há matérias em zona de gargalo crítico.
                  </span>
                )}
              </div>
            </div>

            {/* Quadrant 3: Baixo Esforço / Alto Retorno (Facilidade Natural) */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2" />
                  Q3: Facilidade Natural
                </span>
                <span className="text-[11px] text-cyan-400 font-semibold font-mono">
                  Alta Eficiência
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Disciplinas onde você atinge boa pontuação com pouco tempo de estudo. Pode ceder tempo para compensar as matérias de Q2.
              </p>
            </div>

            {/* Quadrant 4: Baixo Esforço / Baixo Retorno (Alocar Mais Horas) */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                  Q4: Conteúdos Pouco Explorados
                </span>
                <span className="text-[11px] text-amber-400 font-semibold font-mono">
                  Aguardando Ciclo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Matérias recentes ou ainda no início do cronograma que precisam de primeiras baterias de exercícios.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
