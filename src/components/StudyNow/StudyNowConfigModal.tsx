import React, { useState } from "react";
import { 
  Sparkles, 
  Zap, 
  Flame, 
  Clock, 
  BookOpen, 
  Layers, 
  Brain, 
  Target, 
  Play, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronRight
} from "lucide-react";
import { UserProfile, StudySessionMode, StudyTimerMode, SpacedReviewItem, DiagnosticResult, FlashcardItem } from "../../types";

interface StudyNowConfigModalProps {
  profile: UserProfile;
  diagnosticResult: DiagnosticResult | null;
  spacedReviews: SpacedReviewItem[];
  flashcards: FlashcardItem[];
  isGenerating: boolean;
  onStartSession: (config: {
    mode: StudySessionMode;
    subject: string;
    topic: string;
    targetDurationMinutes: number;
    timerMode: StudyTimerMode;
    questionsCount: number;
    flashcardsCount: number;
    reviewsCount: number;
    weaknesses: string[];
  }) => void;
  onClose?: () => void;
  hasActiveSession?: boolean;
  onResumeActiveSession?: () => void;
}

export const StudyNowConfigModal: React.FC<StudyNowConfigModalProps> = ({
  profile,
  diagnosticResult,
  spacedReviews,
  flashcards,
  isGenerating,
  onStartSession,
  hasActiveSession,
  onResumeActiveSession,
}) => {
  // Preset modes
  const [selectedMode, setSelectedMode] = useState<StudySessionMode>("balanced");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    profile.subjects && profile.subjects.length > 0 ? profile.subjects[0] : "Geral"
  );
  const [customTopic, setCustomTopic] = useState<string>("");
  const [targetDuration, setTargetDuration] = useState<number>(25);
  const [timerMode, setTimerMode] = useState<StudyTimerMode>("pomodoro");
  const [questionsCount, setQuestionsCount] = useState<number>(4);
  const [flashcardsCount, setFlashcardsCount] = useState<number>(4);
  const [reviewsCount, setReviewsCount] = useState<number>(2);
  const [useWeaknessesFocus, setUseWeaknessesFocus] = useState<boolean>(true);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);

  // Available subjects
  const subjectsList = profile.subjects && profile.subjects.length > 0 ? profile.subjects : ["Matemática", "Física", "Química", "Biologia"];

  // Pending spaced reviews count
  const pendingReviewsCount = spacedReviews.filter((r) => !r.completed).length;

  // Weaknesses from diagnostic
  const diagnosticWeaknesses = diagnosticResult?.attentionSkills || [];

  const handleQuickPreset = (presetType: "pomodoro_balanced" | "quick_sprint" | "deep_questions" | "flashcard_mastery" | "weakness_triage") => {
    if (presetType === "pomodoro_balanced") {
      setSelectedMode("balanced");
      setTargetDuration(25);
      setTimerMode("pomodoro");
      setQuestionsCount(4);
      setFlashcardsCount(4);
      setReviewsCount(2);
    } else if (presetType === "quick_sprint") {
      setSelectedMode("quick_sprint");
      setTargetDuration(15);
      setTimerMode("countdown");
      setQuestionsCount(3);
      setFlashcardsCount(3);
      setReviewsCount(1);
    } else if (presetType === "deep_questions") {
      setSelectedMode("questions_focus");
      setTargetDuration(35);
      setTimerMode("countdown");
      setQuestionsCount(6);
      setFlashcardsCount(2);
      setReviewsCount(2);
    } else if (presetType === "flashcard_mastery") {
      setSelectedMode("flashcards_focus");
      setTargetDuration(20);
      setTimerMode("pomodoro");
      setQuestionsCount(2);
      setFlashcardsCount(6);
      setReviewsCount(3);
    } else if (presetType === "weakness_triage") {
      setSelectedMode("weakness_recovery");
      setTargetDuration(30);
      setTimerMode("pomodoro");
      setQuestionsCount(5);
      setFlashcardsCount(4);
      setReviewsCount(3);
      setUseWeaknessesFocus(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weaknessesToSend = useWeaknessesFocus
      ? [
          ...diagnosticWeaknesses,
          ...(profile.difficulties ? [profile.difficulties] : [])
        ]
      : [];

    onStartSession({
      mode: selectedMode,
      subject: selectedSubject,
      topic: customTopic.trim() || (weaknessesToSend[0] || `${selectedSubject} - Tópicos Essenciais`),
      targetDurationMinutes: targetDuration,
      timerMode,
      questionsCount,
      flashcardsCount,
      reviewsCount,
      weaknesses: weaknessesToSend,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-xl max-w-4xl mx-auto">
      {/* Header with Neuro Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>Sessão Dinâmica com IA & Neurociência</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Estudar Agora</span>
            <Zap className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            A IA estrutura uma sessão interativa sob medida com <strong>revisões ativas de aquecimento</strong>, <strong>questões práticas com dicas socráticas</strong> e <strong>flashcards mnemônicos</strong> com cronômetro integrado.
          </p>
        </div>

        {hasActiveSession && onResumeActiveSession && (
          <div className="flex sm:flex-col items-end gap-2 bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Sessão em Andamento!
            </span>
            <button
              type="button"
              onClick={onResumeActiveSession}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-slate-950" />
              Continuar Sessão
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Quick Presets Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            1. Escolha uma Modalidade ou Preset Rápido:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickPreset("pomodoro_balanced")}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "balanced"
                  ? "bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Brain className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  25 min
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Tríade Neurocientífica
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Revisão (10%) + Questões (50%) + Flashcards (40%)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset("quick_sprint")}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "quick_sprint"
                  ? "bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  15 min
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                Sprint Rápido (Express)
              </div>
              <p className="text-xs text-slate-400 mt-1">
                3 questões de alto impacto + 3 flashcards ágeis
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset("weakness_triage")}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "weakness_recovery"
                  ? "bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <Target className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  30 min
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                Recuperação de Fraquezas
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Foco estrito em tópicos com erros no Diagnóstico
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset("deep_questions")}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "questions_focus"
                  ? "bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  35 min
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                Simulado Blitz Prático
              </div>
              <p className="text-xs text-slate-400 mt-1">
                6 questões contextualizadas com dicas socráticas
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset("flashcard_mastery")}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "flashcards_focus"
                  ? "bg-purple-500/15 border-purple-500 text-white ring-1 ring-purple-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  20 min
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Fixação & Mnemônicas
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Flashcards ilustrados + repetição espaçada
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMode("custom");
                setShowAdvancedConfig(true);
              }}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                selectedMode === "custom"
                  ? "bg-teal-500/15 border-teal-500 text-white ring-1 ring-teal-500"
                  : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                  <Sliders className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                  Personalizado
                </span>
              </div>
              <div className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                Configuração Livre
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste contagens, tempos e cronômetro
              </p>
            </button>
          </div>
        </div>

        {/* Subject and Topic Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Matéria / Disciplina:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              {subjectsList.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Tópico Específico ou Palavra-Chave (Opcional):
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ex: Circuitos Elétricos, Funções Orgânicas, Geometria Espacial..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* Context Insights Pillbox */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            {pendingReviewsCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {pendingReviewsCount} {pendingReviewsCount === 1 ? "revisão espaçada pendente" : "revisões espaçadas pendentes"}
              </span>
            )}
            {diagnosticWeaknesses.length > 0 && (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {diagnosticWeaknesses.length} pontos de atenção identificados no teste
              </span>
            )}
            {flashcards.length > 0 && (
              <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                <Layers className="w-3.5 h-3.5" />
                {flashcards.length} flashcards cadastrados
              </span>
            )}
          </div>

          {diagnosticWeaknesses.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium hover:text-white transition">
              <input
                type="checkbox"
                checked={useWeaknessesFocus}
                onChange={(e) => setUseWeaknessesFocus(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <span>Injetar pontos fracos na IA</span>
            </label>
          )}
        </div>

        {/* Advanced Config Toggle */}
        <div className="border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvancedConfig ? "Ocultar Ajustes Detalhados" : "Personalizar Duração, Cronômetro e Quantidades"}</span>
          </button>

          {showAdvancedConfig && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Duração (Minutos):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-emerald-400 font-bold text-sm w-12 text-right">{targetDuration}m</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Tipo de Cronômetro:</label>
                <select
                  value={timerMode}
                  onChange={(e) => setTimerMode(e.target.value as StudyTimerMode)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="pomodoro">Pomodoro (Foco + Pausa)</option>
                  <option value="countdown">Contagem Regressiva</option>
                  <option value="stopwatch">Cronômetro Livre (Crescente)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Qtd. Questões:</label>
                <select
                  value={questionsCount}
                  onChange={(e) => setQuestionsCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={2}>2 Questões Rápidas</option>
                  <option value={3}>3 Questões (Sprint)</option>
                  <option value={4}>4 Questões (Equilibrado)</option>
                  <option value={6}>6 Questões (Aprofundado)</option>
                  <option value={8}>8 Questões (Simulado Intenso)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Qtd. Flashcards:</label>
                <select
                  value={flashcardsCount}
                  onChange={(e) => setFlashcardsCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={2}>2 Flashcards Chave</option>
                  <option value={4}>4 Flashcards com Mnemônica</option>
                  <option value={6}>6 Flashcards Ilustrados</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
          <button
            id="start-study-now-btn"
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>IA Estruturando Sua Sessão...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>Montar e Iniciar Sessão com IA</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
