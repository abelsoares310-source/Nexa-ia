export type LevelType = "Iniciante" | "Intermediário" | "Avançado";

export type SubjectIntent = "learn" | "improve" | "master"; // "learn" = Aprender do Zero, "improve" = Melhorar / Reforçar, "master" = Dominar / Alta Performance

export interface CustomSubjectConfig {
  name: string;
  intent: SubjectIntent;
  difficulty: number; // 0 (Muito Fácil/Dominado) a 10 (Muito Difícil/Crítico)
  specificTopics?: string[]; // Tópicos prioritários para aprender ou melhorar
  targetWeeklyHours?: number; // Carga horária semanal desejada
  currentKnowledgeLevel?: string;
  notes?: string;
}

export interface UserProfile {
  name?: string;
  objective: string;
  targetDate: string;
  currentLevel: LevelType;
  subjects: string[];
  subjectDifficulties?: Record<string, number>;
  subjectIntents?: Record<string, SubjectIntent>;
  customSubjectConfigs?: CustomSubjectConfig[];
  priorityTopics: string;
  difficulties: string;
  strengths: string;
  availableDays: string[];
  dailyHours: number;
  preferredTimes: string;
  learningMethod: string;
  materials: string;
  limitations: string;
  schoolStage?: string;
  schoolGrade?: string;
  isSchoolMode?: boolean;
  isCustomMode?: boolean;
  customModeTitle?: string;
}

export interface DetailedExplanation {
  concept: string;
  stepByStep: string[];
  keyTakeaway: string;
  mnemonicTip?: string;
  whyWrongOptions?: { option: string; reason: string }[];
}

export type AssessmentType = "diagnostic" | "subject_simulado" | "blitz_5" | "placement_test";

export interface DiagnosticQuestion {
  id: number;
  subject: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skillTested: string;
  detailedExplanation?: DetailedExplanation;
}

export interface DiagnosticData {
  id?: string;
  assessmentTitle: string;
  instructions: string;
  assessmentType?: AssessmentType;
  subject?: string;
  questions: DiagnosticQuestion[];
  createdAt?: string;
}

export interface DiagnosticAnswerRecord {
  questionId: number;
  selectedIndex: number; // 0..3 for options, -1 for unanswered, -2 for "dont_know"
  isCorrect: boolean;
  isDontKnow?: boolean;
  timeSpentSeconds?: number;
}

export interface SubjectMasteryBreakdown {
  subject: string;
  total: number;
  correct: number;
  dontKnow: number;
  percentage: number;
  masteryStatus: "mastered" | "solid" | "developing" | "critical";
  strongSkills?: string[];
  attentionSkills?: string[];
}

export interface DiagnosticResult {
  id?: string;
  title?: string;
  assessmentType?: AssessmentType;
  subject?: string;
  score: number;
  total: number;
  percentage: number;
  dontKnowCount?: number;
  answers: DiagnosticAnswerRecord[];
  completedAt: string;
  strongSkills?: string[]; // Pontos fortes / tópicos dominados ("onde a pessoa está boa")
  attentionSkills?: string[]; // Pontos a reforçar
  dontKnowSkills?: string[]; // Tópicos onde o aluno assinalou "Não sei"
  subjectBreakdown?: SubjectMasteryBreakdown[];
}

export interface AnnualMonthPlan {
  month: number;
  monthName: string;
  mainFocus: string;
  topics: string[];
  totalHours: number;
  practicalActivities: string;
  revisionSchedule: string;
  performanceGoal: string;
  completed?: boolean;
}

export interface Month1Plan {
  centralObjective: string;
  hoursPerSubject: { subject: string; hours: number }[];
  sessionDistribution: {
    theoryPercent: number;
    practicePercent: number;
    revisionPercent: number;
    simulationPercent: number;
  };
  weeklyBreakdown: {
    week: number;
    weekGoal: string;
    subjectsAndTopics: string[];
    practiceTasks: string[];
    checkpoint: string;
  }[];
  expectedDeliverables: string[];
  learningVerificationCriteria: string[];
  recoveryPlanIfBehind: string;
}

export interface RoutineBlock {
  id: string;
  timeSlot: string;
  subject: string;
  topic: string;
  activityType: string;
  durationMinutes: number;
  difficultyLevel?: string;
  expectedResult: string;
  completed?: boolean;
}

export interface WeeklyRoutineDay {
  day: string;
  blocks: RoutineBlock[];
}

export interface GeneratedPlans {
  executiveSummary: string;
  annualPlan: AnnualMonthPlan[];
  month1Plan: Month1Plan;
  weeklyRoutine: WeeklyRoutineDay[];
}

export interface ActiveRecallItem {
  prompt: string;
  guidance: string;
}

export interface ExerciseItem {
  id: string;
  level: "Fácil" | "Médio" | "Difícil" | string;
  question: string;
  options: string[];
  correctIndex: number;
  socraticHint: string;
  fullExplanation: string;
}

export interface TopicLesson {
  topic: string;
  subject: string;
  briefExplanation: string;
  keyPrerequisites: string[];
  practicalExample: string;
  activeRecallQuestions: ActiveRecallItem[];
  exercises: ExerciseItem[];
  flashcards: { front: string; back: string; tag: string }[];
  spacedRepetitionSchedule: {
    day1: string;
    day7: string;
    day15: string;
    day30: string;
  };
}

export interface VisualMnemonicData {
  imageUrl?: string;
  imagePrompt?: string;
  metaphorTitle?: string;
  mnemonicAnchor?: string;
  visualElements?: string[];
  visualExplanation?: string;
  style?: string;
  generatedAt?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  tag: string;
  topic: string;
  nextReviewDate: string;
  interval: number;
  box: number;
  visualMnemonic?: VisualMnemonicData;
}

export interface SpacedReviewItem {
  id: string;
  topic: string;
  subject: string;
  stage: "1D" | "7D" | "15D" | "30D";
  scheduledFor: string;
  completed: boolean;
}

export interface SubjectMetric {
  subject: string;
  accuracy: number;
  hoursSpent: number;
  weakTopics: string[];
  status?: "critical" | "warning" | "good" | "mastered";
}

export interface SubjectBenchmarkItem {
  subject: string;
  studentAccuracy: number;
  cohortAverageAccuracy: number;
  cohortApprovedAccuracy: number;
  studentHours: number;
  approvedAvgHours: number;
  status: "above_approved" | "approved_zone" | "near_approved" | "attention";
  weightInContest: string;
  strategicInsight: string;
}

export interface HistoricalBenchmarkData {
  anonymityToken: string;
  targetContest: string;
  contestCategory?: string;
  estimatedCohortSize: string;
  estimatedCutoffScore: number;
  studentOverallAccuracy: number;
  cohortOverallAverage: number;
  cohortApprovedAverage: number;
  percentileRank: string;
  percentileValue: number;
  competitivenessIndex: number;
  approvalProbabilityLabel: "Muito Alta" | "Alta" | "Competitiva / Em Evolução" | "Construindo Base";
  subjectBenchmarks: SubjectBenchmarkItem[];
  competitiveAdvantages: string[];
  strategicGaps: string[];
  roadmapToTop10: string[];
  pedagogicalVerdict: string;
  generatedAt: string;
}

export interface WeeklyCheckin {
  id: string;
  weekNumber: number;
  date: string;
  plannedHours: number;
  completedHours: number;
  completedTopics: string[];
  accuracyRate: number;
  difficultiesFaced: string;
  topicsNeedingRevision: string[];
  adjustmentsMade: string;
  subjectMetrics?: SubjectMetric[];
  perceivedProductivity?: number; // 0-100% de produtividade percebida/qualidade do foco
  focusScore?: number; // 1-10
}

export type AchievementCategory = "all" | "consistency" | "weekly_goals" | "spaced_repetition" | "mastery" | "journal_milestones";
export type AchievementTier = "bronze" | "silver" | "gold" | "diamond";

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: "consistency" | "weekly_goals" | "spaced_repetition" | "mastery" | "journal_milestones";
  tier: AchievementTier;
  iconName: string;
  currentProgress: number;
  maxProgress: number;
  progressUnit: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpPoints: number;
  criteriaLabel: string;
  isSpecialMilestone?: boolean;
  specialTag?: "journal_30d" | "journal_60d" | "journal_90d" | string;
}

export interface JournalMilestoneInfo {
  daysRequired: number;
  badgeId: string;
  title: string;
  subtitle: string;
  description: string;
  tier: "gold" | "diamond";
  xpReward: number;
  unlocked: boolean;
  progress: number;
  progressPercent: number;
  iconName: string;
  benefits: string[];
}

export interface JournalConsistencyStats {
  totalEntries: number;
  distinctDays: number;
  currentStreak: number;
  longestStreak: number;
  milestones: {
    m30: JournalMilestoneInfo;
    m60: JournalMilestoneInfo;
    m90: JournalMilestoneInfo;
  };
  earnedBadgeCount: number;
  totalXpFromJournal: number;
}

export type JournalMood = "confident" | "motivated" | "neutral" | "tired" | "challenged" | "overwhelmed";
export type JournalEntryType = "reflection" | "quick_note" | "insight" | "difficulty" | "breakthrough";
export type SubjectSentimentStatus = "confident" | "improving" | "challenging" | "needs_attention";

export interface JournalSubjectSentiment {
  subject: string;
  sentiment: SubjectSentimentStatus;
  notes?: string;
}

export interface StudyJournalEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string;
  entryType: JournalEntryType;
  overallMood: JournalMood;
  energyLevel: number; // 1-5
  focusScore: number; // 1-10
  content: string;
  subjectSentiments: JournalSubjectSentiment[];
  keyTakeaway?: string;
  tomorrowGoal?: string;
  tags?: string[];
  createdAt: string;
}

export interface SubjectLearningGoal {
  id: string;
  subject: string;
  weeklyQuestionsTarget: number; // Target questions per week (e.g. 30)
  weeklyHoursTarget: number; // Target study hours per week (e.g. 5)
  targetAccuracy: number; // Target accuracy percentage (e.g. 80%)
  priority: "high" | "medium" | "low";
  notes?: string;
  manualQuestionsThisWeek?: number;
  manualHoursThisWeek?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  question: string;
  subject: string;
  topic?: string;
  isCorrect: boolean;
  source: "diagnostic" | "tutor" | "quiz" | "custom";
  timestamp: string;
}

export interface QuestionStreakState {
  currentStreak: number; // consecutive days answering questions
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  totalQuestionsAnswered: number;
  totalCorrect: number;
  todayQuestionsCount: number;
  todayCorrectCount: number;
  history: Record<string, { total: number; correct: number }>; // map 'YYYY-MM-DD' -> stats
  bonusStreakPoints?: number; // Total bonus streak points accumulated through daily challenges
  challengesCompletedToday?: number; // Count of completed challenges today
}

export type DailyChallengeType = 
  | "solve_exercises" 
  | "review_flashcards" 
  | "complete_block" 
  | "spaced_repetition" 
  | "active_tutor"
  | "quick_blitz";

export interface DailyChallengeItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  type: DailyChallengeType;
  subject: string;
  topic?: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  completedAt?: string;
  streakBonusPoints: number; // e.g. 15, 20, 25 points
  badgeIcon: "flame" | "target" | "zap" | "book" | "sparkles" | "check";
  actionLabel: string;
  actionTab?: string;
  actionPayload?: {
    subject?: string;
    topic?: string;
    blockId?: string;
    dayIndex?: number;
  };
}

export interface DailyChallengesState {
  date: string;
  challenges: DailyChallengeItem[];
  allCompletedBonusClaimed: boolean;
  totalBonusPointsEarned: number;
  streakShieldActive?: boolean;
}

export type VoiceTutorMode = 
  | "doubt_solver"          // Tirar Dúvidas Socráticas por Voz
  | "language_practice"      // Prática de Conversação em Línguas (EN, IT, ES, FR, DE, etc.)
  | "socratic_challenge"     // Sabatina Oral / Active Recall Falado
  | "free_dialog";          // Diálogo e Explicação Livre

export interface VoiceLanguageFeedback {
  originalTranscript?: string;
  detectedLanguage?: string;
  grammarCorrections?: string[];
  vocabularySuggestions?: string[];
  fluencyScore?: number; // 1 to 10
  nativePhoneticsTips?: string;
}

export interface VoiceChatMessage {
  id: string;
  role: "user" | "tutor";
  text: string;
  autoSpokenText?: string;
  timestamp: string;
  mode?: VoiceTutorMode;
  targetLanguage?: string; // e.g. "pt-BR", "en-US", "it-IT", "es-ES", "fr-FR"
  languageFeedback?: VoiceLanguageFeedback;
  suggestedSpokenFollowUp?: string;
  keyPoints?: string[];
  isPlayingAudio?: boolean;
}

export type StudySessionMode = 
  | "balanced"            // Tríade Neurocientífica (Revisão + Questões + Flashcards)
  | "questions_focus"     // Simulado Blitz & Resolução Ativa
  | "flashcards_focus"    // Fixação Mnemônica & Flashcards Visuais
  | "weakness_recovery"   // Recuperação Direcionada de Pontos Fracos
  | "quick_sprint"        // Sprint Rápido (15 min)
  | "deep_pomodoro"       // Pomodoro Foco Profundo (25m foco / 5m pausa)
  | "custom";             // Configuração Livre Personalizada

export type StudyTimerMode = "pomodoro" | "countdown" | "stopwatch";

export type StudySessionStage = "config" | "warmup_reviews" | "questions" | "flashcards" | "summary";

export interface StudySessionReviewItem {
  id: string;
  topic: string;
  subject: string;
  questionOrPrompt: string;
  answerSummary: string;
  mnemonicTrigger?: string;
  userRating?: "remembered" | "partial" | "forgot";
  isFromExistingSpaced?: boolean;
  originalSpacedId?: string;
  completed?: boolean;
}

export interface StudySessionQuestionItem {
  id: number | string;
  question: string;
  subject: string;
  topic?: string;
  difficulty?: "Fácil" | "Médio" | "Difícil" | string;
  options: string[];
  correctIndex: number;
  explanation: string;
  socraticHint?: string;
  detailedExplanation?: DetailedExplanation;
  userSelectedIndex?: number;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
}

export interface StudySessionMetrics {
  totalFocusSeconds: number;
  totalPauseSeconds: number;
  totalQuestionsAnswered: number;
  correctQuestionsCount: number;
  accuracyRate: number;
  totalCardsReviewed: number;
  totalReviewsCompleted: number;
  xpEarned: number;
  focusScore: number; // 1 to 10
}

export interface StudyNowSession {
  id: string;
  createdAt: string;
  title: string;
  subject: string;
  topic: string;
  mode: StudySessionMode;
  timerMode: StudyTimerMode;
  targetDurationMinutes: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  isPomodoroBreak?: boolean;
  elapsedSeconds: number;
  remainingSeconds?: number;
  isPaused: boolean;
  isCompleted: boolean;
  completedAt?: string;
  currentStage: StudySessionStage;
  activeQuestionIdx?: number;
  activeFlashcardIdx?: number;
  reviews: StudySessionReviewItem[];
  questions: StudySessionQuestionItem[];
  flashcards: FlashcardItem[];
  pedagogicalGoal: string;
  neuroFocusTip?: string;
  breakdownSummary?: string;
  metrics?: StudySessionMetrics;
  savedToJournal?: boolean;
  journalEntryId?: string;
  pauseLog?: { pausedAt: string; resumedAt?: string; reason?: string }[];
}

export interface DailyStudySummary {
  date: string;
  generatedAt: string;
  biggestProgress: string;
  nextDayFocus: string;
  motivationalBadge?: string;
  suggestedTomorrowSubject?: string;
  suggestedTomorrowTopic?: string;
  neuroTip?: string;
  statsSnapshot: {
    minutesStudied: number;
    sessionsCount: number;
    questionsAnswered: number;
    questionsCorrect: number;
    accuracy: number;
    flashcardsReviewed: number;
    streak: number;
    subjectsStudied: string[];
    topicsStudied: string[];
  };
}



