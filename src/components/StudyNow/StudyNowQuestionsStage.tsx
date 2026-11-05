import React, { useState } from "react";
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Lightbulb, 
  Flame, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  Brain,
  Layers,
  Award
} from "lucide-react";
import { StudyNowSession, StudySessionQuestionItem } from "../../types";
import { studyAudio } from "../../utils/studyAudio";

interface StudyNowQuestionsStageProps {
  session: StudyNowSession;
  onAnswerQuestion: (questionId: number | string, selectedIndex: number) => void;
  onNextStage: () => void;
}

export const StudyNowQuestionsStage: React.FC<StudyNowQuestionsStageProps> = ({
  session,
  onAnswerQuestion,
  onNextStage,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(session.activeQuestionIdx || 0);
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({});
  const [showExplanationMap, setShowExplanationMap] = useState<Record<string, boolean>>({});

  const questions = session.questions;
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-6">
        <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Nenhuma Questão Configurada</h3>
        <p className="text-sm text-slate-400 mb-6">
          Você pode avançar diretamente para a fixação com flashcards mnemônicos.
        </p>
        <button
          type="button"
          onClick={onNextStage}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Ir para Flashcards</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentQ = questions[activeIdx] || questions[0];
  const qIdKey = String(currentQ.id);
  const isAnswered = typeof currentQ.userSelectedIndex === "number";
  const isCorrect = currentQ.isCorrect;
  const isHintOpen = !!showHintMap[qIdKey];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return; // already answered
    onAnswerQuestion(currentQ.id, index);

    if (index === currentQ.correctIndex) {
      studyAudio.playCorrectPing();
    }
  };

  const toggleHint = () => {
    setShowHintMap((prev) => ({ ...prev, [qIdKey]: !prev[qIdKey] }));
  };

  const answeredCount = questions.filter((q) => typeof q.userSelectedIndex === "number").length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="max-w-3xl mx-auto my-4 space-y-6">
      {/* Stage Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                Etapa 2 de 4 • Prática Ativa Deliberada
              </span>
              <h3 className="text-lg font-bold text-white">
                Resolução de Questões Contextualizadas
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">
              Acertos: <strong className="text-emerald-400">{correctCount}</strong>/{answeredCount}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
              Questão {activeIdx + 1} de {questions.length}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          🎯 <strong>Recuperação Ativa & Feedback Imediato:</strong> Teste seu raciocínio. Se travar, use a <strong>Dica Socrática</strong> para construir a resposta por si mesmo antes de verificar a resolução completa.
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-100 relative overflow-hidden">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
              {currentQ.subject} {currentQ.topic ? `• ${currentQ.topic}` : ""}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              currentQ.difficulty === "Fácil"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : currentQ.difficulty === "Difícil"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}>
              {currentQ.difficulty || "Médio"}
            </span>
          </div>

          {/* Socratic Hint Button */}
          {currentQ.socraticHint && !isAnswered && (
            <button
              type="button"
              onClick={toggleHint}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{isHintOpen ? "Ocultar Dica" : "Pedir Dica Socrática"}</span>
            </button>
          )}
        </div>

        {/* Socratic Hint Banner */}
        {isHintOpen && currentQ.socraticHint && !isAnswered && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-bold mb-0.5">Dica do Tutor IA:</strong>
              <p>{currentQ.socraticHint}</p>
            </div>
          </div>
        )}

        {/* Question Statement */}
        <div className="my-4">
          <h4 className="text-base sm:text-lg font-medium text-white leading-relaxed">
            {currentQ.question}
          </h4>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 mt-6">
          {currentQ.options.map((optionText, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx); // 'A', 'B', 'C', 'D'
            const isSelected = currentQ.userSelectedIndex === optIdx;
            const isThisCorrect = currentQ.correctIndex === optIdx;

            let optionStyle = "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200";

            if (isAnswered) {
              if (isThisCorrect) {
                optionStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500";
              } else if (isSelected && !isThisCorrect) {
                optionStyle = "bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-500";
              } else {
                optionStyle = "bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${optionStyle}`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isAnswered && isThisCorrect
                    ? "bg-emerald-500 text-slate-950"
                    : isAnswered && isSelected && !isThisCorrect
                    ? "bg-rose-500 text-white"
                    : isSelected
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  {letter}
                </span>
                <span className="text-xs sm:text-sm pt-0.5 leading-snug">{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation & Resolution Card (Visible when answered) */}
        {isAnswered && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-xl border ${
              isCorrect
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/30 border-rose-500/40 text-rose-200"
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400">Resposta Correta! (+10 pts)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400">
                      Gabarito Correto: Letra {String.fromCharCode(65 + currentQ.correctIndex)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>

            {/* Detailed Explanation Breakdown */}
            {currentQ.detailedExplanation && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>Passo a Passo Cognitivo:</span>
                </div>

                {currentQ.detailedExplanation.stepByStep && currentQ.detailedExplanation.stepByStep.length > 0 && (
                  <ul className="space-y-1.5 pl-2">
                    {currentQ.detailedExplanation.stepByStep.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {currentQ.detailedExplanation.keyTakeaway && (
                  <div className="pt-2 border-t border-slate-800/80 text-amber-300 font-medium">
                    📌 <strong>Regra de Ouro:</strong> {currentQ.detailedExplanation.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Carousel & Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={activeIdx === 0}
              onClick={() => setActiveIdx(activeIdx - 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Questão Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5">
              {questions.map((q, i) => {
                const isThisAnswered = typeof q.userSelectedIndex === "number";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      i === activeIdx
                        ? "bg-emerald-400 scale-125 ring-2 ring-emerald-400/40"
                        : isThisAnswered
                        ? q.isCorrect
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                        : "bg-slate-700"
                    }`}
                    title={`Questão ${i + 1}`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              disabled={activeIdx === questions.length - 1}
              onClick={() => setActiveIdx(activeIdx + 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Próxima Questão"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {activeIdx < questions.length - 1 && isAnswered ? (
              <button
                type="button"
                onClick={() => setActiveIdx(activeIdx + 1)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
              >
                <span>Próxima Questão</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNextStage}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <span>{allAnswered ? "Avançar para Flashcards" : "Pular para Flashcards"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
