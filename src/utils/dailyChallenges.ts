import { 
  DailyChallengeItem, 
  DailyChallengesState, 
  GeneratedPlans, 
  UserProfile, 
  SpacedReviewItem, 
  FlashcardItem, 
  DiagnosticResult, 
  QuestionRecord,
  QuestionStreakState
} from "../types";
import { getTodayDateStr } from "./streak";

const STORAGE_KEY_DAILY_CHALLENGES = "study_tutor_daily_challenges";

// Map day index 0-6 to Brazilian Portuguese weekday names matching routine days
export function getTodayWeekdayName(): string {
  const dayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const map = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return map[dayIndex];
}

/**
 * Generates 3 intelligent, contextual daily challenges / micro-tasks
 * based on pending routine blocks for today, pending spaced reviews,
 * subject difficulties, and active learning goals.
 */
export function generateDailyChallenges(params: {
  profile: UserProfile;
  plans: GeneratedPlans | null;
  spacedReviews: SpacedReviewItem[];
  flashcards: FlashcardItem[];
  diagnosticResult: DiagnosticResult | null;
  questionRecords?: QuestionRecord[];
  forceRegenerate?: boolean;
}): DailyChallengeItem[] {
  const todayStr = getTodayDateStr();
  const weekdayName = getTodayWeekdayName();
  const { profile, plans, spacedReviews, flashcards, diagnosticResult } = params;

  // 1. Identify today's scheduled routine blocks
  const todayRoutineDay = plans?.weeklyRoutine?.find(
    (d) => d.day.toLowerCase().includes(weekdayName.toLowerCase()) || weekdayName.toLowerCase().includes(d.day.toLowerCase())
  ) || plans?.weeklyRoutine?.[0];

  const pendingBlocks = (todayRoutineDay?.blocks || []).filter(
    (b) => b.activityType !== "Pausa" && !b.completed
  );

  // 2. Identify pending spaced reviews or flashcard decks
  const pendingReviews = spacedReviews.filter((r) => !r.completed);

  // 3. Identify subjects needing attention (highest difficulty or low diagnostic score)
  const subjects = profile.subjects && profile.subjects.length > 0
    ? profile.subjects
    : ["Matemática", "Física", "Química", "Biologia", "Português"];

  const difficulties = profile.subjectDifficulties || {};
  const sortedSubjects = [...subjects].sort((a, b) => (difficulties[b] || 5) - (difficulties[a] || 5));

  const prioritySubject1 = sortedSubjects[0] || "Matemática";
  const prioritySubject2 = sortedSubjects[1] || "Física";
  const prioritySubject3 = sortedSubjects[2] || "Português";

  // Attention topic from diagnostic if any
  const weakTopicFromDiag = diagnosticResult?.attentionSkills?.[0] || diagnosticResult?.dontKnowSkills?.[0];

  const challenges: DailyChallengeItem[] = [];

  // CHALLENGE 1: Practical Exercise solving (5 questions in priority subject or today's routine block)
  if (pendingBlocks.length > 0) {
    const primaryBlock = pendingBlocks[0];
    challenges.push({
      id: `challenge-${todayStr}-1`,
      date: todayStr,
      title: `Resolver 5 exercícios de ${primaryBlock.subject}`,
      description: `Foque no tópico "${primaryBlock.topic}" planejado na sua rotina de ${weekdayName}.`,
      type: "solve_exercises",
      subject: primaryBlock.subject,
      topic: primaryBlock.topic,
      targetCount: 5,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 20,
      badgeIcon: "flame",
      actionLabel: "Praticar Questões →",
      actionTab: "tutor",
      actionPayload: {
        subject: primaryBlock.subject,
        topic: primaryBlock.topic,
        blockId: primaryBlock.id,
      },
    });
  } else {
    challenges.push({
      id: `challenge-${todayStr}-1`,
      date: todayStr,
      title: `Resolver 5 exercícios de ${prioritySubject1}`,
      description: weakTopicFromDiag
        ? `Reforço ativo no tópico crítico: ${weakTopicFromDiag}.`
        : `Prática ativa para consolidar ${prioritySubject1} (dificuldade nível ${difficulties[prioritySubject1] || 6}/10).`,
      type: "solve_exercises",
      subject: prioritySubject1,
      topic: weakTopicFromDiag || `Fundamentos de ${prioritySubject1}`,
      targetCount: 5,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 20,
      badgeIcon: "flame",
      actionLabel: "Praticar Questões →",
      actionTab: "tutor",
      actionPayload: {
        subject: prioritySubject1,
        topic: weakTopicFromDiag || `Fundamentos de ${prioritySubject1}`,
      },
    });
  }

  // CHALLENGE 2: Flashcard Review / Spaced Repetition (or Blitz de Conceitos)
  if (pendingReviews.length > 0) {
    const review = pendingReviews[0];
    challenges.push({
      id: `challenge-${todayStr}-2`,
      date: todayStr,
      title: `Concluir Revisão Espaçada (${review.stage})`,
      description: `Revise os flashcards do tópico "${review.topic}" em ${review.subject} para evitar a curva de esquecimento.`,
      type: "spaced_repetition",
      subject: review.subject,
      topic: review.topic,
      targetCount: 8,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 15,
      badgeIcon: "target",
      actionLabel: "Revisar Flashcards →",
      actionTab: "flashcards",
      actionPayload: {
        subject: review.subject,
        topic: review.topic,
      },
    });
  } else if (flashcards.length > 0) {
    challenges.push({
      id: `challenge-${todayStr}-2`,
      date: todayStr,
      title: `Revisar 10 Flashcards Ativos`,
      description: `Exercite a recuperação ativa rápida de conceitos-chave em ${prioritySubject2}.`,
      type: "review_flashcards",
      subject: prioritySubject2,
      targetCount: 10,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 15,
      badgeIcon: "target",
      actionLabel: "Abrir Baralho →",
      actionTab: "flashcards",
      actionPayload: {
        subject: prioritySubject2,
      },
    });
  } else {
    challenges.push({
      id: `challenge-${todayStr}-2`,
      date: todayStr,
      title: `Simulado Blitz: 5 Questões Rápidas`,
      description: `Teste seus reflexos com um mini-blitz cronometrado em ${prioritySubject2}.`,
      type: "quick_blitz",
      subject: prioritySubject2,
      targetCount: 5,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 15,
      badgeIcon: "zap",
      actionLabel: "Iniciar Blitz →",
      actionTab: "diagnostic",
      actionPayload: {
        subject: prioritySubject2,
      },
    });
  }

  // CHALLENGE 3: Complete a Study Routine Block or Socratic Tutor Session
  if (pendingBlocks.length > 1) {
    const secondBlock = pendingBlocks[1];
    challenges.push({
      id: `challenge-${todayStr}-3`,
      date: todayStr,
      title: `Completar Bloco: ${secondBlock.subject}`,
      description: `Estude o bloco de ${secondBlock.durationMinutes} min sobre "${secondBlock.topic}".`,
      type: "complete_block",
      subject: secondBlock.subject,
      topic: secondBlock.topic,
      targetCount: 1,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 25,
      badgeIcon: "book",
      actionLabel: "Abrir Rotina Semanal →",
      actionTab: "weekly",
      actionPayload: {
        subject: secondBlock.subject,
        topic: secondBlock.topic,
        blockId: secondBlock.id,
      },
    });
  } else {
    challenges.push({
      id: `challenge-${todayStr}-3`,
      date: todayStr,
      title: `Sessão de Aprendizado no Tutor Socrático`,
      description: `Aprenda do zero ou aprofunde um conceito-chave de ${prioritySubject3} com perguntas guiadas.`,
      type: "active_tutor",
      subject: prioritySubject3,
      topic: `Conceitos Centrais de ${prioritySubject3}`,
      targetCount: 1,
      currentCount: 0,
      completed: false,
      streakBonusPoints: 25,
      badgeIcon: "sparkles",
      actionLabel: "Iniciar com Tutor IA →",
      actionTab: "tutor",
      actionPayload: {
        subject: prioritySubject3,
        topic: `Conceitos Centrais de ${prioritySubject3}`,
      },
    });
  }

  return challenges;
}

/**
 * Gets or creates the daily challenges state for today.
 */
export function getStoredDailyChallenges(params: {
  profile: UserProfile;
  plans: GeneratedPlans | null;
  spacedReviews: SpacedReviewItem[];
  flashcards: FlashcardItem[];
  diagnosticResult: DiagnosticResult | null;
  questionRecords?: QuestionRecord[];
}): DailyChallengesState {
  const todayStr = getTodayDateStr();

  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_CHALLENGES);
    if (raw) {
      const parsed: DailyChallengesState = JSON.parse(raw);
      if (parsed.date === todayStr && Array.isArray(parsed.challenges) && parsed.challenges.length === 3) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler daily challenges:", e);
  }

  // Generate new 3 challenges for today
  const freshChallenges = generateDailyChallenges(params);
  const newState: DailyChallengesState = {
    date: todayStr,
    challenges: freshChallenges,
    allCompletedBonusClaimed: false,
    totalBonusPointsEarned: 0,
    streakShieldActive: false,
  };

  saveStoredDailyChallenges(newState);
  return newState;
}

export function saveStoredDailyChallenges(state: DailyChallengesState): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_CHALLENGES, JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar daily challenges:", e);
  }
}

/**
 * Updates challenges progress based on an answered question, reviewed card, or completed block.
 */
export function syncDailyChallengesProgress(
  currentState: DailyChallengesState,
  event: {
    type: "question_answered" | "flashcard_reviewed" | "block_completed" | "tutor_session_finished" | "manual_toggle";
    subject?: string;
    topic?: string;
    blockId?: string;
    count?: number;
    challengeId?: string;
  }
): { updatedState: DailyChallengesState; completedAny: boolean; allCompletedNow: boolean; bonusEarned: number } {
  const now = new Date().toISOString();
  let completedAny = false;
  let bonusEarned = 0;

  const prevAllCompleted = currentState.challenges.every((c) => c.completed);

  const updatedChallenges = currentState.challenges.map((c) => {
    let shouldUpdate = false;
    let newCount = c.currentCount;
    let newCompleted = c.completed;

    if (event.type === "manual_toggle" && event.challengeId === c.id) {
      newCompleted = !c.completed;
      newCount = newCompleted ? c.targetCount : 0;
      shouldUpdate = true;
    } else if (!c.completed) {
      if (event.type === "question_answered" && (c.type === "solve_exercises" || c.type === "quick_blitz")) {
        newCount = Math.min(c.targetCount, c.currentCount + (event.count || 1));
        shouldUpdate = true;
      } else if (event.type === "flashcard_reviewed" && (c.type === "review_flashcards" || c.type === "spaced_repetition")) {
        newCount = Math.min(c.targetCount, c.currentCount + (event.count || 1));
        shouldUpdate = true;
      } else if (event.type === "block_completed" && c.type === "complete_block") {
        if (!event.blockId || event.blockId === c.actionPayload?.blockId || !c.actionPayload?.blockId) {
          newCount = Math.min(c.targetCount, c.currentCount + 1);
          shouldUpdate = true;
        }
      } else if (event.type === "tutor_session_finished" && (c.type === "active_tutor" || c.type === "solve_exercises")) {
        newCount = Math.min(c.targetCount, c.currentCount + (event.count || 1));
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      const wasCompleted = newCompleted || newCount >= c.targetCount;
      if (!c.completed && wasCompleted) {
        completedAny = true;
        bonusEarned += c.streakBonusPoints;
        return {
          ...c,
          currentCount: c.targetCount,
          completed: true,
          completedAt: now,
        };
      }
      return {
        ...c,
        currentCount: newCount,
        completed: newCompleted,
      };
    }

    return c;
  });

  const nowAllCompleted = updatedChallenges.every((c) => c.completed);
  const allCompletedNow = !prevAllCompleted && nowAllCompleted;

  let totalBonus = currentState.totalBonusPointsEarned + bonusEarned;
  if (allCompletedNow && !currentState.allCompletedBonusClaimed) {
    totalBonus += 50; // +50 bonus streak XP for completing all 3 challenges!
  }

  const updatedState: DailyChallengesState = {
    ...currentState,
    challenges: updatedChallenges,
    totalBonusPointsEarned: totalBonus,
    allCompletedBonusClaimed: nowAllCompleted ? true : currentState.allCompletedBonusClaimed,
    streakShieldActive: nowAllCompleted ? true : currentState.streakShieldActive,
  };

  saveStoredDailyChallenges(updatedState);

  return {
    updatedState,
    completedAny,
    allCompletedNow,
    bonusEarned: allCompletedNow ? bonusEarned + 50 : bonusEarned,
  };
}
