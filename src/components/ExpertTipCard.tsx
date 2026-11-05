import React, { useState, useEffect } from "react";
import { 
  Lightbulb, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Star, 
  RefreshCw, 
  Calendar, 
  ArrowRight, 
  Bookmark, 
  Brain, 
  Compass, 
  Zap, 
  X, 
  Tag, 
  GraduationCap,
  Layers,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { UserProfile } from "../types";
import { 
  ExpertTip, 
  EXPERT_TIPS_DATABASE, 
  getDailyExpertTip, 
  getTodayDateKey, 
  getSavedExpertTipIds, 
  toggleSaveExpertTipId,
  getRankedTipsForProfile
} from "../utils/expertTips";

interface ExpertTipCardProps {
  profile: UserProfile;
  onStartStudySession?: () => void;
  className?: string;
}

export const ExpertTipCard: React.FC<ExpertTipCardProps> = ({
  profile,
  onStartStudySession,
  className = "",
}) => {
  const [tipOffset, setTipOffset] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);

  const dateKey = getTodayDateKey();
  const { tip, totalTips, currentIndex, isDailyDefault, dateFormatted } = getDailyExpertTip(profile, dateKey, tipOffset);

  // Sync saved state
  useEffect(() => {
    const saved = getSavedExpertTipIds();
    setSavedTipIds(saved);
    setIsSaved(saved.includes(tip.id));
  }, [tip.id]);

  // Clean up speech synthesis if unmounting
  useEffect(() => {
    return () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Speech Synthesis (Audio Readout)
  const handleToggleAudio = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `Dica de Especialista: ${tip.title}. Categoria: ${tip.categoryLabel}. ${tip.quoteOrInsight}. Como aplicar na prática: ${tip.actionableStep}. Fonte: ${tip.authorOrSource}.`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Copy to Clipboard
  const handleCopyTip = async () => {
    const textToCopy = `💡 Dica de Especialista (${tip.title})\n🎯 Categoria: ${tip.categoryLabel}\n\n"${tip.quoteOrInsight}"\n— ${tip.authorOrSource}\n\n⚡ Como Aplicar na Prática:\n${tip.actionableStep}${tip.practicalExample ? `\n\n📌 Exemplo: ${tip.practicalExample}` : ""}\n\n${tip.tags.join(" ")}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Falha ao copiar:", e);
    }
  };

  // Toggle Save / Bookmark
  const handleToggleSave = () => {
    const nowSaved = toggleSaveExpertTipId(tip.id);
    setIsSaved(nowSaved);
    setSavedTipIds(getSavedExpertTipIds());
  };

  // Select tip from catalog
  const handleSelectTipFromCatalog = (selectedTip: ExpertTip) => {
    const ranked = getRankedTipsForProfile(profile);
    const foundIndex = ranked.findIndex((t) => t.id === selectedTip.id);
    if (foundIndex !== -1) {
      const dateKeySeed = getDailyExpertTip(profile, dateKey, 0).currentIndex;
      const newOffset = foundIndex - dateKeySeed;
      setTipOffset(newOffset);
    }
    setShowCatalogModal(false);
  };

  // Category badge colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "active_recall":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "spaced_repetition":
        return "bg-blue-500/15 border-blue-500/30 text-blue-400";
      case "feynman":
        return "bg-amber-500/15 border-amber-500/30 text-amber-400";
      case "mnemonics":
        return "bg-purple-500/15 border-purple-500/30 text-purple-400";
      case "focus_pomodoro":
        return "bg-teal-500/15 border-teal-500/30 text-teal-400";
      case "neuroscience":
        return "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";
      case "mindset":
        return "bg-rose-500/15 border-rose-500/30 text-rose-400";
      case "interleaving":
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-400";
      default:
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    }
  };

  const allCategories = [
    { key: "all", label: "Todas as Técnicas" },
    { key: "active_recall", label: "Recuperação Ativa" },
    { key: "spaced_repetition", label: "Repetição Espaçada" },
    { key: "feynman", label: "Técnica de Feynman" },
    { key: "mnemonics", label: "Mnemônica & Imagens" },
    { key: "focus_pomodoro", label: "Foco & Pomodoro" },
    { key: "neuroscience", label: "Neurociência do Sono" },
    { key: "mindset", label: "Mindset & Resiliência" },
    { key: "interleaving", label: "Prática Intercalada" },
  ];

  const filteredCatalogTips = selectedCategoryFilter === "all"
    ? EXPERT_TIPS_DATABASE
    : EXPERT_TIPS_DATABASE.filter((t) => t.category === selectedCategoryFilter);

  return (
    <div
      id="expert-tip-card-container"
      className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          {/* Main Title Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Lightbulb className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
            <span>{isDailyDefault ? "Dica de Especialista do Dia" : "Técnica em Destaque"}</span>
          </div>

          {/* Date Stamp */}
          <div className="flex items-center space-x-1 text-xs text-slate-400 font-medium px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{dateFormatted}</span>
            <span className="text-[10px] text-slate-500 ml-1 font-mono">(Atualiza diariamente)</span>
          </div>

          {/* User Methodology Calibration Chip */}
          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-emerald-400 font-medium px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 max-w-xs truncate">
            <Brain className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">
              Calibrada para: {profile.learningMethod ? profile.learningMethod.slice(0, 28) + (profile.learningMethod.length > 28 ? "..." : "") : profile.currentLevel}
            </span>
          </div>
        </div>

        {/* Quick Toolbar (Audio, Copy, Bookmark, Catalog, Next Tip) */}
        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          {/* Audio TTS button */}
          <button
            id="expert-tip-audio-btn"
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? "Pausar leitura de voz" : "Ouvir dica em áudio"}
            className={`p-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              isPlayingAudio
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 animate-pulse"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden xs:inline">Ouvindo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] hidden xs:inline">Ouvir</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            id="expert-tip-copy-btn"
            type="button"
            onClick={handleCopyTip}
            title="Copiar dica"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </>
            )}
          </button>

          {/* Save / Favorite Button */}
          <button
            id="expert-tip-favorite-btn"
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? "Remover dos favoritos" : "Salvar dica nos favoritos"}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              isSaved
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>

          {/* Explore Catalog Modal Button */}
          <button
            id="expert-tip-catalog-btn"
            type="button"
            onClick={() => setShowCatalogModal(true)}
            title="Ver catálogo completo de técnicas"
            className="px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] hidden sm:inline">Acervo</span>
          </button>

          {/* Cycle Next Tip Button */}
          <button
            id="expert-tip-next-btn"
            type="button"
            onClick={() => setTipOffset((prev) => prev + 1)}
            title="Ver outra dica calibrada"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 pt-4 space-y-4">
        
        {/* Category & Title & Reset pill if navigated */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(tip.category)}`}>
              {tip.categoryLabel}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/40">
              {tip.techniqueName}
            </span>
          </div>

          {!isDailyDefault && (
            <button
              type="button"
              onClick={() => setTipOffset(0)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Voltar para dica de hoje</span>
            </button>
          )}
        </div>

        {/* Big Quote / Core Insight */}
        <div className="bg-slate-950/60 border-l-4 border-l-amber-400 border-y border-r border-slate-800/80 rounded-r-2xl p-4 sm:p-4.5 space-y-2">
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{tip.title}</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic font-serif">
            "{tip.quoteOrInsight}"
          </p>

          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-1">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Fonte / Especialista: <strong className="text-slate-300 font-semibold">{tip.authorOrSource}</strong></span>
          </div>
        </div>

        {/* Actionable Practice Step (Como aplicar hoje) */}
        <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Zap className="w-4 h-4 fill-emerald-400/20 text-emerald-400" />
            <span>⚡ Como Aplicar na Prática Hoje:</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {tip.actionableStep}
          </p>

          {tip.practicalExample && (
            <div className="pt-2 border-t border-emerald-500/15 text-[11px] text-emerald-300/90 flex items-start gap-1.5">
              <span className="font-bold text-emerald-400 shrink-0">📌 Exemplo:</span>
              <span>{tip.practicalExample}</span>
            </div>
          )}
        </div>

        {/* Footer: Tags & Session Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            {tip.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/50"
              >
                {tag}
              </span>
            ))}
          </div>

          {onStartStudySession && (
            <button
              id="expert-tip-apply-study-btn"
              type="button"
              onClick={onStartStudySession}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer self-end sm:self-auto group"
            >
              <span>Aplicar esta técnica na sessão</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

      </div>

      {/* MODAL / CATALOG OF ALL TECHNIQUES */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Acervo de Técnicas & Dicas Científicas</h3>
                  <p className="text-xs text-slate-400">Metodologias baseadas em neurociência cognitiva e evidências</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-5 py-3 border-b border-slate-800 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
              {allCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategoryFilter === cat.key
                      ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {filteredCatalogTips.map((catalogTip) => {
                const isCurrent = catalogTip.id === tip.id;
                const isFavorite = savedTipIds.includes(catalogTip.id);

                return (
                  <div
                    key={catalogTip.id}
                    onClick={() => handleSelectTipFromCatalog(catalogTip)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isCurrent
                        ? "bg-slate-800 border-amber-500/50 shadow-lg ring-1 ring-amber-500/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(catalogTip.category)}`}>
                          {catalogTip.categoryLabel}
                        </span>
                        <span className="text-xs font-bold text-white">{catalogTip.title}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 italic mb-2">
                      "{catalogTip.quoteOrInsight}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Fonte: {catalogTip.authorOrSource}</span>
                      <span className="text-emerald-400 font-semibold">{catalogTip.techniqueName}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
              <span>Total de {filteredCatalogTips.length} técnicas científicas no acervo</span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
