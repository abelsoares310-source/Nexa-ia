import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Minus,
  X,
  Search,
  Check,
  CheckCircle2,
  BookOpen,
  Sliders,
  Gauge,
  Target,
  Zap,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Brain,
  GraduationCap,
  ListPlus,
  HelpCircle,
  FolderPlus
} from "lucide-react";
import { UserProfile, CustomSubjectConfig, SubjectIntent } from "../types";
import {
  CUSTOM_SUBJECTS_CATALOG,
  CUSTOM_SUBJECT_CATEGORIES,
  CatalogSubjectItem,
  INTENT_META
} from "../utils/customSubjectsCatalog";
import { getDifficultyMeta } from "./ProfileForm";

interface CustomSubjectModeBuilderProps {
  currentProfile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onGeneratePlan: () => void;
  onStartDiagnostic: () => void;
  isGenerating: boolean;
  onSelectTopicForTutor?: (subject: string, topic: string) => void;
}

export const CustomSubjectModeBuilder: React.FC<CustomSubjectModeBuilderProps> = ({
  currentProfile,
  onUpdateProfile,
  onGeneratePlan,
  onStartDiagnostic,
  isGenerating,
  onSelectTopicForTutor,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [customInputName, setCustomInputName] = useState("");
  const [customInputIntent, setCustomInputIntent] = useState<SubjectIntent>("learn");
  const [customInputDifficulty, setCustomInputDifficulty] = useState<number>(5);
  const [customSubtopicInput, setCustomSubtopicInput] = useState<Record<string, string>>({});
  const [showAiAssistantBox, setShowAiAssistantBox] = useState<boolean>(false);
  const [aiSuggestionsState, setAiSuggestionsState] = useState<{
    isLoading: boolean;
    suggestionText?: string;
  }>({ isLoading: false });

  // Current list of custom subject configs
  const customConfigs: CustomSubjectConfig[] = useMemo(() => {
    if (currentProfile.customSubjectConfigs && currentProfile.customSubjectConfigs.length > 0) {
      return currentProfile.customSubjectConfigs;
    }
    // If not set yet, build from profile.subjects and profile.subjectDifficulties
    return (currentProfile.subjects || []).map((s) => {
      const diff = currentProfile.subjectDifficulties?.[s] ?? 5;
      const intent = (currentProfile.subjectIntents?.[s] as SubjectIntent) || (diff >= 7 ? "improve" : "learn");
      const catalogItem = CUSTOM_SUBJECTS_CATALOG.find((c) => c.name.toLowerCase() === s.toLowerCase());
      return {
        name: s,
        intent,
        difficulty: diff,
        specificTopics: catalogItem ? catalogItem.popularTopics.slice(0, 3) : [],
        targetWeeklyHours: 4,
      };
    });
  }, [currentProfile.customSubjectConfigs, currentProfile.subjects, currentProfile.subjectDifficulties, currentProfile.subjectIntents]);

  // Sync back to profile
  const syncCustomConfigsToProfile = (newConfigs: CustomSubjectConfig[], extraFields?: Partial<UserProfile>) => {
    const subjects = newConfigs.map((c) => c.name);
    const subjectDifficulties: Record<string, number> = {};
    const subjectIntents: Record<string, SubjectIntent> = {};

    newConfigs.forEach((c) => {
      subjectDifficulties[c.name] = c.difficulty;
      subjectIntents[c.name] = c.intent;
    });

    const learnCount = newConfigs.filter((c) => c.intent === "learn").length;
    const improveCount = newConfigs.filter((c) => c.intent === "improve").length;
    const masterCount = newConfigs.filter((c) => c.intent === "master").length;

    // Build comprehensive priority topics text
    const priorityTopicsText = newConfigs
      .map((c) => {
        const intentText = c.intent === "learn" ? "[Aprender do Zero]" : c.intent === "improve" ? "[Melhorar/Reforçar]" : "[Dominar]";
        const topics = c.specificTopics && c.specificTopics.length > 0 ? ` - Tópicos: ${c.specificTopics.join(", ")}` : "";
        return `${c.name} ${intentText} (Dif: ${c.difficulty}/10)${topics}`;
      })
      .join(" | ");

    const updated: UserProfile = {
      ...currentProfile,
      subjects,
      subjectDifficulties,
      subjectIntents,
      customSubjectConfigs: newConfigs,
      priorityTopics: priorityTopicsText || currentProfile.priorityTopics,
      isCustomMode: true,
      isSchoolMode: false,
      difficulties: newConfigs
        .filter((c) => c.difficulty >= 7)
        .map((c) => `${c.name} (${c.intent === "learn" ? "Aprender do zero" : "Reforçar lacunas"})`)
        .join(", ") || currentProfile.difficulties || "Nenhuma crítica",
      strengths: newConfigs
        .filter((c) => c.difficulty <= 4)
        .map((c) => c.name)
        .join(", ") || currentProfile.strengths || "Fundamentos iniciais",
      ...extraFields,
    };

    onUpdateProfile(updated);
  };

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    return CUSTOM_SUBJECTS_CATALOG.filter((item: CatalogSubjectItem) => {
      const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.popularTopics.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Add subject from catalog or custom
  const handleAddSubjectConfig = (
    name: string,
    intent: SubjectIntent = "learn",
    difficulty: number = 5,
    initialTopics: string[] = []
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (customConfigs.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return; // Already in list
    }

    const catalogItem = CUSTOM_SUBJECTS_CATALOG.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    const topicsToAdd = initialTopics.length > 0 ? initialTopics : catalogItem ? catalogItem.popularTopics.slice(0, 3) : [];

    const newConfig: CustomSubjectConfig = {
      name: trimmed,
      intent,
      difficulty,
      specificTopics: topicsToAdd,
      targetWeeklyHours: 4,
    };

    const nextList = [...customConfigs, newConfig];
    syncCustomConfigsToProfile(nextList);
    setCustomInputName("");
  };

  // Remove subject
  const handleRemoveSubjectConfig = (name: string) => {
    const nextList = customConfigs.filter((c) => c.name !== name);
    syncCustomConfigsToProfile(nextList);
  };

  // Update intent
  const handleSetIntent = (name: string, intent: SubjectIntent) => {
    const nextList = customConfigs.map((c) => (c.name === name ? { ...c, intent } : c));
    syncCustomConfigsToProfile(nextList);
  };

  // Update difficulty
  const handleSetDifficulty = (name: string, difficulty: number) => {
    const clamped = Math.max(0, Math.min(10, difficulty));
    const nextList = customConfigs.map((c) => (c.name === name ? { ...c, difficulty: clamped } : c));
    syncCustomConfigsToProfile(nextList);
  };

  // Toggle specific topic in subject
  const handleToggleTopic = (subjectName: string, topic: string) => {
    const nextList = customConfigs.map((c) => {
      if (c.name !== subjectName) return c;
      const currentTopics = c.specificTopics || [];
      const exists = currentTopics.includes(topic);
      const updatedTopics = exists ? currentTopics.filter((t) => t !== topic) : [...currentTopics, topic];
      return { ...c, specificTopics: updatedTopics };
    });
    syncCustomConfigsToProfile(nextList);
  };

  // Add custom subtopic
  const handleAddCustomSubtopic = (subjectName: string) => {
    const subtopic = (customSubtopicInput[subjectName] || "").trim();
    if (!subtopic) return;

    const nextList = customConfigs.map((c) => {
      if (c.name !== subjectName) return c;
      const currentTopics = c.specificTopics || [];
      if (currentTopics.includes(subtopic)) return c;
      return { ...c, specificTopics: [...currentTopics, subtopic] };
    });
    syncCustomConfigsToProfile(nextList);
    setCustomSubtopicInput((prev) => ({ ...prev, [subjectName]: "" }));
  };

  // AI Assistant for topics & plan suggestions
  const handleAskAiForSuggestions = async () => {
    if (customConfigs.length === 0) return;
    setAiSuggestionsState({ isLoading: true });
    setShowAiAssistantBox(true);

    try {
      const response = await fetch("/api/study/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `O estudante montou um plano personalizado com as seguintes matérias:
${customConfigs
  .map(
    (c) =>
      `- ${c.name}: Intenção "${c.intent === "learn" ? "Aprender do Zero" : c.intent === "improve" ? "Melhorar/Reforçar" : "Dominar Alta Performance"}", Dificuldade ${c.difficulty}/10. Tópicos atuais: ${c.specificTopics?.join(", ") || "Nenhum ainda"}`
  )
  .join("\n")}

Disponibilidade: ${currentProfile.dailyHours}h por dia em ${currentProfile.availableDays.length} dias (${currentProfile.availableDays.join(", ")}).

Por favor, dê uma análise pedagógica rápida e estruturada:
1. Ordem recomendada de estudo e interligação entre essas matérias (qual estudar primeiro na semana).
2. 2 a 3 tópicos indispensáveis para cada matéria que ele quer aprender ou melhorar.
3. Sugestão prática de técnica (ex: active recall para as de dificuldade 7+, prática intercalada).`,
          history: [],
          profile: currentProfile,
          subject: "Orientação Personalizada de Estudos",
          topic: "Estratégia de Aprendizagem das Matérias Escolhidas",
        }),
      });

      if (!response.ok) throw new Error("Falha ao obter sugestões");
      const data = await response.json();
      setAiSuggestionsState({
        isLoading: false,
        suggestionText: data.reply || "Sugestão gerada com sucesso!",
      });
    } catch (e: any) {
      setAiSuggestionsState({
        isLoading: false,
        suggestionText:
          "Dica Estratégica: Para as matérias que você quer 'Aprender do Zero', inicie sempre pelas bases conceituais com sessões de 30-40 minutos e exemplos resolvidos. Para as matérias de 'Melhorar/Reforçar', foque 70% do tempo em resolução de exercícios e análise dos erros no diário.",
      });
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = customConfigs.length;
    const learn = customConfigs.filter((c) => c.intent === "learn").length;
    const improve = customConfigs.filter((c) => c.intent === "improve").length;
    const master = customConfigs.filter((c) => c.intent === "master").length;
    const totalDiff = customConfigs.reduce((acc, c) => acc + c.difficulty, 0);
    const avgDiff = total > 0 ? (totalDiff / total).toFixed(1) : "0.0";
    const totalTopics = customConfigs.reduce((acc, c) => acc + (c.specificTopics?.length || 0), 0);
    const weeklyHours = currentProfile.dailyHours * currentProfile.availableDays.length;

    return { total, learn, improve, master, avgDiff, totalTopics, weeklyHours };
  }, [customConfigs, currentProfile.dailyHours, currentProfile.availableDays]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Modo Personalizado */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1" />
                Modo Personalizado
              </span>
              <span className="text-xs text-slate-400">
                Escolha livremente o que você quer <strong>Aprender do Zero</strong> ou <strong>Melhorar / Reforçar</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Matérias & Habilidades Sob Medida
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monte sua grade ideal com matérias escolares, idiomas, programação, concursos ou faculdade. 
              Defina o foco (Aprender vs Melhorar), selecione os tópicos prioritários e ajuste a dificuldade para a IA montar a rotina perfeita.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">{stats.total} Matérias</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold">{stats.learn} do Zero</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400 font-bold">{stats.improve} Reforço</span>
            </div>

            <button
              type="button"
              onClick={handleAskAiForSuggestions}
              disabled={customConfigs.length === 0 || aiSuggestionsState.isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{aiSuggestionsState.isLoading ? "Analisando..." : "Assistente IA: Sugerir Estratégia"}</span>
            </button>
          </div>
        </div>

        {/* AI Assistant Output Modal/Box */}
        {showAiAssistantBox && (
          <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl border border-emerald-500/30 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span>Orientação Estratégica da IA para suas Matérias</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAiAssistantBox(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {aiSuggestionsState.isLoading ? (
              <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Analisando pré-requisitos e sugerindo a melhor distribuição...</span>
              </div>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {aiSuggestionsState.suggestionText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Grid: Selected Subjects Manager (Left/Top) & Subject Catalog Picker (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / MAIN COLUMN: Matérias Selecionadas e Customizadas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Minhas Matérias Configuradas ({customConfigs.length})</span>
            </h3>

            {customConfigs.length > 0 && (
              <span className="text-xs text-slate-400">
                Média de Dificuldade: <strong className="text-emerald-400">{stats.avgDiff}/10</strong>
              </span>
            )}
          </div>

          {/* Quick Custom Input for Any Subject (Free-Form) */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Digitar Nome de Qualquer Matéria / Habilidade</span>
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customInputName}
                onChange={(e) => setCustomInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubjectConfig(customInputName, customInputIntent, customInputDifficulty);
                  }
                }}
                placeholder="Ex: Física Quântica, Alemão B1, Direito Tributário, Redação..."
                className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />

              {/* Intent Toggle */}
              <select
                value={customInputIntent}
                onChange={(e) => setCustomInputIntent(e.target.value as SubjectIntent)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="learn">🟢 Aprender do Zero</option>
                <option value="improve">🟡 Melhorar / Reforçar</option>
                <option value="master">🟣 Dominar / Alta Perf.</option>
              </select>

              {/* Add button */}
              <button
                type="button"
                onClick={() => handleAddSubjectConfig(customInputName, customInputIntent, customInputDifficulty)}
                disabled={!customInputName.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </button>
            </div>
          </div>

          {/* List of Configured Subjects Cards */}
          <div className="space-y-3.5">
            {customConfigs.map((cfg) => {
              const intentInfo = INTENT_META[cfg.intent] || INTENT_META.learn;
              const diffMeta = getDifficultyMeta(cfg.difficulty);
              const catalogMatch = CUSTOM_SUBJECTS_CATALOG.find((c) => c.name.toLowerCase() === cfg.name.toLowerCase());
              const availableSuggestions = catalogMatch ? catalogMatch.popularTopics : [];

              return (
                <div
                  key={cfg.name}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 space-y-3 transition shadow-sm"
                >
                  {/* Header: Name + Intent Selector + Remove */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate" title={cfg.name}>
                          {cfg.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {intentInfo.targetLevelText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Intent Segmented Selector */}
                      <div className="inline-flex p-0.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleSetIntent(cfg.name, "learn")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                            cfg.intent === "learn"
                              ? "bg-emerald-500 text-slate-950 shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Foco em conceitos básicos, fundamentos do zero e ritmo gradual"
                        >
                          <span>Aprender do Zero</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetIntent(cfg.name, "improve")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                            cfg.intent === "improve"
                              ? "bg-amber-500 text-slate-950 shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Foco em exercícios guiados, correção de lacunas e reforço"
                        >
                          <span>Melhorar / Reforçar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetIntent(cfg.name, "master")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                            cfg.intent === "master"
                              ? "bg-purple-500 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Foco em simulados avançados, velocidade e alto rendimento"
                        >
                          <span>Dominar</span>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectConfig(cfg.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remover matéria"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Difficulty Stepper & Slider */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="sm:col-span-5 flex items-center justify-between sm:justify-start space-x-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                        <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dificuldade:</span>
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetDifficulty(cfg.name, cfg.difficulty - 1)}
                          disabled={cfg.difficulty <= 0}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className={`px-2 py-0.5 rounded-md border font-mono font-bold text-xs ${diffMeta.badgeColor}`}>
                          {cfg.difficulty}/10
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSetDifficulty(cfg.name, cfg.difficulty + 1)}
                          disabled={cfg.difficulty >= 10}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className={`text-[11px] font-semibold ${diffMeta.textColor}`}>
                        {diffMeta.shortLabel}
                      </span>
                    </div>

                    <div className="sm:col-span-7">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={cfg.difficulty}
                        onChange={(e) => handleSetDifficulty(cfg.name, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Specific Topics to Learn / Improve */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tópicos Específicos para Focar ({cfg.specificTopics?.length || 0})</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Clique para ativar ou digite novos tópicos
                      </span>
                    </div>

                    {/* Active Selected Topics */}
                    <div className="flex flex-wrap gap-1.5">
                      {(cfg.specificTopics || []).map((topic) => (
                        <span
                          key={topic}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-1 font-medium group"
                        >
                          <span>{topic}</span>
                          {onSelectTopicForTutor && (
                            <button
                              type="button"
                              onClick={() => onSelectTopicForTutor(cfg.name, topic)}
                              className="text-emerald-400 hover:text-white ml-1 text-[10px] font-bold underline"
                              title="Praticar este tópico no Tutor Socrático"
                            >
                              Tutor ↗
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleTopic(cfg.name, topic)}
                            className="text-emerald-400/60 hover:text-rose-400 ml-1 p-0.5 rounded"
                            title="Remover tópico"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      {(!cfg.specificTopics || cfg.specificTopics.length === 0) && (
                        <span className="text-xs text-slate-500 italic py-0.5">
                          Nenhum subtópico adicionado ainda. A IA cobrirá toda a ementa da matéria.
                        </span>
                      )}
                    </div>

                    {/* Catalog Suggested Topics (Click-to-Add) */}
                    {availableSuggestions.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                          Sugestões:
                        </span>
                        {availableSuggestions.map((sug) => {
                          const isAdded = cfg.specificTopics?.includes(sug);
                          return (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleToggleTopic(cfg.name, sug)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition flex items-center space-x-1 ${
                                isAdded
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750 border border-slate-700/60"
                              }`}
                            >
                              {isAdded ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Plus className="w-2.5 h-2.5" />}
                              <span>{sug}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Custom Subtopic input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customSubtopicInput[cfg.name] || ""}
                        onChange={(e) => setCustomSubtopicInput({ ...customSubtopicInput, [cfg.name]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomSubtopic(cfg.name);
                          }
                        }}
                        placeholder={`+ Adicionar tópico específico em ${cfg.name}...`}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomSubtopic(cfg.name)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
                      >
                        + Inserir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {customConfigs.length === 0 && (
              <div className="p-8 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">Nenhuma matéria adicionada ainda</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Digite o nome de uma matéria acima ou selecione matérias no catálogo ao lado para começar seu plano personalizado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Catálogo Rápido de Matérias & Habilidades (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Biblioteca de Matérias ({CUSTOM_SUBJECTS_CATALOG.length})
                </h3>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar (ex: matemática, inglês, python, redação...)"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {CUSTOM_SUBJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    selectedCategory === cat
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const isSelected = customConfigs.some((c) => c.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition text-xs space-y-2 ${
                      isSelected
                        ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                        : "bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-bold text-emerald-400 border border-slate-700">
                            {item.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{item.category}</span>
                        </div>
                        <h5 className="font-bold text-white text-xs">{item.name}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveSubjectConfig(item.name);
                          } else {
                            handleAddSubjectConfig(item.name, item.suggestedIntentDefault, item.defaultDifficulty, item.popularTopics);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center space-x-1 ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Adicionado</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Incluir</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Preview of top topics */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-700/40">
                      {item.popularTopics.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                      {item.popularTopics.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{item.popularTopics.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhuma matéria encontrada para "<strong>{searchQuery}</strong>".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Pronto para Começar seu Aprendizado?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Você configurou <strong>{customConfigs.length} matérias</strong> com <strong>{stats.weeklyHours}h semanais</strong> de estudo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              id="start-custom-diagnostic-btn"
              type="button"
              onClick={onStartDiagnostic}
              disabled={isGenerating || customConfigs.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Fazer Diagnóstico (10Q)</span>
            </button>

            <button
              id="generate-custom-plan-btn"
              type="button"
              onClick={onGeneratePlan}
              disabled={isGenerating || customConfigs.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isGenerating ? "Gerando Plano..." : "⚡ Gerar Plano Anual, Mês 1 & Rotina"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
