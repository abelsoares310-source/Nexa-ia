import React, { useState, useEffect } from "react";
import { 
  UserProfile, 
  DiagnosticData, 
  DiagnosticResult, 
  GeneratedPlans, 
  FlashcardItem, 
  SpacedReviewItem, 
  WeeklyCheckin,
  StudyJournalEntry,
  QuestionStreakState,
  QuestionRecord,
  SubjectLearningGoal,
  AssessmentType,
  DailyChallengesState,
  DailyChallengeItem
} from "./types";
import { 
  getStoredProfile, 
  saveStoredProfile, 
  getStoredDiagnostic, 
  saveStoredDiagnostic, 
  getStoredPlans, 
  saveStoredPlans, 
  getStoredFlashcards, 
  saveStoredFlashcards, 
  getStoredSpacedReviews, 
  saveStoredSpacedReviews, 
  getStoredCheckins, 
  saveStoredCheckins,
  getStoredJournalEntries,
  saveStoredJournalEntries,
  getStoredQuestionStreak,
  saveStoredQuestionStreak,
  getStoredQuestionRecords,
  saveStoredQuestionRecords,
  getStoredLearningGoals,
  saveStoredLearningGoals,
  getStoredActiveStudySession
} from "./utils/storage";
import { registerQuestionAnswer, registerQuestionBatch } from "./utils/streak";
import { 
  getStoredDailyChallenges, 
  saveStoredDailyChallenges, 
  generateDailyChallenges, 
  syncDailyChallengesProgress 
} from "./utils/dailyChallenges";
import { PRESET_PROFILES } from "./utils/presets";
import { Navbar, NavTab } from "./components/Navbar";
import { ProfileForm } from "./components/ProfileForm";
import { DiagnosticQuiz } from "./components/DiagnosticQuiz";
import { AnnualPlanView } from "./components/AnnualPlanView";
import { Month1PlanView } from "./components/Month1PlanView";
import { WeeklyRoutineView } from "./components/WeeklyRoutineView";
import { LearningGoalsView } from "./components/LearningGoalsView";
import { ActiveTutorSession } from "./components/ActiveTutorSession";
import { FlashcardsView } from "./components/FlashcardsView";
import { StudyJournalView } from "./components/StudyJournalView";
import { WeeklyTrackingView } from "./components/WeeklyTrackingView";
import { StreakDetailsModal } from "./components/StreakDetailsModal";
import { StudyNowSessionView } from "./components/StudyNowSessionView";
import { PastExamsView } from "./components/PastExamsView";
import { AuthModal } from "./components/AuthModal";
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  auth, 
  saveUserProgressToFirestore, 
  loadUserProgressFromFirestore,
  publishCommunityMetric
} from "./utils/firebase";
import { purgeDemoNumbersFromUserProgress } from "./utils/accountCleanSync";
import { Sparkles, Loader2, Zap, Compass, Clock, Layers, ClipboardCheck, BookOpenCheck, Cloud, CheckCircle2, X, Award } from "lucide-react";
import confetti from "canvas-confetti";


export default function App() {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(() => getStoredDiagnostic().data);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(() => getStoredDiagnostic().result);
  const [plans, setPlans] = useState<GeneratedPlans | null>(getStoredPlans);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(getStoredFlashcards);
  const [spacedReviews, setSpacedReviews] = useState<SpacedReviewItem[]>(getStoredSpacedReviews);
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>(getStoredCheckins);
  const [journalEntries, setJournalEntries] = useState<StudyJournalEntry[]>(getStoredJournalEntries);

  // Quantitative Learning Goals State
  const [learningGoals, setLearningGoals] = useState<SubjectLearningGoal[]>(() => getStoredLearningGoals(profile));

  // Question Streak State & Records
  const [streakState, setStreakState] = useState<QuestionStreakState>(getStoredQuestionStreak);
  const [questionRecords, setQuestionRecords] = useState<QuestionRecord[]>(getStoredQuestionRecords);
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  // User Account & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);
  const [dismissCloudBanner, setDismissCloudBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dismiss_cloud_banner") === "true";
    } catch {
      return false;
    }
  });

  // Daily Challenges State
  const [dailyChallengesState, setDailyChallengesState] = useState<DailyChallengesState>(() => 
    getStoredDailyChallenges({
      profile,
      plans,
      spacedReviews,
      flashcards,
      diagnosticResult,
      questionRecords,
    })
  );

  const [activeTab, setActiveTab] = useState<NavTab>("profile");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");

  const hasActiveStudySession = !!getStoredActiveStudySession();

  // Target topic for interactive tutor session
  const [tutorTopic, setTutorTopic] = useState<string>("");
  const [tutorSubject, setTutorSubject] = useState<string>("");

  // Synchronize changes to localStorage
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (diagnosticData) {
      saveStoredDiagnostic(diagnosticData, diagnosticResult || undefined);
    }
  }, [diagnosticData, diagnosticResult]);

  useEffect(() => {
    if (plans) {
      saveStoredPlans(plans);
    }
  }, [plans]);

  useEffect(() => {
    saveStoredFlashcards(flashcards);
  }, [flashcards]);

  useEffect(() => {
    saveStoredSpacedReviews(spacedReviews);
  }, [spacedReviews]);

  useEffect(() => {
    saveStoredCheckins(checkins);
  }, [checkins]);

  useEffect(() => {
    saveStoredJournalEntries(journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    saveStoredQuestionStreak(streakState);
  }, [streakState]);

  useEffect(() => {
    saveStoredQuestionRecords(questionRecords);
  }, [questionRecords]);

  useEffect(() => {
    saveStoredLearningGoals(learningGoals);
  }, [learningGoals]);

  useEffect(() => {
    saveStoredDailyChallenges(dailyChallengesState);
  }, [dailyChallengesState]);

  // Listen to Firebase Auth state & Hydrate progress from cloud
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        // Wipe local fake/sample benchmark cache upon logging in
        try {
          localStorage.removeItem(`bench_data_${profile.objective}`);
        } catch {}

        try {
          const remote = await loadUserProgressFromFirestore(user.uid);
          if (remote && remote.profile) {
            // Existing user: purge any legacy demo numbers or sample items
            const clean = purgeDemoNumbersFromUserProgress({
              flashcards: remote.flashcards,
              spacedReviews: remote.spacedReviews,
              questionRecords: remote.questionRecords,
              streakState: remote.streakState,
              checkins: remote.checkins,
              journalEntries: remote.journalEntries,
              learningGoals: remote.learningGoals,
              dailyChallenges: remote.dailyChallenges,
            });

            setProfile(remote.profile);
            if (remote.diagnosticData) setDiagnosticData(remote.diagnosticData);
            if (remote.diagnosticResult) setDiagnosticResult(remote.diagnosticResult);
            if (remote.plans) setPlans(remote.plans);
            setFlashcards(clean.flashcards);
            setSpacedReviews(clean.spacedReviews);
            setStreakState(clean.streakState);
            setQuestionRecords(clean.questionRecords);
            setJournalEntries(clean.journalEntries);
            setCheckins(clean.checkins);
            setLearningGoals(clean.learningGoals);
            if (clean.dailyChallenges) {
              setDailyChallengesState(clean.dailyChallenges);
            }
            setLastSyncTime(new Date());

            // Sanitize Firestore copy as well
            await saveUserProgressToFirestore(user.uid, {
              profile: remote.profile,
              diagnosticData: remote.diagnosticData,
              diagnosticResult: remote.diagnosticResult,
              plans: remote.plans,
              flashcards: clean.flashcards,
              spacedReviews: clean.spacedReviews,
              streakState: clean.streakState,
              questionRecords: clean.questionRecords,
              dailyChallenges: clean.dailyChallenges,
              journalEntries: clean.journalEntries,
              checkins: clean.checkins,
              learningGoals: clean.learningGoals,
            });
          } else {
            // Brand new account: purge all initial mock/demo numbers from state
            const clean = purgeDemoNumbersFromUserProgress({
              flashcards,
              spacedReviews,
              questionRecords,
              streakState,
              checkins,
              journalEntries,
              learningGoals,
              dailyChallenges: dailyChallengesState,
            });

            setFlashcards(clean.flashcards);
            setSpacedReviews(clean.spacedReviews);
            setStreakState(clean.streakState);
            setQuestionRecords(clean.questionRecords);
            setJournalEntries(clean.journalEntries);
            setCheckins(clean.checkins);
            setLearningGoals(clean.learningGoals);
            if (clean.dailyChallenges) {
              setDailyChallengesState(clean.dailyChallenges);
            }

            await saveUserProgressToFirestore(user.uid, {
              profile,
              diagnosticData,
              diagnosticResult,
              plans,
              flashcards: clean.flashcards,
              spacedReviews: clean.spacedReviews,
              streakState: clean.streakState,
              questionRecords: clean.questionRecords,
              dailyChallenges: clean.dailyChallenges,
              journalEntries: clean.journalEntries,
              checkins: clean.checkins,
              learningGoals: clean.learningGoals,
            });
            setLastSyncTime(new Date());
          }
        } catch (e) {
          console.warn("Could not sync from Firestore on auth change:", e);
        } finally {
          setIsSyncing(false);
          setIsAuthLoaded(true);
        }
      } else {
        setIsAuthLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Automatic Cloud Sync to Firestore & Real Community Metric publication when user is logged in
  useEffect(() => {
    if (!currentUser || !isAuthLoaded) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const clean = purgeDemoNumbersFromUserProgress({
          flashcards,
          spacedReviews,
          questionRecords,
          streakState,
          checkins,
          journalEntries,
          learningGoals,
          dailyChallenges: dailyChallengesState,
        });

        await saveUserProgressToFirestore(currentUser.uid, {
          profile,
          diagnosticData,
          diagnosticResult,
          plans,
          flashcards: clean.flashcards,
          spacedReviews: clean.spacedReviews,
          streakState: clean.streakState,
          questionRecords: clean.questionRecords,
          dailyChallenges: clean.dailyChallenges,
          journalEntries: clean.journalEntries,
          checkins: clean.checkins,
          learningGoals: clean.learningGoals,
        });

        // Publish real student study metrics to shared Firestore community collection
        const totalCompletedHours = clean.checkins.reduce((acc, c) => acc + (c.completedHours || 0), 0);
        const realAvgAccuracy = clean.checkins.length > 0
          ? Math.round(clean.checkins.reduce((acc, c) => acc + (c.accuracyRate || 0), 0) / clean.checkins.length)
          : (clean.questionRecords.length > 0
              ? Math.round((clean.questionRecords.filter(r => r.isCorrect).length / clean.questionRecords.length) * 100)
              : (diagnosticResult?.score ? Math.min(100, Math.round(diagnosticResult.score * 10)) : 0));

        await publishCommunityMetric(currentUser.uid, {
          displayName: currentUser.displayName || profile.name || "Estudante",
          objective: profile.objective,
          averageAccuracy: realAvgAccuracy,
          totalHoursCompleted: +totalCompletedHours.toFixed(1),
          checkinsCount: clean.checkins.length,
          streakDays: clean.streakState.currentStreak || 0,
          totalQuestionsAnswered: clean.questionRecords.length,
          subjectAccuracies: profile.subjects.map((sub) => {
            const subjectRecords = clean.questionRecords.filter(
              (r) => r.subject?.toLowerCase() === sub.toLowerCase()
            );
            const acc = subjectRecords.length > 0
              ? Math.round((subjectRecords.filter((r) => r.isCorrect).length / subjectRecords.length) * 100)
              : 0;
            return {
              subject: sub,
              accuracy: acc,
            };
          }),
        });

        setLastSyncTime(new Date());
      } catch (err) {
        console.warn("Auto sync failed:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    currentUser,
    isAuthLoaded,
    profile,
    diagnosticData,
    diagnosticResult,
    plans,
    flashcards,
    spacedReviews,
    streakState,
    questionRecords,
    dailyChallengesState,
    journalEntries,
    checkins,
    learningGoals,
  ]);

  // Manual Trigger to Sync Now
  const handleManualSyncNow = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsSyncing(true);
    try {
      const clean = purgeDemoNumbersFromUserProgress({
        flashcards,
        spacedReviews,
        questionRecords,
        streakState,
        checkins,
        journalEntries,
        learningGoals,
        dailyChallenges: dailyChallengesState,
      });

      await saveUserProgressToFirestore(currentUser.uid, {
        profile,
        diagnosticData,
        diagnosticResult,
        plans,
        flashcards: clean.flashcards,
        spacedReviews: clean.spacedReviews,
        streakState: clean.streakState,
        questionRecords: clean.questionRecords,
        dailyChallenges: clean.dailyChallenges,
        journalEntries: clean.journalEntries,
        checkins: clean.checkins,
        learningGoals: clean.learningGoals,
      });
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Manual sync failed:", e);
      alert("Houve um erro ao sincronizar com a nuvem. Tente novamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDismissCloudBanner = () => {
    setDismissCloudBanner(true);
    try {
      localStorage.setItem("dismiss_cloud_banner", "true");
    } catch {}
  };
  const handleAnswerSingleQuestion = (record: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }) => {
    const { updatedState, newRecord, streakIncremented } = registerQuestionAnswer(streakState, record);
    
    // Sync with daily challenges progress
    const { updatedState: updatedChallenges, completedAny, allCompletedNow, bonusEarned } = syncDailyChallengesProgress(
      dailyChallengesState,
      { type: "question_answered", subject: record.subject, topic: record.topic, count: 1 }
    );
    setDailyChallengesState(updatedChallenges);

    if (bonusEarned > 0) {
      updatedState.bonusStreakPoints = (updatedState.bonusStreakPoints || 0) + bonusEarned;
    }
    updatedState.challengesCompletedToday = updatedChallenges.challenges.filter((c) => c.completed).length;

    setStreakState(updatedState);
    setQuestionRecords((prev) => [newRecord, ...prev]);

    if (allCompletedNow || (streakIncremented && updatedState.currentStreak > 1)) {
      try {
        confetti({
          particleCount: allCompletedNow ? 100 : 70,
          spread: 70,
          origin: { y: 0.2, x: 0.9 },
          colors: ["#f97316", "#eab308", "#10b981", "#ef4444"],
        });
      } catch (e) {}
    }
  };

  // Handler for batch questions answered (e.g., diagnostic quiz completion)
  const handleAnswerBatchQuestions = (records: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }[]) => {
    const { updatedState, newRecords, streakIncremented } = registerQuestionBatch(streakState, records);
    
    // Sync with daily challenges progress
    const { updatedState: updatedChallenges, allCompletedNow, bonusEarned } = syncDailyChallengesProgress(
      dailyChallengesState,
      { type: "question_answered", count: records.length }
    );
    setDailyChallengesState(updatedChallenges);

    if (bonusEarned > 0) {
      updatedState.bonusStreakPoints = (updatedState.bonusStreakPoints || 0) + bonusEarned;
    }
    updatedState.challengesCompletedToday = updatedChallenges.challenges.filter((c) => c.completed).length;

    setStreakState(updatedState);
    setQuestionRecords((prev) => [...newRecords, ...prev]);

    if (allCompletedNow || (streakIncremented && updatedState.currentStreak > 1)) {
      try {
        confetti({
          particleCount: allCompletedNow ? 110 : 90,
          spread: 70,
          origin: { y: 0.2, x: 0.9 },
          colors: ["#f97316", "#eab308", "#10b981", "#ef4444"],
        });
      } catch (e) {}
    }
  };

  // Handlers for Daily Challenges
  const handleToggleDailyChallenge = (challengeId: string) => {
    const { updatedState, allCompletedNow, bonusEarned } = syncDailyChallengesProgress(
      dailyChallengesState,
      { type: "manual_toggle", challengeId }
    );
    setDailyChallengesState(updatedState);

    if (bonusEarned > 0) {
      setStreakState((prev) => ({
        ...prev,
        bonusStreakPoints: (prev.bonusStreakPoints || 0) + bonusEarned,
        challengesCompletedToday: updatedState.challenges.filter((c) => c.completed).length,
      }));
    } else {
      setStreakState((prev) => ({
        ...prev,
        challengesCompletedToday: updatedState.challenges.filter((c) => c.completed).length,
      }));
    }

    if (allCompletedNow) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
        });
      } catch (e) {}
    }
  };

  const handleRegenerateDailyChallenges = () => {
    const fresh = generateDailyChallenges({
      profile,
      plans,
      spacedReviews,
      flashcards,
      diagnosticResult,
      questionRecords,
      forceRegenerate: true,
    });
    const newState: DailyChallengesState = {
      date: dailyChallengesState.date,
      challenges: fresh,
      allCompletedBonusClaimed: false,
      totalBonusPointsEarned: 0,
      streakShieldActive: false,
    };
    setDailyChallengesState(newState);
    saveStoredDailyChallenges(newState);
  };

  const handleExecuteChallengeAction = (challenge: DailyChallengeItem) => {
    if (challenge.actionPayload?.topic) {
      setTutorTopic(challenge.actionPayload.topic);
    }
    if (challenge.actionPayload?.subject) {
      setTutorSubject(challenge.actionPayload.subject);
    }

    if (challenge.actionTab === "tutor") {
      setActiveTab("tutor");
    } else if (challenge.actionTab === "flashcards") {
      setActiveTab("flashcards");
    } else if (challenge.actionTab === "diagnostic") {
      setActiveTab("diagnostic");
    } else if (challenge.actionTab === "weekly") {
      setActiveTab("weekly");
    } else {
      setActiveTab("tutor");
    }
  };

  // Handler: Start Custom Assessment (Subject Simulado, Blitz 5, Placement Test)
  const handleStartCustomAssessment = async (type: AssessmentType, subject?: string, count?: number) => {
    setIsGenerating(true);
    const typeLabel = type === "blitz_5" ? "Simulado Blitz (5 Questões)" : type === "subject_simulado" ? `Simulado de ${subject}` : "Nova Avaliação";
    setGenerationStep(`Gerando ${typeLabel} calibrada com IA...`);
    try {
      const res = await fetch("/api/study/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, type, subject, count }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao gerar avaliação");
      }

      const data: DiagnosticData = await res.json();
      setDiagnosticData(data);
      setDiagnosticResult(null);
      setActiveTab("diagnostic");
    } catch (err: any) {
      console.error("Erro ao gerar avaliação:", err);
      alert("Não foi possível gerar esta avaliação no momento. Tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Handler: Start 10-Question Diagnostic Assessment
  const handleStartDiagnostic = async () => {
    setIsGenerating(true);
    setGenerationStep("Construindo o teste diagnóstico de 10 questões baseado no seu perfil...");
    try {
      const res = await fetch("/api/study/generate-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha na geração do diagnóstico");
      }

      const data: DiagnosticData = await res.json();
      setDiagnosticData(data);
      setDiagnosticResult(null);
      setActiveTab("diagnostic");
    } catch (err: any) {
      console.error("Erro no diagnóstico:", err);
      alert("Não foi possível gerar o diagnóstico no momento. Tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Handler: Generate Annual Plan, Month 1 Plan & Weekly Routine
  const handleGeneratePlans = async (diagResult?: DiagnosticResult) => {
    setIsGenerating(true);
    setGenerationStep("Gerando o Plano Anual em tabela, o detalhamento do Mês 1 e a Rotina Semanal...");
    try {
      const res = await fetch("/api/study/generate-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          diagnosticResult: diagResult || diagnosticResult,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha na criação dos planos");
      }

      const data: GeneratedPlans = await res.json();
      setPlans(data);
      setActiveTab("annual");
    } catch (err: any) {
      console.error("Erro ao gerar planos:", err);
      alert("Houve um erro ao processar o plano de estudos. Tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleLaunchTopicTutor = (topic: string, subject?: string) => {
    setTutorTopic(topic);
    if (subject) setTutorSubject(subject);
    setActiveTab("tutor");
  };

  const handleAddFlashcards = (newCards: FlashcardItem[]) => {
    setFlashcards((prev) => [...newCards, ...prev]);
  };

  const handleAddCustomFlashcard = (newCard: FlashcardItem) => {
    setFlashcards((prev) => [newCard, ...prev]);
  };

  const handleAddSpacedReviews = (newReviews: SpacedReviewItem[]) => {
    setSpacedReviews((prev) => [...newReviews, ...prev]);
  };

  const handleToggleMonthComplete = (monthNum: number) => {
    if (!plans) return;
    const updated = {
      ...plans,
      annualPlan: plans.annualPlan.map((m) =>
        m.month === monthNum ? { ...m, completed: !m.completed } : m
      ),
    };
    setPlans(updated);
  };

  const handleToggleBlockComplete = (dayIndex: number, blockId: string) => {
    if (!plans || !plans.weeklyRoutine[dayIndex]) return;
    const updatedRoutine = [...plans.weeklyRoutine];
    const targetDay = updatedRoutine[dayIndex];
    let isCompletedNow = false;
    targetDay.blocks = targetDay.blocks.map((b) => {
      if (b.id === blockId) {
        const nextVal = !b.completed;
        isCompletedNow = nextVal;
        return { ...b, completed: nextVal };
      }
      return b;
    });
    setPlans({ ...plans, weeklyRoutine: updatedRoutine });

    if (isCompletedNow) {
      const { updatedState: updatedChallenges, allCompletedNow, bonusEarned } = syncDailyChallengesProgress(
        dailyChallengesState,
        { type: "block_completed", blockId }
      );
      setDailyChallengesState(updatedChallenges);

      if (bonusEarned > 0) {
        setStreakState((prev) => ({
          ...prev,
          bonusStreakPoints: (prev.bonusStreakPoints || 0) + bonusEarned,
          challengesCompletedToday: updatedChallenges.challenges.filter((c) => c.completed).length,
        }));
      }

      if (allCompletedNow) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10b981", "#f59e0b", "#3b82f6"],
          });
        } catch (e) {}
      }
    }
  };

  const handleToggleSpacedReview = (reviewId: string) => {
    setSpacedReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, completed: !r.completed } : r))
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        diagnosticResult={diagnosticResult}
        hasPlans={!!plans}
        onPrint={handlePrint}
        streakState={streakState}
        onOpenStreak={() => setShowStreakModal(true)}
        dailyChallengesState={dailyChallengesState}
        onOpenChallenges={() => setActiveTab("weekly")}
        hasActiveStudySession={!!getStoredActiveStudySession()}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Global Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto animate-spin">
              <Loader2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">IA Especialista em Aprendizagem</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {generationStep || "Processando estratégias e calibrando seu cronograma..."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* Unauthenticated Cloud Promotion Banner */}
        {!currentUser && !dismissCloudBanner && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Crie sua conta para ler e salvar seu progresso</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Nuvem Segura
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Seu plano anual, rotina semanal, flashcards, caderno de erros e ofensiva ficam salvos e sincronizados em tempo real em qualquer dispositivo.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Criar Conta / Entrar
              </button>
              <button
                type="button"
                onClick={handleDismissCloudBanner}
                title="Dispensar aviso"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Authenticated Cloud Status Bar */}
        {currentUser && (
          <div className="mb-4 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-slate-300 font-medium">
                Conta: <strong className="text-white">{currentUser.displayName || currentUser.email}</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-400">
                {isSyncing ? "Sincronizando com Firestore..." : "Progresso sincronizado na nuvem"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {lastSyncTime && (
                <span className="text-[10px] text-slate-500 hidden md:inline">
                  Salvo às {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isSyncing}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
              >
                {isSyncing ? "Salvando..." : "Sincronizar Agora"}
              </button>
            </div>
          </div>
        )}
        {activeTab === "profile" && (
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            onStartDiagnostic={handleStartDiagnostic}
            onDirectGenerate={() => handleGeneratePlans()}
            isGenerating={isGenerating}
            onSelectTopicForTutor={handleLaunchTopicTutor}
            onStartStudySession={() => setActiveTab("study_now")}
            streakState={streakState}
            dailyChallengesState={dailyChallengesState}
            diagnosticResult={diagnosticResult}
            onNavigateToPastExams={() => setActiveTab("past_exams")}
            questionRecords={questionRecords}
          />
        )}

        {activeTab === "diagnostic" && (
          <DiagnosticQuiz
            diagnosticData={diagnosticData}
            diagnosticResult={diagnosticResult}
            profile={profile}
            onCompleteQuiz={(res) => setDiagnosticResult(res)}
            onGeneratePlansWithResult={(res) => handleGeneratePlans(res)}
            onRestartDiagnostic={handleStartDiagnostic}
            onStartCustomAssessment={handleStartCustomAssessment}
            onLaunchTopicTutor={handleLaunchTopicTutor}
            onAddFlashcard={handleAddCustomFlashcard}
            isGenerating={isGenerating}
            onAnswerBatch={handleAnswerBatchQuestions}
            streakState={streakState}
            onOpenStreak={() => setShowStreakModal(true)}
            onNavigateToPastExams={() => setActiveTab("past_exams")}
          />
        )}

        {activeTab === "past_exams" && (
          <PastExamsView
            profile={profile}
            onRecordQuestions={handleAnswerBatchQuestions}
            onAddFlashcard={(card) => {
              handleAddCustomFlashcard({
                id: `card-exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                front: card.front,
                back: card.back,
                tag: card.tag,
                topic: card.topic,
                nextReviewDate: new Date().toISOString().split("T")[0],
                interval: 1,
                box: 1,
              });
            }}
            onNavigateToStudyNow={(sub, top) => {
              if (sub) setTutorSubject(sub);
              if (top) setTutorTopic(top);
              setActiveTab("study_now");
            }}
          />
        )}

        {activeTab === "annual" && plans && (
          <AnnualPlanView
            plans={plans}
            profile={profile}
            onSelectMonth={() => setActiveTab("monthly")}
            onToggleMonthComplete={handleToggleMonthComplete}
          />
        )}

        {activeTab === "monthly" && plans && (
          <Month1PlanView
            plans={plans}
            profile={profile}
            onLaunchTopicTutor={handleLaunchTopicTutor}
          />
        )}

        {activeTab === "weekly" && plans && (
          <WeeklyRoutineView
            routine={plans.weeklyRoutine}
            profile={profile}
            onLaunchTopicTutor={handleLaunchTopicTutor}
            onToggleBlockComplete={handleToggleBlockComplete}
            onOpenJournal={() => setActiveTab("journal")}
            challengesState={dailyChallengesState}
            onToggleChallenge={handleToggleDailyChallenge}
            onRegenerateChallenges={handleRegenerateDailyChallenges}
            onExecuteChallengeAction={handleExecuteChallengeAction}
            streakDays={streakState.currentStreak}
            spacedReviews={spacedReviews}
            flashcards={flashcards}
            onNavigateToFlashcards={(sub) => setActiveTab("flashcards")}
            onToggleSpacedReview={handleToggleSpacedReview}
          />
        )}

        {activeTab === "study_now" && (
          <StudyNowSessionView
            profile={profile}
            diagnosticResult={diagnosticResult}
            spacedReviews={spacedReviews}
            setSpacedReviews={setSpacedReviews}
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            onAnswerQuestion={handleAnswerSingleQuestion}
            onAddJournalEntry={(entry) => setJournalEntries((prev) => [entry, ...prev])}
            onNavigateToTab={setActiveTab}
            initialSubject={tutorSubject}
            initialTopic={tutorTopic}
          />
        )}

        {activeTab === "goals" && (
          <LearningGoalsView
            goals={learningGoals}
            onUpdateGoals={setLearningGoals}
            profile={profile}
            questionRecords={questionRecords}
            checkins={checkins}
            streakState={streakState}
            onLaunchTopicTutor={handleLaunchTopicTutor}
          />
        )}

        {activeTab === "tutor" && (
          <ActiveTutorSession
            initialTopic={tutorTopic}
            initialSubject={tutorSubject}
            profile={profile}
            onAddFlashcards={handleAddFlashcards}
            onAddSpacedReviews={handleAddSpacedReviews}
            onAnswerQuestion={handleAnswerSingleQuestion}
            streakState={streakState}
            onOpenStreak={() => setShowStreakModal(true)}
          />
        )}

        {activeTab === "flashcards" && (
          <FlashcardsView
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            spacedReviews={spacedReviews}
            setSpacedReviews={setSpacedReviews}
          />
        )}

        {activeTab === "journal" && (
          <StudyJournalView
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
            profile={profile}
            plans={plans}
            onLaunchTopicTutor={handleLaunchTopicTutor}
          />
        )}

        {activeTab === "tracking" && (
          <WeeklyTrackingView
            checkins={checkins}
            setCheckins={setCheckins}
            profile={profile}
            plans={plans}
            flashcards={flashcards}
            spacedReviews={spacedReviews}
            onLaunchTopicTutor={handleLaunchTopicTutor}
            streakState={streakState}
            onOpenStreak={() => setShowStreakModal(true)}
            journalEntries={journalEntries}
            questionRecords={questionRecords}
            onNavigateToFlashcards={(sub) => setActiveTab("flashcards")}
            onToggleSpacedReview={handleToggleSpacedReview}
            currentUser={currentUser}
            diagnosticResult={diagnosticResult}
            onNavigateToDiagnostic={() => setActiveTab("diagnostic")}
          />
        )}
      </main>

      {/* Mobile Bottom Quick Navigation Dock (< 640px) */}
      <nav 
        aria-label="Navegação Rápida Mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        <button
          type="button"
          onClick={() => setActiveTab("study_now")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "study_now" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Zap className={`w-5 h-5 ${activeTab === "study_now" ? "fill-emerald-400" : ""}`} />
            {hasActiveStudySession && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Estudar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("weekly")}
          disabled={!plans}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "weekly" 
              ? "text-emerald-400 font-bold" 
              : !plans 
              ? "text-slate-600 opacity-40 cursor-not-allowed" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Rotina</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("flashcards")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "flashcards" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Flashcards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("past_exams")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "past_exams" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Provas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("diagnostic")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "diagnostic" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Quiz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition ${
            activeTab === "profile" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
      </nav>

      {/* Streak Details & Heatmap Modal */}
      <StreakDetailsModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streakState={streakState}
        questionRecords={questionRecords}
        profile={profile}
        dailyChallengesState={dailyChallengesState}
        onNavigateToChallenges={() => setActiveTab("weekly")}
      />

      {/* Cloud Account & Progress Sync Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onSyncNow={handleManualSyncNow}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Footer */}
      <footer id="app-footer" className="border-t border-slate-900/80 bg-slate-950/60 py-6 text-center text-xs text-slate-400 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 text-slate-500">
            <span>Plano de Estudos & Tutor de Aprendizagem Adaptativo</span>
            <span>
              Neurociência • Recuperação Ativa • Repetição Espaçada (1, 7, 15, 30d)
            </span>
          </div>
          <div id="footer-creator-credit" className="pt-3 border-t border-slate-900/60 w-full text-center">
            <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              ABEL SOARES DE SOUZA NETO, FUNDADOR E CRIADOR DO SITE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
