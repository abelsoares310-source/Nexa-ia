import React, { useState } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  Maximize2, 
  Brain, 
  Lightbulb, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Zap,
  Info
} from "lucide-react";
import { FlashcardItem, VisualMnemonicData } from "../types";

interface VisualMnemonicCardProps {
  card: FlashcardItem;
  onGenerateVisual: (cardId: string, customPrompt?: string) => Promise<void>;
  isGenerating?: boolean;
  isFlipped?: boolean;
  onOpenLightbox?: (data: { imageUrl: string; title: string; anchor: string; elements?: string[] }) => void;
  onRemoveVisual?: (cardId: string) => void;
}

export const VisualMnemonicCard: React.FC<VisualMnemonicCardProps> = ({
  card,
  onGenerateVisual,
  isGenerating = false,
  isFlipped = false,
  onOpenLightbox,
  onRemoveVisual,
}) => {
  const [showCustomPromptModal, setShowCustomPromptModal] = useState<boolean>(false);
  const [customPromptText, setCustomPromptText] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showFrontHint, setShowFrontHint] = useState<boolean>(false);

  const visual = card.visualMnemonic;

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await onGenerateVisual(card.id, customPromptText.trim() || undefined);
    setShowCustomPromptModal(false);
    setCustomPromptText("");
  };

  // If card is on Front Side (unflipped)
  if (!isFlipped) {
    if (!visual || !visual.imageUrl) {
      return (
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Brain className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px]">Sem apoio visual gerado ainda</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateVisual(card.id);
            }}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-[11px] flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Gerando Imagem...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Gerar Imagem IA</span>
              </>
            )}
          </button>
        </div>
      );
    }

    // Has visual - show subtle hint trigger for active recall
    return (
      <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs">
          <div className="flex items-center space-x-2 text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-[11px]">Apoio Visual Mnemônico Disponível</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFrontHint(!showFrontHint);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold flex items-center space-x-1 transition border border-purple-500/30"
          >
            {showFrontHint ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showFrontHint ? "Ocultar Pista" : "Ver Pista Visual"}</span>
          </button>
        </div>

        {showFrontHint && (
          <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 space-y-2 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <img
                  src={visual.imageUrl}
                  alt={visual.metaphorTitle || "Pista Visual"}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover border border-purple-500/30 cursor-pointer hover:opacity-90 shrink-0"
                  onClick={() =>
                    onOpenLightbox &&
                    onOpenLightbox({
                      imageUrl: visual.imageUrl!,
                      title: visual.metaphorTitle || "Apoio Visual Mnemônico",
                      anchor: visual.mnemonicAnchor || "",
                      elements: visual.visualElements,
                    })
                  }
                />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    Gatilho de Memória:
                  </span>
                  <p className="text-xs font-bold text-slate-100">{visual.metaphorTitle}</p>
                  <p className="text-[11px] text-purple-200 italic line-clamp-1">"{visual.mnemonicAnchor}"</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenLightbox &&
                  onOpenLightbox({
                    imageUrl: visual.imageUrl!,
                    title: visual.metaphorTitle || "Apoio Visual Mnemônico",
                    anchor: visual.mnemonicAnchor || "",
                    elements: visual.visualElements,
                  })
                }
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                title="Ampliar Imagem"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Back Side (Answer / Flipped) ---
  if (!visual || !visual.imageUrl) {
    return (
      <div
        className="w-full p-4 rounded-xl bg-slate-900/90 border border-dashed border-purple-500/30 text-center space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center space-x-2 text-purple-400">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Potencialize a Memorização</span>
        </div>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Conceitos abstratos são esquecidos 3x mais rápido sem âncoras visuais. A IA pode gerar uma metáfora ilustrada para fixação permanente.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Criando Associação Visual com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Imagem & Mnemônica com IA</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCustomPromptModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Personalizar Estilo</span>
          </button>
        </div>

        {showCustomPromptModal && (
          <div className="pt-3 border-t border-slate-800 text-left space-y-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Instruções personalizadas para a Imagem (opcional):
            </label>
            <input
              type="text"
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              placeholder="Ex: Focar na fórmula matemática, criar metáfora de quadrinhos, esquema de fluxo..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomPromptModal(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-lg"
              >
                Gerar com Instruções
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Visual is available on Back Side
  return (
    <div
      className="w-full rounded-xl bg-slate-950 border border-purple-500/40 p-4 space-y-3.5 text-left shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Title & Action Controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
              Apoio Visual IA
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {card.tag || "Conceito"}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1 flex items-center">
            {visual.metaphorTitle || "Âncora Mnemônica"}
          </h4>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onOpenLightbox &&
              onOpenLightbox({
                imageUrl: visual.imageUrl!,
                title: visual.metaphorTitle || "Apoio Visual Mnemônico",
                anchor: visual.mnemonicAnchor || "",
                elements: visual.visualElements,
              })
            }
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Expandir Imagem"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowCustomPromptModal(!showCustomPromptModal)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 border border-slate-700 transition"
            title="Regenerar com prompt personalizado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          </button>

          {onRemoveVisual && (
            <button
              type="button"
              onClick={() => onRemoveVisual(card.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
              title="Remover Apoio Visual"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom prompt input overlay if toggled */}
      {showCustomPromptModal && (
        <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/40 space-y-2">
          <label className="block text-[11px] font-semibold text-slate-300">
            Regenerar apoio visual com novas instruções:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              placeholder="Ex: Fazer analogia mais simples, focar na anatomia..."
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-lg shrink-0 flex items-center space-x-1"
            >
              {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Regenerar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Visual Image & Anchors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* Visual Graphic Thumbnail */}
        <div className="sm:col-span-5 relative group overflow-hidden rounded-xl border border-purple-500/30 bg-slate-900 shadow-inner">
          <img
            src={visual.imageUrl}
            alt={visual.metaphorTitle || "Apoio Visual"}
            referrerPolicy="no-referrer"
            className="w-full h-40 sm:h-44 object-cover object-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
            onClick={() =>
              onOpenLightbox &&
              onOpenLightbox({
                imageUrl: visual.imageUrl!,
                title: visual.metaphorTitle || "Apoio Visual Mnemônico",
                anchor: visual.mnemonicAnchor || "",
                elements: visual.visualElements,
              })
            }
          />
          <div 
            onClick={() =>
              onOpenLightbox &&
              onOpenLightbox({
                imageUrl: visual.imageUrl!,
                title: visual.metaphorTitle || "Apoio Visual Mnemônico",
                anchor: visual.mnemonicAnchor || "",
                elements: visual.visualElements,
              })
            }
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-semibold flex items-center space-x-1 shadow">
              <Maximize2 className="w-3 h-3" />
              <span>Clique para Ampliar</span>
            </span>
          </div>
        </div>

        {/* Mnemonic Details & Anchors */}
        <div className="sm:col-span-7 space-y-2.5">
          {/* Mnemonic Anchor Box */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1">
            <div className="flex items-center space-x-1.5 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Âncora Mental de Resgate Rápido:</span>
            </div>
            <p className="text-xs font-semibold text-emerald-300 leading-snug">
              "{visual.mnemonicAnchor || visual.metaphorTitle}"
            </p>
          </div>

          {/* Key Visual Elements Pills */}
          {visual.visualElements && visual.visualElements.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Elementos Visuais para Lembrar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visual.visualElements.map((elem, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] flex items-center space-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span className="truncate">{elem}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Neuro explanation toggle */}
          {visual.visualExplanation && (
            <div>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 transition"
              >
                <Brain className="w-3 h-3" />
                <span>{showExplanation ? "Ocultar fundamentação neurocientífica" : "Por que esta imagem fixa na memória?"}</span>
                {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showExplanation && (
                <div className="mt-1.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed animate-fadeIn">
                  <p>{visual.visualExplanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
