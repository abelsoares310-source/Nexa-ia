import React, { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Flame,
  Clock,
  HelpCircle,
  TrendingUp,
  Award,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Zap,
  BarChart2,
  BookOpen,
  ArrowUpRight,
  Info,
  Calendar,
  X,
  Check
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import confetti from "canvas-confetti";
import { SubjectLearningGoal, UserProfile, QuestionRecord, WeeklyCheckin, QuestionStreakState } from "../types";
import { getDifficultyMeta } from "./ProfileForm";
import { generateDefaultLearningGoals } from "../utils/storage";

interface LearningGoalsViewProps {
  goals: SubjectLearningGoal[];
  onUpdateGoals: (goals: SubjectLearningGoal[]) => void;
  profile: UserProfile;
  questionRecords?: QuestionRecord[];
  checkins?: WeeklyCheckin[];
  streakState?: QuestionStreakState;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
}

export const LearningGoalsView: React.FC<LearningGoalsViewProps> = ({
  goals,
  onUpdateGoals,
  profile,
  questionRecords = [],
  checkins = [],
  streakState,
  onLaunchTopicTutor,
}) => {
  const [editingGoal, setEditingGoal] = useState<SubjectLearningGoal | null>(null);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState<boolean>(false);
  const [chartMetric, setChartMetric] = useState<"questions" | "hours">("questions");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "high" | "pending" | "completed">("all");
  const [showAiAdvisorModal, setShowAiAdvisorModal] = useState<boolean>(false);

  // Form state for creating / editing goals
  const [formSubject, setFormSubject] = useState<string>("");
  const [formQuestions, setFormQuestions] = useState<number>(30);
  const [formHours, setFormHours] = useState<number>(4);
  const [formAccuracy, setFormAccuracy] = useState<number>(75);
  const [formPriority, setFormPriority] = useState<"high" | "medium" | "low">("medium");
  const [formNotes, setFormNotes] = useState<string>("");

  // Calculate live progress for each goal
  const enrichedGoals = useMemo(() => {
    return goals.map((goal) => {
      // Find questions solved for this subject from questionRecords and manual log
      const recordsForSubject = questionRecords.filter(
        (r) => r.subject.toLowerCase() === goal.subject.toLowerCase()
      );
      const recordsCount = recordsForSubject.length;
      const recordsCorrect = recordsForSubject.filter((r) => r.isCorrect).length;

      const manualQ = goal.manualQuestionsThisWeek || 0;
      const manualH = goal.manualHoursThisWeek || 0;

      const totalCurrentQuestions = recordsCount + manualQ;
      const currentHours = manualH;

      // Accuracy calculation
      let calculatedAccuracy = goal.targetAccuracy;
      if (recordsCount > 0) {
        calculatedAccuracy = Math.round((recordsCorrect / recordsCount) * 100);
      }

      const questionsProgressPct = goal.weeklyQuestionsTarget > 0
        ? Math.min(150, Math.round((totalCurrentQuestions / goal.weeklyQuestionsTarget) * 100))
        : 0;

      const hoursProgressPct = goal.weeklyHoursTarget > 0
        ? Math.min(150, Math.round((currentHours / goal.weeklyHoursTarget) * 100))
        : 0;

      const isCompleted = questionsProgressPct >= 100 && hoursProgressPct >= 100;
      const isQuestionsHit = questionsProgressPct >= 100;
      const isHoursHit = hoursProgressPct >= 100;

      return {
        ...goal,
        currentQuestions: totalCurrentQuestions,
        currentHours,
        calculatedAccuracy,
        questionsProgressPct,
        hoursProgressPct,
        isCompleted,
        isQuestionsHit,
        isHoursHit,
      };
    });
  }, [goals, questionRecords]);

  // Overall Global KPI Summary
  const globalSummary = useMemo(() => {
    let totalTargetQ = 0;
    let totalCurrentQ = 0;
    let totalTargetH = 0;
    let totalCurrentH = 0;
    let completedCount = 0;

    enrichedGoals.forEach((g) => {
      totalTargetQ += g.weeklyQuestionsTarget;
      totalCurrentQ += g.currentQuestions;
      totalTargetH += g.weeklyHoursTarget;
      totalCurrentH += g.currentHours;
      if (g.questionsProgressPct >= 100) completedCount++;
    });

    const overallQPercentage = totalTargetQ > 0 ? Math.min(100, Math.round((totalCurrentQ / totalTargetQ) * 100)) : 0;
    const overallHPercentage = totalTargetH > 0 ? Math.min(100, Math.round((totalCurrentH / totalTargetH) * 100)) : 0;

    return {
      totalTargetQ,
      totalCurrentQ,
      totalTargetH: Math.round(totalTargetH * 10) / 10,
      totalCurrentH: Math.round(totalCurrentH * 10) / 10,
      overallQPercentage,
      overallHPercentage,
      completedCount,
      totalGoals: enrichedGoals.length,
    };
  }, [enrichedGoals]);

  // Filtered list
  const filteredGoals = useMemo(() => {
    return enrichedGoals.filter((g) => {
      if (selectedFilter === "high") return g.priority === "high";
      if (selectedFilter === "completed") return g.questionsProgressPct >= 100;
      if (selectedFilter === "pending") return g.questionsProgressPct < 100;
      return true;
    });
  }, [enrichedGoals, selectedFilter]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return enrichedGoals.map((g) => ({
      name: g.subject.length > 12 ? g.subject.substring(0, 10) + "…" : g.subject,
      fullName: g.subject,
      metaQuestoes: g.weeklyQuestionsTarget,
      realQuestoes: g.currentQuestions,
      metaHoras: g.weeklyHoursTarget,
      realHoras: g.currentHours,
      acuraciaReal: g.calculatedAccuracy,
      acuraciaMeta: g.targetAccuracy,
      progressoQ: g.questionsProgressPct,
    }));
  }, [enrichedGoals]);

  // Radar Data
  const radarData = useMemo(() => {
    return enrichedGoals.map((g) => ({
      subject: g.subject.length > 10 ? g.subject.substring(0, 8) + "…" : g.subject,
      progressoQuestoes: Math.min(100, g.questionsProgressPct),
      progressoHoras: Math.min(100, g.hoursProgressPct),
      acuracia: g.calculatedAccuracy,
    }));
  }, [enrichedGoals]);

  // Handler: Open modal to edit existing goal
  const handleOpenEdit = (goal: SubjectLearningGoal) => {
    setEditingGoal(goal);
    setFormSubject(goal.subject);
    setFormQuestions(goal.weeklyQuestionsTarget);
    setFormHours(goal.weeklyHoursTarget);
    setFormAccuracy(goal.targetAccuracy);
    setFormPriority(goal.priority);
    setFormNotes(goal.notes || "");
    setIsNewGoalModalOpen(true);
  };

  // Handler: Open modal to create new goal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    const existingSubjects = goals.map((g) => g.subject.toLowerCase());
    const remainingSubjects = profile.subjects.filter(
      (s) => !existingSubjects.includes(s.toLowerCase())
    );
    setFormSubject(remainingSubjects[0] || "");
    setFormQuestions(30);
    setFormHours(4);
    setFormAccuracy(75);
    setFormPriority("medium");
    setFormNotes("");
    setIsNewGoalModalOpen(true);
  };

  // Handler: Save Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) return;

    if (editingGoal) {
      // Update existing
      const updated = goals.map((g) => {
        if (g.id === editingGoal.id) {
          return {
            ...g,
            subject: formSubject.trim(),
            weeklyQuestionsTarget: Number(formQuestions),
            weeklyHoursTarget: Number(formHours),
            targetAccuracy: Number(formAccuracy),
            priority: formPriority,
            notes: formNotes.trim() || undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });
      onUpdateGoals(updated);
    } else {
      // Create new
      const newGoal: SubjectLearningGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        subject: formSubject.trim(),
        weeklyQuestionsTarget: Number(formQuestions),
        weeklyHoursTarget: Number(formHours),
        targetAccuracy: Number(formAccuracy),
        priority: formPriority,
        notes: formNotes.trim() || undefined,
        manualQuestionsThisWeek: 0,
        manualHoursThisWeek: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onUpdateGoals([...goals, newGoal]);
    }

    setIsNewGoalModalOpen(false);
    setEditingGoal(null);
  };

  // Handler: Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    onUpdateGoals(updated);
  };

  // Handler: Quick add progress (+X questions, +X hours)
  const handleQuickAddQuestions = (goalId: string, amount: number) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const current = g.manualQuestionsThisWeek || 0;
        const newTotal = Math.max(0, current + amount);
        if (newTotal >= g.weeklyQuestionsTarget && current < g.weeklyQuestionsTarget) {
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#10b981", "#3b82f6", "#f59e0b"],
            });
          } catch (e) {}
        }
        return {
          ...g,
          manualQuestionsThisWeek: newTotal,
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });
    onUpdateGoals(updated);
  };

  const handleQuickAddHours = (goalId: string, amount: number) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const current = g.manualHoursThisWeek || 0;
        const newTotal = Math.max(0, Math.round((current + amount) * 10) / 10);
        return {
          ...g,
          manualHoursThisWeek: newTotal,
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });
    onUpdateGoals(updated);
  };

  // Handler: AI Goal Calibration (Auto-Rebalance by Difficulty and Weekly Hours)
  const handleApplyAiCalibration = () => {
    const calibrated = generateDefaultLearningGoals(profile);
    onUpdateGoals(calibrated);
    setShowAiAdvisorModal(false);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#6366f1", "#f97316"],
      });
    } catch (e) {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Target className="w-4 h-4" />
              <span>Planejamento Quantitativo • Semana em Curso</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Metas de Aprendizagem por Matéria
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Defina metas quantitativas semanais de <strong>questões resolvidas</strong>, <strong>horas líquidas de estudo</strong> e <strong>taxa de acerto</strong>. Acompanhe em tempo real o avanço de cada disciplina em direção ao seu objetivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAiAdvisorModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 hover:from-emerald-500/25 hover:to-indigo-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Calibrar Metas com IA</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Adicionar Nova Meta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions Goal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questões Semanais</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{globalSummary.totalCurrentQ}</span>
            <span className="text-sm text-slate-400 font-medium">/ {globalSummary.totalTargetQ} resolvidas</span>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Progresso Geral</span>
              <span className="font-bold text-orange-400">{globalSummary.overallQPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, globalSummary.overallQPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Hours Goal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horas de Estudo</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{globalSummary.totalCurrentH}h</span>
            <span className="text-sm text-slate-400 font-medium">/ {globalSummary.totalTargetH}h semanais</span>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Tempo Cumprido</span>
              <span className="font-bold text-indigo-400">{globalSummary.overallHPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, globalSummary.overallHPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Disciplinas Batidas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metas Batidas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{globalSummary.completedCount}</span>
            <span className="text-sm text-slate-400 font-medium">/ {globalSummary.totalGoals} matérias</span>
          </div>
          <div className="text-xs text-slate-400">
            {globalSummary.completedCount === globalSummary.totalGoals && globalSummary.totalGoals > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 100% das metas batidas esta semana!
              </span>
            ) : (
              <span>Faltam {globalSummary.totalGoals - globalSummary.completedCount} matérias para o gabarito semanal</span>
            )}
          </div>
        </div>

        {/* Sequência Atual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak Ativo</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">{streakState?.currentStreak || 0}</span>
            <span className="text-sm text-slate-400 font-medium">dias seguidos</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Recorde histórico</span>
            <span className="font-bold text-slate-300">{streakState?.longestStreak || 0} dias</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section (Meta vs. Realizado) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              Comparativo: Meta Estipulada vs. Progresso Realizado
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize o balanço de esforço semanal e identifique onde concentrar os próximos blocos de resolução ativa.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setChartMetric("questions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMetric === "questions"
                  ? "bg-orange-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Questões Semanais
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("hours")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMetric === "hours"
                  ? "bg-indigo-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Horas de Estudo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
                          <strong className="text-white text-sm block border-b border-slate-800 pb-1">{d.fullName}</strong>
                          {chartMetric === "questions" ? (
                            <>
                              <div className="flex justify-between gap-4 text-orange-400 font-bold">
                                <span>Realizado:</span>
                                <span>{d.realQuestoes} questões</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400">
                                <span>Meta Semanal:</span>
                                <span>{d.metaQuestoes} questões</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400 font-semibold pt-1 border-t border-slate-900">
                                <span>Cumprimento:</span>
                                <span>{d.progressoQ}%</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between gap-4 text-indigo-400 font-bold">
                                <span>Realizado:</span>
                                <span>{d.realHoras}h</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400">
                                <span>Meta Semanal:</span>
                                <span>{d.metaHoras}h</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400 font-semibold pt-1 border-t border-slate-900">
                                <span>Acurácia Média:</span>
                                <span>{d.acuraciaReal}%</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                {chartMetric === "questions" ? (
                  <>
                    <Bar
                      dataKey="metaQuestoes"
                      name="Meta (Questões)"
                      fill="#475569"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="realQuestoes"
                      name="Realizado (Questões)"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="metaHoras"
                      name="Meta (Horas)"
                      fill="#475569"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="realHoras"
                      name="Realizado (Horas)"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart (Multidimensional Mastery) */}
          <div className="h-72 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl p-2 border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Radar de Atingimento (%)
            </span>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.6} />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
                <Radar
                  name="% Questões"
                  dataKey="progressoQuestoes"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.3}
                />
                <Radar
                  name="% Horas"
                  dataKey="progressoHoras"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter and Subject Goals Cards List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Metas Individuais por Disciplina ({enrichedGoals.length})
            </h2>
            <p className="text-xs text-slate-400">
              Use os botões rápidos para registrar questões ou horas finalizadas diretamente em cada matéria.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Todas ({enrichedGoals.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("high")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedFilter === "high" ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Alta Prioridade
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("pending")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedFilter === "pending" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Em Andamento
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("completed")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedFilter === "completed" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Batidas 🎉
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const diffScore = profile.subjectDifficulties?.[goal.subject] || 5;
            const diffMeta = getDifficultyMeta(diffScore);

            const isQuestions100 = goal.questionsProgressPct >= 100;
            const isHours100 = goal.hoursProgressPct >= 100;

            return (
              <div
                key={goal.id}
                className={`bg-slate-900 rounded-3xl p-5 border transition-all space-y-4 relative flex flex-col justify-between ${
                  isQuestions100 && isHours100
                    ? "border-emerald-500/50 shadow-lg shadow-emerald-500/5 bg-gradient-to-b from-slate-900 to-emerald-950/20"
                    : goal.priority === "high"
                    ? "border-rose-500/40 hover:border-rose-500/60"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            goal.priority === "high"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : goal.priority === "medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {goal.priority === "high" ? "Alta Prioridade" : goal.priority === "medium" ? "Média Prioridade" : "Prioridade Normal"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffMeta.badgeColor}`}>
                          Dif. {diffScore}/10
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1 tracking-tight">
                        {goal.subject}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        title="Editar parâmetros desta meta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        title="Excluir meta"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                      💡 {goal.notes}
                    </p>
                  )}
                </div>

                {/* Progress Metric 1: Questões */}
                <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      Questões Resolvidas
                    </span>
                    <span className="font-bold text-white">
                      <strong className={isQuestions100 ? "text-emerald-400" : "text-orange-400"}>
                        {goal.currentQuestions}
                      </strong>{" "}
                      / {goal.weeklyQuestionsTarget} ({goal.questionsProgressPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isQuestions100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-orange-500 to-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, goal.questionsProgressPct)}%` }}
                    />
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Lançar avanço:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAddQuestions(goal.id, 1)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        +1Q
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddQuestions(goal.id, 5)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition"
                      >
                        +5Q
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddQuestions(goal.id, 10)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition"
                      >
                        +10Q
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Metric 2: Horas de Estudo */}
                <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Horas Líquidas
                    </span>
                    <span className="font-bold text-white">
                      <strong className={isHours100 ? "text-emerald-400" : "text-indigo-400"}>
                        {goal.currentHours}h
                      </strong>{" "}
                      / {goal.weeklyHoursTarget}h ({goal.hoursProgressPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHours100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-indigo-500 to-sky-400"
                      }`}
                      style={{ width: `${Math.min(100, goal.hoursProgressPct)}%` }}
                    />
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Lançar horas:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAddHours(goal.id, 0.5)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddHours(goal.id, 1)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition"
                      >
                        +1h
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accuracy Target & Tutor Launch Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-xs">
                    <span className="text-[11px] text-slate-400 block">Meta Acurácia:</span>
                    <span className="font-bold text-emerald-400">≥ {goal.targetAccuracy}% acertos</span>
                  </div>

                  {onLaunchTopicTutor && (
                    <button
                      type="button"
                      onClick={() => onLaunchTopicTutor(goal.subject, goal.subject)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition"
                    >
                      <span>Resolver Agora</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Create or Edit Goal */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsNewGoalModalOpen(false);
                setEditingGoal(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingGoal ? `Editar Meta: ${editingGoal.subject}` : "Nova Meta Quantitativa"}
                </h3>
                <p className="text-xs text-slate-400">
                  Estipule o volume semanal desejado de exercícios e horas de dedicação.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Disciplina / Matéria
                </label>
                {editingGoal ? (
                  <input
                    type="text"
                    disabled
                    value={formSubject}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Ex: Matemática, Física, Biologia..."
                    list="available-profile-subjects"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
                <datalist id="available-profile-subjects">
                  {profile.subjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Number of Weekly Questions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Meta de Questões/sem
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formQuestions}
                    onChange={(e) => setFormQuestions(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Meta de Horas/sem
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    required
                    value={formHours}
                    onChange={(e) => setFormHours(Math.max(0.5, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Target Accuracy & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Meta de Acurácia (%)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    required
                    value={formAccuracy}
                    onChange={(e) => setFormAccuracy(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nível de Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as "high" | "medium" | "low")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="high">Alta Prioridade</option>
                    <option value="medium">Média Prioridade</option>
                    <option value="low">Prioridade Normal</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Anotação / Foco Principal (Opcional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Focar em Geometria Plana e Logaritmos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewGoalModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  {editingGoal ? "Salvar Alterações" : "Criar Meta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Smart Goal Advisor & Auto-Rebalance */}
      {showAiAdvisorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-slate-100 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowAiAdvisorModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold">
                <Sparkles className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Calibração Inteligente de Metas por IA</h3>
                <p className="text-xs text-slate-400">
                  Ajuste automático baseado na sua carga semanal ({profile.dailyHours * (profile.availableDays?.length || 6)}h) e nas dificuldades das disciplinas.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Critérios da Calibração:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-slate-400">
                <li>Distribuição proporcional das horas semanais dando maior peso às matérias com dificuldade ≥ 7.</li>
                <li>Volume de questões ajustado à densidade de resolução de cada matéria (Exatas: ~7Q/h, Humanas: ~5Q/h).</li>
                <li>Metas de acurácia calibradas para reforçar retenção sem sobrecarga de frustração.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAiAdvisorModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyAiCalibration}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                Aplicar Calibração Automática ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
