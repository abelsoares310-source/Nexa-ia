import React, { useState } from "react";
import { 
  X, 
  Maximize2, 
  Sparkles, 
  Brain, 
  Lightbulb, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react";

interface VisualMnemonicLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    imageUrl: string;
    title: string;
    anchor: string;
    elements?: string[];
    explanation?: string;
  } | null;
}

export const VisualMnemonicLightboxModal: React.FC<VisualMnemonicLightboxModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maskLabels, setMaskLabels] = useState<boolean>(false);

  if (!isOpen || !data) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Associação Visual Mnemônica IA</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {data.title || "Apoio Visual do Conceito"}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMaskLabels(!maskLabels)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                maskLabels
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Modo Teste Cego: Ocultar textos para testar sua memória visual"
            >
              {maskLabels ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{maskLabels ? "Textos Ocultos" : "Ocultar Textos (Teste)"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Stage with Zoom Controls */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[460px]">
          <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
            <img
              src={data.imageUrl}
              alt={data.title}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
              className="max-w-full max-h-[380px] object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 flex items-center space-x-1 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1 font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs"
              title="Redefinir Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mnemonic Details Footer */}
        {!maskLabels && (
          <div className="space-y-3 pt-1">
            {/* Anchor */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1">
              <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Gatilho Mnemônico de Memorização:</span>
              </div>
              <p className="text-sm font-semibold text-emerald-300">
                "{data.anchor}"
              </p>
            </div>

            {/* Visual Elements Pills */}
            {data.elements && data.elements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.elements.map((elem, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{elem}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
