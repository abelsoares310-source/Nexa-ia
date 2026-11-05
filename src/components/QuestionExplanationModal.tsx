import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  MessageSquare
} from "lucide-react";
import { DiagnosticQuestion, FlashcardItem } from "../types";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";

interface QuestionExplanationModalProps {
  question: DiagnosticQuestion | null;
  userAnswerText?: string;
  isDontKnow?: boolean;
  onClose: () => void;
  onLaunchTutor?: (topic: string, subject: string) => void;
  onAddFlashcard?: (card: FlashcardItem) => void;
}

export const QuestionExplanationModal: React.FC<QuestionExplanationModalProps> = ({
  question,
  userAnswerText,
  isDontKnow = false,
  onClose,
  onLaunchTutor,
  onAddFlashcard,
}) => {
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<{
    conceptSummary?: string;
    stepByStepSolution?: string[];
    correctAnswerAnalysis?: string;
    distractorsAnalysis?: string;
    goldenRuleMnemonic?: string;
    encouragement?: string;
  } | null>(null);
  const [cardSaved, setCardSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!question) return;

    // If question already has detailedExplanation pre-rendered, use it
    if (question.detailedExplanation) {
      setAiExplanation({
        conceptSummary: question.detailedExplanation.concept,
        stepByStepSolution: question.detailedExplanation.stepByStep,
        correctAnswerAnalysis: question.explanation,
        goldenRuleMnemonic: question.detailedExplanation.mnemonicTip || question.detailedExplanation.keyTakeaway,
        encouragement: "Admitir a dúvida é a maior virtude de um estudante de alto rendimento. Você está no caminho certo!",
        distractorsAnalysis: question.detailedExplanation.whyWrongOptions
          ?.map((w) => `${w.option}: ${w.reason}`)
          .join(" | "),
      });
      return;
    }

    // Otherwise, fetch rich explanation from backend
    const fetchDeepExplanation = async () => {
      setLoadingAi(true);
      try {
        const res = await fetch("/api/study/explain-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.question,
            subject: question.subject,
            topic: question.skillTested,
            options: question.options,
            correctIndex: question.correctIndex,
            isDontKnow,
            studentAnswer: isDontKnow ? "NÃO SEI" : userAnswerText || "Não assinalou",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAiExplanation(data);
        } else {
          throw new Error("Falha na API");
        }
      } catch (err) {
        console.warn("Fallback para explicação padrão:", err);
        setAiExplanation({
          conceptSummary: `Esta questão avalia a habilidade de "${question.skillTested}" na disciplina de ${question.subject}.`,
          stepByStepSolution: [
            `1. Analise o enunciado e identifique os dados centrais: "${question.question}".`,
            `2. Avalie as 4 alternativas disponíveis.`,
            `3. A alternativa correta é "${question.options[question.correctIndex]}".`,
            `4. Motivo: ${question.explanation}`,
          ],
          correctAnswerAnalysis: question.explanation,
          goldenRuleMnemonic: `Sempre verifique as definições fundamentais de ${question.skillTested}.`,
          encouragement: "Excelente atitude ao sinalizar a dúvida. O aprendizado deliberado acontece quando você investiga o que ainda não dominava!",
        });
      } finally {
        setLoadingAi(false);
      }
    };

    fetchDeepExplanation();
  }, [question, isDontKnow, userAnswerText]);

  if (!question) return null;

  const correctLetter = String.fromCharCode(65 + question.correctIndex);
  const correctOptionText = question.options[question.correctIndex];

  const handleCreateFlashcard = () => {
    if (!onAddFlashcard) return;
    const newCard: FlashcardItem = {
      id: `fc-q-${Date.now()}`,
      front: `[${question.subject}] Como resolver: ${question.skillTested}?`,
      back: `Conceito: ${aiExplanation?.conceptSummary || question.explanation}\n\nRegra de ouro: ${
        aiExplanation?.goldenRuleMnemonic || question.options[question.correctIndex]
      }`,
      tag: question.subject,
      topic: question.skillTested,
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      interval: 1,
      box: 1,
    };
    onAddFlashcard(newCard);
    setCardSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDontKnow
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isDontKnow ? <HelpCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {question.subject}
                </span>
                {isDontKnow && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Opção "Não Sei" Assinalada
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {isDontKnow ? "Explicação Passo a Passo (Construção do Zero)" : "Análise Didática da Questão"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Question Summary */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Enunciado Original</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Nível: {question.difficulty}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">{question.question}</p>
            <div className="text-xs text-emerald-400 font-semibold flex items-center pt-1 border-t border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>
                Gabarito Correto: <strong className="text-white">Opção {correctLetter})</strong> {correctOptionText}
              </span>
            </div>
          </div>

          {loadingAi && !aiExplanation ? (
            <div className="p-8 text-center space-y-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-white">Preparando Masterclass Didática...</p>
              <p className="text-xs text-slate-400">
                Desmembrando o conceito teórico, lógica de resolução e macetes mnemônicos com IA.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Conceito Fundamental */}
              {aiExplanation?.conceptSummary && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <BrainCircuit className="w-4 h-4 mr-1.5" />
                    1. O Conceito Fundamental que Você Precisa Saber
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {aiExplanation.conceptSummary}
                  </p>
                </div>
              )}

              {/* 2. Passo a Passo de Resolução */}
              {aiExplanation?.stepByStepSolution && aiExplanation.stepByStepSolution.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    2. Passo a Passo Lógico da Solução
                  </h3>
                  <div className="space-y-2">
                    {aiExplanation.stepByStepSolution.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start space-x-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step.replace(/^\d+\.\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Dica de Ouro / Mnemônica */}
              {aiExplanation?.goldenRuleMnemonic && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-1.5" />
                    3. Regra de Ouro / Macete para Fixar
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200 leading-relaxed font-medium">
                    {aiExplanation.goldenRuleMnemonic}
                  </p>
                </div>
              )}

              {/* 4. Mensagem Encorajadora */}
              {aiExplanation?.encouragement && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{aiExplanation.encouragement}</p>
                </div>
              )}

              {/* YouTube Video Explanation Banner */}
              <YouTubeExplanationLink
                topic={question.skillTested || question.question}
                subject={question.subject}
                variant="banner"
                customLabel="Ver Vídeo-aula no YouTube"
              />
            </>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <YouTubeExplanationLink
              topic={question.skillTested || question.question}
              subject={question.subject}
              variant="compact"
              customLabel="Aula no YouTube"
            />

            {onAddFlashcard && (
              <button
                type="button"
                onClick={handleCreateFlashcard}
                disabled={cardSaved}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center transition disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                {cardSaved ? "Flashcard Salvo!" : "Criar Flashcard"}
              </button>
            )}

            {onLaunchTutor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchTutor(question.skillTested || question.question, question.subject);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center transition"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Praticar com Tutor IA
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center transition shadow"
          >
            Entendi, Continuar
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
