import React, { useState, useMemo } from "react";
import { 
  User, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Zap,
  Plus,
  Minus,
  X,
  GraduationCap,
  Search,
  Check,
  Gauge,
  Sliders,
  School,
  Compass,
  Award
} from "lucide-react";
import { UserProfile, LevelType } from "../types";
import { PRESET_PROFILES, PRESET_CATEGORIES, PresetItem } from "../utils/presets";
import { SchoolCurriculumExplorer } from "./SchoolCurriculumExplorer";
import { CustomSubjectModeBuilder } from "./CustomSubjectModeBuilder";
import { DashboardWelcomeCard } from "./DashboardWelcomeCard";
import { ExpertTipCard } from "./ExpertTipCard";
import { DailySummaryCard } from "./DailySummaryCard";
import { ALL_SCHOOL_SUBJECTS } from "../utils/schoolCurriculum";
import { QuestionStreakState, DailyChallengesState, DiagnosticResult, QuestionRecord } from "../types";
import { Accuracy30DaysChart } from "./Accuracy30DaysChart";

interface ProfileFormProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onStartDiagnostic: () => void;
  onDirectGenerate: () => void;
  isGenerating: boolean;
  onSelectTopicForTutor?: (subject: string, topic: string) => void;
  onStartStudySession?: () => void;
  streakState?: QuestionStreakState;
  dailyChallengesState?: DailyChallengesState;
  diagnosticResult?: DiagnosticResult | null;
  onNavigateToPastExams?: () => void;
  questionRecords?: QuestionRecord[];
}

export const getDifficultyMeta = (val: number = 5) => {
  const score = Math.max(0, Math.min(10, Math.round(val)));
  if (score <= 2) {
    return {
      label: "Muito Fácil / Dominado",
      shortLabel: "Muito Fácil",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      barColor: "bg-emerald-500",
      textColor: "text-emerald-400",
      score,
    };
  }
  if (score <= 4) {
    return {
      label: "Fácil / Confortável",
      shortLabel: "Fácil",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      barColor: "bg-teal-500",
      textColor: "text-teal-400",
      score,
    };
  }
  if (score <= 6) {
    return {
      label: "Médio / Moderado",
      shortLabel: "Médio",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      barColor: "bg-amber-500",
      textColor: "text-amber-400",
      score,
    };
  }
  if (score <= 8) {
    return {
      label: "Difícil / Exige Atenção",
      shortLabel: "Difícil",
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      barColor: "bg-orange-500",
      textColor: "text-orange-400",
      score,
    };
  }
  return {
    label: "Muito Difícil / Crítico",
    shortLabel: "Crítico",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    barColor: "bg-rose-500",
    textColor: "text-rose-400",
    score,
  };
};

const ALL_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  setProfile,
  onStartDiagnostic,
  onDirectGenerate,
  isGenerating,
  onSelectTopicForTutor,
  onStartStudySession,
  streakState,
  dailyChallengesState,
  diagnosticResult,
  onNavigateToPastExams,
  questionRecords = [],
}) => {
  const [modeView, setModeView] = useState<"custom" | "school" | "presets">(
    profile.isCustomMode ? "custom" : profile.isSchoolMode ? "school" : "custom"
  );
  const [newSubject, setNewSubject] = useState("");
  const [newSubjectDifficulty, setNewSubjectDifficulty] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAppliedPreset, setLastAppliedPreset] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    return PRESET_PROFILES.filter((item: PresetItem) => {
      const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        item.label.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.profile.objective.toLowerCase().includes(q) ||
        item.profile.subjects.some(s => s.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleApplyPreset = (preset: PresetItem) => {
    const updatedProfile = { ...preset.profile };
    if (!updatedProfile.subjectDifficulties) {
      updatedProfile.subjectDifficulties = {};
      updatedProfile.subjects.forEach((s) => {
        // give intelligent default difficulty
        const sLower = s.toLowerCase();
        if (sLower.includes("física") || sLower.includes("química") || sLower.includes("matemática") || sLower.includes("redação")) {
          updatedProfile.subjectDifficulties![s] = 8;
        } else if (sLower.includes("direito") || sLower.includes("lógica") || sLower.includes("gramática") || sLower.includes("idioma")) {
          updatedProfile.subjectDifficulties![s] = 7;
        } else {
          updatedProfile.subjectDifficulties![s] = 5;
        }
      });
    }
    setProfile(updatedProfile);
    setLastAppliedPreset(preset.label);
    setTimeout(() => {
      setLastAppliedPreset(null);
    }, 4000);
  };

  const handleApplySchoolGrade = (newProf: UserProfile, gradeName: string) => {
    setProfile(newProf);
    setLastAppliedPreset(gradeName);
    setTimeout(() => {
      setLastAppliedPreset(null);
    }, 4000);
  };

  const handleDayToggle = (day: string) => {
    const exists = profile.availableDays.includes(day);
    if (exists) {
      if (profile.availableDays.length <= 1) return; // keep at least 1
      setProfile({
        ...profile,
        availableDays: profile.availableDays.filter((d) => d !== day),
      });
    } else {
      setProfile({
        ...profile,
        availableDays: [...profile.availableDays, day],
      });
    }
  };

  const handleSetSubjectDifficulty = (subj: string, diff: number) => {
    const clamped = Math.max(0, Math.min(10, diff));
    const currentDiffs = { ...(profile.subjectDifficulties || {}) };
    currentDiffs[subj] = clamped;
    setProfile({
      ...profile,
      subjectDifficulties: currentDiffs,
    });
  };

  const handleIncrementDifficulty = (subj: string) => {
    const current = profile.subjectDifficulties?.[subj] ?? 5;
    if (current < 10) {
      handleSetSubjectDifficulty(subj, current + 1);
    }
  };

  const handleDecrementDifficulty = (subj: string) => {
    const current = profile.subjectDifficulties?.[subj] ?? 5;
    if (current > 0) {
      handleSetSubjectDifficulty(subj, current - 1);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    const name = newSubject.trim();
    if (profile.subjects.includes(name)) {
      setNewSubject("");
      return;
    }
    const currentDiffs = { ...(profile.subjectDifficulties || {}) };
    currentDiffs[name] = newSubjectDifficulty;
    setProfile({
      ...profile,
      subjects: [...profile.subjects, name],
      subjectDifficulties: currentDiffs,
    });
    setNewSubject("");
    setNewSubjectDifficulty(5);
  };

  const handleRemoveSubject = (sub: string) => {
    const currentDiffs = { ...(profile.subjectDifficulties || {}) };
    delete currentDiffs[sub];
    setProfile({
      ...profile,
      subjects: profile.subjects.filter((s) => s !== sub),
      subjectDifficulties: currentDiffs,
    });
  };

  // Calculate difficulty stats
  const difficultyStats = useMemo(() => {
    if (!profile.subjects || profile.subjects.length === 0) {
      return { average: 0, easyCount: 0, mediumCount: 0, hardCount: 0, criticalCount: 0 };
    }
    let total = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let critical = 0;

    profile.subjects.forEach((s) => {
      const score = profile.subjectDifficulties?.[s] ?? 5;
      total += score;
      if (score <= 4) easy++;
      else if (score <= 6) medium++;
      else if (score <= 8) hard++;
      else critical++;
    });

    return {
      average: Number((total / profile.subjects.length).toFixed(1)),
      easyCount: easy,
      mediumCount: medium,
      hardCount: hard,
      criticalCount: critical,
    };
  }, [profile.subjects, profile.subjectDifficulties]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome Header & Quick Study Session Overview Section */}
      {onStartStudySession && (
        <DashboardWelcomeCard
          profile={profile}
          streakState={streakState}
          dailyChallengesState={dailyChallengesState}
          diagnosticResult={diagnosticResult}
          onStartStudySession={onStartStudySession}
        />
      )}

      {/* Resumo do Dia com IA (Maior Progresso & Foco para Amanhã) */}
      <DailySummaryCard
        profile={profile}
        streakState={streakState}
        onStartStudySession={onStartStudySession}
      />

      {/* Gráfico de Evolução da Precisão Média (Últimos 30 Dias) via Recharts */}
      <Accuracy30DaysChart
        questionRecords={questionRecords}
        streakState={streakState}
        targetAccuracy={80}
      />

      {/* Dica de Especialista Diária Baseada na Metodologia */}
      <ExpertTipCard
        profile={profile}
        onStartStudySession={onStartStudySession}
      />

      {/* Profile & Customization Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Diagnóstico & Planejamento Baseado em Evidências</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Configuração do Perfil & Currículo
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Calibre sua disponibilidade, matérias com maior dificuldade, ciclos de revisão espaçada (1, 7, 15 e 30 dias) e tutoria socrática.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {onNavigateToPastExams && (
              <button
                type="button"
                id="past-exams-profile-btn"
                onClick={onNavigateToPastExams}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Award className="w-4 h-4 mr-2 text-emerald-400" />
                <span>Provas Antigas & Bancas</span>
              </button>
            )}
            <button
              id="start-diagnostic-top-btn"
              onClick={onStartDiagnostic}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 mr-2 text-emerald-400" />
              {isGenerating ? "Processando..." : "Refazer Diagnóstico (10Q)"}
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs: Personalizado vs Matérias Escolares vs Exames & Concursos */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModeView("custom")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                  modeView === "custom"
                    ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Modo Personalizado (Aprender & Melhorar)</span>
              </button>

              <button
                type="button"
                onClick={() => setModeView("school")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                  modeView === "school"
                    ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <School className="w-4 h-4" />
                <span>Modo Matérias Escolares (Séries EF & EM)</span>
              </button>

              <button
                type="button"
                onClick={() => setModeView("presets")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                  modeView === "presets"
                    ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Vestibulares, Militares & Concursos</span>
              </button>
            </div>

            {profile.schoolGrade && modeView === "school" && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {profile.schoolGrade}
              </span>
            )}
          </div>

          {lastAppliedPreset && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
              <span className="flex items-center">
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                Configuração para <strong>{lastAppliedPreset}</strong> carregada no formulário abaixo!
              </span>
            </div>
          )}

          {/* Render Mode View: Custom Subject Builder vs School Explorer vs Presets Catalog */}
          {modeView === "custom" ? (
            <CustomSubjectModeBuilder
              currentProfile={profile}
              onUpdateProfile={setProfile}
              onGeneratePlan={onDirectGenerate}
              onStartDiagnostic={onStartDiagnostic}
              isGenerating={isGenerating}
              onSelectTopicForTutor={onSelectTopicForTutor}
            />
          ) : modeView === "school" ? (
            <SchoolCurriculumExplorer
              currentProfile={profile}
              onApplyGradeProfile={handleApplySchoolGrade}
              onSelectTopicForTutor={onSelectTopicForTutor}
            />
          ) : (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1.5 text-emerald-400" />
                  Catálogo de Cursos & Exames ({PRESET_PROFILES.length}):
                </p>

                {/* Quick Search */}
                <div className="relative min-w-[200px] sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar (ex: inglês, francês, naval, epcar, iff...)"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredPresets.map((p) => {
                  const isSelected = profile.objective === p.profile.objective;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`text-left p-3.5 rounded-xl border transition text-xs flex flex-col justify-between ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30 text-white"
                          : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-bold text-emerald-400">
                            {p.badge}
                          </span>
                          {isSelected ? (
                            <span className="flex items-center text-[11px] text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ativo
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">{p.profile.dailyHours}h/dia</span>
                          )}
                        </div>
                        <p className="font-bold text-slate-100 line-clamp-1 text-[13px]">
                          {p.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[170px]">{p.profile.subjects.slice(0, 3).join(", ")}...</span>
                        <span className="text-emerald-400 font-semibold shrink-0 ml-1">Carregar →</span>
                      </div>
                    </button>
                  );
                })}
                {filteredPresets.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                    Nenhum curso encontrado para "<strong>{searchQuery}</strong>" na categoria selecionada.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Form */}
      <form className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center">
          <User className="w-5 h-5 mr-2 text-emerald-400" />
          Perfil do Estudante & Restrições Reais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objetivo Principal */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Objetivo Principal <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Target className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="profile-objective-input"
                type="text"
                value={profile.objective}
                onChange={(e) => setProfile({ ...profile, objective: e.target.value })}
                placeholder="Ex: Passar no ENEM (Medicina), Colégio Naval, EPCAR, IFF, UFRJ, FAETEC..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Prazo ou Data da Prova */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Prazo ou Data da Prova <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="profile-targetdate-input"
                type="date"
                value={profile.targetDate}
                onChange={(e) => setProfile({ ...profile, targetDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Nível Atual */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Nível Atual Declarado <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Iniciante", "Intermediário", "Avançado"] as LevelType[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProfile({ ...profile, currentLevel: lvl })}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                    profile.currentLevel === lvl
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                      : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Matérias / Habilidades com Contador de Dificuldade (0 a 10) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Matérias & Contador de Dificuldade (0 a 10)</span>
                  <span className="text-emerald-400 font-bold">({profile.subjects.length})</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Classifique de <strong>0 (Muito Fácil/Dominado)</strong> a <strong>10 (Máxima Dificuldade/Crítico)</strong>. A IA priorizará as matérias mais difíceis na rotina e no tutor.
                </p>
              </div>

              {profile.subjects.length > 0 && (
                <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Média Geral:</span>
                  <span className={`font-bold ${
                    difficultyStats.average >= 7 ? "text-rose-400" : difficultyStats.average >= 5 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {difficultyStats.average} / 10
                  </span>
                </div>
              )}
            </div>

            {/* Difficulty breakdown chips */}
            {profile.subjects.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium flex items-center space-x-1">
                  <span>🟢 Fáceis (0-4):</span>
                  <strong>{difficultyStats.easyCount}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium flex items-center space-x-1">
                  <span>🟡 Médias (5-6):</span>
                  <strong>{difficultyStats.mediumCount}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 font-medium flex items-center space-x-1">
                  <span>🟠 Difíceis (7-8):</span>
                  <strong>{difficultyStats.hardCount}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium flex items-center space-x-1">
                  <span>🔴 Críticas (9-10):</span>
                  <strong>{difficultyStats.criticalCount}</strong>
                </span>
              </div>
            )}

            {/* List of Subjects with 0-10 Difficulty Steppers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.subjects.map((subj) => {
                const diff = profile.subjectDifficulties?.[subj] ?? 5;
                const meta = getDifficultyMeta(diff);

                return (
                  <div
                    key={subj}
                    className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2.5 transition hover:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-100 truncate" title={subj}>
                          {subj}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subj)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition hover:bg-slate-700/50"
                        title="Remover matéria"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Difficulty Counter & Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleDecrementDifficulty(subj)}
                          disabled={diff <= 0}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold flex items-center justify-center transition"
                          title="Diminuir dificuldade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center space-x-1.5 ${meta.badgeColor}`}>
                          <span>{diff}</span>
                          <span className="text-[10px] opacity-75">/10</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIncrementDifficulty(subj)}
                          disabled={diff >= 10}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold flex items-center justify-center transition"
                          title="Aumentar dificuldade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] font-semibold ${meta.textColor}`}>
                          {meta.shortLabel}
                        </span>
                      </div>
                    </div>

                    {/* Quick Range Slider & Segments */}
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={diff}
                        onChange={(e) => handleSetSubjectDifficulty(subj, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>0 (Fácil)</span>
                        <span>5 (Médio)</span>
                        <span>10 (Crítico)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Subject Form with Difficulty Selector */}
            <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                + Adicionar Nova Matéria ou Curso com Dificuldade
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubject(e);
                    }
                  }}
                  placeholder="Nome da matéria (ex: Termodinâmica, Direito Penal, Inglês Conversação)..."
                  className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />

                {/* Initial Difficulty Stepper */}
                <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2 py-1 rounded-xl">
                  <span className="text-[11px] text-slate-400 mr-1 font-medium">Dif:</span>
                  <button
                    type="button"
                    onClick={() => setNewSubjectDifficulty((prev) => Math.max(0, prev - 1))}
                    disabled={newSubjectDifficulty <= 0}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center text-xs disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-emerald-400 px-1 font-mono">
                    {newSubjectDifficulty}/10
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewSubjectDifficulty((prev) => Math.min(10, prev + 1))}
                    disabled={newSubjectDifficulty >= 10}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center text-xs disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar
                </button>
              </div>

              {/* Quick School Subjects Chips */}
              <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center tracking-wider">
                  <School className="w-3 h-3 mr-1 text-emerald-400" />
                  Adicionar Matéria Escolar em 1 Clique:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SCHOOL_SUBJECTS.map((schoolSub) => {
                    const alreadyAdded = profile.subjects.includes(schoolSub);
                    return (
                      <button
                        key={schoolSub}
                        type="button"
                        onClick={() => {
                          if (alreadyAdded) {
                            handleRemoveSubject(schoolSub);
                          } else {
                            const updatedSubjects = [...profile.subjects, schoolSub];
                            const updatedDifficulties = {
                              ...(profile.subjectDifficulties || {}),
                              [schoolSub]: 5,
                            };
                            setProfile({
                              ...profile,
                              subjects: updatedSubjects,
                              subjectDifficulties: updatedDifficulties,
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center space-x-1 ${
                          alreadyAdded
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                            : "bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                        }`}
                      >
                        {alreadyAdded ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{schoolSub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdos Prioritários */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Conteúdos Prioritários
            </label>
            <textarea
              rows={2}
              value={profile.priorityTopics}
              onChange={(e) => setProfile({ ...profile, priorityTopics: e.target.value })}
              placeholder="Ex: Circuitos elétricos, Ecologia, Direito Administrativo, Funções assíncronas..."
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Maiores Dificuldades */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Maiores Dificuldades
            </label>
            <textarea
              rows={2}
              value={profile.difficulties}
              onChange={(e) => setProfile({ ...profile, difficulties: e.target.value })}
              placeholder="Ex: Raciocínio lógico, Química orgânica, Gestão do tempo..."
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Maiores Facilidades */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center text-teal-300">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Maiores Facilidades
            </label>
            <textarea
              rows={2}
              value={profile.strengths}
              onChange={(e) => setProfile({ ...profile, strengths: e.target.value })}
              placeholder="Ex: Redação, Interpretação de texto, Biologia celular..."
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Horários Preferidos */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Horários Preferidos de Estudo
            </label>
            <input
              type="text"
              value={profile.preferredTimes}
              onChange={(e) => setProfile({ ...profile, preferredTimes: e.target.value })}
              placeholder="Ex: Noite (19h às 22h) ou Manhã cedo (06h às 08h30)"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Dias Disponíveis */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Dias Disponíveis na Semana ({profile.availableDays.length} dias selecionados)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_DAYS.map((day) => {
                const active = profile.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                      active
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                        : "bg-slate-800/50 border-slate-700/60 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tempo Diário Disponível */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tempo Diário Máximo (Horas/dia)</span>
              <span className="text-emerald-400 font-bold text-sm">{profile.dailyHours}h por dia</span>
            </label>
            <div className="flex items-center space-x-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                id="profile-dailyhours-range"
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={profile.dailyHours}
                onChange={(e) => setProfile({ ...profile, dailyHours: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-semibold w-12 text-right">
                {profile.dailyHours}h
              </span>
            </div>
          </div>

          {/* Método Preferido */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Método de Aprendizagem Preferido
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={profile.learningMethod}
                onChange={(e) => setProfile({ ...profile, learningMethod: e.target.value })}
                placeholder="Ex: Exercícios + Flashcards + Resumos estruturados"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Materiais Disponíveis */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Materiais & Ferramentas Disponíveis
            </label>
            <input
              type="text"
              value={profile.materials}
              onChange={(e) => setProfile({ ...profile, materials: e.target.value })}
              placeholder="Ex: PDFs, Plataforma de questões, Videoaulas, Livro Farias..."
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Compromissos e Limitações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Compromissos Fixos & Limitações
            </label>
            <input
              type="text"
              value={profile.limitations}
              onChange={(e) => setProfile({ ...profile, limitations: e.target.value })}
              placeholder="Ex: Trabalho das 8h às 18h, Cuidar dos filhos à noite, etc."
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            ⚡ Regra pedagógica: Recomendamos realizar o <strong>Diagnóstico de 10 Perguntas</strong> para calibrar o plano inicial.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="direct-generate-btn"
              onClick={onDirectGenerate}
              disabled={isGenerating}
              className="px-5 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center disabled:opacity-50"
            >
              Pular Diagnóstico e Gerar Planos
            </button>
            <button
              type="button"
              id="start-diagnostic-main-btn"
              onClick={onStartDiagnostic}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center transition disabled:opacity-50"
            >
              <span>{isGenerating ? "Gerando..." : "Iniciar Diagnóstico (10 Perguntas)"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
