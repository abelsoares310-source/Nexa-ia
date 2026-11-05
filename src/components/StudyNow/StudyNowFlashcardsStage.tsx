import React, { useState } from "react";
import { 
  Layers, 
  RotateCw, 
  Sparkles, 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Flame, 
  Lightbulb,
  Image as ImageIcon,
  ZoomIn
} from "lucide-react";
import { StudyNowSession, FlashcardItem } from "../../types";
import { studyAudio } from "../../utils/studyAudio";

interface StudyNowFlashcardsStageProps {
  session: StudyNowSession;
  onRateFlashcard: (cardId: string, rating: "hard" | "good" | "easy") => void;
  onNextStage: () => void;
}

export const StudyNowFlashcardsStage: React.FC<StudyNowFlashcardsStageProps> = ({
  session,
  onRateFlashcard,
  onNextStage,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(session.activeFlashcardIdx || 0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showBlindTest, setShowBlindTest] = useState<boolean>(false);
  const [showMnemonicModal, setShowMnemonicModal] = useState<boolean>(false);

  const flashcards = session.flashcards;
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-6">
        <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Nenhum Flashcard nesta Sessão</h3>
        <p className="text-sm text-slate-400 mb-6">
          Você pode avançar diretamente para a síntese final e salvamento do diário.
        </p>
        <button
          type="button"
          onClick={onNextStage}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Ir para Síntese Final</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentCard = flashcards[activeIdx] || flashcards[0];
  const visualMnemonic = currentCard.visualMnemonic;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: "hard" | "good" | "easy") => {
    onRateFlashcard(currentCard.id, rating);
    if (rating === "good" || rating === "easy") {
      studyAudio.playCorrectPing();
    }

    setIsFlipped(false);
    setShowBlindTest(false);

    if (activeIdx < flashcards.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const isLastCard = activeIdx === flashcards.length - 1;

  return (
    <div className="max-w-3xl mx-auto my-4 space-y-6">
      {/* Stage Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-purple-400">
                Etapa 3 de 4 • Fixação de Longo Prazo
              </span>
              <h3 className="text-lg font-bold text-white">
                Flashcards com Apoio Visual & Mnemônica
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Card:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
              {activeIdx + 1} de {flashcards.length}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          🧠 <strong>Codificação Dupla (Paivio):</strong> Conectar a linguagem verbal à âncora visual ativa o córtex visual e temporal simultaneamente, acelerando a consolidação das memórias.
        </p>
      </div>

      {/* Flashcard Interactive View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-100 relative min-h-[380px] flex flex-col justify-between">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
            {currentCard.tag} • {currentCard.topic}
          </span>

          <div className="flex items-center gap-2">
            {visualMnemonic && (
              <span className="flex items-center gap-1 text-[11px] text-purple-400 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                <ImageIcon className="w-3.5 h-3.5" />
                Mnemônica IA
              </span>
            )}
            <span className="text-xs text-slate-400 font-semibold">
              {isFlipped ? "Verso (Resposta)" : "Frente (Pergunta)"}
            </span>
          </div>
        </div>

        {/* Card Body (Clickable to Flip) */}
        <div 
          onClick={handleFlip}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer rounded-xl hover:bg-slate-850/60 transition-all border border-dashed border-slate-800 hover:border-purple-500/40 my-2 group"
        >
          {!isFlipped ? (
            /* Front Face */
            <div className="space-y-4 max-w-xl">
              <span className="inline-block p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentCard.front}
              </h3>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Clique para virar o card e conferir</span>
              </p>
            </div>
          ) : (
            /* Back Face */
            <div className="space-y-5 max-w-xl w-full text-left animate-fadeIn">
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4">
                <h4 className="text-xs uppercase font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Conceito Consolidado:</span>
                </h4>
                <p className="text-sm text-slate-100 font-medium leading-relaxed">
                  {currentCard.back}
                </p>
              </div>

              {/* Visual Mnemonic Preview on Back */}
              {visualMnemonic && (
                <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3.5 flex items-center gap-4">
                  {visualMnemonic.imageUrl && (
                    <div className="w-16 h-16 rounded-lg bg-slate-900 border border-purple-500/30 shrink-0 overflow-hidden flex items-center justify-center p-1">
                      <img
                        src={visualMnemonic.imageUrl}
                        alt="Mnemônica"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="font-bold text-purple-300 block">
                      {visualMnemonic.metaphorTitle || "Âncora Mnemônica"}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                      {visualMnemonic.mnemonicAnchor}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leitner Box Rating Buttons (Visible when flipped) */}
        {isFlipped && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-fadeIn">
            <p className="text-xs text-center text-slate-400 font-semibold mb-3">
              Qual foi a facilidade de resgate da resposta?
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleRate("hard")}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🔴</span>
                <span>Difícil</span>
                <span className="text-[10px] text-slate-400 font-normal">Revisar logo</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate("good")}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🟡</span>
                <span>Bom</span>
                <span className="text-[10px] text-slate-400 font-normal">+1 a 3 dias</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate("easy")}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🟢</span>
                <span>Fácil!</span>
                <span className="text-[10px] text-slate-400 font-normal">+4 a 7 dias</span>
              </button>
            </div>
          </div>
        )}

        {/* Carousel & Navigation Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={activeIdx === 0}
              onClick={() => {
                setActiveIdx(activeIdx - 1);
                setIsFlipped(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Card Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5">
              {flashcards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveIdx(i);
                    setIsFlipped(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    i === activeIdx
                      ? "bg-purple-400 scale-125 ring-2 ring-purple-400/40"
                      : "bg-slate-700"
                  }`}
                  title={`Card ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={isLastCard}
              onClick={() => {
                setActiveIdx(activeIdx + 1);
                setIsFlipped(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Próximo Card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNextStage}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer"
          >
            <span>Concluir Sessão & Ver Síntese</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
