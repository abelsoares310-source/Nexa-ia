import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Zap,
  Target,
  Flame,
  BarChart3,
  Layers,
  Scale,
  BrainCircuit,
  History,
  TrendingUp,
  AlertTriangle,
  Play,
  ChevronRight,
  Info
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

import { 
  DiagnosticData, 
  DiagnosticResult, 
  DiagnosticQuestion, 
  QuestionStreakState, 
  UserProfile, 
  AssessmentType,
  FlashcardItem,
  SubjectMasteryBreakdown
} from "../types";
import { 
  ASSESSMENT_TEMPLATES, 
  calculateDomainAnalytics, 
  FALLBACK_BLITZ_QUESTIONS 
} from "../utils/assessmentPresets";
import { 
  getStoredAssessmentHistory, 
  addAssessmentToHistory 
} from "../utils/storage";
import { QuestionExplanationModal } from "./QuestionExplanationModal";

interface DiagnosticQuizProps {
  diagnosticData: DiagnosticData | null;
  diagnosticResult: DiagnosticResult | null;
  profile?: UserProfile;
  onCompleteQuiz: (result: DiagnosticResult) => void;
  onGeneratePlansWithResult: (result: DiagnosticResult) => void;
  onRestartDiagnostic: () => void;
  onStartCustomAssessment?: (type: AssessmentType, subject?: string, count?: number) => void;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
  onAddFlashcard?: (card: FlashcardItem) => void;
  isGenerating: boolean;
  onAnswerBatch?: (records: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }[]) => void;
  streakState?: QuestionStreakState;
  onOpenStreak?: () => void;
  onNavigateToPastExams?: () => void;
}

export const DiagnosticQuiz: React.FC<DiagnosticQuizProps> = ({
  diagnosticData,
  diagnosticResult,
  profile,
  onCompleteQuiz,
  onGeneratePlansWithResult,
  onRestartDiagnostic,
  onStartCustomAssessment,
  onLaunchTopicTutor,
  onAddFlashcard,
  isGenerating,
  onAnswerBatch,
  streakState,
  onOpenStreak,
  onNavigateToPastExams,
}) => {
  // Navigation tabs inside assessment center
  const [activeSubTab, setActiveSubTab] = useState<"quiz" | "hub" | "analytics" | "history">(
    diagnosticData && diagnosticData.questions.length > 0 ? "quiz" : "hub"
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  // selectedAnswers: map questionId -> optionIndex (0..3) or -2 for "dont_know"
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(!!diagnosticResult);

  // Modal explanation state
  const [explainingQuestion, setExplainingQuestion] = useState<{
    question: DiagnosticQuestion;
    isDontKnow: boolean;
    userAnswerText?: string;
  } | null>(null);

  // Custom assessment selection states
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType>("diagnostic");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    profile?.subjects?.[0] || "Matemática"
  );
  const [customLoading, setCustomLoading] = useState<boolean>(false);

  // Historical assessments
  const [assessmentHistory, setAssessmentHistory] = useState<DiagnosticResult[]>([]);

  useEffect(() => {
    setAssessmentHistory(getStoredAssessmentHistory());
  }, [diagnosticResult, submitted]);

  // When diagnosticData changes, reset quiz state
  useEffect(() => {
    if (diagnosticData && diagnosticData.questions.length > 0) {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setSubmitted(false);
      setActiveSubTab("quiz");
    }
  }, [diagnosticData]);

  const questions: DiagnosticQuestion[] = diagnosticData?.questions || [];
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optIdx: number) => {
    if (submitted || !currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx,
    }));
  };

  const handleSelectDontKnow = () => {
    if (!currentQ) return;
    // Mark as -2 ("não sei")
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: -2,
    }));

    // Open rich didactic explanation modal immediately
    setExplainingQuestion({
      question: currentQ,
      isDontKnow: true,
      userAnswerText: "NÃO SEI",
    });
  };

  const handleFinishQuiz = () => {
    if (questions.length === 0) return;

    const analytics = calculateDomainAnalytics(questions, selectedAnswers);

    const batchRecords: {
      question: string;
      subject: string;
      topic?: string;
      isCorrect: boolean;
      source: "diagnostic" | "tutor" | "quiz" | "custom";
    }[] = [];

    const answersList = questions.map((q) => {
      const selected = selectedAnswers[q.id] ?? -1;
      const isDontKnow = selected === -2;
      const isCorrect = selected === q.correctIndex;

      batchRecords.push({
        question: q.question,
        subject: q.subject || "Geral",
        topic: q.skillTested || "Diagnóstico",
        isCorrect,
        source: "diagnostic",
      });

      return {
        questionId: q.id,
        selectedIndex: selected,
        isCorrect,
        isDontKnow,
      };
    });

    const result: DiagnosticResult = {
      id: `diag-${Date.now()}`,
      title: diagnosticData?.assessmentTitle || "Avaliação Diagnóstica",
      assessmentType: diagnosticData?.assessmentType || "diagnostic",
      subject: diagnosticData?.subject,
      score: analytics.score,
      total: analytics.total,
      percentage: analytics.percentage,
      dontKnowCount: analytics.dontKnowCount,
      answers: answersList,
      completedAt: new Date().toISOString(),
      strongSkills: analytics.strongSkills,
      attentionSkills: analytics.attentionSkills,
      dontKnowSkills: analytics.dontKnowSkills,
      subjectBreakdown: analytics.subjectBreakdown,
    };

    if (onAnswerBatch && batchRecords.length > 0) {
      onAnswerBatch(batchRecords);
    }

    setSubmitted(true);
    addAssessmentToHistory(result);
    setAssessmentHistory(getStoredAssessmentHistory());
    onCompleteQuiz(result);
    setActiveSubTab("analytics");
  };

  const handleLaunchNewAssessment = async (type: AssessmentType, subject?: string) => {
    if (onStartCustomAssessment) {
      onStartCustomAssessment(type, subject);
      return;
    }

    if (onRestartDiagnostic) {
      onRestartDiagnostic();
    }
  };

  const activeResult: DiagnosticResult | null = diagnosticResult || (submitted && questions.length > 0 ? {
    score: questions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0), 0),
    total: totalQuestions,
    percentage: Math.round((questions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0), 0) / totalQuestions) * 100),
    dontKnowCount: Object.values(selectedAnswers).filter((v) => v === -2).length,
    answers: questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? -1,
      isCorrect: selectedAnswers[q.id] === q.correctIndex,
      isDontKnow: selectedAnswers[q.id] === -2,
    })),
    completedAt: new Date().toISOString(),
    strongSkills: questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).map((q) => q.skillTested),
    attentionSkills: questions.filter((q) => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctIndex && selectedAnswers[q.id] !== -2).map((q) => q.skillTested),
    dontKnowSkills: questions.filter((q) => selectedAnswers[q.id] === -2).map((q) => q.skillTested),
  } : null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Mode Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Centro de Avaliações & Diagnósticos
              </span>
              {streakState && (
                <button
                  type="button"
                  onClick={onOpenStreak}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold transition cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                  <span>Sequência: <strong>{streakState.currentStreak}d</strong></span>
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
              Simulados, Diagnósticos & Mapa de Domínio
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Avalie seu nível, descubra exatamente onde você está bom e tire dúvidas passo a passo com o botão "Não Sei".
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("hub")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                activeSubTab === "hub"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Novas Avaliações
            </button>
            {questions.length > 0 && (
              <button
                onClick={() => setActiveSubTab("quiz")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                  activeSubTab === "quiz"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Questões ({answeredCount}/{totalQuestions})
              </button>
            )}
            {(activeResult || assessmentHistory.length > 0) && (
              <button
                onClick={() => setActiveSubTab("analytics")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                  activeSubTab === "analytics"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Onde Você Está Bom
              </button>
            )}
            {assessmentHistory.length > 0 && (
              <button
                onClick={() => setActiveSubTab("history")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                  activeSubTab === "history"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                Histórico
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: ASSESSMENT HUB (Escolher e Iniciar Novas Avaliações) */}
      {activeSubTab === "hub" && (
        <div className="space-y-6">
          {/* Official Past Exams Callout Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Bancas Oficiais do RJ e Brasil</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Provas Antigas & Cadernos Oficiais (IFF, IFRJ, Colégio Naval, EPCAR, UFRJ...)
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Treine com as provas oficiais completas, cronômetro de prova real, resolução detalhada passo a passo e gerador de simulados inéditos com a IA.
              </p>
            </div>
            {onNavigateToPastExams && (
              <button
                type="button"
                onClick={onNavigateToPastExams}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Acessar Provas Antigas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSESSMENT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-amber-400" />
                      {tmpl.questionCount} Questões • ~{tmpl.estimatedMinutes} min
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 flex items-center">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {tmpl.shortDesc}
                  </p>
                </div>

                {tmpl.type === "subject_simulado" && profile?.subjects && profile.subjects.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Selecione a disciplina para o simulado:
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {profile.subjects.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isGenerating || customLoading}
                  onClick={() => handleLaunchNewAssessment(tmpl.type, tmpl.type === "subject_simulado" ? selectedSubject : undefined)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center transition shadow"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-slate-950" />
                  {isGenerating ? "Gerando Teste..." : `Iniciar ${tmpl.title}`}
                </button>
              </div>
            ))}
          </div>

          {/* Quick Notice about the "Não Sei" Feature */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-semibold">Novo Recurso de Transparência & Aprendizado: Opção "Não Sei"</strong>
              <p className="leading-relaxed text-slate-400">
                Durante as questões, você pode clicar no botão <strong>"❓ Não Sei a Resposta"</strong>. O sistema não tratará como um erro comum ou chute: ele identifica a lacuna conceitual imediatamente e abre uma <strong>Explicação Didática Passo a Passo</strong> construída do zero para você aprender o fundamento na hora!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUIZ INTERACTION (Resolução das Questões com Botão Não Sei) */}
      {activeSubTab === "quiz" && questions.length > 0 && currentQ && (
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {diagnosticData?.assessmentTitle || "Avaliação em Andamento"}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Questão {currentIdx + 1} de {totalQuestions}
                </h2>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400">Progresso</span>
                <p className="text-sm font-bold text-emerald-400">
                  {answeredCount} de {totalQuestions} respondidas
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Header with subject & level */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  Questão {currentIdx + 1}
                </span>
                <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {currentQ.subject}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Nível: {currentQ.difficulty}
              </span>
            </div>

            {/* Enunciado */}
            <div>
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {currentQ.question}
              </p>
              <p className="text-xs text-slate-400 mt-2 flex items-center">
                <Target className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Habilidade avaliada: <strong className="text-slate-300 ml-1">{currentQ.skillTested}</strong>
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;
                const isDontKnowSelected = selectedAnswers[currentQ.id] === -2;

                let btnClass = "border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:border-slate-700";
                if (submitted) {
                  if (isCorrect) {
                    btnClass = "border-emerald-500/80 bg-emerald-500/15 text-emerald-300 font-semibold";
                  } else if (isSelected && !isCorrect) {
                    btnClass = "border-rose-500/80 bg-rose-500/15 text-rose-300";
                  }
                } else if (isSelected) {
                  btnClass = "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-start space-x-3 text-sm ${btnClass}`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                    }`}>
                      {letter}
                    </span>
                    <span className="flex-1">{option}</span>
                    {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                    {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}

              {/* OPÇÃO DE "NÃO SEI / PRECISO DE AJUDA" */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSelectDontKnow}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs ${
                    selectedAnswers[currentQ.id] === -2
                      ? "border-amber-500 bg-amber-500/15 text-amber-200 ring-1 ring-amber-500"
                      : "border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-amber-300 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                      ?
                    </span>
                    <div>
                      <span className="font-semibold block">Não sei a resposta / Preciso de explicação</span>
                      <span className="text-[11px] text-slate-400">
                        O sistema explicará passo a passo do zero sem distorcer seu diagnóstico.
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold shrink-0 ml-2">
                    Explicar Conceito
                  </span>
                </button>
              </div>
            </div>

            {/* Explanation box when submitted or after selecting */}
            {(submitted || selectedAnswers[currentQ.id] !== undefined) && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-400 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    Resolução & Explicação:
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExplainingQuestion({
                        question: currentQ,
                        isDontKnow: selectedAnswers[currentQ.id] === -2,
                        userAnswerText:
                          selectedAnswers[currentQ.id] !== undefined && selectedAnswers[currentQ.id] >= 0
                            ? currentQ.options[selectedAnswers[currentQ.id]]
                            : "NÃO SEI",
                      })
                    }
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Ver Masterclass Passo a Passo
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation bottom */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 text-xs font-medium flex items-center transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Anterior
              </button>

              {/* Question dots picker */}
              <div className="flex space-x-1.5 overflow-x-auto max-w-[200px] sm:max-w-none">
                {questions.map((q, idx) => {
                  const val = selectedAnswers[q.id];
                  const isAns = val !== undefined && val >= 0;
                  const isDontKnow = val === -2;
                  const isCurrent = currentIdx === idx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        isCurrent
                          ? "ring-2 ring-emerald-400 bg-slate-700 text-white"
                          : isDontKnow
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : isAns
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center transition"
                >
                  Próxima
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              ) : !submitted ? (
                <button
                  type="button"
                  onClick={handleFinishQuiz}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center transition shadow"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Finalizar Avaliação
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSubTab("analytics")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center transition shadow"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Ver Onde Estou Bom
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ANALYTICS & "ONDE A PESSOA ESTÁ BOA" */}
      {activeSubTab === "analytics" && activeResult && (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                    Diagnóstico de Proficiência
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {activeResult.score} de {activeResult.total} Acertos ({activeResult.percentage}%)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeResult.dontKnowCount ? `${activeResult.dontKnowCount} conceitos assinalados como 'Não Sei' para aprendizado do zero.` : "Todas as questões foram respondidas com convicção."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onGeneratePlansWithResult(activeResult)}
                  disabled={isGenerating}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? "Criando Planos..." : "Gerar/Recalibrar Planos com IA"}
                </button>
              </div>
            </div>
          </div>

          {/* Section: ONDE VOCÊ ESTÁ BOM vs PONTOS DE ATENÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PONTOS FORTES & HABILIDADES DOMINADAS */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center text-emerald-400">
                  <Sparkles className="w-5 h-5 mr-2" />
                  🌟 Onde Você Está Bom (Pontos Fortes)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {activeResult.strongSkills?.length || 0} Dominados
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Habilidades e matérias em que você demonstrou precisão e base sólida nas avaliações:
              </p>

              <div className="space-y-2.5">
                {activeResult.strongSkills && activeResult.strongSkills.length > 0 ? (
                  activeResult.strongSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white">{skill}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Alta Precisão
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-800/40">
                    Realize mais questões para consolidar seus pontos fortes na lista.
                  </p>
                )}
              </div>
            </div>

            {/* PONTOS DE ATENÇÃO & LACUNAS "NÃO SEI" */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center text-amber-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  ⚠️ Conceitos para Reforçar & "Não Sei"
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {(activeResult.attentionSkills?.length || 0) + (activeResult.dontKnowSkills?.length || 0)} Tópicos
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tópicos onde você assinalou dúvida ou errou. Pratique-os no Tutor Socrático para eliminá-los:
              </p>

              <div className="space-y-2.5">
                {activeResult.dontKnowSkills?.map((skill, idx) => (
                  <div
                    key={`dk-${idx}`}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200"
                  >
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{skill}</span>
                        <span className="text-[10px] text-amber-400">Sinalizado com "Não Sei"</span>
                      </div>
                    </div>
                    {onLaunchTopicTutor && (
                      <button
                        type="button"
                        onClick={() => onLaunchTopicTutor(skill, "Geral")}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold transition flex items-center shrink-0"
                      >
                        Treinar no Tutor
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                  </div>
                ))}

                {activeResult.attentionSkills?.map((skill, idx) => (
                  <div
                    key={`att-${idx}`}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs text-slate-300"
                  >
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-medium text-slate-200">{skill}</span>
                    </div>
                    {onLaunchTopicTutor && (
                      <button
                        type="button"
                        onClick={() => onLaunchTopicTutor(skill, "Geral")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition flex items-center shrink-0"
                      >
                        Revisar
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                  </div>
                ))}

                {(!activeResult.dontKnowSkills || activeResult.dontKnowSkills.length === 0) &&
                  (!activeResult.attentionSkills || activeResult.attentionSkills.length === 0) && (
                    <p className="text-xs text-emerald-400 italic p-3 rounded-xl bg-emerald-500/10">
                      Nenhuma lacuna crítica encontrada nesta avaliação. Excelente resultado!
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Gráfico de Desempenho por Matéria */}
          {activeResult.subjectBreakdown && activeResult.subjectBreakdown.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-sky-400" />
                Desempenho por Disciplina
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeResult.subjectBreakdown}>
                    <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                    />
                    <Bar dataKey="percentage" name="Taxa de Acerto (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: HISTÓRICO DE AVALIAÇÕES */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-emerald-400" />
              Histórico de Avaliações Realizadas
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Acompanhe sua evolução e taxa de acertos ao longo do tempo.
            </p>
          </div>

          <div className="space-y-3">
            {assessmentHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.assessmentType === "blitz_5" ? "Blitz 5Q" : item.assessmentType === "subject_simulado" ? `Simulado: ${item.subject || "Matéria"}` : "Diagnóstico"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.completedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{item.title || "Avaliação de Aprendizagem"}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.score} / {item.total} acertos • {item.dontKnowCount ? `${item.dontKnowCount} dúvidas explicadas` : "0 dúvidas"}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className={`text-xl font-bold ${item.percentage >= 80 ? "text-emerald-400" : item.percentage >= 60 ? "text-sky-400" : "text-amber-400"}`}>
                      {item.percentage}%
                    </span>
                    <span className="text-[11px] block text-slate-400">Acurácia</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onCompleteQuiz(item);
                      setActiveSubTab("analytics");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center transition"
                  >
                    Ver Análise
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MASTERCLASS EXPLANATION MODAL (Quando o aluno clica em Não Sei ou Ver Explicação) */}
      {explainingQuestion && (
        <QuestionExplanationModal
          question={explainingQuestion.question}
          isDontKnow={explainingQuestion.isDontKnow}
          userAnswerText={explainingQuestion.userAnswerText}
          onClose={() => setExplainingQuestion(null)}
          onLaunchTutor={onLaunchTopicTutor}
          onAddFlashcard={onAddFlashcard}
        />
      )}
    </div>
  );
};

