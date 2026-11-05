import React, { useState, useEffect } from "react";
import { 
  PastExamEdition, 
  PastExamInstitution, 
  PAST_EXAM_INSTITUTIONS, 
  PAST_EXAMS_EDITIONS, 
  PAST_EXAM_TIPS,
  PastExamCategory 
} from "../data/pastExamsData";
import { DiagnosticQuestion, UserProfile } from "../types";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  FileText, 
  Flame, 
  HelpCircle, 
  Layers, 
  Lightbulb, 
  Play, 
  RotateCcw, 
  Search, 
  Sparkles, 
  Target, 
  X, 
  ExternalLink,
  ChevronDown,
  Compass,
  AlertTriangle,
  Bookmark,
  Share2,
  Check,
  Zap,
  Printer
} from "lucide-react";
import confetti from "canvas-confetti";

interface PastExamsViewProps {
  profile: UserProfile;
  onRecordQuestions: (records: {
    question: string;
    subject: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }[]) => void;
  onAddFlashcard?: (flashcard: { front: string; back: string; tag: string; topic: string }) => void;
  onNavigateToStudyNow?: (subject?: string, topic?: string) => void;
}

export const PastExamsView: React.FC<PastExamsViewProps> = ({
  profile,
  onRecordQuestions,
  onAddFlashcard,
  onNavigateToStudyNow,
}) => {
  // Navigation & Filter State
  const [selectedCategory, setSelectedCategory] = useState<PastExamCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);

  // Active Exam Session State
  const [activeEdition, setActiveEdition] = useState<PastExamEdition | null>(null);
  const [examMode, setExamMode] = useState<"official_simulado" | "practice">("official_simulado");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showImmediateResolution, setShowImmediateResolution] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<number, boolean>>({});

  // AI Custom Exam Generation State
  const [isGeneratingAiExam, setIsGeneratingAiExam] = useState(false);
  const [aiExamInstitution, setAiExamInstitution] = useState<string>("IFF");
  const [aiExamSubject, setAiExamSubject] = useState<string>("Todas as matérias da banca");
  const [aiExamDifficulty, setAiExamDifficulty] = useState<string>("Médio");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Pre-filter based on user's profile objective if applicable
  useEffect(() => {
    const obj = (profile.objective || "").toUpperCase();
    if (obj.includes("IFF") && !selectedInstitutionId) {
      setSelectedInstitutionId("iff");
      setSelectedCategory("institutos_federais");
    } else if (obj.includes("IFRJ") && !selectedInstitutionId) {
      setSelectedInstitutionId("ifrj");
      setSelectedCategory("institutos_federais");
    } else if (obj.includes("COLÉGIO NAVAL") || obj.includes("COLEGIO NAVAL") || obj.includes(" CN ") || obj.endsWith(" CN")) {
      setSelectedInstitutionId("cn");
      setSelectedCategory("militares");
    } else if (obj.includes("EPCAR") && !selectedInstitutionId) {
      setSelectedInstitutionId("epcar");
      setSelectedCategory("militares");
    } else if (obj.includes("UFRJ") && !selectedInstitutionId) {
      setSelectedInstitutionId("ufrj");
      setSelectedCategory("vestibulares_federais");
    }
  }, [profile.objective]);

  // Exam Timer Effect
  useEffect(() => {
    if (!activeEdition || isExamFinished || isTimerPaused || examMode !== "official_simulado") return;

    if (timeRemainingSeconds <= 0) {
      handleFinishExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEdition, isExamFinished, isTimerPaused, examMode, timeRemainingSeconds]);

  // Start an Exam Edition
  const handleStartExam = (edition: PastExamEdition, mode: "official_simulado" | "practice") => {
    setActiveEdition(edition);
    setExamMode(mode);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setShowImmediateResolution(mode === "practice");
    setIsExamFinished(false);
    setTimeRemainingSeconds(edition.durationMinutes * 60);
    setIsTimerPaused(false);
    setSavedFlashcardIds({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Answer selection
  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (isExamFinished) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Flag toggle
  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Finish exam and calculate score
  const handleFinishExam = () => {
    if (!activeEdition) return;
    setIsExamFinished(true);

    const questions = activeEdition.questions;
    let correctCount = 0;
    const recordsToSave: {
      question: string;
      subject: string;
      isCorrect: boolean;
      source: "diagnostic" | "tutor" | "quiz" | "custom";
    }[] = [];

    questions.forEach((q) => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;

      recordsToSave.push({
        question: `[${activeEdition.institutionCode} ${activeEdition.year}] ${q.question.slice(0, 100)}...`,
        subject: q.subject,
        isCorrect,
        source: "quiz",
      });
    });

    // Save answered questions to streak & question records
    onRecordQuestions(recordsToSave);

    // Confetti celebration if score is good
    if (correctCount / questions.length >= 0.7) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add question to flashcards
  const handleSaveToFlashcards = (q: DiagnosticQuestion) => {
    if (!onAddFlashcard) return;
    onAddFlashcard({
      front: `[${activeEdition?.institutionCode || "Banca Oficial"}] ${q.question}`,
      back: `Resposta Correta: ${q.options[q.correctIndex]}\n\nExplicação: ${q.detailedExplanation?.concept || q.explanation}\n\nDica: ${q.detailedExplanation?.keyTakeaway || ""}`,
      tag: activeEdition?.institutionCode || "Simulado",
      topic: q.skillTested || q.subject,
    });
    setSavedFlashcardIds((prev) => ({ ...prev, [q.id]: true }));
  };

  // AI Exam Generator Handler
  const handleGenerateAiExam = async () => {
    setIsGeneratingAiExam(true);
    setAiError(null);

    const inst = PAST_EXAM_INSTITUTIONS.find((i) => i.code === aiExamInstitution) || PAST_EXAM_INSTITUTIONS[0];

    try {
      const res = await fetch("/api/past-exams/generate-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionCode: inst.code,
          institutionName: inst.fullName,
          year: 2024,
          subject: aiExamSubject,
          questionCount: 6,
          difficulty: aiExamDifficulty,
        }),
      });

      if (!res.ok) throw new Error("Erro na resposta do servidor.");
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        const dynamicEdition: PastExamEdition = {
          id: `ai-${inst.id}-${Date.now()}`,
          institutionId: inst.id,
          institutionCode: inst.code,
          institutionName: inst.fullName,
          year: 2024,
          editionName: `Simulado Inédito da Banca ${inst.code} (Gerado por IA)`,
          courseTarget: inst.description,
          durationMinutes: 45,
          totalQuestions: data.questions.length,
          subjects: Array.from(new Set(data.questions.map((q: any) => q.subject))),
          difficulty: aiExamDifficulty as any,
          description: `Simulado autêntico formulado com o rigor e matriz de competências da banca do ${inst.fullName}.`,
          bancaName: inst.examRules.banca,
          questions: data.questions,
        };

        setShowAiModal(false);
        handleStartExam(dynamicEdition, "official_simulado");
      } else {
        throw new Error("Não foi possível gerar questões.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Falha ao gerar simulado inédito. Tente novamente.");
    } finally {
      setIsGeneratingAiExam(false);
    }
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m < 10 ? "0" : ""}${m}m ${s < 10 ? "0" : ""}${s}s`;
    }
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Filtered institutions and editions
  const filteredInstitutions = PAST_EXAM_INSTITUTIONS.filter((inst) => {
    if (selectedCategory !== "all" && inst.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inst.name.toLowerCase().includes(query) ||
      inst.fullName.toLowerCase().includes(query) ||
      inst.description.toLowerCase().includes(query) ||
      inst.examRules.subjects.some((s) => s.toLowerCase().includes(query))
    );
  });

  const filteredEditions = PAST_EXAMS_EDITIONS.filter((edition) => {
    if (selectedInstitutionId && edition.institutionId !== selectedInstitutionId) return false;
    if (selectedCategory !== "all") {
      const inst = PAST_EXAM_INSTITUTIONS.find((i) => i.id === edition.institutionId);
      if (inst && inst.category !== selectedCategory) return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      edition.institutionName.toLowerCase().includes(query) ||
      edition.editionName.toLowerCase().includes(query) ||
      edition.subjects.some((s) => s.toLowerCase().includes(query)) ||
      edition.year.toString().includes(query)
    );
  });

  // Current question in active session
  const currentQ = activeEdition ? activeEdition.questions[currentQuestionIndex] : null;

  // =========================================================================
  // RENDER: EXAM IN PROGRESS OR RESULT VIEW
  // =========================================================================
  if (activeEdition && currentQ) {
    const totalQ = activeEdition.questions.length;
    const answeredCount = Object.keys(userAnswers).length;
    const currentAnswer = userAnswers[currentQ.id];
    const isCurrentFlagged = !!flaggedQuestions[currentQ.id];

    // Score calculation if finished
    const correctCount = isExamFinished
      ? activeEdition.questions.filter((q) => userAnswers[q.id] === q.correctIndex).length
      : 0;
    const percentScore = Math.round((correctCount / totalQ) * 100);

    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fadeIn text-slate-100">
        {/* Top Control Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {activeEdition.institutionCode} {activeEdition.year}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {activeEdition.editionName}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {examMode === "official_simulado" ? "Modo Simulado Oficial Cronometrado" : "Modo Treino Passo a Passo"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            {/* Timer (if official mode) */}
            {examMode === "official_simulado" && !isExamFinished && (
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
                timeRemainingSeconds < 300 
                  ? "bg-red-500/10 text-red-400 border-red-500/40 animate-pulse" 
                  : "bg-slate-800 text-slate-200 border-slate-700"
              }`}>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            )}

            {/* Exit / Finish Button */}
            {!isExamFinished ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Deseja pausar e sair do simulado? Seu progresso nesta sessão será cancelado.")) {
                      setActiveEdition(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700 transition"
                >
                  Sair
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount < totalQ) {
                      if (window.confirm(`Você respondeu ${answeredCount} de ${totalQ} questões. Tem certeza de que deseja entregar o cartão de respostas agora?`)) {
                        handleFinishExam();
                      }
                    } else {
                      handleFinishExam();
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  Entregar Gabarito ({answeredCount}/{totalQ})
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveEdition(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition"
              >
                Voltar ao Catálogo de Provas
              </button>
            )}
          </div>
        </div>

        {/* RESULTS HEADER (IF FINISHED) */}
        {isExamFinished && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-scaleUp">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resultado Oficial do Simulado</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {percentScore >= 80 ? "Desempenho de Alta Performance!" : percentScore >= 60 ? "Bom Rendimento Competitivo!" : "Diagnóstico Concluído - Hora de Ajustar a Base"}
                </h3>
                <p className="text-sm text-slate-300 max-w-xl">
                  {percentScore >= 80 
                    ? `Parabéns! Sua pontuação em ${activeEdition.institutionCode} (${percentScore}%) coloca você diretamente dentro da zona histórica de classificação e corte do edital.` 
                    : percentScore >= 60 
                    ? `Sua taxa de acertos de ${percentScore}% mostra base sólida em matérias centrais da banca. Revise abaixo as questões que você perdeu para garantir os pontos decisivos.`
                    : `Simulado concluído com ${percentScore}% de acertos. Identificamos as lacunas prioritárias da banca oficial do ${activeEdition.institutionCode} para seu plano de recuperação.`}
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center shrink-0">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {correctCount} <span className="text-slate-500 text-xl font-normal">/ {totalQ}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Acertos Totais</div>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white">
                    {percentScore}%
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Aproveitamento</div>
                </div>
              </div>
            </div>

            {/* Subject breakdown */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Desempenho por Matéria na Banca
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from(new Set(activeEdition.questions.map((q) => q.subject))).map((sub) => {
                  const subQuestions = activeEdition.questions.filter((q) => q.subject === sub);
                  const subCorrect = subQuestions.filter((q) => userAnswers[q.id] === q.correctIndex).length;
                  const subPercent = Math.round((subCorrect / subQuestions.length) * 100);
                  return (
                    <div key={sub} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">{sub}</div>
                        <div className="text-[11px] text-slate-400">{subCorrect} de {subQuestions.length} acertos</div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        subPercent >= 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {subPercent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Question Navigator Palette & Cartão-Resposta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Navegador de Questões / Cartão-Resposta
            </span>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Respondida</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Marcada</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Pendente</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeEdition.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isFlagged = !!flaggedQuestions[q.id];
              const isCurrent = idx === currentQuestionIndex;
              const isCorrect = isExamFinished && userAnswers[q.id] === q.correctIndex;
              const isWrong = isExamFinished && userAnswers[q.id] !== undefined && !isCorrect;

              let btnBg = "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750";

              if (isExamFinished) {
                if (isCorrect) btnBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold";
                else if (isWrong) btnBg = "bg-red-500/20 text-red-400 border-red-500/50 font-bold";
                else btnBg = "bg-slate-800/40 text-slate-500 border-slate-800";
              } else {
                if (isFlagged) btnBg = "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold";
                else if (isAnswered) btnBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
              }

              if (isCurrent) {
                btnBg += " ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer relative ${btnBg}`}
                >
                  {idx + 1}
                  {isFlagged && !isExamFinished && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6">
          {/* Header of Question */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-800 text-emerald-400 border border-slate-700">
                Questão {currentQuestionIndex + 1} de {totalQ}
              </span>
              <span className="text-xs font-semibold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60">
                {currentQ.subject}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {currentQ.skillTested}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {!isExamFinished && (
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isCurrentFlagged
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-white border-slate-700"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
                  <span>{isCurrentFlagged ? "Marcada para Revisar" : "Marcar"}</span>
                </button>
              )}

              {/* Add to flashcards */}
              {onAddFlashcard && (
                <button
                  type="button"
                  onClick={() => handleSaveToFlashcards(currentQ)}
                  disabled={savedFlashcardIds[currentQ.id]}
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    savedFlashcardIds[currentQ.id]
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-white border-slate-700"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{savedFlashcardIds[currentQ.id] ? "Salva nos Cards!" : "Salvar Card"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
            {currentQ.question}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((option, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = currentAnswer === optIdx;
              const isOfficialCorrect = currentQ.correctIndex === optIdx;
              const showValidation = isExamFinished || (examMode === "practice" && currentAnswer !== undefined);

              let optionStyle = "border-slate-800 bg-slate-900/80 hover:bg-slate-800/60 text-slate-200";

              if (showValidation) {
                if (isOfficialCorrect) {
                  optionStyle = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold";
                } else if (isSelected && !isOfficialCorrect) {
                  optionStyle = "border-red-500/60 bg-red-500/10 text-red-300 font-semibold";
                } else {
                  optionStyle = "border-slate-800/40 bg-slate-900/30 text-slate-500 opacity-60";
                }
              } else if (isSelected) {
                optionStyle = "border-emerald-500 bg-emerald-500/15 text-white shadow-sm ring-1 ring-emerald-500/30";
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={isExamFinished}
                  onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start space-x-3.5 cursor-pointer ${optionStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                    showValidation && isOfficialCorrect
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold"
                      : showValidation && isSelected && !isOfficialCorrect
                      ? "bg-red-500 text-white border-red-400 font-extrabold"
                      : isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base leading-snug pt-0.5 flex-1">
                    {option}
                  </span>
                  {showValidation && isOfficialCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {showValidation && isSelected && !isOfficialCorrect && (
                    <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed Resolution (if finished or in practice mode) */}
          {(isExamFinished || (examMode === "practice" && currentAnswer !== undefined)) && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 bg-slate-950/40 -mx-5 -mb-5 sm:-mx-8 sm:-mb-8 p-5 sm:p-8 rounded-b-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gabarito Comentado & Resolução Oficial</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  Alternativa Correta: {String.fromCharCode(65 + currentQ.correctIndex)}
                </span>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800">
                {currentQ.explanation}
              </div>

              {currentQ.detailedExplanation && (
                <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 text-xs sm:text-sm">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    {currentQ.detailedExplanation.concept}
                  </div>

                  {currentQ.detailedExplanation.stepByStep && currentQ.detailedExplanation.stepByStep.length > 0 && (
                    <div className="space-y-1.5 text-slate-300 pl-2 border-l-2 border-emerald-500/40">
                      {currentQ.detailedExplanation.stepByStep.map((step, sIdx) => (
                        <div key={sIdx}>{step}</div>
                      ))}
                    </div>
                  )}

                  {currentQ.detailedExplanation.keyTakeaway && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                      <strong>Dica da Banca:</strong> {currentQ.detailedExplanation.keyTakeaway}
                    </div>
                  )}

                  {currentQ.detailedExplanation.mnemonicTip && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      <strong>Mnemônica / Macete:</strong> {currentQ.detailedExplanation.mnemonicTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                currentQuestionIndex === 0
                  ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                  : "bg-slate-800 text-white hover:bg-slate-750 border-slate-700 cursor-pointer"
              }`}
            >
              Anterior
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {currentQuestionIndex + 1} de {totalQ}
            </span>

            {currentQuestionIndex < totalQ - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
              >
                Próxima
              </button>
            ) : (
              !isExamFinished ? (
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  Finalizar Prova
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveEdition(null)}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
                >
                  Voltar ao Catálogo
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: DIRECTORY & CATALOG VIEW
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn text-slate-100">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Repositório de Provas Anteriores & Bancas Oficiais</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Provas Antigas & Simulados Oficiais
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Treine com questões reais e autênticas das principais bancas do Rio de Janeiro e do Brasil: 
            <strong className="text-white"> IFF, IFRJ, Colégio Naval, EPCAR, UFRJ, Colégio Pedro II, CMRJ e EsPCEx</strong>. 
            Monitore seu tempo oficial, estude com gabarito passo a passo e gere testes inéditos com a IA.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Simulado Inédito da Banca com IA</span>
            </button>

            {profile.objective && (
              <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Alvo Atual: <strong className="text-slate-200">{profile.objective}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Banca Strategy Carousel / Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAST_EXAM_TIPS.slice(0, 3).map((tip) => (
          <div key={tip.institution} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{tip.title}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tip.tips[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Todas as Bancas" },
              { id: "institutos_federais", label: "Institutos Federais (IFF, IFRJ...)" },
              { id: "militares", label: "Escolas Militares (CN, EPCAR...)" },
              { id: "vestibulares_federais", label: "Vestibulares & Federais (UFRJ, UERJ...)" },
              { id: "colegios_tradicionais", label: "Colégios Tradicionais (CPII...)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id as any);
                  setSelectedInstitutionId(null);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar IFF, CN, EPCAR, UFRJ..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Institution Quick Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/60">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
            Filtrar Escola:
          </span>
          <button
            type="button"
            onClick={() => setSelectedInstitutionId(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedInstitutionId === null
                ? "bg-slate-200 text-slate-900 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todas
          </button>
          {PAST_EXAM_INSTITUTIONS.map((inst) => (
            <button
              key={inst.id}
              type="button"
              onClick={() => setSelectedInstitutionId(inst.id === selectedInstitutionId ? null : inst.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                selectedInstitutionId === inst.id
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              {inst.code}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Past Exam Editions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Cadernos de Prova Disponíveis ({filteredEditions.length})
          </h2>
          <span className="text-xs text-slate-400">
            Selecione uma prova para iniciar o simulado cronometrado ou estudo comentado
          </span>
        </div>

        {filteredEditions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhuma prova encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tente ajustar seus termos de busca ou selecione outra categoria de banca.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedInstitutionId(null);
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEditions.map((edition) => {
              const inst = PAST_EXAM_INSTITUTIONS.find((i) => i.id === edition.institutionId);
              return (
                <div
                  key={edition.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 group"
                >
                  <div className="space-y-4">
                    {/* Top badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${inst?.badgeColor || "bg-slate-800 text-slate-300"}`}>
                          {edition.institutionCode}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {edition.year}
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${
                        edition.difficulty === "Muito Difícil"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : edition.difficulty === "Difícil"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        Nível {edition.difficulty}
                      </span>
                    </div>

                    {/* Title & Info */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition">
                        {edition.editionName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {edition.description}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                      <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {Math.floor(edition.durationMinutes / 60)}h {edition.durationMinutes % 60 ? `${edition.durationMinutes % 60}m` : ""}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        {edition.questions.length} questões
                      </span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Banca: {edition.bancaName}
                      </span>
                    </div>

                    {/* Subjects tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {edition.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700/60"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleStartExam(edition, "official_simulado")}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Simulado Oficial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartExam(edition, "practice")}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>Treino Comentado</span>
                      </button>
                    </div>

                    {inst?.officialSiteUrl && (
                      <a
                        href={inst.officialSiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir portal oficial de processos seletivos da instituição"
                        className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 text-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Directory of Institutions Info Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Instituições & Bancas Mapeadas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Conheça as particularidades de pontuação e critérios de corte de cada certame
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.map((inst) => (
            <div
              key={inst.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 space-y-3 transition"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${inst.badgeColor}`}>
                  {inst.code}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {inst.categoryLabel}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{inst.fullName}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {inst.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div><strong>Tempo de Prova:</strong> {Math.floor(inst.examRules.durationMinutes / 60)}h{inst.examRules.durationMinutes % 60 ? ` ${inst.examRules.durationMinutes % 60}m` : ""}</div>
                <div><strong>Questões Oficiais:</strong> {inst.examRules.totalOfficialQuestions} itens</div>
                <div className="line-clamp-1"><strong>Disciplinas:</strong> {inst.examRules.subjects.join(", ")}</div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInstitutionId(inst.id);
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Ver Provas da Banca <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={inst.officialSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Simulation Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">Gerador IA de Simulado Inédito</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              A IA formula questões calibradas com o rigor, estilo textual e exigência conceitual da banca examinadora selecionada.
            </p>

            {aiError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instituição / Banca Examinadora
                </label>
                <select
                  value={aiExamInstitution}
                  onChange={(e) => setAiExamInstitution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="IFF">IFF (Instituto Federal Fluminense)</option>
                  <option value="IFRJ">IFRJ (Instituto Federal do Rio de Janeiro)</option>
                  <option value="CN">Colégio Naval (Marinha do Brasil)</option>
                  <option value="EPCAR">EPCAR (Força Aérea Brasileira)</option>
                  <option value="UFRJ">UFRJ (Universidade Federal do Rio de Janeiro)</option>
                  <option value="CPII">Colégio Pedro II (CPII)</option>
                  <option value="CMRJ">CMRJ (Colégio Militar do Rio de Janeiro)</option>
                  <option value="ESPCEX">EsPCEx (Exército Brasileiro)</option>
                  <option value="UERJ">UERJ (Vestibular Estadual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Foco Disciplinar
                </label>
                <select
                  value={aiExamSubject}
                  onChange={(e) => setAiExamSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Todas as matérias da banca">Todas as matérias da banca (Multidisciplinar)</option>
                  <option value="Matemática">Matemática</option>
                  <option value="Língua Portuguesa">Língua Portuguesa</option>
                  <option value="Ciências da Natureza / Física / Química">Ciências da Natureza / Física / Química</option>
                  <option value="Estudos Sociais / História / Geografia">Estudos Sociais / História / Geografia</option>
                  <option value="Língua Inglesa">Língua Inglesa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nível de Dificuldade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Médio", "Difícil", "Muito Difícil"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAiExamDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        aiExamDifficulty === diff
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isGeneratingAiExam}
                onClick={handleGenerateAiExam}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isGeneratingAiExam ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Elaborando Prova com IA...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Gerar e Iniciar Simulado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
