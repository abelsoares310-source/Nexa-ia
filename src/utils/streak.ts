import { QuestionRecord, QuestionStreakState } from "../types";

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateStr(todayStr?: string): string {
  const date = todayStr ? new Date(todayStr + "T12:00:00") : new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateStreakFromHistory(
  history: Record<string, { total: number; correct: number }>,
  referenceDateStr: string = getTodayDateStr()
): { currentStreak: number; longestStreak: number } {
  const activeDates = Object.keys(history)
    .filter((d) => (history[d]?.total || 0) > 0)
    .sort();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak in history
  let maxStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of activeDates) {
    const currentDate = new Date(dateStr + "T12:00:00");
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentRun += 1;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
    prevDate = currentDate;
  }

  // Calculate current active streak relative to reference date (today)
  const todayCount = history[referenceDateStr]?.total || 0;
  const yesterdayStr = getYesterdayDateStr(referenceDateStr);
  const yesterdayCount = history[yesterdayStr]?.total || 0;

  // If user hasn't studied today or yesterday, streak is broken (0)
  if (todayCount === 0 && yesterdayCount === 0) {
    return { currentStreak: 0, longestStreak: maxStreak };
  }

  // Trace backwards consecutively
  let streak = 0;
  let checkDate = new Date(referenceDateStr + "T12:00:00");

  // If user answered today, count today and walk backward
  if (todayCount > 0) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Has not answered today, but answered yesterday: count yesterday and walk backward
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, "0");
    const d = String(checkDate.getDate()).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;

    // If we already counted today, yesterday is the first check in the loop
    if ((history[formatted]?.total || 0) > 0) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak: streak,
    longestStreak: Math.max(maxStreak, streak),
  };
}

export function registerQuestionAnswer(
  currentState: QuestionStreakState,
  record: Omit<QuestionRecord, "id" | "date" | "timestamp">
): { updatedState: QuestionStreakState; newRecord: QuestionRecord; streakIncremented: boolean } {
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr(todayStr);
  const now = new Date();

  const newRecord: QuestionRecord = {
    ...record,
    id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: todayStr,
    timestamp: now.toISOString(),
  };

  const currentHistory = { ...(currentState.history || {}) };
  const todayStats = currentHistory[todayStr] || { total: 0, correct: 0 };

  const wasFirstToday = todayStats.total === 0;

  todayStats.total += 1;
  if (record.isCorrect) {
    todayStats.correct += 1;
  }
  currentHistory[todayStr] = todayStats;

  // Recalculate streak
  const { currentStreak, longestStreak } = calculateStreakFromHistory(currentHistory, todayStr);

  const updatedState: QuestionStreakState = {
    currentStreak,
    longestStreak,
    lastActiveDate: todayStr,
    totalQuestionsAnswered: (currentState.totalQuestionsAnswered || 0) + 1,
    totalCorrect: (currentState.totalCorrect || 0) + (record.isCorrect ? 1 : 0),
    todayQuestionsCount: todayStats.total,
    todayCorrectCount: todayStats.correct,
    history: currentHistory,
  };

  return {
    updatedState,
    newRecord,
    streakIncremented: wasFirstToday,
  };
}

export function registerQuestionBatch(
  currentState: QuestionStreakState,
  records: Omit<QuestionRecord, "id" | "date" | "timestamp">[]
): { updatedState: QuestionStreakState; newRecords: QuestionRecord[]; streakIncremented: boolean } {
  if (records.length === 0) {
    return { updatedState: currentState, newRecords: [], streakIncremented: false };
  }

  const todayStr = getTodayDateStr();
  const now = new Date();
  const currentHistory = { ...(currentState.history || {}) };
  const todayStats = { ...(currentHistory[todayStr] || { total: 0, correct: 0 }) };
  const wasFirstToday = todayStats.total === 0;

  const newRecords: QuestionRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    todayStats.total += 1;
    if (r.isCorrect) {
      todayStats.correct += 1;
    }

    newRecords.push({
      ...r,
      id: `q-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      timestamp: now.toISOString(),
    });
  }

  currentHistory[todayStr] = todayStats;

  const { currentStreak, longestStreak } = calculateStreakFromHistory(currentHistory, todayStr);

  const totalAddedCorrect = records.filter((r) => r.isCorrect).length;

  const updatedState: QuestionStreakState = {
    currentStreak,
    longestStreak,
    lastActiveDate: todayStr,
    totalQuestionsAnswered: (currentState.totalQuestionsAnswered || 0) + records.length,
    totalCorrect: (currentState.totalCorrect || 0) + totalAddedCorrect,
    todayQuestionsCount: todayStats.total,
    todayCorrectCount: todayStats.correct,
    history: currentHistory,
  };

  return {
    updatedState,
    newRecords,
    streakIncremented: wasFirstToday,
  };
}

