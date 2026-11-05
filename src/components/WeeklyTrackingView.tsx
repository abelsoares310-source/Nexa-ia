import React, { useState } from "react";
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Plus, 
  Calendar, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Trash2,
  BrainCircuit,
  Users,
  Lock,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { WeeklyCheckin, UserProfile, GeneratedPlans, SubjectMetric, FlashcardItem, SpacedReviewItem, QuestionStreakState, StudyJournalEntry, QuestionRecord, DiagnosticResult } from "../types";
import { TrackingCharts } from "./TrackingCharts";
import { SubjectPerformanceCharts } from "./SubjectPerformanceCharts";
import { ScatterAnalyticsCharts } from "./ScatterAnalyticsCharts";
import { AchievementsBadgesView } from "./AchievementsBadgesView";
import { PriorityReviewCard } from "./PriorityReviewCard";
import { AnonymousBenchmarkSection } from "./AnonymousBenchmarkSection";
import { Accuracy30DaysChart } from "./Accuracy30DaysChart";
import { Subject30DaysEvolutionChart } from "./Subject30DaysEvolutionChart";

interface WeeklyTrackingViewProps {
  checkins: WeeklyCheckin[];
  setCheckins: React.Dispatch<React.SetStateAction<WeeklyCheckin[]>>;
  profile: UserProfile;
  plans: GeneratedPlans | null;
  onApplyAdaptedRoutine?: (adaptedPlan: any) => void;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
  flashcards?: FlashcardItem[];
  spacedReviews?: SpacedReviewItem[];
  streakState?: QuestionStreakState;
  questionRecords?: QuestionRecord[];
  onOpenStreak?: () => void;
  journalEntries?: StudyJournalEntry[];
  onNavigateToFlashcards?: (subject?: string) => void;
  onToggleSpacedReview?: (reviewId: string) => void;
  currentUser?: any;
  diagnosticResult?: DiagnosticResult | null;
  onNavigateToDiagnostic?: () => void;
}

export const WeeklyTrackingView: React.FC<WeeklyTrackingViewProps> = ({
  checkins,
  setCheckins,
  profile,
  plans,
  onApplyAdaptedRoutine,
  onLaunchTopicTutor,
  flashcards,
  spacedReviews,
  streakState,
  questionRecords = [],
  onOpenStreak,
  journalEntries,
  onNavigateToFlashcards,
  onToggleSpacedReview,
  currentUser,
  diagnosticResult,
  onNavigateToDiagnostic,
}) => {
  // Wipe any fake / sample / demo checkins when user is logged in
  React.useEffect(() => {
    if (currentUser) {
      setCheckins((prev) => {
        const filtered = prev.filter(
          (c) =>
            !c.id.startsWith("checkin-sample-") &&
            !c.id.startsWith("checkin-demo-") &&
            !c.id.includes("demo") &&
            !c.id.includes("sample")
        );
        return filtered.length !== prev.length ? filtered : prev;
      });
    }
  }, [currentUser]);

  const [activeTrackingSubTab, setActiveTrackingSubTab] = useState<"overview" | "subjects_evolution" | "benchmark" | "achievements" | "history">("overview");
  const [showCheckinModal, setShowCheckinModal] = useState<boolean>(false);
  const [showRebalanceModal, setShowRebalanceModal] = useState<boolean>(false);
  const [showSubjectBreakdownForm, setShowSubjectBreakdownForm] = useState<boolean>(false);

  // New Check-in Form States
  const [weekNum, setWeekNum] = useState<number>(checkins.length + 1);
  const [plannedHours, setPlannedHours] = useState<number>(profile.dailyHours * profile.availableDays.length);
  const [completedHours, setCompletedHours] = useState<number>(profile.dailyHours * profile.availableDays.length * 0.9);
  const [completedTopicsStr, setCompletedTopicsStr] = useState<string>("");
  const [accuracyRate, setAccuracyRate] = useState<number>(82);
  const [perceivedProductivity, setPerceivedProductivity] = useState<number>(85);
  const [difficultiesFaced, setDifficultiesFaced] = useState<string>("");
  const [topicsNeedingRevisionStr, setTopicsNeedingRevisionStr] = useState<string>("");
  const [adjustmentsMade, setAdjustmentsMade] = useState<string>("");

  // Subject Metrics Form State
  const [subjectInputs, setSubjectInputs] = useState<{ [subject: string]: { accuracy: number; weakTopic: string } }>(() => {
    const initial: { [subject: string]: { accuracy: number; weakTopic: string } } = {};
    profile.subjects.forEach((sub) => {
      const isDiff = profile.difficulties.toLowerCase().includes(sub.toLowerCase());
      initial[sub] = {
        accuracy: isDiff ? 65 : 82,
        weakTopic: isDiff ? profile.priorityTopics.split(",")[0] || "" : "",
      };
    });
    return initial;
  });

  // Rebalance AI States
  const [missedTopicsInput, setMissedTopicsInput] = useState<string>("");
  const [rebalanceReason, setRebalanceReason] = useState<string>("Semana com imprevistos no trabalho / acumulei matérias");
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  const [rebalanceResult, setRebalanceResult] = useState<any | null>(null);

  const handleSaveCheckin = (e: React.FormEvent) => {
    e.preventDefault();

    const subjectMetrics: SubjectMetric[] = profile.subjects.map((sub) => {
      const input = subjectInputs[sub] || { accuracy: accuracyRate, weakTopic: "" };
      const hoursPerSub = +(Number(completedHours) / Math.max(1, profile.subjects.length)).toFixed(1);
      return {
        subject: sub,
        accuracy: input.accuracy,
        hoursSpent: hoursPerSub,
        weakTopics: input.weakTopic ? [input.weakTopic.trim()] : [],
        status: input.accuracy < 70 ? "critical" : input.accuracy < 80 ? "warning" : input.accuracy < 90 ? "good" : "mastered",
      };
    });

    const newCheckin: WeeklyCheckin = {
      id: `checkin-${Date.now()}`,
      weekNumber: weekNum,
      date: new Date().toLocaleDateString("pt-BR"),
      plannedHours: Number(plannedHours),
      completedHours: Number(completedHours),
      completedTopics: completedTopicsStr.split(",").map((t) => t.trim()).filter(Boolean),
      accuracyRate: Number(accuracyRate),
      perceivedProductivity: Number(perceivedProductivity),
      difficultiesFaced: difficultiesFaced.trim(),
      topicsNeedingRevision: topicsNeedingRevisionStr.split(",").map((t) => t.trim()).filter(Boolean),
      adjustmentsMade: adjustmentsMade.trim(),
      subjectMetrics,
    };

    setCheckins([newCheckin, ...checkins]);
    setShowCheckinModal(false);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
  };

  const handleTriggerRebalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRebalancing(true);
    setRebalanceResult(null);

    try {
      const res = await fetch("/api/study/rebalance-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlan: plans,
          missedTopics: missedTopicsInput.split(",").map((t) => t.trim()).filter(Boolean),
          dailyHoursLimit: profile.dailyHours,
          reason: rebalanceReason,
        }),
      });

      if (!res.ok) throw new Error("Falha ao rebalancear cronograma");
      const data = await res.json();
      setRebalanceResult(data);
    } catch (err: any) {
      console.error("Erro no rebalanceamento:", err);
      alert("Não foi possível reorganizar o cronograma. Tente novamente.");
    } finally {
      setIsRebalancing(false);
    }
  };

  const totalCompletedHours = checkins.reduce((acc, c) => acc + c.completedHours, 0);
  const avgAccuracy = checkins.length > 0 
    ? Math.round(checkins.reduce((acc, c) => acc + c.accuracyRate, 0) / checkins.length)
    : 0;

  const handleDeleteCheckin = (id: string) => {
    setCheckins(checkins.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Avaliação Semanal & Ajustes Contínuos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Acompanhamento & Adaptabilidade do Plano
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Monitore horas realizadas vs. planejadas, taxa de acerto em questões, registre dificuldades e 
              reorganize o cronograma caso fique atrasado sem aumentar sua carga diária.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowRebalanceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center transition"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Estou Atrasado (Reorganizar)
            </button>
            <button
              type="button"
              onClick={() => setShowCheckinModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Check-in Semanal
            </button>
          </div>
        </div>

        {/* Global Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avaliações Feitas</span>
            <p className="text-xl font-bold text-white mt-0.5">{checkins.length} Semanas</p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Horas Realizadas</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{totalCompletedHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Média de Acertos</span>
            <p className="text-xl font-bold text-teal-300 mt-0.5">{avgAccuracy}%</p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Meta Diária Máxima</span>
            <p className="text-xl font-bold text-slate-200 mt-0.5">{profile.dailyHours}h/dia</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTrackingSubTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center ${
              activeTrackingSubTab === "overview"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral & Gráficos
          </button>

          <button
            type="button"
            onClick={() => setActiveTrackingSubTab("subjects_evolution")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center ${
              activeTrackingSubTab === "subjects_evolution"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "bg-slate-900 text-teal-300 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40"
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            <span>Evolução por Matéria (30d)</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30">
              vs Diagnóstico
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrackingSubTab("benchmark")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center ${
              activeTrackingSubTab === "benchmark"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-900 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40"
            }`}
          >
            <BrainCircuit className="w-4 h-4 mr-2 text-indigo-400" />
            <span>Benchmark com IA</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Anônimo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrackingSubTab("achievements")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center ${
              activeTrackingSubTab === "achievements"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-900 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40"
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Conquistas & Medalhas
          </button>

          <button
            type="button"
            onClick={() => setActiveTrackingSubTab("history")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center ${
              activeTrackingSubTab === "history"
                ? "bg-slate-700 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Histórico ({checkins.length})
          </button>
        </div>
      </div>

      {/* Dedicated Subject 30-Day Evolution View */}
      {activeTrackingSubTab === "subjects_evolution" && (
        <Subject30DaysEvolutionChart
          questionRecords={questionRecords}
          checkins={checkins}
          profile={profile}
          diagnosticResult={diagnosticResult}
          onLaunchTopicTutor={onLaunchTopicTutor}
          onNavigateToDiagnostic={onNavigateToDiagnostic}
          targetAccuracy={80}
        />
      )}

      {/* Benchmark View */}
      {activeTrackingSubTab === "benchmark" && (
        <AnonymousBenchmarkSection
          profile={profile}
          checkins={checkins}
          streakState={streakState}
          flashcardsCount={flashcards?.length || 0}
          onLaunchTopicTutor={onLaunchTopicTutor}
          currentUser={currentUser}
        />
      )}

      {/* Achievements & Badges View */}
      {activeTrackingSubTab === "achievements" && (
        <AchievementsBadgesView
          checkins={checkins}
          profile={profile}
          plans={plans}
          flashcards={flashcards}
          spacedReviews={spacedReviews}
          streakState={streakState}
          journalEntries={journalEntries}
        />
      )}

      {/* 30-Day Subject Accuracy Evolution (Recharts) Comparing with Initial Diagnostic in Overview */}
      {activeTrackingSubTab === "overview" && (
        <Subject30DaysEvolutionChart
          questionRecords={questionRecords}
          checkins={checkins}
          profile={profile}
          diagnosticResult={diagnosticResult}
          onLaunchTopicTutor={onLaunchTopicTutor}
          onNavigateToDiagnostic={onNavigateToDiagnostic}
          targetAccuracy={80}
        />
      )}

      {/* 30-Day Overall Accuracy Evolution Line Chart (Recharts) */}
      {activeTrackingSubTab === "overview" && (
        <Accuracy30DaysChart
          questionRecords={questionRecords}
          streakState={streakState}
          targetAccuracy={80}
        />
      )}

      {/* Priority Review Section - Top 3 Overdue Subjects from Spaced Repetition */}
      {activeTrackingSubTab === "overview" && (
        <PriorityReviewCard
          spacedReviews={spacedReviews}
          flashcards={flashcards}
          profile={profile}
          onLaunchTopicTutor={onLaunchTopicTutor}
          onNavigateToFlashcards={onNavigateToFlashcards}
          onToggleSpacedReview={onToggleSpacedReview}
        />
      )}

      {/* Anonymous Benchmark Section in Overview */}
      {activeTrackingSubTab === "overview" && (
        <AnonymousBenchmarkSection
          profile={profile}
          checkins={checkins}
          streakState={streakState}
          flashcardsCount={flashcards?.length || 0}
          onLaunchTopicTutor={onLaunchTopicTutor}
          currentUser={currentUser}
        />
      )}

      {/* Recharts Data Visualization Component - General Evolution */}
      {activeTrackingSubTab === "overview" && checkins.length > 0 && (
        <TrackingCharts
          checkins={checkins}
          plans={plans}
          dailyHoursLimit={profile.dailyHours}
        />
      )}

      {/* Recharts Data Visualization Component - Scatter Analytics (Time vs Productivity & Subject Dispersion) */}
      {activeTrackingSubTab === "overview" && checkins.length > 0 && (
        <ScatterAnalyticsCharts
          checkins={checkins}
          profile={profile}
          plans={plans}
          onLaunchTopicTutor={onLaunchTopicTutor}
        />
      )}

      {/* Recharts Data Visualization Component - Segmented By Subject */}
      {activeTrackingSubTab === "overview" && (
        <SubjectPerformanceCharts
          checkins={checkins}
          profile={profile}
          plans={plans}
          onLaunchTopicTutor={onLaunchTopicTutor}
        />
      )}

      {/* Rebalance Modal / AI Assistant */}
      {showRebalanceModal && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">
                Reorganização Inteligente de Atrasos (Sem Sobrecarga)
              </h2>
            </div>
            <button
              onClick={() => setShowRebalanceModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Fechar
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Nossa regra de ouro: <strong>Nunca aumentamos sua carga de {profile.dailyHours}h/dia</strong>. A IA redistribuirá os conteúdos prioritários, podará redundâncias e reprogramará seu ciclo de forma sustentável.
          </p>

          <form onSubmit={handleTriggerRebalance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Quais conteúdos ou semanas ficaram pendentes?
              </label>
              <textarea
                rows={2}
                value={missedTopicsInput}
                onChange={(e) => setMissedTopicsInput(e.target.value)}
                placeholder="Ex: Semana 2 de Física (Circuitos), Redação nota 1000 e 20 questões de Matemática..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Motivo do atraso ou situação atual
              </label>
              <input
                type="text"
                value={rebalanceReason}
                onChange={(e) => setRebalanceReason(e.target.value)}
                placeholder="Ex: Cansaço no trabalho, assunto muito complexo, semana atípica..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isRebalancing}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {isRebalancing ? "Recalculando Cronograma..." : "Rebalancear Agora"}
              </button>
            </div>
          </form>

          {/* Rebalance Result */}
          {rebalanceResult && (
            <div className="p-5 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-4 text-xs">
              <div>
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
                  Estratégia de Adaptação:
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {rebalanceResult.adaptationStrategy}
                </p>
              </div>

              <div>
                <span className="text-slate-300 font-bold block mb-1.5">Ajustes de Prioridade:</span>
                <ul className="space-y-1 text-slate-400">
                  {rebalanceResult.priorityAdjustments?.map((adj: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{adj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200">
                <strong className="block text-amber-300 mb-0.5">Conselho do Especialista:</strong>
                {rebalanceResult.motivationalAdvice}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Check-in Modal */}
      {showCheckinModal && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
              Avaliação de Fim de Semana (Semana {weekNum})
            </h2>
            <button
              onClick={() => setShowCheckinModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveCheckin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Semana Número
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={weekNum}
                  onChange={(e) => setWeekNum(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Horas Planejadas
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={plannedHours}
                  onChange={(e) => setPlannedHours(parseFloat(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Horas Realizadas
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={completedHours}
                  onChange={(e) => setCompletedHours(parseFloat(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Conteúdos Concluídos nesta Semana
              </label>
              <textarea
                rows={2}
                value={completedTopicsStr}
                onChange={(e) => setCompletedTopicsStr(e.target.value)}
                placeholder="Ex: Cinemática Vetorial, Leis de Newton, Funções Injetoras, 40 Exercícios..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex justify-between">
                  <span>Taxa de Acertos nos Exercícios</span>
                  <span className="text-emerald-400 font-bold">{accuracyRate}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={accuracyRate}
                  onChange={(e) => setAccuracyRate(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex justify-between">
                  <span>Produtividade / Foco Percebido</span>
                  <span className="text-cyan-400 font-bold">{perceivedProductivity}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={perceivedProductivity}
                  onChange={(e) => setPerceivedProductivity(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 text-amber-300">
                  Dificuldades Encontradas
                </label>
                <textarea
                  rows={2}
                  value={difficultiesFaced}
                  onChange={(e) => setDifficultiesFaced(e.target.value)}
                  placeholder="Ex: Dificuldade em interpretação de enunciados longos de Física..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 text-teal-300">
                  Assuntos que Precisam de Revisão Espaçada
                </label>
                <textarea
                  rows={2}
                  value={topicsNeedingRevisionStr}
                  onChange={(e) => setTopicsNeedingRevisionStr(e.target.value)}
                  placeholder="Ex: Gráficos de velocidade vs tempo, Fórmulas de trigonometria..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
                />
              </div>
            </div>

            {/* Optional Subject Breakdown Section */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Detalhar Desempenho por Matéria (Opcional)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubjectBreakdownForm(!showSubjectBreakdownForm)}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold underline"
                >
                  {showSubjectBreakdownForm ? "Ocultar Detalhes" : "Personalizar Notas por Matéria"}
                </button>
              </div>

              {showSubjectBreakdownForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                  {profile.subjects.map((sub) => {
                    const current = subjectInputs[sub] || { accuracy: accuracyRate, weakTopic: "" };
                    return (
                      <div key={sub} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-200 truncate">{sub}</span>
                          <span className="font-bold text-emerald-400 font-mono">{current.accuracy}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={current.accuracy}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSubjectInputs({
                              ...subjectInputs,
                              [sub]: { ...current, accuracy: val },
                            });
                          }}
                          className="w-full accent-emerald-500 h-1.5"
                        />
                        <input
                          type="text"
                          value={current.weakTopic}
                          onChange={(e) => {
                            setSubjectInputs({
                              ...subjectInputs,
                              [sub]: { ...current, weakTopic: e.target.value },
                            });
                          }}
                          placeholder="Tópico difícil (ex: Circuitos, Funções...)"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200 placeholder-slate-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Ajustes e Metas para a Próxima Semana
              </label>
              <input
                type="text"
                value={adjustmentsMade}
                onChange={(e) => setAdjustmentsMade(e.target.value)}
                placeholder="Ex: Fazer blocos menores de 25min (Pomodoro) e focar mais em questões..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow"
              >
                Salvar Avaliação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checkins History List */}
      {(activeTrackingSubTab === "history" || activeTrackingSubTab === "overview") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-400" />
            Histórico de Avaliações Semanais
          </h2>

        {checkins.length > 0 ? (
          <div className="space-y-4">
            {checkins.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                      Semana {item.weekNumber}
                    </span>
                    <span className="text-slate-400 text-[11px]">{item.date}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-300">
                      Horas: <strong>{item.completedHours}h</strong> / {item.plannedHours}h
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Acertos: {item.accuracyRate}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckin(item.id)}
                      title="Excluir este check-in"
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Conteúdos Concluídos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.completedTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80 text-[11px]"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                {item.difficultiesFaced && (
                  <div className="text-amber-200">
                    <strong className="text-amber-300">Dificuldades: </strong>
                    <span>{item.difficultiesFaced}</span>
                  </div>
                )}

                {item.topicsNeedingRevision && item.topicsNeedingRevision.length > 0 && (
                  <div className="text-teal-200">
                    <strong className="text-teal-300">Para Revisão: </strong>
                    <span>{item.topicsNeedingRevision.join(", ")}</span>
                  </div>
                )}

                {item.adjustmentsMade && (
                  <div className="text-slate-300">
                    <strong className="text-slate-200">Ajustes: </strong>
                    <span>{item.adjustmentsMade}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            {currentUser ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 max-w-lg mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Modo Conta Autêntica • Análises Fakes Apagadas</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Sua conta está conectada. As análises fakes foram totalmente eliminadas. Ao final da sua semana de estudos, registre seu primeiro relatório real clicando em <strong>"Novo Check-in Semanal"</strong> no topo para gerar gráficos 100% autênticos!
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 italic">
                  Nenhuma avaliação semanal registrada ainda. Ao final da sua primeira semana de estudos, clique em <strong>Novo Check-in Semanal</strong> para avaliar sua consistência e calibrar o progresso!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const sampleCheckins: WeeklyCheckin[] = [
                      {
                        id: `checkin-sample-1`,
                        weekNumber: 1,
                        date: "01/08/2026",
                        plannedHours: +(profile.dailyHours * profile.availableDays.length).toFixed(1),
                        completedHours: +(profile.dailyHours * profile.availableDays.length * 0.85).toFixed(1),
                        completedTopics: ["Fundamentos teóricos", "30 exercícios introdutórios", "Conceitos base"],
                        accuracyRate: 72,
                        perceivedProductivity: 70,
                        difficultiesFaced: "Adaptação inicial ao ritmo de estudos e gestão de tempo",
                        topicsNeedingRevision: ["Formulário básico"],
                        adjustmentsMade: "Flashcards diários criados e blocos menores de estudo",
                        subjectMetrics: profile.subjects.map((sub, i) => ({
                          subject: sub,
                          accuracy: i === 0 ? 65 : 75,
                          hoursSpent: +((profile.dailyHours * profile.availableDays.length * 0.85) / profile.subjects.length).toFixed(1),
                          weakTopics: i === 0 ? ["Conceitos Introdutórios"] : [],
                          status: i === 0 ? "critical" : "warning",
                        })),
                      },
                      {
                        id: `checkin-sample-2`,
                        weekNumber: 2,
                        date: "08/08/2026",
                        plannedHours: +(profile.dailyHours * profile.availableDays.length).toFixed(1),
                        completedHours: +(profile.dailyHours * profile.availableDays.length * 1.1).toFixed(1),
                        completedTopics: ["Aprofundamento", "Bateria de 50 questões", "Simulado semanal", "Revisão 7D"],
                        accuracyRate: 79,
                        perceivedProductivity: 82,
                        difficultiesFaced: "Cansaço nas últimas sessões da semana (sobrecarga leve)",
                        topicsNeedingRevision: ["Questões analíticas complexas"],
                        adjustmentsMade: "Pomodoro 25min aplicado com pausas ativas",
                        subjectMetrics: profile.subjects.map((sub, i) => ({
                          subject: sub,
                          accuracy: i === 0 ? 72 : 84,
                          hoursSpent: +((profile.dailyHours * profile.availableDays.length * 1.1) / profile.subjects.length).toFixed(1),
                          weakTopics: i === 0 ? ["Exercícios de Fixação"] : [],
                          status: i === 0 ? "warning" : "good",
                        })),
                      },
                      {
                        id: `checkin-sample-3`,
                        weekNumber: 3,
                        date: "15/08/2026",
                        plannedHours: +(profile.dailyHours * profile.availableDays.length).toFixed(1),
                        completedHours: +(profile.dailyHours * profile.availableDays.length * 0.95).toFixed(1),
                        completedTopics: ["Revisão 15D", "Simulado quinzenal", "Exercícios avançados", "Estudo de casos"],
                        accuracyRate: 86,
                        perceivedProductivity: 91,
                        difficultiesFaced: "Nenhuma dificuldade crítica; ritmo fluido e focado",
                        topicsNeedingRevision: ["Conceitos periféricos pontuais"],
                        adjustmentsMade: "Manter rotina e elevar nível das questões para difíceis",
                        subjectMetrics: profile.subjects.map((sub, i) => ({
                          subject: sub,
                          accuracy: i === 0 ? 82 : 90,
                          hoursSpent: +((profile.dailyHours * profile.availableDays.length * 0.95) / profile.subjects.length).toFixed(1),
                          weakTopics: [],
                          status: i === 0 ? "good" : "mastered",
                        })),
                      },
                      {
                        id: `checkin-sample-4`,
                        weekNumber: 4,
                        date: "22/08/2026",
                        plannedHours: +(profile.dailyHours * profile.availableDays.length).toFixed(1),
                        completedHours: +(profile.dailyHours * profile.availableDays.length * 1.0).toFixed(1),
                        completedTopics: ["Ciclo de simulados", "Active Recall", "Banco de flashcards concluído"],
                        accuracyRate: 89,
                        perceivedProductivity: 94,
                        difficultiesFaced: "Tempo de resolução em questões discursivas",
                        topicsNeedingRevision: ["Treino de velocidade"],
                        adjustmentsMade: "Cronometrar 3min por questão",
                        subjectMetrics: profile.subjects.map((sub, i) => ({
                          subject: sub,
                          accuracy: i === 0 ? 86 : 93,
                          hoursSpent: +((profile.dailyHours * profile.availableDays.length * 1.0) / profile.subjects.length).toFixed(1),
                          weakTopics: [],
                          status: "mastered",
                        })),
                      },
                    ];
                    setCheckins(sampleCheckins);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  Carregar Dados de Exemplo (Apenas Modo Visitante)
                </button>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
