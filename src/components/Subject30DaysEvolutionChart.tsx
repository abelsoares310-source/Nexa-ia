import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Radar as RadarIcon,
  HelpCircle,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Filter,
  Flame,
  Info,
} from "lucide-react";
import {
  QuestionRecord,
  QuestionStreakState,
  WeeklyCheckin,
  UserProfile,
  DiagnosticResult,
} from "../types";

interface Subject30DaysEvolutionChartProps {
  questionRecords?: QuestionRecord[];
  checkins?: WeeklyCheckin[];
  profile: UserProfile;
  diagnosticResult?: DiagnosticResult | null;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
  onNavigateToDiagnostic?: () => void;
  targetAccuracy?: number; // Default: 80%
  className?: string;
}

// Visual color palette for up to 10 distinct subjects
const SUBJECT_COLORS = [
  "#10b981", // Emerald
  "#0ea5e9", // Sky Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

interface SubjectComparisonSummary {
  subject: string;
  color: string;
  diagnosticAccuracy: number;
  currentAccuracy: number;
  delta: number;
  totalQuestions30d: number;
  correctQuestions30d: number;
  status: "surpassed" | "growing" | "stable" | "critical";
  statusLabel: string;
}

export const Subject30DaysEvolutionChart: React.FC<Subject30DaysEvolutionChartProps> = ({
  questionRecords = [],
  checkins = [],
  profile,
  diagnosticResult,
  onLaunchTopicTutor,
  onNavigateToDiagnostic,
  targetAccuracy = 80,
  className = "",
}) => {
  const [activeView, setActiveView] = useState<"timeline" | "comparison_bar" | "radar">("timeline");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [timeWindowDays, setTimeWindowDays] = useState<number>(30); // 30 days default
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showDiagnosticLine, setShowDiagnosticLine] = useState<boolean>(true);

  // 1. Establish the catalog of subjects (from profile + checkins + question records)
  const allSubjects = useMemo(() => {
    const list = Array.from(
      new Set([
        ...(profile.subjects || []),
        ...questionRecords.map((r) => r.subject?.trim()).filter(Boolean),
        ...checkins.flatMap((c) => c.subjectMetrics?.map((m) => m.subject) || []),
      ])
    ).filter(Boolean);

    return list.length > 0 ? list : ["Língua Portuguesa", "Matemática", "Conhecimentos Específicos"];
  }, [profile.subjects, questionRecords, checkins]);

  // Color mapping per subject
  const subjectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allSubjects.forEach((sub, idx) => {
      map[sub] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
    });
    return map;
  }, [allSubjects]);

  // 2. Compute initial diagnostic accuracy baseline per subject
  const initialDiagnosticBySubject = useMemo(() => {
    const baseline: Record<string, number> = {};

    // Check if real diagnosticResult has subject breakdown
    if (diagnosticResult?.subjectBreakdown && diagnosticResult.subjectBreakdown.length > 0) {
      diagnosticResult.subjectBreakdown.forEach((item) => {
        baseline[item.subject] = Math.round(item.percentage);
      });
    }

    // Overall diagnostic percentage as fallback
    const overallDiagPct = diagnosticResult?.total
      ? Math.round((diagnosticResult.score / diagnosticResult.total) * 100)
      : null;

    // Fill missing subjects using pedagogical profiling heuristic
    allSubjects.forEach((sub) => {
      if (baseline[sub] === undefined) {
        if (overallDiagPct !== null) {
          const isDifficult = profile.difficulties?.toLowerCase().includes(sub.toLowerCase());
          baseline[sub] = isDifficult
            ? Math.max(35, overallDiagPct - 12)
            : Math.min(95, overallDiagPct + 5);
        } else {
          // Estimated initial baseline if student has not taken the 10-question diagnostic yet
          const isDifficult = profile.difficulties?.toLowerCase().includes(sub.toLowerCase());
          const level = profile.currentLevel;
          const base = level === "Avançado" ? 75 : level === "Intermediário" ? 60 : 48;
          baseline[sub] = isDifficult ? Math.max(35, base - 15) : base;
        }
      }
    });

    return baseline;
  }, [diagnosticResult, allSubjects, profile.difficulties, profile.currentLevel]);

  // Average initial diagnostic score
  const overallDiagnosticAverage = useMemo(() => {
    if (diagnosticResult?.total) {
      return Math.round((diagnosticResult.score / diagnosticResult.total) * 100);
    }
    const values = Object.values(initialDiagnosticBySubject);
    if (values.length === 0) return 60;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [diagnosticResult, initialDiagnosticBySubject]);

  // 3. Construct 30-Day Evolution Data Points per Subject
  const { timelineData, subjectSummaries, overallCurrentAccuracy, bestImprovedSubject, criticalSubject } = useMemo(() => {
    const now = new Date();
    const days: any[] = [];
    const windowLength = timeWindowDays;

    // Filter question records strictly within the window
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - windowLength);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const recordsInWindow = questionRecords.filter((r) => {
      const d = r.date || r.timestamp?.substring(0, 10);
      return d && d >= cutoffStr;
    });

    // Group records by subject and date
    const recordsBySubAndDate: Record<string, Record<string, { total: number; correct: number }>> = {};
    const totalBySubject30d: Record<string, { total: number; correct: number }> = {};

    allSubjects.forEach((sub) => {
      recordsBySubAndDate[sub] = {};
      totalBySubject30d[sub] = { total: 0, correct: 0 };
    });

    recordsInWindow.forEach((r) => {
      const sub = allSubjects.find((s) => s.toLowerCase() === r.subject?.toLowerCase()) || r.subject;
      const d = r.date || r.timestamp?.substring(0, 10);
      if (sub && d) {
        if (!recordsBySubAndDate[sub]) recordsBySubAndDate[sub] = {};
        if (!recordsBySubAndDate[sub][d]) recordsBySubAndDate[sub][d] = { total: 0, correct: 0 };
        recordsBySubAndDate[sub][d].total += 1;
        if (r.isCorrect) recordsBySubAndDate[sub][d].correct += 1;

        if (!totalBySubject30d[sub]) totalBySubject30d[sub] = { total: 0, correct: 0 };
        totalBySubject30d[sub].total += 1;
        if (r.isCorrect) totalBySubject30d[sub].correct += 1;
      }
    });

    // Also look at checkins subjectMetrics if questionRecords have few attempts
    const checkinMetricsBySub: Record<string, number[]> = {};
    checkins.forEach((c) => {
      c.subjectMetrics?.forEach((sm) => {
        const sub = allSubjects.find((s) => s.toLowerCase() === sm.subject?.toLowerCase()) || sm.subject;
        if (!checkinMetricsBySub[sub]) checkinMetricsBySub[sub] = [];
        checkinMetricsBySub[sub].push(sm.accuracy);
      });
    });

    // Running mastery tracker per subject starting from Initial Diagnostic
    const runningMastery: Record<string, number> = {};
    allSubjects.forEach((sub) => {
      runningMastery[sub] = initialDiagnosticBySubject[sub] || 60;
    });

    // Generate each day from (now - windowLength) to today
    for (let i = windowLength - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = `${day}/${month}`;

      const point: any = {
        dateStr,
        dayLabel,
        dayIndex: windowLength - 1 - i,
      };

      allSubjects.forEach((sub) => {
        const dayStat = recordsBySubAndDate[sub]?.[dateStr];

        if (dayStat && dayStat.total > 0) {
          const dayAcc = Math.round((dayStat.correct / dayStat.total) * 100);
          // Exponential moving average for smooth mastery curve
          runningMastery[sub] = Math.round(runningMastery[sub] * 0.65 + dayAcc * 0.35);
          point[`${sub}_raw`] = dayAcc;
          point[`${sub}_count`] = dayStat.total;
        } else {
          // If checkin metrics exist, apply gradual convergence
          const checkinList = checkinMetricsBySub[sub] || [];
          if (checkinList.length > 0) {
            const latestCheckinAcc = checkinList[0];
            const driftRate = 0.02; // slow convergence toward latest reported metric
            runningMastery[sub] = Math.round(
              runningMastery[sub] * (1 - driftRate) + latestCheckinAcc * driftRate
            );
          }
        }

        // Clamp between 0 and 100
        point[sub] = Math.min(100, Math.max(10, runningMastery[sub]));
      });

      days.push(point);
    }

    // Calculate subject summaries (Diagnostic vs Current)
    const summaries: SubjectComparisonSummary[] = allSubjects.map((sub) => {
      const diag = initialDiagnosticBySubject[sub] || 60;
      const stats = totalBySubject30d[sub] || { total: 0, correct: 0 };
      const checkinList = checkinMetricsBySub[sub] || [];
      const hasRecentQuestions = stats.total > 0;

      // Current accuracy: prioritize direct 30-day question records; fall back to running mastery / checkin
      let current = diag;
      if (hasRecentQuestions) {
        current = Math.round((stats.correct / stats.total) * 100);
      } else if (checkinList.length > 0) {
        current = checkinList[0];
      } else {
        current = runningMastery[sub] || diag;
      }

      const delta = current - diag;
      let status: "surpassed" | "growing" | "stable" | "critical" = "stable";
      let statusLabel = "Estável";

      if (current >= targetAccuracy && delta >= 5) {
        status = "surpassed";
        statusLabel = "Superou a Meta";
      } else if (delta > 3) {
        status = "growing";
        statusLabel = "Em Evolução";
      } else if (current < 65 || delta < -5) {
        status = "critical";
        statusLabel = "Atenção Prioritária";
      } else {
        status = "stable";
        statusLabel = "Consolidação";
      }

      return {
        subject: sub,
        color: subjectColorMap[sub],
        diagnosticAccuracy: diag,
        currentAccuracy: current,
        delta,
        totalQuestions30d: stats.total,
        correctQuestions30d: stats.correct,
        status,
        statusLabel,
      };
    });

    // Sort summaries: subjects needing attention first, then by highest delta
    const sortedSummaries = [...summaries].sort((a, b) => b.delta - a.delta);

    const overallCurrent =
      summaries.length > 0
        ? Math.round(summaries.reduce((acc, s) => acc + s.currentAccuracy, 0) / summaries.length)
        : 65;

    const bestImproved = sortedSummaries.length > 0 && sortedSummaries[0].delta > 0 ? sortedSummaries[0] : null;
    const critical = summaries.find((s) => s.status === "critical") || null;

    return {
      timelineData: days,
      subjectSummaries: sortedSummaries,
      overallCurrentAccuracy: overallCurrent,
      bestImprovedSubject: bestImproved,
      criticalSubject: critical,
    };
  }, [timeWindowDays, questionRecords, allSubjects, initialDiagnosticBySubject, checkins, targetAccuracy, subjectColorMap]);

  // Overall delta vs diagnostic
  const overallDelta = overallCurrentAccuracy - overallDiagnosticAverage;

  // Radar chart data preparation
  const radarData = useMemo(() => {
    return subjectSummaries.map((s) => ({
      subject: s.subject.length > 14 ? s.subject.substring(0, 12) + "..." : s.subject,
      fullSubject: s.subject,
      "Diagnóstico Inicial": s.diagnosticAccuracy,
      "Desempenho Atual": s.currentAccuracy,
      Meta: targetAccuracy,
    }));
  }, [subjectSummaries, targetAccuracy]);

  // Bar chart comparison data preparation
  const barComparisonData = useMemo(() => {
    return subjectSummaries.map((s) => ({
      subject: s.subject,
      "Diagnóstico Inicial": s.diagnosticAccuracy,
      "Desempenho Atual": s.currentAccuracy,
      delta: s.delta,
      color: s.color,
    }));
  }, [subjectSummaries]);

  // Custom Tooltip for Timeline
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur max-w-xs text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-300">
          <span className="font-bold flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            {label}
          </span>
          <span className="text-[10px] text-slate-400">Precisão Estimada</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => {
            const subName = entry.name;
            const value = entry.value;
            const color = entry.color;
            const initialDiag = initialDiagnosticBySubject[subName];
            const diffFromDiag = initialDiag !== undefined ? value - initialDiag : null;

            return (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate text-slate-300 font-medium">{subName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-slate-100">{value}%</span>
                  {diffFromDiag !== null && (
                    <span
                      className={`text-[10px] font-semibold ${
                        diffFromDiag > 0
                          ? "text-emerald-400"
                          : diffFromDiag < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      ({diffFromDiag > 0 ? `+${diffFromDiag}` : diffFromDiag}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom Tooltip for Bar Comparison
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const diagVal = data["Diagnóstico Inicial"];
    const currVal = data["Desempenho Atual"];
    const delta = currVal - diagVal;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur text-xs">
        <p className="font-bold text-slate-200 mb-1.5">{data.subject}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-slate-400">
            <span>Diagnóstico Inicial:</span>
            <span className="font-bold text-slate-300">{diagVal}%</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-400">
            <span>Desempenho Atual (30d):</span>
            <span className="font-bold text-emerald-300">{currVal}%</span>
          </div>
          <div className="pt-1.5 mt-1 border-t border-slate-800 flex justify-between gap-4 font-bold">
            <span className="text-slate-300">Evolução:</span>
            <span className={delta >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {delta > 0 ? `+${delta} p.p.` : `${delta} p.p.`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm ${className}`}
    >
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header and Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Evolução da Precisão por Matéria
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                Últimos 30 Dias
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Comparativo dinâmico entre o seu diagnóstico inicial e o aproveitamento atual em cada disciplina.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === "timeline"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Linha do Tempo
          </button>
          <button
            type="button"
            onClick={() => setActiveView("comparison_bar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === "comparison_bar"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Diagnóstico vs Atual
          </button>
          <button
            type="button"
            onClick={() => setActiveView("radar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === "radar"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <RadarIcon className="w-3.5 h-3.5" />
            Radar de Domínio
          </button>
        </div>
      </div>

      {/* Diagnostic Baseline Alert if user hasn't completed test yet */}
      {!diagnosticResult && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Diagnóstico inicial estimado:</strong> Os valores iniciais estão calibrados pelo seu perfil.
              Faça a avaliação diagnóstica de 10 perguntas para ter a linha de base 100% precisa.
            </span>
          </div>
          {onNavigateToDiagnostic && (
            <button
              type="button"
              onClick={onNavigateToDiagnostic}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shrink-0 self-start sm:self-auto flex items-center gap-1 shadow-sm"
            >
              Fazer Diagnóstico
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* Metric 1: Overall Evolution */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Precisão Média Geral
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-100">{overallCurrentAccuracy}%</span>
            <span
              className={`text-xs font-bold flex items-center ${
                overallDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {overallDelta >= 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +{overallDelta}%
                </>
              ) : (
                `${overallDelta}%`
              )}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            vs {overallDiagnosticAverage}% no diagnóstico inicial
          </span>
        </div>

        {/* Metric 2: Best Improved Subject */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Maior Evolução
          </span>
          {bestImprovedSubject ? (
            <div className="mt-1">
              <p className="text-sm font-bold text-slate-200 truncate">{bestImprovedSubject.subject}</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-0.5">
                <span>{bestImprovedSubject.diagnosticAccuracy}%</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-bold">{bestImprovedSubject.currentAccuracy}%</span>
                <span className="text-[10px] bg-emerald-500/20 px-1 py-0.2 rounded font-bold">
                  +{bestImprovedSubject.delta} p.p.
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 mt-1">Sem histórico de avanço</span>
          )}
          <span className="text-[10px] text-slate-500 mt-1">Maior ganho de retenção</span>
        </div>

        {/* Metric 3: Critical Subject / Focus Needed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Ponto de Atenção
          </span>
          {criticalSubject ? (
            <div className="mt-1">
              <p className="text-sm font-bold text-slate-200 truncate">{criticalSubject.subject}</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mt-0.5">
                <span>{criticalSubject.currentAccuracy}% de precisão</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (meta: {targetAccuracy}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Todas na meta
              </p>
              <span className="text-xs text-slate-400">Aproveitamento equilibrado</span>
            </div>
          )}
          <span className="text-[10px] text-slate-500 mt-1">Disciplina prioritária</span>
        </div>

        {/* Metric 4: Total Questions in 30 Days */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            Volume Praticado (30d)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-100">
              {subjectSummaries.reduce((acc, s) => acc + s.totalQuestions30d, 0)}
            </span>
            <span className="text-xs text-slate-400">questões</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            Distribuídas em {allSubjects.length} disciplinas
          </span>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="mt-6">
        {/* VIEW 1: TIMELINE LINE CHART */}
        {activeView === "timeline" && (
          <div>
            {/* Subject Filter Pills & Display Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1 flex items-center">
                  <Filter className="w-3 h-3 mr-1" />
                  Filtrar:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedSubjectFilter === "all"
                      ? "bg-slate-200 text-slate-950"
                      : "bg-slate-800/70 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas ({allSubjects.length})
                </button>
                {allSubjects.map((sub) => {
                  const isSelected = selectedSubjectFilter === sub;
                  const color = subjectColorMap[sub];
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(sub)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-slate-800 text-slate-100 border"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                      style={{ borderColor: isSelected ? color : "transparent" }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate max-w-[120px]">{sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Toggles: Target line & Diagnostic line */}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={showDiagnosticLine}
                    onChange={(e) => setShowDiagnosticLine(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Linha Diagnóstico ({overallDiagnosticAverage}%)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={showTargetLine}
                    onChange={(e) => setShowTargetLine(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Meta de Corte ({targetAccuracy}%)</span>
                </label>
              </div>
            </div>

            {/* Recharts Timeline */}
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={Math.ceil(timelineData.length / 10)}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={[20, 100]}
                    ticks={[20, 40, 60, 80, 100]}
                    unit="%"
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />

                  {/* Reference line for initial diagnostic baseline */}
                  {showDiagnosticLine && (
                    <ReferenceLine
                      y={overallDiagnosticAverage}
                      stroke="#818cf8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Diagnóstico: ${overallDiagnosticAverage}%`,
                        position: "insideTopLeft",
                        fill: "#818cf8",
                        fontSize: 10,
                      }}
                    />
                  )}

                  {/* Reference line for cutoff target */}
                  {showTargetLine && (
                    <ReferenceLine
                      y={targetAccuracy}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Meta: ${targetAccuracy}%`,
                        position: "insideTopRight",
                        fill: "#10b981",
                        fontSize: 10,
                      }}
                    />
                  )}

                  {/* Lines for subjects */}
                  {allSubjects.map((sub) => {
                    if (selectedSubjectFilter !== "all" && selectedSubjectFilter !== sub) {
                      return null;
                    }
                    const color = subjectColorMap[sub];
                    const isFocus = selectedSubjectFilter === sub;

                    return (
                      <Line
                        key={sub}
                        type="monotone"
                        dataKey={sub}
                        name={sub}
                        stroke={color}
                        strokeWidth={isFocus ? 3 : 2}
                        dot={false}
                        activeDot={{ r: 5, stroke: "#0f172a", strokeWidth: 2 }}
                        opacity={selectedSubjectFilter === "all" ? 0.9 : 1}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: DIRECT COMPARISON (DIAGNOSTIC VS CURRENT) */}
        {activeView === "comparison_bar" && (
          <div>
            <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
              <p>Comparação direta da precisão no dia do diagnóstico versus a média dos últimos 30 dias.</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-600 inline-block" />
                  Diagnóstico Inicial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  Desempenho Atual (30d)
                </span>
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barComparisonData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="subject"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomBarTooltip />} />
                  <ReferenceLine
                    y={targetAccuracy}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: `Meta: ${targetAccuracy}%`,
                      position: "insideTopRight",
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />

                  <Bar dataKey="Diagnóstico Inicial" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Desempenho Atual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {barComparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.delta >= 0 ? entry.color || "#10b981" : "#f43f5e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: MULTIDISCIPLINARY RADAR CHART */}
        {activeView === "radar" && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="h-72 sm:h-80 w-full md:w-2/3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                  <Radar
                    name="Diagnóstico Inicial"
                    dataKey="Diagnóstico Inicial"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.25}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Desempenho Atual"
                    dataKey="Desempenho Atual"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.45}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Insights Side Card */}
            <div className="w-full md:w-1/3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <span>Superfície Cognitiva</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A área verde demonstra a expansão do seu domínio nas disciplinas em relação à área cinza (diagnóstico inicial).
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Área expandida:</span>
                  <span className="font-bold text-emerald-400">
                    +{Math.max(0, overallDelta)}% de alcance
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Equilíbrio da matriz:</span>
                  <span className="font-semibold text-slate-200">
                    {subjectSummaries.filter((s) => s.currentAccuracy >= targetAccuracy).length} de{" "}
                    {subjectSummaries.length} acima da meta
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Subject Breakdown Cards & Quick Tutor Actions */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center justify-between">
          <span>Detalhamento por Disciplina</span>
          <span className="text-[11px] font-normal text-slate-500">
            {subjectSummaries.length} matérias cadastradas
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjectSummaries.map((item) => (
            <div
              key={item.subject}
              className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <h5 className="font-bold text-sm text-slate-200 truncate">{item.subject}</h5>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                      item.status === "surpassed"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : item.status === "growing"
                        ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                        : item.status === "critical"
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                </div>

                {/* Score comparison visual */}
                <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Diagnóstico</span>
                    <span className="font-bold text-slate-300 text-sm">{item.diagnosticAccuracy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Atual (30d)</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-emerald-400 text-sm">{item.currentAccuracy}%</span>
                      <span
                        className={`text-[10px] font-bold ${
                          item.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ({item.delta >= 0 ? `+${item.delta}` : item.delta}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro progress bar comparing diagnostic and current */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Meta de aprovação: {targetAccuracy}%</span>
                    <span>{item.totalQuestions30d} questões resolvidas</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                    {/* Diagnostic marker */}
                    <div
                      className="absolute top-0 bottom-0 bg-slate-500/60"
                      style={{ width: `${item.diagnosticAccuracy}%` }}
                    />
                    {/* Current progress */}
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.currentAccuracy >= targetAccuracy ? "bg-emerald-400" : "bg-sky-400"
                      }`}
                      style={{ width: `${item.currentAccuracy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button: Train with AI Topic Tutor */}
              {onLaunchTopicTutor && (
                <button
                  type="button"
                  onClick={() => onLaunchTopicTutor(item.subject, item.subject)}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Praticar com Tutor IA
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
