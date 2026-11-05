import React, { useState } from "react";
import { 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Flame,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { StudyNowSession, StudySessionReviewItem } from "../../types";
import { studyAudio } from "../../utils/studyAudio";

interface StudyNowReviewsStageProps {
  session: StudyNowSession;
  onUpdateReview: (reviewId: string, rating: "remembered" | "partial" | "forgot") => void;
  onNextStage: () => void;
}

export const StudyNowReviewsStage: React.FC<StudyNowReviewsStageProps> = ({
  session,
  onUpdateReview,
  onNextStage,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});

  const reviews = session.reviews;
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-6">
        <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Nenhuma Revisão Prévia para este Tópico</h3>
        <p className="text-sm text-slate-400 mb-6">
          Você pode avançar diretamente para a etapa de questões práticas aplicadas.
        </p>
        <button
          type="button"
          onClick={onNextStage}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Ir para Questões Práticas</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentReview = reviews[activeIdx] || reviews[0];
  const isRevealed = !!revealedMap[currentReview.id];
  const allCompleted = reviews.every((r) => r.completed);

  const toggleReveal = () => {
    setRevealedMap((prev) => ({
      ...prev,
      [currentReview.id]: !prev[currentReview.id],
    }));
  };

  const handleRate = (rating: "remembered" | "partial" | "forgot") => {
    onUpdateReview(currentReview.id, rating);
    if (rating === "remembered") {
      studyAudio.playCorrectPing();
    }
    
    // Auto advance to next review if available
    if (activeIdx < reviews.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-4 space-y-6">
      {/* Stage Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                Etapa 1 de 4 • Priming Neural
              </span>
              <h3 className="text-lg font-bold text-white">
                Revisão Ativa de Aquecimento
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Progresso:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {activeIdx + 1} de {reviews.length}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          🧠 <strong>Efeito Priming:</strong> Tentar resgatar o conceito da memória <em>antes</em> de ver a resposta ativa circuitos neurais, multiplicando a taxa de absorção nas questões a seguir.
        </p>
      </div>

      {/* Review Item Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-100 relative overflow-hidden">
        {/* Topic Tag */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
            {currentReview.subject} • {currentReview.topic}
          </span>
          {currentReview.mnemonicTrigger && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Lightbulb className="w-3.5 h-3.5" />
              Gatilho: {currentReview.mnemonicTrigger}
            </span>
          )}
        </div>

        {/* Prompt Question */}
        <div className="my-4">
          <h4 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {currentReview.questionOrPrompt}
          </h4>
        </div>

        {/* Reveal / Answer Section */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          {!isRevealed ? (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400 mb-4">
                Pense por 5 a 10 segundos na resposta antes de conferir.
              </p>
              <button
                type="button"
                onClick={toggleReveal}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition shadow cursor-pointer"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Revelar Síntese para Conferir</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Síntese Conceitual Chave:</span>
                </div>
                <p>{currentReview.answerSummary}</p>
              </div>

              {/* Self-Rating Buttons */}
              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3 text-center font-medium">
                  Como foi sua lembrança deste conceito?
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRate("forgot")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      currentReview.userRating === "forgot"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                        : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                    }`}
                  >
                    <span>🔴 Não Lembrei</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate("partial")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      currentReview.userRating === "partial"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500"
                        : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                    }`}
                  >
                    <span>🟡 Parcialmente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate("remembered")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      currentReview.userRating === "remembered"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                    }`}
                  >
                    <span>🟢 Lembrei Bem!</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                  i === activeIdx
                    ? "bg-amber-400 scale-125 ring-2 ring-amber-400/40"
                    : r.completed
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                }`}
                title={`Revisão ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNextStage}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer"
          >
            <span>{allCompleted ? "Avançar para Questões Práticas" : "Pular para Questões"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
