import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  Target,
  BarChart3,
  RefreshCw,
  Zap,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  BrainCircuit,
  Lock,
  Compass,
  Users
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from "recharts";
import { UserProfile, WeeklyCheckin, HistoricalBenchmarkData, QuestionStreakState } from "../types";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";
import { fetchCommunityMetrics, CommunityMetricItem } from "../utils/firebase";

interface AnonymousBenchmarkSectionProps {
  profile: UserProfile;
  checkins: WeeklyCheckin[];
  streakState?: QuestionStreakState;
  flashcardsCount?: number;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
  currentUser?: any;
}

export const AnonymousBenchmarkSection: React.FC<AnonymousBenchmarkSectionProps> = ({
  profile,
  checkins,
  streakState,
  flashcardsCount = 0,
  onLaunchTopicTutor,
  currentUser,
}) => {
  const [benchmarkData, setBenchmarkData] = useState<HistoricalBenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "subjects" | "strategy">("overview");
  const [realCommunityMetrics, setRealCommunityMetrics] = useState<CommunityMetricItem[]>([]);
  const [realCommunityCount, setRealCommunityCount] = useState<number>(0);

  // If user is logged in, wipe any fake or sample check-ins
  const realCheckins = currentUser
    ? checkins.filter((c) => !c.id.startsWith("checkin-sample-"))
    : checkins;

  const fetchBenchmark = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let communityList: CommunityMetricItem[] = [];
      if (currentUser) {
        // Authenticated: wipe fake local caches
        try {
          localStorage.removeItem(`bench_data_${profile.objective}`);
        } catch {}

        // Fetch real community metrics from Firestore
        try {
          communityList = await fetchCommunityMetrics();
          setRealCommunityMetrics(communityList);
          setRealCommunityCount(communityList.length);
        } catch (e) {
          console.warn("Could not load community metrics from firestore:", e);
        }
      }

      const response = await fetch("/api/study/historical-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            objective: profile.objective,
            currentLevel: profile.currentLevel,
            subjects: profile.subjects,
            subjectDifficulties: profile.subjectDifficulties,
            difficulties: profile.difficulties,
            dailyHours: profile.dailyHours,
            availableDays: profile.availableDays,
          },
          checkins: realCheckins,
          streakState,
          flashcardsCount,
          forceRefresh,
          isLoggedIn: Boolean(currentUser),
          realCommunityMetrics: communityList,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível gerar a análise de benchmark no momento.");
      }

      const data = await response.json();
      setBenchmarkData(data);
      if (!currentUser) {
        try {
          localStorage.setItem(`bench_data_${profile.objective}`, JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err: any) {
      console.warn("Aviso ao carregar benchmark:", err?.message || err);
      setErrorMsg(err.message || "Erro de conexão ao calcular comparativo de benchmark.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // WIPE FAKE DATA IMMEDIATELY
      try {
        localStorage.removeItem(`bench_data_${profile.objective}`);
      } catch {}
      fetchBenchmark(true);
    } else {
      // Guest mode: check cached data or auto-fetch
      try {
        const cached = localStorage.getItem(`bench_data_${profile.objective}`);
        if (cached) {
          setBenchmarkData(JSON.parse(cached));
        } else {
          fetchBenchmark();
        }
      } catch (e) {
        fetchBenchmark();
      }
    }
  }, [profile.objective, realCheckins.length, currentUser?.uid]);

  // Chart preparation
  const chartData = benchmarkData?.subjectBenchmarks?.map((sb) => ({
    subject: sb.subject.length > 14 ? `${sb.subject.substring(0, 12)}...` : sb.subject,
    fullName: sb.subject,
    "Sua Acurácia": sb.studentAccuracy,
    "Média Concorrentes": sb.cohortAverageAccuracy,
    "Média Aprovados": sb.cohortApprovedAccuracy,
    status: sb.status,
    weight: sb.weightInContest,
  })) || [];

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-white">
            <span>{item.fullName || label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {item.weight}
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Sua Acurácia:</span>
              <span>{item["Sua Acurácia"]}%</span>
            </div>
            <div className="flex items-center justify-between text-amber-300">
              <span>Média Aprovados:</span>
              <span>{item["Média Aprovados"]}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Média Concorrentes:</span>
              <span>{item["Média Concorrentes"]}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="anonymous-benchmark-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header with Privacy & Anonymity Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
              <BrainCircuit className="w-3.5 h-3.5 mr-1" />
              IA de Benchmark Histórico
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
              <Lock className="w-3 h-3 mr-1" />
              100% Anônimo & Privativo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Comparativo com a Média Histórica de Concorrentes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            A IA compara seu aproveitamento atual com a base estatística agregada de candidatos e aprovados para o concurso <strong>"{profile.objective}"</strong> sem armazenar ou expor dados pessoais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {benchmarkData?.anonymityToken && (
            <span className="text-[11px] font-mono px-2.5 py-1.5 bg-slate-800/80 rounded-lg text-slate-400 border border-slate-700/60 hidden sm:inline-block">
              {benchmarkData.anonymityToken}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchBenchmark(true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Processando IA..." : "Recalcular Benchmark"}</span>
          </button>
        </div>
      </div>

      {currentUser ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span>Modo Comunidade Real Ativado • Análises Fakes Eliminadas</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Você está logado. Os dados exibidos lêem métricas autênticas da comunidade de estudantes reais no Firestore ({realCommunityCount > 0 ? `${realCommunityCount} estudantes conectados` : "Você é o primeiro estudante registrado desta base"}). Amostras fakes foram descartadas.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 shrink-0 self-start sm:self-auto">
            100% Autêntico
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-slate-300 text-[11px]">
              Modo Visitante: Amostras sintéticas ativas. <strong>Faça login ou crie sua conta</strong> para apagar todas as análises fakes e comparar seu aproveitamento diretamente com estudantes reais da comunidade.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Não foi possível atualizar o benchmark:</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {isLoading && !benchmarkData && (
        <div className="py-12 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-200">
            Consultando modelos estatísticos e histórico de aprovados...
          </p>
          <p className="text-xs text-slate-500">
            Anonimizando métricas e mapeando corte para {profile.objective}
          </p>
        </div>
      )}

      {benchmarkData && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Percentile Card */}
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <span>Posicionamento</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {benchmarkData.percentileRank}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Entre os mais competitivos da amostra
              </p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${benchmarkData.percentileValue}%` }}
                />
              </div>
            </div>

            {/* Competitiveness Index */}
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <span>Competitividade</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {benchmarkData.competitivenessIndex}<span className="text-xs font-normal text-slate-400">/100</span>
              </p>
              <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                {benchmarkData.approvalProbabilityLabel}
              </p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${benchmarkData.competitivenessIndex}%` }}
                />
              </div>
            </div>

            {/* Cutoff Score */}
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/80">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <span>Corte Estimado</span>
                <Target className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-black text-teal-300 mt-1">
                {benchmarkData.estimatedCutoffScore}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Nota líquida típica dos aprovados
              </p>
            </div>

            {/* Overall Accuracy Comparison */}
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/80">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <span>Sua Média Geral</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">
                {benchmarkData.studentOverallAccuracy}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                vs <strong className="text-slate-300">{benchmarkData.cohortOverallAverage}%</strong> geral / <strong className="text-amber-300">{benchmarkData.cohortApprovedAverage}%</strong> aprovados
              </p>
            </div>
          </div>

          {/* Sub-tabs inside Benchmark */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeView === "overview"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráfico Comparativo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("subjects")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeView === "subjects"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Desempenho por Matéria ({benchmarkData.subjectBenchmarks?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("strategy")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeView === "strategy"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gargalos & Roadmap Top 10%</span>
            </button>
          </div>

          {/* VIEW: OVERVIEW / CHART */}
          {activeView === "overview" && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Taxa de Acertos: Você vs Média Concorrentes vs Média Aprovados
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
                      Você
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5 inline-block" />
                      Aprovados
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-1.5 inline-block" />
                      Média Geral
                    </span>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis 
                        dataKey="subject" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        domain={[30, 100]} 
                        tickFormatter={(v) => `${v}%`}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <ReferenceLine 
                        y={benchmarkData.estimatedCutoffScore} 
                        stroke="#14b8a6" 
                        strokeDasharray="4 4"
                        label={{ 
                          value: `Corte (${benchmarkData.estimatedCutoffScore}%)`, 
                          fill: "#14b8a6", 
                          fontSize: 10, 
                          position: "top" 
                        }} 
                      />
                      <Bar dataKey="Sua Acurácia" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="Média Aprovados" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="Média Concorrentes" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pedagogical AI Verdict Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Diagnóstico Estratégico da IA</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {benchmarkData.pedagogicalVerdict}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-indigo-900/50">
                  <span className="flex items-center text-slate-300">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {benchmarkData.estimatedCohortSize}
                  </span>
                  <span>•</span>
                  <span>Concurso: <strong>{benchmarkData.targetContest}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SUBJECTS BREAKDOWN */}
          {activeView === "subjects" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {benchmarkData.subjectBenchmarks?.map((sb, idx) => {
                  const isAbove = sb.status === "above_approved";
                  const isApprovedZone = sb.status === "approved_zone";
                  const isAttention = sb.status === "attention";

                  const badgeColor = isAbove
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : isApprovedZone
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    : isAttention
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40";

                  const badgeLabel = isAbove
                    ? "🏆 Superando Aprovados"
                    : isApprovedZone
                    ? "🎯 Na Faixa de Corte"
                    : isAttention
                    ? "⚠️ Abaixo da Média (Crítico)"
                    : "⚡ Próximo da Faixa";

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-sm text-white">{sb.subject}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                            {sb.weightInContest}
                          </span>
                        </div>
                      </div>

                      {/* Performance Bar Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Sua Acurácia
                          </span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            {sb.studentAccuracy}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Média dos Aprovados
                          </span>
                          <span className="text-base font-bold text-amber-300 font-mono">
                            {sb.cohortApprovedAccuracy}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Média Geral Concorrentes
                          </span>
                          <span className="text-base font-bold text-slate-400 font-mono">
                            {sb.cohortAverageAccuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Strategic Insight from AI */}
                      <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-slate-200 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <strong className="text-indigo-300 text-[11px] block font-bold">
                            Orientação Estratégica da IA:
                          </strong>
                          <p className="text-xs text-slate-300">{sb.strategicInsight}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <YouTubeExplanationLink
                            topic={`Aulas e Resumos de ${sb.subject}`}
                            subject={sb.subject}
                            variant="compact"
                            customLabel="Vídeos"
                          />
                          {onLaunchTopicTutor && (
                            <button
                              type="button"
                              onClick={() => onLaunchTopicTutor(`Revisão Estratégica e Questões de ${sb.subject}`, sb.subject)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 transition flex items-center space-x-1"
                            >
                              <span>Treinar IA</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: STRATEGY, GAPS & ROADMAP */}
          {activeView === "strategy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Competitive Strengths */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Seus Pontos Fortes Competitivos</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {benchmarkData.competitiveAdvantages?.map((adv, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Strategic Gaps */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Gargalos onde os Aprovados se Distanciam</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {benchmarkData.strategicGaps?.map((gap, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tactical Roadmap */}
              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                  <Compass className="w-4 h-4" />
                  <span>Roadmap Tático para Ingressar no Top 10% dos Aprovados</span>
                </div>
                <div className="space-y-2.5">
                  {benchmarkData.roadmapToTop10?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
