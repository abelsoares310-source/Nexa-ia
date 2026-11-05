import React, { useState, useEffect, useRef } from "react";
import { 
  UserProfile, 
  DiagnosticResult, 
  SpacedReviewItem, 
  FlashcardItem, 
  StudyNowSession, 
  StudySessionStage, 
  StudySessionMode, 
  StudyTimerMode,
  StudyJournalEntry
} from "../types";
import { 
  getStoredActiveStudySession, 
  saveStoredActiveStudySession, 
  clearStoredActiveStudySession, 
  addStudySessionToHistory 
} from "../utils/storage";
import { StudyNowConfigModal } from "./StudyNow/StudyNowConfigModal";
import { StudyNowActiveBar } from "./StudyNow/StudyNowActiveBar";
import { StudyNowReviewsStage } from "./StudyNow/StudyNowReviewsStage";
import { StudyNowQuestionsStage } from "./StudyNow/StudyNowQuestionsStage";
import { StudyNowFlashcardsStage } from "./StudyNow/StudyNowFlashcardsStage";
import { StudyNowSummaryStage } from "./StudyNow/StudyNowSummaryStage";
import { studyAudio } from "../utils/studyAudio";

interface StudyNowSessionViewProps {
  profile: UserProfile;
  diagnosticResult: DiagnosticResult | null;
  spacedReviews: SpacedReviewItem[];
  setSpacedReviews: React.Dispatch<React.SetStateAction<SpacedReviewItem[]>>;
  flashcards: FlashcardItem[];
  setFlashcards: React.Dispatch<React.SetStateAction<FlashcardItem[]>>;
  onAnswerQuestion: (record: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }) => void;
  onAddJournalEntry: (entry: StudyJournalEntry) => void;
  onNavigateToTab: (tab: any) => void;
  initialSubject?: string;
  initialTopic?: string;
}

export const StudyNowSessionView: React.FC<StudyNowSessionViewProps> = ({
  profile,
  diagnosticResult,
  spacedReviews,
  setSpacedReviews,
  flashcards,
  setFlashcards,
  onAnswerQuestion,
  onAddJournalEntry,
  onNavigateToTab,
  initialSubject,
  initialTopic,
}) => {
  const [activeSession, setActiveSession] = useState<StudyNowSession | null>(() => {
    return getStoredActiveStudySession();
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [lastSavedText, setLastSavedText] = useState<string>("Salvo");

  // Timer interval ref
  const timerRef = useRef<any>(null);

  // Auto-save session to localStorage on state change
  useEffect(() => {
    if (activeSession) {
      saveStoredActiveStudySession(activeSession);
      setLastSavedText("Salvo");
    }
  }, [activeSession]);

  // Master Timer Tick (Every 1 second)
  useEffect(() => {
    if (activeSession && !activeSession.isPaused && !activeSession.isCompleted && activeSession.currentStage !== "summary") {
      timerRef.current = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev || prev.isPaused || prev.isCompleted) return prev;

          const newElapsed = prev.elapsedSeconds + 1;
          let newRemaining = prev.remainingSeconds !== undefined ? prev.remainingSeconds - 1 : undefined;

          // Check if countdown expired
          if (newRemaining !== undefined && newRemaining <= 0) {
            studyAudio.playCompletionChime();
            newRemaining = 0;
          }

          return {
            ...prev,
            elapsedSeconds: newElapsed,
            remainingSeconds: newRemaining,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeSession?.isPaused, activeSession?.isCompleted, activeSession?.currentStage]);

  // Start a new AI-generated dynamic study session
  const handleStartSession = async (config: {
    mode: StudySessionMode;
    subject: string;
    topic: string;
    targetDurationMinutes: number;
    timerMode: StudyTimerMode;
    questionsCount: number;
    flashcardsCount: number;
    reviewsCount: number;
    weaknesses: string[];
  }) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/study/generate-dynamic-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          mode: config.mode,
          subject: config.subject,
          topic: config.topic,
          targetDurationMinutes: config.targetDurationMinutes,
          questionsCount: config.questionsCount,
          flashcardsCount: config.flashcardsCount,
          reviewsCount: config.reviewsCount,
          weaknesses: config.weaknesses,
          timerMode: config.timerMode,
        }),
      });

      const data = await response.json();

      const totalSecs = config.targetDurationMinutes * 60;
      const initialStage: StudySessionStage = (data.reviews && data.reviews.length > 0)
        ? "warmup_reviews"
        : (data.questions && data.questions.length > 0)
        ? "questions"
        : "flashcards";

      const newSession: StudyNowSession = {
        id: `session-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: data.title || `Sessão Foco: ${config.subject}`,
        subject: config.subject,
        topic: config.topic,
        mode: config.mode,
        timerMode: config.timerMode,
        targetDurationMinutes: config.targetDurationMinutes,
        pomodoroWorkMinutes: config.timerMode === "pomodoro" ? 25 : undefined,
        pomodoroBreakMinutes: config.timerMode === "pomodoro" ? 5 : undefined,
        isPomodoroBreak: false,
        elapsedSeconds: 0,
        remainingSeconds: config.timerMode === "stopwatch" ? undefined : totalSecs,
        isPaused: false,
        isCompleted: false,
        currentStage: initialStage,
        activeQuestionIdx: 0,
        activeFlashcardIdx: 0,
        reviews: data.reviews || [],
        questions: data.questions || [],
        flashcards: data.flashcards || [],
        pedagogicalGoal: data.pedagogicalGoal || "Consolidar o aprendizado com prática deliberada.",
        neuroFocusTip: data.neuroFocusTip,
        breakdownSummary: data.breakdownSummary,
      };

      // Add new flashcards to user's overall deck if not present
      if (newSession.flashcards.length > 0) {
        setFlashcards((prev) => {
          const existingIds = new Set(prev.map((c) => c.front));
          const toAdd = newSession.flashcards.filter((c) => !existingIds.has(c.front));
          return [...toAdd, ...prev];
        });
      }

      setActiveSession(newSession);
      saveStoredActiveStudySession(newSession);
      studyAudio.playStartChime();

    } catch (error) {
      console.error("Erro ao gerar sessão dinâmica:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Pause
  const handleTogglePause = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const willBePaused = !prev.isPaused;
      const nowIso = new Date().toISOString();
      const updatedPauseLog = prev.pauseLog ? [...prev.pauseLog] : [];

      if (willBePaused) {
        updatedPauseLog.push({ pausedAt: nowIso });
      } else {
        if (updatedPauseLog.length > 0 && !updatedPauseLog[updatedPauseLog.length - 1].resumedAt) {
          updatedPauseLog[updatedPauseLog.length - 1].resumedAt = nowIso;
        }
      }

      return {
        ...prev,
        isPaused: willBePaused,
        pauseLog: updatedPauseLog,
      };
    });
  };

  // Add extra time (+5 min)
  const handleAddExtraTime = (minutes: number) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const currentRemaining = prev.remainingSeconds ?? 0;
      return {
        ...prev,
        remainingSeconds: currentRemaining + minutes * 60,
      };
    });
  };

  // Change active stage (Warmup -> Questions -> Flashcards -> Summary)
  const handleChangeStage = (stage: StudySessionStage) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentStage: stage,
      };
    });
  };

  // Update a review rating
  const handleUpdateReview = (reviewId: string, rating: "remembered" | "partial" | "forgot") => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const updatedReviews = prev.reviews.map((r) =>
        r.id === reviewId ? { ...r, userRating: rating, completed: true } : r
      );
      return {
        ...prev,
        reviews: updatedReviews,
      };
    });

    // Mark matching spaced review completed in main state
    setSpacedReviews((prev) =>
      prev.map((sr) => {
        if (activeSession && sr.subject === activeSession.subject && sr.topic === activeSession.topic) {
          return { ...sr, completed: true };
        }
        return sr;
      })
    );
  };

  // Answer a question in the session
  const handleAnswerQuestion = (questionId: number | string, selectedIndex: number) => {
    if (!activeSession) return;

    const q = activeSession.questions.find((item) => item.id === questionId);
    if (!q) return;

    const isCorrect = selectedIndex === q.correctIndex;

    // Update session state
    setActiveSession((prev) => {
      if (!prev) return null;
      const updatedQList = prev.questions.map((item) => {
        if (item.id === questionId) {
          return {
            ...item,
            userSelectedIndex: selectedIndex,
            isCorrect,
          };
        }
        return item;
      });
      return {
        ...prev,
        questions: updatedQList,
      };
    });

    // Register with App-wide question streak & daily challenges
    onAnswerQuestion({
      question: q.question,
      subject: q.subject || activeSession.subject,
      topic: q.topic || activeSession.topic,
      isCorrect,
      source: "quiz",
    });
  };

  // Rate a flashcard Leitner rating
  const handleRateFlashcard = (cardId: string, rating: "hard" | "good" | "easy") => {
    if (!activeSession) return;

    const intervalBonus = rating === "easy" ? 4 : rating === "good" ? 2 : 1;
    const nextReview = new Date(Date.now() + intervalBonus * 86400000).toISOString();

    setFlashcards((prev) =>
      prev.map((fc) => {
        if (fc.id === cardId) {
          return {
            ...fc,
            box: rating === "hard" ? 1 : Math.min(5, (fc.box || 1) + 1),
            interval: intervalBonus,
            nextReviewDate: nextReview,
          };
        }
        return fc;
      })
    );
  };

  // Finish session
  const handleFinishSession = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const completed: StudyNowSession = {
        ...prev,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        currentStage: "summary",
        isPaused: true,
      };
      addStudySessionToHistory(completed);
      return completed;
    });
  };

  // Save to Study Journal
  const handleSaveToJournal = (entryPartial: Partial<StudyJournalEntry>) => {
    if (!activeSession) return;

    const newEntry: StudyJournalEntry = {
      id: `journal-session-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: entryPartial.title || `Sessão Ativa: ${activeSession.subject}`,
      entryType: entryPartial.entryType || "reflection",
      overallMood: entryPartial.overallMood || "confident",
      energyLevel: entryPartial.energyLevel || 4,
      focusScore: entryPartial.focusScore || 9,
      content: entryPartial.content || "Sessão focada com resolução de questões e flashcards.",
      subjectSentiments: [
        {
          subject: activeSession.subject,
          sentiment: "improving",
          notes: `Tempo de foco: ${Math.round(activeSession.elapsedSeconds / 60)} min`,
        },
      ],
      tomorrowGoal: entryPartial.tomorrowGoal,
      tags: entryPartial.tags || [activeSession.subject, "Estudar Agora"],
      createdAt: new Date().toISOString(),
    };

    onAddJournalEntry(newEntry);

    setActiveSession((prev) => (prev ? { ...prev, savedToJournal: true, journalEntryId: newEntry.id } : null));
  };

  // Restart / Reset to setup modal
  const handleRestartNewSession = () => {
    clearStoredActiveStudySession();
    setActiveSession(null);
  };

  // Log pause mind-dump
  const handleLogPauseReason = (reason: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const pauseLog = prev.pauseLog ? [...prev.pauseLog] : [];
      if (pauseLog.length > 0) {
        pauseLog[pauseLog.length - 1].reason = reason;
      }
      return { ...prev, pauseLog };
    });
  };

  return (
    <div className={`transition-all ${isZenMode ? "fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-4 sm:p-8" : ""}`}>
      {/* If no active session or in config stage, show configuration setup */}
      {!activeSession || activeSession.currentStage === "config" ? (
        <StudyNowConfigModal
          profile={profile}
          diagnosticResult={diagnosticResult}
          spacedReviews={spacedReviews}
          flashcards={flashcards}
          isGenerating={isGenerating}
          onStartSession={handleStartSession}
          hasActiveSession={!!activeSession}
          onResumeActiveSession={() => {
            if (activeSession) {
              setActiveSession({ ...activeSession, currentStage: activeSession.currentStage || "questions" });
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Top Sticky Active Bar with Timer & Controls */}
          <StudyNowActiveBar
            session={activeSession}
            onTogglePause={handleTogglePause}
            onAddExtraTime={handleAddExtraTime}
            onChangeStage={handleChangeStage}
            onFinishSession={handleFinishSession}
            isZenMode={isZenMode}
            onToggleZenMode={() => setIsZenMode(!isZenMode)}
            lastSavedText={lastSavedText}
            onLogPauseReason={handleLogPauseReason}
          />

          {/* Render Current Active Stage */}
          {activeSession.currentStage === "warmup_reviews" && (
            <StudyNowReviewsStage
              session={activeSession}
              onUpdateReview={handleUpdateReview}
              onNextStage={() => handleChangeStage("questions")}
            />
          )}

          {activeSession.currentStage === "questions" && (
            <StudyNowQuestionsStage
              session={activeSession}
              onAnswerQuestion={handleAnswerQuestion}
              onNextStage={() => handleChangeStage("flashcards")}
            />
          )}

          {activeSession.currentStage === "flashcards" && (
            <StudyNowFlashcardsStage
              session={activeSession}
              onRateFlashcard={handleRateFlashcard}
              onNextStage={() => handleChangeStage("summary")}
            />
          )}

          {activeSession.currentStage === "summary" && (
            <StudyNowSummaryStage
              session={activeSession}
              onSaveToJournal={handleSaveToJournal}
              onRestartNewSession={handleRestartNewSession}
              onNavigateToTab={onNavigateToTab}
            />
          )}
        </div>
      )}
    </div>
  );
};
