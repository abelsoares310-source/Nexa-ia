import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Calendar, 
  Send, 
  RotateCcw, 
  Zap, 
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
  Flame,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  MessageSquare,
  Radio,
  Sliders,
  Target
} from "lucide-react";

import confetti from "canvas-confetti";
import { TopicLesson, ExerciseItem, FlashcardItem, SpacedReviewItem, UserProfile, QuestionStreakState } from "../types";
import { VoiceTutorDialog } from "./VoiceTutorDialog";
import { createDefaultVisualMnemonic } from "../utils/visualMnemonic";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";
import {
  speakText,
  stopSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognizer,
  detectLanguageFromSubject,
  SpeechRecognitionController
} from "../utils/speech";

interface ActiveTutorSessionProps {
  initialTopic?: string;
  initialSubject?: string;
  profile: UserProfile;
  onAddFlashcards: (cards: FlashcardItem[]) => void;
  onAddSpacedReviews: (reviews: SpacedReviewItem[]) => void;
  onAnswerQuestion?: (record: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }) => void;
  streakState?: QuestionStreakState;
  onOpenStreak?: () => void;
}

export const ActiveTutorSession: React.FC<ActiveTutorSessionProps> = ({
  initialTopic = "",
  initialSubject = "",
  profile,
  onAddFlashcards,
  onAddSpacedReviews,
  onAnswerQuestion,
  streakState,
  onOpenStreak,
}) => {

  const [tutorViewTab, setTutorViewTab] = useState<"lesson" | "voice_dialog">("lesson");
  const [topicInput, setTopicInput] = useState<string>(initialTopic || "Função Quadrática e Vértice da Parábola");
  const [subjectInput, setSubjectInput] = useState<string>(initialSubject || profile.subjects[0] || "Matemática");
  const [loading, setLoading] = useState<boolean>(false);
  const [lesson, setLesson] = useState<TopicLesson | null>(null);

  // Audio Playback state
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isMicSearching, setIsMicSearching] = useState<boolean>(false);
  const [activeRecallMicIndex, setActiveRecallMicIndex] = useState<number | null>(null);

  const isMicSupported = isSpeechRecognitionSupported();
  const isTtsSupported = isSpeechSynthesisSupported();
  const searchRecognizerRef = useRef<SpeechRecognitionController | null>(null);
  const recallRecognizerRef = useRef<SpeechRecognitionController | null>(null);

  // Exercise interaction states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [socraticFeedbacks, setSocraticFeedbacks] = useState<Record<string, string>>({});
  const [evaluatingExerciseId, setEvaluatingExerciseId] = useState<string | null>(null);

  // Active recall user inputs
  const [recallUserInputs, setRecallUserInputs] = useState<Record<number, string>>({});
  const [revealedRecallGuidance, setRevealedRecallGuidance] = useState<Record<number, boolean>>({});

  // Status for added reviews/flashcards
  const [addedFlashcards, setAddedFlashcards] = useState<boolean>(false);
  const [addedSchedule, setAddedSchedule] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleToggleReadAloud = (textToRead: string, sectionId: string) => {
    if (activePlayingId === sectionId) {
      stopSpeech();
      setActivePlayingId(null);
      return;
    }

    stopSpeech();
    setActivePlayingId(sectionId);

    const lang = detectLanguageFromSubject(lesson?.subject || subjectInput);
    speakText(textToRead, {
      lang,
      rate: 1.0,
      onStart: () => setActivePlayingId(sectionId),
      onEnd: () => setActivePlayingId(null),
      onError: () => setActivePlayingId(null),
    });
  };

  const handleStartSearchVoiceInput = () => {
    if (isMicSearching) {
      searchRecognizerRef.current?.stop();
      setIsMicSearching(false);
      return;
    }

    if (!isMicSupported) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const lang = detectLanguageFromSubject(subjectInput);
    const rec = createSpeechRecognizer({
      lang,
      onStart: () => setIsMicSearching(true),
      onInterim: (interim) => setTopicInput(interim),
      onResult: (finalText, isFinal) => {
        if (finalText.trim()) {
          setTopicInput(finalText.trim());
        }
        if (isFinal) {
          setIsMicSearching(false);
        }
      },
      onError: () => setIsMicSearching(false),
      onEnd: () => setIsMicSearching(false),
    });

    searchRecognizerRef.current = rec;
    rec.start();
  };

  const handleStartRecallVoiceInput = (questionIdx: number) => {
    if (activeRecallMicIndex === questionIdx) {
      recallRecognizerRef.current?.stop();
      setActiveRecallMicIndex(null);
      return;
    }

    if (!isMicSupported) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const lang = detectLanguageFromSubject(lesson?.subject || subjectInput);
    const rec = createSpeechRecognizer({
      lang,
      onStart: () => setActiveRecallMicIndex(questionIdx),
      onInterim: (interim) => {
        setRecallUserInputs((prev) => ({ ...prev, [questionIdx]: interim }));
      },
      onResult: (finalText, isFinal) => {
        if (finalText.trim()) {
          setRecallUserInputs((prev) => ({
            ...prev,
            [questionIdx]: prev[questionIdx] && prev[questionIdx] !== finalText
              ? `${prev[questionIdx]} ${finalText}`.trim()
              : finalText.trim(),
          }));
        }
        if (isFinal) {
          setActiveRecallMicIndex(null);
        }
      },
      onError: () => setActiveRecallMicIndex(null),
      onEnd: () => setActiveRecallMicIndex(null),
    });

    recallRecognizerRef.current = rec;
    rec.start();
  };

  const handleGenerateLesson = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topicInput.trim()) return;

    stopSpeech();
    setActivePlayingId(null);
    setLoading(true);
    setLesson(null);
    setSelectedAnswers({});
    setSocraticFeedbacks({});
    setRecallUserInputs({});
    setRevealedRecallGuidance({});
    setAddedFlashcards(false);
    setAddedSchedule(false);

    try {
      const res = await fetch("/api/study/topic-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput.trim(),
          subject: subjectInput.trim(),
          userLevel: profile.currentLevel,
          objective: profile.objective,
          schoolStage: profile.schoolStage || profile.schoolGrade,
          priorityTopics: profile.priorityTopics,
          difficulties: profile.difficulties,
          profile: {
            objective: profile.objective,
            schoolStage: profile.schoolStage,
            schoolGrade: profile.schoolGrade,
            priorityTopics: profile.priorityTopics,
            difficulties: profile.difficulties,
          },
        }),
      });

      if (!res.ok) throw new Error("Falha ao gerar aula do tópico");
      const data: TopicLesson = await res.json();
      setLesson(data);
    } catch (err: any) {
      console.error("Erro no tutor:", err);
      alert("Não foi possível gerar a aula. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExerciseOption = async (ex: ExerciseItem, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [ex.id]: optIdx }));
    const isCorrect = optIdx === ex.correctIndex;

    if (isCorrect) {
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      } catch (e) {}
    }

    // Register answer to track daily question streak
    if (onAnswerQuestion) {
      onAnswerQuestion({
        question: ex.question,
        subject: lesson?.subject || subjectInput || "Geral",
        topic: lesson?.topic || topicInput,
        isCorrect,
        source: "tutor",
      });
    }

    // Call socratic evaluation to give insightful explanation without giving answers away if wrong
    setEvaluatingExerciseId(ex.id);
    try {
      const res = await fetch("/api/study/socratic-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: lesson?.topic || topicInput,
          level: ex.level,
          question: ex.question,
          userAnswer: ex.options[optIdx],
          isCorrect,
          isDontKnow: false,
        }),
      });
      const data = await res.json();
      setSocraticFeedbacks((prev) => ({
        ...prev,
        [ex.id]: data.feedback || (isCorrect ? "Excelente! Resposta correta." : ex.socraticHint),
      }));
    } catch (e) {
      setSocraticFeedbacks((prev) => ({
        ...prev,
        [ex.id]: isCorrect ? "Excelente raciocínio!" : `Dica: ${ex.socraticHint}`,
      }));
    } finally {
      setEvaluatingExerciseId(null);
    }
  };

  const handleSelectExerciseDontKnow = async (ex: ExerciseItem) => {
    setSelectedAnswers((prev) => ({ ...prev, [ex.id]: -2 }));

    if (onAnswerQuestion) {
      onAnswerQuestion({
        question: ex.question,
        subject: lesson?.subject || subjectInput || "Geral",
        topic: lesson?.topic || topicInput,
        isCorrect: false,
        source: "tutor",
      });
    }

    setEvaluatingExerciseId(ex.id);
    try {
      const res = await fetch("/api/study/socratic-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: lesson?.topic || topicInput,
          level: ex.level,
          question: ex.question,
          userAnswer: "NÃO SEI",
          isCorrect: false,
          isDontKnow: true,
        }),
      });
      const data = await res.json();
      setSocraticFeedbacks((prev) => ({
        ...prev,
        [ex.id]: data.feedback || `💡 Explicação Didática do Zero:\n\nConceito Central: ${lesson?.briefExplanation || lesson?.topic}\n\nDica Passo a Passo: ${ex.socraticHint}`,
      }));
    } catch (e) {
      setSocraticFeedbacks((prev) => ({
        ...prev,
        [ex.id]: `💡 Explicação Passo a Passo:\n\n${ex.socraticHint}`,
      }));
    } finally {
      setEvaluatingExerciseId(null);
    }
  };

  const handleSaveFlashcards = () => {
    if (!lesson || !lesson.flashcards) return;
    const items: FlashcardItem[] = lesson.flashcards.map((f, i) => ({
      id: `fc-${Date.now()}-${i}`,
      front: f.front,
      back: f.back,
      tag: f.tag || lesson.subject,
      topic: lesson.topic,
      nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
      interval: 1,
      box: 1,
      visualMnemonic: createDefaultVisualMnemonic(f.front, f.back, lesson.topic, f.tag || lesson.subject),
    }));
    onAddFlashcards(items);
    setAddedFlashcards(true);
  };

  const handleSaveSpacedReviews = () => {
    if (!lesson) return;
    const now = Date.now();
    const reviews: SpacedReviewItem[] = [
      {
        id: `sr-1d-${now}`,
        topic: lesson.topic,
        subject: lesson.subject,
        stage: "1D",
        scheduledFor: new Date(now + 1 * 86400000).toISOString(),
        completed: false,
      },
      {
        id: `sr-7d-${now}`,
        topic: lesson.topic,
        subject: lesson.subject,
        stage: "7D",
        scheduledFor: new Date(now + 7 * 86400000).toISOString(),
        completed: false,
      },
      {
        id: `sr-15d-${now}`,
        topic: lesson.topic,
        subject: lesson.subject,
        stage: "15D",
        scheduledFor: new Date(now + 15 * 86400000).toISOString(),
        completed: false,
      },
      {
        id: `sr-30d-${now}`,
        topic: lesson.topic,
        subject: lesson.subject,
        stage: "30D",
        scheduledFor: new Date(now + 30 * 86400000).toISOString(),
        completed: false,
      },
    ];
    onAddSpacedReviews(reviews);
    setAddedSchedule(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* View Switcher: Aula Estruturada vs Conversação e Dúvidas por Voz */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setTutorViewTab("lesson")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
              tutorViewTab === "lesson"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Aula Estruturada (7 Pilares)</span>
          </button>

          <button
            type="button"
            onClick={() => setTutorViewTab("voice_dialog")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
              tutorViewTab === "voice_dialog"
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Conversação & Voz (Idiomas / Dúvidas)</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Voz Ativa
            </span>
          </button>
        </div>

        {streakState && (
          <button
            type="button"
            onClick={onOpenStreak}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{streakState.currentStreak}d Streak</span>
          </button>
        )}
      </div>

      {/* Voice Dialog Component View */}
      {tutorViewTab === "voice_dialog" && (
        <VoiceTutorDialog
          topic={lesson?.topic || topicInput}
          subject={lesson?.subject || subjectInput}
          profile={profile}
          streakState={streakState}
          onAnswerQuestion={onAnswerQuestion}
          onOpenStreak={onOpenStreak}
        />
      )}

      {/* Standard Lesson & Search View */}
      {tutorViewTab === "lesson" && (
        <div className="space-y-6">
          {/* Search & Topic Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Método dos 7 Pilares • Aprendizagem Acelerada & Leitura em Voz Alta</span>
              </div>
              {streakState && (
                <button
                  type="button"
                  onClick={onOpenStreak}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                  <span>Sequência: <strong>{streakState.currentStreak} {streakState.currentStreak === 1 ? "dia" : "dias"}</strong></span>
                  {streakState.todayQuestionsCount > 0 ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                      Hoje: +{streakState.todayQuestionsCount}Q
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                      Faça 1 questão hoje!
                    </span>
                  )}
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sessão de Estudo Ativo & Tutor Socrático
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Digite ou <strong>fale pelo microfone</strong> qualquer conteúdo para receber aula completa com leitura em voz alta, active recall e exercícios progressivos.
            </p>

            {/* Target Course Focus Banner */}
            <div className="mt-3.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300">
                  Foco Exclusivo do Tutor: <strong className="text-indigo-300 font-semibold">"{profile.objective}"</strong>
                  {profile.schoolStage ? ` • ${profile.schoolStage}` : ""}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-fit">
                Perguntas & Didática Calibradas para o seu Curso
              </span>
            </div>

            <form onSubmit={handleGenerateLesson} className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative flex items-center">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Digite ou fale o tema (ex: Sintaxe da Oração, Passato Prossimo, Circuitos)..."
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleStartSearchVoiceInput}
                  className={`absolute right-2 p-1.5 rounded-lg transition ${
                    isMicSearching
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-700/80 hover:bg-slate-700 text-emerald-400"
                  }`}
                  title={isMicSearching ? "Ouvindo... Clique para parar" : "Falar tema por comando de voz"}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Matéria..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition shrink-0 disabled:opacity-50 flex items-center"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 text-slate-950" />
                  {loading ? "Gerando..." : "Estudar"}
                </button>
              </div>
            </form>

            {/* Quick topic pills from user profile */}
            {profile.subjects.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-slate-400 shrink-0 font-medium">Sugestões:</span>
                {profile.priorityTopics?.split(",").map((item, idx) => {
                  const clean = item.trim();
                  if (!clean) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTopicInput(clean);
                        setSubjectInput(profile.subjects[0] || "Geral");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px]"
                    >
                      {clean}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Preparando aula de alto impacto...</p>
              <p className="text-xs text-slate-400">
                Sintetizando explicação, caso prático, active recall, exercícios socráticos e recursos de voz com IA.
              </p>
            </div>
          )}

          {/* Main Lesson Content */}
          {lesson && !loading && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {lesson.subject}
                      </span>
                      <span className="text-xs text-slate-400">Nível: {profile.currentLevel}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-2">{lesson.topic}</h2>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-2">
                    {/* YouTube Explanation Link */}
                    <YouTubeExplanationLink
                      topic={lesson.topic}
                      subject={lesson.subject}
                      variant="button"
                      customLabel="Explicação no YouTube"
                    />

                    {/* Switch to Voice Tutor Dialog */}
                    <button
                      type="button"
                      onClick={() => setTutorViewTab("voice_dialog")}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow transition flex items-center space-x-1.5"
                    >
                      <Mic className="w-4 h-4 text-slate-950" />
                      <span>Conversar por Voz</span>
                    </button>

                    {/* Read Full Overview */}
                    {isTtsSupported && (
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleReadAloud(
                            `${lesson.topic}. ${lesson.briefExplanation}. Exemplo prático: ${lesson.practicalExample}`,
                            "lesson-full-overview"
                          )
                        }
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1 ${
                          activePlayingId === "lesson-full-overview"
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        }`}
                        title="Ouvir Resumo Completo em Voz Alta"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="hidden md:inline">
                          {activePlayingId === "lesson-full-overview" ? "Pausar Leitura" : "Ouvir Aula"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Prerequisites */}
                {lesson.keyPrerequisites && lesson.keyPrerequisites.length > 0 && (
                  <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Pré-requisitos identificados:</span>
                    {lesson.keyPrerequisites.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Explicação Breve e Clara */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center text-emerald-400">
                    <BookOpen className="w-5 h-5 mr-2" />
                    1. Explicação Breve e Clara
                  </h3>

                  {isTtsSupported && (
                    <button
                      type="button"
                      onClick={() => handleToggleReadAloud(lesson.briefExplanation, "section-explanation")}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition flex items-center space-x-1 ${
                        activePlayingId === "section-explanation"
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{activePlayingId === "section-explanation" ? "Ouvindo..." : "Ler em Voz Alta"}</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {lesson.briefExplanation}
                </p>

                {/* YouTube Video Explanation Banner */}
                <div className="pt-2">
                  <YouTubeExplanationLink
                    topic={lesson.topic}
                    subject={lesson.subject}
                    variant="banner"
                    customLabel="Assistir Explicação no YouTube"
                  />
                </div>
              </div>

              {/* 2. Exemplo Prático */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center text-sky-400">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    2. Exemplo Prático Aplicado
                  </h3>

                  {isTtsSupported && (
                    <button
                      type="button"
                      onClick={() => handleToggleReadAloud(lesson.practicalExample, "section-practical")}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition flex items-center space-x-1 ${
                        activePlayingId === "section-practical"
                          ? "bg-sky-500 text-slate-950 border-sky-400 animate-pulse"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{activePlayingId === "section-practical" ? "Ouvindo..." : "Ler Exemplo"}</span>
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-line">
                  {lesson.practicalExample}
                </div>
              </div>

              {/* 3. Perguntas de Recuperação Ativa (Active Recall) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center text-amber-400">
                    <HelpCircle className="w-5 h-5 mr-2" />
                    3. Perguntas de Recuperação Ativa (Sem Resposta Imediata)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Feche os olhos ou <strong>fale sua resposta pelo microfone</strong> antes de conferir. O resgate ativo fortalece a memória de longo prazo.
                  </p>
                </div>

                <div className="space-y-4">
                  {lesson.activeRecallQuestions.map((q, idx) => {
                    const isRevealed = revealedRecallGuidance[idx];
                    const isRecordingThis = activeRecallMicIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-100 flex items-start space-x-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{q.prompt}</span>
                          </p>

                          {isTtsSupported && (
                            <button
                              type="button"
                              onClick={() => handleToggleReadAloud(q.prompt, `recall-prompt-${idx}`)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs shrink-0"
                              title="Ouvir Pergunta"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="relative">
                            <textarea
                              rows={2}
                              value={recallUserInputs[idx] || ""}
                              onChange={(e) =>
                                setRecallUserInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder="Digite ou fale sua síntese mental aqui..."
                              className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStartRecallVoiceInput(idx)}
                              className={`absolute right-2.5 bottom-3 p-1.5 rounded-lg transition ${
                                isRecordingThis
                                  ? "bg-rose-500 text-white animate-pulse"
                                  : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                              }`}
                              title={isRecordingThis ? "Ouvindo... Clique para parar" : "Falar resposta mental por voz"}
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedRecallGuidance((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center transition"
                            >
                              <span>{isRevealed ? "Ocultar Orientação" : "Ver Orientação / Ponto Chave"}</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </button>

                            {isRecordingThis && (
                              <span className="text-[10px] text-emerald-400 font-bold animate-pulse">
                                ● Gravando sua fala...
                              </span>
                            )}
                          </div>
                        </div>

                        {isRevealed && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed flex items-start justify-between">
                            <div>
                              <strong className="block text-amber-300 mb-0.5">Critério de Resgate:</strong>
                              {q.guidance}
                            </div>
                            {isTtsSupported && (
                              <button
                                type="button"
                                onClick={() => handleToggleReadAloud(q.guidance, `recall-guidance-${idx}`)}
                                className="p-1 rounded bg-amber-500/20 text-amber-300 ml-2 shrink-0"
                                title="Ouvir Orientação"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Exercícios do Fácil ao Difícil (com Tutoria Socrática) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center text-emerald-400">
                    <Award className="w-5 h-5 mr-2" />
                    4. Exercícios Progressivos (Fácil → Médio → Difícil)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tutor Socrático: Suas respostas são avaliadas com explicações que estimulam seu raciocínio, com suporte a leitura em áudio.
                  </p>
                </div>

                <div className="space-y-6">
                  {lesson.exercises.map((ex, exIdx) => {
                    const userChoice = selectedAnswers[ex.id];
                    const hasAnswered = userChoice !== undefined;
                    const isCorrect = userChoice === ex.correctIndex;
                    const feedback = socraticFeedbacks[ex.id];

                    return (
                      <div
                        key={ex.id || exIdx}
                        className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-300">
                              Exercício {exIdx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ex.level === "Fácil"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : ex.level === "Médio"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              Nível: {ex.level}
                            </span>
                          </div>

                          {isTtsSupported && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleReadAloud(
                                  `${ex.question}. Alternativas: ${ex.options.join(". ")}`,
                                  `exercise-tts-${ex.id}`
                                )
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center space-x-1"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Ouvir Questão</span>
                            </button>
                          )}
                        </div>

                        <p className="text-sm font-medium text-slate-100 leading-relaxed">
                          {ex.question}
                        </p>

                        <div className="space-y-2">
                          {ex.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isThisSelected = userChoice === optIdx;
                            const isThisCorrect = optIdx === ex.correctIndex;

                            let style = "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800";
                            if (hasAnswered) {
                              if (isThisCorrect) {
                                style = "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold";
                              } else if (isThisSelected && !isThisCorrect) {
                                style = "bg-rose-500/15 border-rose-500 text-rose-300";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectExerciseOption(ex, optIdx)}
                                className={`w-full text-left p-3 rounded-xl border text-xs flex items-center space-x-3 transition ${style}`}
                              >
                                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-slate-800 text-slate-300 shrink-0">
                                  {letter}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {hasAnswered && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                {hasAnswered && isThisSelected && !isThisCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                              </button>
                            );
                          })}

                          {/* Opção Não Sei nos exercícios do Tutor */}
                          <button
                            type="button"
                            onClick={() => handleSelectExerciseDontKnow(ex)}
                            className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                              userChoice === -2
                                ? "bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500 font-semibold"
                                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-amber-500/20 text-amber-300 shrink-0">
                                ?
                              </span>
                              <span>Não sei resolver / Explicar passo a passo</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Pedir Explicação
                            </span>
                          </button>
                        </div>

                        {/* Socratic Feedback Box */}
                        {evaluatingExerciseId === ex.id && (
                          <div className="text-xs text-slate-400 flex items-center space-x-2 animate-pulse">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                            <span>O Tutor Socrático está analisando seu raciocínio...</span>
                          </div>
                        )}

                        {feedback && (
                          <div
                            className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                              isCorrect
                                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                                : "bg-amber-950/20 border-amber-500/40 text-amber-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold flex items-center">
                                <ShieldCheck className="w-4 h-4 mr-1.5" />
                                Feedback do Tutor Socrático:
                              </p>
                              {isTtsSupported && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleReadAloud(feedback, `feedback-tts-${ex.id}`)}
                                  className="px-2 py-0.5 rounded bg-slate-900/60 hover:bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center space-x-1"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Ouvir Feedback</span>
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-line">{feedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Cronograma de Revisão Espaçada (1, 7, 15, 30 dias) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center text-teal-400">
                      <Calendar className="w-5 h-5 mr-2" />
                      6. Cronograma de Revisões Espaçadas (1, 7, 15 e 30 Dias)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Intervalos matemáticos para impedir o esquecimento pela curva de Ebbinghaus.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSpacedReviews}
                    disabled={addedSchedule}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50 flex items-center shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {addedSchedule ? "Revisões Agendadas!" : "Agendar no meu Painel"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">1 Dia (Amanhã)</span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{lesson.spacedRepetitionSchedule.day1}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">7 Dias (Semana que vem)</span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{lesson.spacedRepetitionSchedule.day7}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">15 Dias (Quinzena)</span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{lesson.spacedRepetitionSchedule.day15}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">30 Dias (Mês)</span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{lesson.spacedRepetitionSchedule.day30}</p>
                  </div>
                </div>
              </div>

              {/* 7. Flashcards de Alta Retenção */}
              {lesson.flashcards && lesson.flashcards.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center text-purple-400">
                        <Layers className="w-5 h-5 mr-2" />
                        7. Flashcards Recomendados (Apenas Fatos Essenciais)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Somente para fórmulas, prazos ou conceitos de memorização pura.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveFlashcards}
                      disabled={addedFlashcards}
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {addedFlashcards ? "Adicionado ao Baralho!" : "Salvar no Baralho de Flashcards"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lesson.flashcards.map((card, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-purple-300 font-semibold text-[11px]">
                          <span>Frente (Pergunta / Gatilho):</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-[10px]">
                              {card.tag}
                            </span>
                            {isTtsSupported && (
                              <button
                                type="button"
                                onClick={() => handleToggleReadAloud(`${card.front}. Resposta: ${card.back}`, `card-tts-${idx}`)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300"
                                title="Ouvir Flashcard"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-slate-100">{card.front}</p>
                        <div className="pt-2 border-t border-slate-700/60 text-slate-300">
                          <span className="text-[11px] font-semibold text-emerald-400 block mb-0.5">
                            Verso (Resposta / Definição):
                          </span>
                          <p>{card.back}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
