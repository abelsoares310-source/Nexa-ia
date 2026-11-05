import { 
  FlashcardItem, 
  SpacedReviewItem, 
  QuestionRecord, 
  QuestionStreakState, 
  WeeklyCheckin, 
  StudyJournalEntry, 
  SubjectLearningGoal, 
  DailyChallengesState
} from "../types";
import { calculateStreakFromHistory, getTodayDateStr } from "./streak";

/**
 * Checks whether an item ID belongs to pre-populated mock/demo data.
 */
export function isDemoItemId(id: string | undefined | null): boolean {
  if (!id) return false;
  return (
    id.startsWith("fc-demo-") ||
    id.startsWith("sr-demo-") ||
    id.startsWith("checkin-demo-") ||
    id.startsWith("checkin-sample-") ||
    id.startsWith("sample-qr-") ||
    id.startsWith("entry-sample-") ||
    id.includes("fc-demo") ||
    id.includes("sr-demo") ||
    id.includes("checkin-sample") ||
    id.includes("checkin-demo")
  );
}

/**
 * Recalculate streak state strictly from authentic question records.
 * If user has no real records, returns an absolute 0-state.
 */
export function recalculateAuthenticStreak(
  records: QuestionRecord[], 
  referenceDateStr: string = getTodayDateStr()
): QuestionStreakState {
  const authenticRecords = records.filter((r) => !isDemoItemId(r.id));

  if (authenticRecords.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: undefined,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      todayQuestionsCount: 0,
      todayCorrectCount: 0,
      history: {},
    };
  }

  const history: Record<string, { total: number; correct: number }> = {};
  let totalCorrect = 0;

  for (const r of authenticRecords) {
    const dateKey = r.date || referenceDateStr;
    if (!history[dateKey]) {
      history[dateKey] = { total: 0, correct: 0 };
    }
    history[dateKey].total += 1;
    if (r.isCorrect) {
      history[dateKey].correct += 1;
      totalCorrect += 1;
    }
  }

  const { currentStreak, longestStreak } = calculateStreakFromHistory(history, referenceDateStr);
  const todayStats = history[referenceDateStr] || { total: 0, correct: 0 };

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: authenticRecords[0]?.date || referenceDateStr,
    totalQuestionsAnswered: authenticRecords.length,
    totalCorrect,
    todayQuestionsCount: todayStats.total,
    todayCorrectCount: todayStats.correct,
    history,
  };
}

/**
 * Purges all synthetic demo/sample numbers from user progress data
 * ensuring a registered account starts from and stores only real student metrics.
 */
export function purgeDemoNumbersFromUserProgress(data: {
  flashcards?: FlashcardItem[];
  spacedReviews?: SpacedReviewItem[];
  questionRecords?: QuestionRecord[];
  streakState?: QuestionStreakState;
  checkins?: WeeklyCheckin[];
  journalEntries?: StudyJournalEntry[];
  learningGoals?: SubjectLearningGoal[];
  dailyChallenges?: DailyChallengesState | null;
}): {
  flashcards: FlashcardItem[];
  spacedReviews: SpacedReviewItem[];
  questionRecords: QuestionRecord[];
  streakState: QuestionStreakState;
  checkins: WeeklyCheckin[];
  journalEntries: StudyJournalEntry[];
  learningGoals: SubjectLearningGoal[];
  dailyChallenges: DailyChallengesState | null;
} {
  // 1. Purge demo flashcards
  const cleanFlashcards = (data.flashcards || []).filter((f) => !isDemoItemId(f.id));

  // 2. Purge demo spaced reviews
  const cleanSpacedReviews = (data.spacedReviews || []).filter((r) => !isDemoItemId(r.id));

  // 3. Purge demo question records
  const cleanQuestionRecords = (data.questionRecords || []).filter((r) => !isDemoItemId(r.id));

  // 4. Purge mock streak numbers and calculate strictly from real question records
  const cleanStreakState = recalculateAuthenticStreak(cleanQuestionRecords);

  // 5. Purge sample check-ins
  const cleanCheckins = (data.checkins || []).filter((c) => !isDemoItemId(c.id));

  // 6. Purge sample journal entries
  const cleanJournalEntries = (data.journalEntries || []).filter((j) => !isDemoItemId(j.id));

  // 7. Purge simulated progress numbers from learning goals (reset achieved counts to 0)
  const cleanLearningGoals = (data.learningGoals || []).map((g) => ({
    ...g,
    manualQuestionsThisWeek: 0,
    manualHoursThisWeek: 0,
  }));

  // 8. Daily challenges
  let cleanDailyChallenges = data.dailyChallenges || null;
  if (cleanDailyChallenges && cleanDailyChallenges.challenges) {
    cleanDailyChallenges = {
      ...cleanDailyChallenges,
      challenges: cleanDailyChallenges.challenges.map((c) => {
        // If no authentic questions solved today, reset to 0
        if (cleanStreakState.todayQuestionsCount === 0 && c.type === "solve_exercises") {
          return { ...c, currentCount: 0, completed: false };
        }
        return c;
      }),
    };
  }

  return {
    flashcards: cleanFlashcards,
    spacedReviews: cleanSpacedReviews,
    questionRecords: cleanQuestionRecords,
    streakState: cleanStreakState,
    checkins: cleanCheckins,
    journalEntries: cleanJournalEntries,
    learningGoals: cleanLearningGoals,
    dailyChallenges: cleanDailyChallenges,
  };
}
