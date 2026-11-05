import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Layers, 
  BookOpen, 
  Brain, 
  ChevronRight,
  Coffee,
  X,
  Zap,
  Save
} from "lucide-react";
import { StudyNowSession, StudySessionStage } from "../../types";
import { studyAudio } from "../../utils/studyAudio";

interface StudyNowActiveBarProps {
  session: StudyNowSession;
  onTogglePause: () => void;
  onAddExtraTime: (minutes: number) => void;
  onChangeStage: (stage: StudySessionStage) => void;
  onFinishSession: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  lastSavedText?: string;
  onLogPauseReason?: (reason: string) => void;
}

export const StudyNowActiveBar: React.FC<StudyNowActiveBarProps> = ({
  session,
  onTogglePause,
  onAddExtraTime,
  onChangeStage,
  onFinishSession,
  isZenMode,
  onToggleZenMode,
  lastSavedText = "Salvo",
  onLogPauseReason,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);
  const [pauseReasonInput, setPauseReasonInput] = useState<string>("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    studyAudio.setSoundEnabled(next);
  };

  const handlePauseClick = () => {
    if (!session.isPaused) {
      studyAudio.playBreakChime();
      setShowPauseModal(true);
    } else {
      studyAudio.playStartChime();
      setShowPauseModal(false);
    }
    onTogglePause();
  };

  const handleSavePauseReason = () => {
    if (pauseReasonInput.trim() && onLogPauseReason) {
      onLogPauseReason(pauseReasonInput.trim());
      setPauseReasonInput("");
    }
    setShowPauseModal(false);
  };

  // Stage progress calculations
  const totalReviews = session.reviews.length;
  const completedReviews = session.reviews.filter((r) => r.completed).length;

  const totalQuestions = session.questions.length;
  const answeredQuestions = session.questions.filter((q) => typeof q.userSelectedIndex === "number").length;

  const totalCards = session.flashcards.length;
  const reviewedCards = session.activeFlashcardIdx !== undefined ? Math.min(session.activeFlashcardIdx, totalCards) : 0;

  // Stages configuration
  const stages: { id: StudySessionStage; label: string; icon: any; countText: string; activeColor: string }[] = [
    {
      id: "warmup_reviews",
      label: "1. Aquecimento",
      icon: Clock,
      countText: `${completedReviews}/${totalReviews}`,
      activeColor: "border-amber-500 text-amber-300 bg-amber-500/10",
    },
    {
      id: "questions",
      label: "2. Questões Práticas",
      icon: BookOpen,
      countText: `${answeredQuestions}/${totalQuestions}`,
      activeColor: "border-emerald-500 text-emerald-300 bg-emerald-500/10",
    },
    {
      id: "flashcards",
      label: "3. Flashcards",
      icon: Layers,
      countText: `${reviewedCards}/${totalCards}`,
      activeColor: "border-purple-500 text-purple-300 bg-purple-500/10",
    },
    {
      id: "summary",
      label: "4. Síntese",
      icon: CheckCircle2,
      countText: "Fim",
      activeColor: "border-teal-500 text-teal-300 bg-teal-500/10",
    },
  ];

  const remainingSeconds = session.remainingSeconds ?? 0;
  const isTimeExpiring = remainingSeconds <= 60 && remainingSeconds > 0 && session.timerMode !== "stopwatch";

  return (
    <>
      <div className="sticky top-16 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg px-4 sm:px-6 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Timer Display & Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            {/* Timer Badge */}
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-base sm:text-lg transition-all shadow-inner ${
              session.isPaused
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300 animate-pulse"
                : isTimeExpiring
                ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-bounce"
                : session.isPomodoroBreak
                ? "bg-sky-500/15 border-sky-500/50 text-sky-300"
                : "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
            }`}>
              <Clock className="w-4 h-4" />
              <span>
                {session.timerMode === "stopwatch"
                  ? formatTime(session.elapsedSeconds)
                  : formatTime(remainingSeconds)}
              </span>
              <span className="text-[10px] uppercase font-sans font-semibold tracking-wider opacity-75">
                {session.isPaused ? "Pausado" : session.isPomodoroBreak ? "Pausa" : "Foco"}
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              id="study-session-pause-btn"
              type="button"
              onClick={handlePauseClick}
              title={session.isPaused ? "Retomar sessão" : "Pausar sessão"}
              className={`p-2 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-md ${
                session.isPaused
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {session.isPaused ? <Play className="w-4 h-4 fill-slate-950" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* +5 Min Button */}
            {session.timerMode !== "stopwatch" && (
              <button
                type="button"
                onClick={() => onAddExtraTime(5)}
                title="Adicionar +5 minutos ao cronômetro"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+5m</span>
              </button>
            )}

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              title={soundEnabled ? "Silenciar sinos e alertas sonoros" : "Ativar sinos sonoros"}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Zen Mode Toggle */}
            <button
              type="button"
              onClick={onToggleZenMode}
              title={isZenMode ? "Sair do Modo Foco Total (Zen)" : "Entrar no Modo Foco Total (Zen)"}
              className={`p-2 rounded-lg transition cursor-pointer ${
                isZenMode 
                  ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Auto-save status badge */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-medium ml-1">
              <Save className="w-3 h-3 text-emerald-400" />
              <span>{lastSavedText}</span>
            </div>
          </div>

          {/* Center/Right: Stage Progression Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none w-full md:w-auto justify-start md:justify-end py-1">
            {stages.map((st) => {
              const Icon = st.icon;
              const isActive = session.currentStage === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChangeStage(st.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? st.activeColor
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/70 border border-slate-700/50">
                    {st.countText}
                  </span>
                </button>
              );
            })}

            {/* End Session Button */}
            {session.currentStage !== "summary" && (
              <button
                type="button"
                onClick={onFinishSession}
                className="ml-2 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Concluir</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mind-Wandering & Pause Guidance Modal (Shown when student pauses) */}
      {showPauseModal && session.isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
                <Coffee className="w-5 h-5" />
                <span>Sessão em Pausa</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                🧠 <strong>Dica de Recuperação Cognitiva:</strong> Afaste os olhos da tela por 60 segundos, beba um copo de água ou faça 3 respirações lentas para renovar o neurotransmissor dopamina.
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Descarregue pensamentos paralelos ou distrações (Mind-dump):
                </label>
                <input
                  type="text"
                  value={pauseReasonInput}
                  onChange={(e) => setPauseReasonInput(e.target.value)}
                  placeholder="Ex: Lembrar de responder email às 18h..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSavePauseReason}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Salvar Nota
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPauseModal(false);
                  onTogglePause();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Retomar Foco Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
