import { 
  WeeklyCheckin, 
  UserProfile, 
  GeneratedPlans, 
  FlashcardItem, 
  SpacedReviewItem, 
  AchievementBadge, 
  QuestionStreakState,
  StudyJournalEntry,
  JournalConsistencyStats,
  JournalMilestoneInfo
} from "../types";

export function computeJournalConsistency(journalEntries: StudyJournalEntry[] = []): JournalConsistencyStats {
  const totalEntries = journalEntries.length;

  // Extract unique sorted dates (YYYY-MM-DD)
  const dateSet = new Set<string>();
  journalEntries.forEach((entry) => {
    if (entry.date) {
      const cleanDate = entry.date.split("T")[0];
      if (cleanDate) dateSet.add(cleanDate);
    }
  });

  const sortedDates = Array.from(dateSet).sort();
  const distinctDays = sortedDates.length;

  // Calculate longest consecutive streak of days in journal
  let longestStreak = 0;
  let currentStreak = 0;

  if (sortedDates.length > 0) {
    let runningStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1] + "T12:00:00");
      const currDate = new Date(sortedDates[i] + "T12:00:00");
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }

    // Check current active streak up to today or yesterday
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const lastDate = sortedDates[sortedDates.length - 1];

    if (lastDate === today || lastDate === yesterday) {
      currentStreak = 1;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const curr = new Date(sortedDates[i] + "T12:00:00");
        const prev = new Date(sortedDates[i - 1] + "T12:00:00");
        const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  const m30: JournalMilestoneInfo = {
    daysRequired: 30,
    badgeId: "journal-consistency-30d",
    title: "Diário de Ouro (30 Dias)",
    subtitle: "Consistência de Hábito Consolidada",
    description: "Completou 30 dias de registros reflexivos e autoavaliação contínua no Diário de Bordo.",
    tier: "gold",
    xpReward: 1000,
    unlocked: distinctDays >= 30,
    progress: Math.min(distinctDays, 30),
    progressPercent: Math.min(100, Math.round((Math.min(distinctDays, 30) / 30) * 100)),
    iconName: "BookOpenCheck",
    benefits: [
      "Autoconsciência cognitiva e detecção precoce de pontos cegos de estudo.",
      "Consolidação da rotina diária no córtex pré-frontal como hábito estável.",
      "+1.000 XP adicionados ao perfil de estudante.",
    ],
  };

  const m60: JournalMilestoneInfo = {
    daysRequired: 60,
    badgeId: "journal-consistency-60d",
    title: "Mestre da Autorreflexão (60 Dias)",
    subtitle: "Disciplina Inabalável & Domínio Cognitivo",
    description: "Alcançou 60 dias de acompanhamento diário com inteligência emocional e clareza de metas.",
    tier: "diamond",
    xpReward: 2500,
    unlocked: distinctDays >= 60,
    progress: Math.min(distinctDays, 60),
    progressPercent: Math.min(100, Math.round((Math.min(distinctDays, 60) / 60) * 100)),
    iconName: "Sparkles",
    benefits: [
      "Capacidade avançada de calibrar esforço e foco de acordo com o nível de energia.",
      "Redução comprovada de ansiedade pré-prova por meio da rastreabilidade emocional.",
      "+2.500 XP adicionados ao perfil de estudante.",
    ],
  };

  const m90: JournalMilestoneInfo = {
    daysRequired: 90,
    badgeId: "journal-consistency-90d",
    title: "Lenda Suprema da Disciplina (90 Dias)",
    subtitle: "Marco Trimestral Lendário de Alta Performance",
    description: "Alcançou o marco supremo de 90 dias de consistência ininterrupta no Diário de Bordo.",
    tier: "diamond",
    xpReward: 5000,
    unlocked: distinctDays >= 90,
    progress: Math.min(distinctDays, 90),
    progressPercent: Math.min(100, Math.round((Math.min(distinctDays, 90) / 90) * 100)),
    iconName: "Crown",
    benefits: [
      "Status de elite entre os 1% de estudantes com consistência trimestral auditada.",
      "Histórico longitudinal completo de evolução em todas as disciplinas do edital.",
      "+5.000 XP e Selo Lendário de Diamante no perfil.",
    ],
  };

  const earnedBadgeCount = (m30.unlocked ? 1 : 0) + (m60.unlocked ? 1 : 0) + (m90.unlocked ? 1 : 0);
  const totalXpFromJournal = (m30.unlocked ? m30.xpReward : 0) + (m60.unlocked ? m60.xpReward : 0) + (m90.unlocked ? m90.xpReward : 0);

  return {
    totalEntries,
    distinctDays,
    currentStreak,
    longestStreak,
    milestones: { m30, m60, m90 },
    earnedBadgeCount,
    totalXpFromJournal,
  };
}

export function computeAchievements(
  checkins: WeeklyCheckin[],
  profile: UserProfile,
  plans: GeneratedPlans | null,
  flashcards: FlashcardItem[] = [],
  spacedReviews: SpacedReviewItem[] = [],
  streakState?: QuestionStreakState,
  journalEntries: StudyJournalEntry[] = []
): AchievementBadge[] {
  // Journal consistency metrics
  const journalStats = computeJournalConsistency(journalEntries);
  const distinctJournalDays = journalStats.distinctDays;

  // Metrics calculation
  const checkinCount = checkins.length;
  const totalCompletedHours = checkins.reduce((acc, c) => acc + (c.completedHours || 0), 0);
  const avgAccuracy = checkinCount > 0 ? Math.round(checkins.reduce((acc, c) => acc + (c.accuracyRate || 0), 0) / checkinCount) : 0;

  const currentStreak = streakState?.currentStreak || 0;
  const longestStreak = streakState?.longestStreak || 0;
  const totalQuestions = streakState?.totalQuestionsAnswered || 0;

  
  const weeksWith100Percent = checkins.filter(
    (c) => c.plannedHours > 0 && c.completedHours >= c.plannedHours
  ).length;

  const hasHighProductivity = checkins.some(
    (c) => (c.perceivedProductivity || 0) >= 90
  );

  const hasTripleCrown = checkins.some(
    (c) =>
      c.plannedHours > 0 &&
      c.completedHours >= c.plannedHours &&
      c.accuracyRate >= 85 &&
      (c.perceivedProductivity || 80) >= 85
  );

  const hasAdjustmentsMade = checkins.some(
    (c) => (c.adjustmentsMade && c.adjustmentsMade.trim().length > 3) || (c.difficultiesFaced && c.difficultiesFaced.trim().length > 3)
  );

  // Spaced repetition & flashcards metrics
  const completedReviews1D = spacedReviews.filter((r) => r.completed && r.stage === "1D").length;
  const completedReviews7D15D = spacedReviews.filter((r) => r.completed && (r.stage === "7D" || r.stage === "15D")).length;
  const completedReviews30D = spacedReviews.filter((r) => r.completed && r.stage === "30D").length;
  const totalCompletedReviews = spacedReviews.filter((r) => r.completed).length;

  // If there are check-in topics with "Revisão" or completed topics mentioning revision, count them as well
  const checkinRevisionsDone = checkins.reduce((acc, c) => {
    return acc + (c.completedTopics || []).filter(t => t.toLowerCase().includes("revis") || t.toLowerCase().includes("1d") || t.toLowerCase().includes("7d") || t.toLowerCase().includes("15d")).length;
  }, 0);

  const totalFlashcards = flashcards.length;
  const box2PlusCount = flashcards.filter((f) => (f.box || 1) >= 2).length;
  const box3Count = flashcards.filter((f) => (f.box || 1) >= 3).length;

  // Subject Mastery metrics
  const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const subjectMetrics = latestCheckin?.subjectMetrics || [];
  
  const masteredSubjectsCount = subjectMetrics.filter(
    (s) => s.accuracy >= 85 || s.status === "mastered"
  ).length;

  const goodSubjectsCount = subjectMetrics.filter(
    (s) => s.accuracy >= 80 || s.status === "good" || s.status === "mastered"
  ).length;

  const overcameDifficulties = profile.difficulties
    ? subjectMetrics.some(
        (s) =>
          profile.difficulties.toLowerCase().includes(s.subject.toLowerCase()) &&
          s.accuracy >= 75
      )
    : false;

  const badges: AchievementBadge[] = [
    // 1. CONSISTÊNCIA DE ESTUDOS & SEQUÊNCIA DE QUESTÕES
    {
      id: "streak-3d",
      title: "Chama Inicial (3 Dias)",
      description: "Manteve o fogo aceso respondendo questões por 3 dias consecutivos.",
      category: "consistency",
      tier: "bronze",
      iconName: "Flame",
      currentProgress: Math.min(longestStreak, 3),
      maxProgress: 3,
      progressUnit: "dias",
      unlocked: longestStreak >= 3,
      xpPoints: 150,
      criteriaLabel: "3 dias seguidos resolvendo questões",
    },
    {
      id: "streak-7d",
      title: "Semana Imparável (7 Dias)",
      description: "Uma semana inteira sem falhar na prática ativa de exercícios.",
      category: "consistency",
      tier: "silver",
      iconName: "Flame",
      currentProgress: Math.min(longestStreak, 7),
      maxProgress: 7,
      progressUnit: "dias",
      unlocked: longestStreak >= 7,
      xpPoints: 350,
      criteriaLabel: "7 dias seguidos resolvendo questões",
    },
    {
      id: "streak-14d",
      title: "Hábito de Ferro (14 Dias)",
      description: "Duas semanas consecutivas consolidando o neuro-circuito da aprendizagem ativa.",
      category: "consistency",
      tier: "gold",
      iconName: "Flame",
      currentProgress: Math.min(longestStreak, 14),
      maxProgress: 14,
      progressUnit: "dias",
      unlocked: longestStreak >= 14,
      xpPoints: 600,
      criteriaLabel: "14 dias seguidos resolvendo questões",
    },
    {
      id: "streak-30d",
      title: "Lenda da Disciplina (30 Dias)",
      description: "Um mês inteiro ininterrupto de dedicação com resolução diária de questões.",
      category: "consistency",
      tier: "diamond",
      iconName: "Crown",
      currentProgress: Math.min(longestStreak, 30),
      maxProgress: 30,
      progressUnit: "dias",
      unlocked: longestStreak >= 30,
      xpPoints: 1200,
      criteriaLabel: "30 dias seguidos resolvendo questões",
    },
    {
      id: "consistency-1",
      title: "Primeiro Passo",
      description: "Registrou seu primeiro check-in semanal e iniciou o acompanhamento contínuo.",
      category: "consistency",
      tier: "bronze",
      iconName: "Footprints",
      currentProgress: Math.min(checkinCount, 1),
      maxProgress: 1,
      progressUnit: "check-in",
      unlocked: checkinCount >= 1,
      unlockedAt: checkins[0]?.date || undefined,
      xpPoints: 100,
      criteriaLabel: "1 check-in semanal registrado",
    },

    {
      id: "consistency-2",
      title: "Ritmo Inabalável (3 Semanas)",
      description: "Manteve o hábito ativo por 3 semanas consecutivas de estudos auditados.",
      category: "consistency",
      tier: "silver",
      iconName: "Flame",
      currentProgress: Math.min(checkinCount, 3),
      maxProgress: 3,
      progressUnit: "semanas",
      unlocked: checkinCount >= 3,
      unlockedAt: checkins[2]?.date || undefined,
      xpPoints: 250,
      criteriaLabel: "3 semanas consecutivas com check-in",
    },
    {
      id: "consistency-3",
      title: "Muralha de Foco (6 Semanas)",
      description: "Consolidou disciplina de longo prazo completando 6 semanas de acompanhamento.",
      category: "consistency",
      tier: "gold",
      iconName: "ShieldCheck",
      currentProgress: Math.min(checkinCount, 6),
      maxProgress: 6,
      progressUnit: "semanas",
      unlocked: checkinCount >= 6,
      unlockedAt: checkins[5]?.date || undefined,
      xpPoints: 500,
      criteriaLabel: "6 semanas de estudos registradas",
    },
    {
      id: "consistency-4",
      title: "Centurião dos Estudos (50h+)",
      description: "Ultrapassou a marca de 50 horas de estudo efetivamente cumpridas no plano.",
      category: "consistency",
      tier: "silver",
      iconName: "Clock",
      currentProgress: Math.min(+totalCompletedHours.toFixed(1), 50),
      maxProgress: 50,
      progressUnit: "horas",
      unlocked: totalCompletedHours >= 50,
      xpPoints: 300,
      criteriaLabel: "50 horas acumuladas de estudo",
    },
    {
      id: "consistency-5",
      title: "Mestre das 100 Horas",
      description: "Alcançou o clube de elite com mais de 100 horas líquidas de aprendizado.",
      category: "consistency",
      tier: "diamond",
      iconName: "Crown",
      currentProgress: Math.min(+totalCompletedHours.toFixed(1), 100),
      maxProgress: 100,
      progressUnit: "horas",
      unlocked: totalCompletedHours >= 100,
      xpPoints: 800,
      criteriaLabel: "100 horas acumuladas de estudo",
    },
    {
      id: "consistency-6",
      title: "Foco Laser (Deep Work)",
      description: "Registrou uma semana de estudos com qualidade de produtividade e foco ≥ 90%.",
      category: "consistency",
      tier: "silver",
      iconName: "Zap",
      currentProgress: hasHighProductivity ? 1 : 0,
      maxProgress: 1,
      progressUnit: "semana",
      unlocked: hasHighProductivity,
      xpPoints: 200,
      criteriaLabel: "Produtividade percebida ≥ 90% no check-in",
    },

    // BADGES ESPECIAIS: MARCOS DE 30, 60 E 90 DIAS DE CONSISTÊNCIA NO DIÁRIO DE BORDO
    {
      id: "journal-consistency-30d",
      title: "Diário de Ouro (30 Dias)",
      description: "Completou 30 dias de registros e autorreflexões pedagógicas no Diário de Bordo, forjando um hábito cognitivo sólido.",
      category: "consistency",
      tier: "gold",
      iconName: "BookOpenCheck",
      currentProgress: Math.min(distinctJournalDays, 30),
      maxProgress: 30,
      progressUnit: "dias",
      unlocked: distinctJournalDays >= 30,
      xpPoints: 1000,
      criteriaLabel: "30 dias de registros no Diário de Bordo",
      isSpecialMilestone: true,
      specialTag: "journal_30d",
    },
    {
      id: "journal-consistency-60d",
      title: "Mestre da Autorreflexão (60 Dias)",
      description: "Dois meses ininterruptos de consistência no Diário de Bordo. Domínio das emoções de estudo, autodisciplina e clareza de metas.",
      category: "consistency",
      tier: "diamond",
      iconName: "Sparkles",
      currentProgress: Math.min(distinctJournalDays, 60),
      maxProgress: 60,
      progressUnit: "dias",
      unlocked: distinctJournalDays >= 60,
      xpPoints: 2500,
      criteriaLabel: "60 dias de registros no Diário de Bordo",
      isSpecialMilestone: true,
      specialTag: "journal_60d",
    },
    {
      id: "journal-consistency-90d",
      title: "Lenda Suprema da Disciplina (90 Dias)",
      description: "Marco trimestral supremo! 90 dias de consistência no Diário de Bordo. Padrão de excelência absoluto entre os 1% melhores estudantes.",
      category: "consistency",
      tier: "diamond",
      iconName: "Crown",
      currentProgress: Math.min(distinctJournalDays, 90),
      maxProgress: 90,
      progressUnit: "dias",
      unlocked: distinctJournalDays >= 90,
      xpPoints: 5000,
      criteriaLabel: "90 dias de registros no Diário de Bordo",
      isSpecialMilestone: true,
      specialTag: "journal_90d",
    },

    // 2. METAS SEMANAIS BATIDAS
    {
      id: "goals-1",
      title: "Meta Batida 100%",
      description: "Cumpriu 100% ou mais da meta semanal de horas planejadas.",
      category: "weekly_goals",
      tier: "bronze",
      iconName: "Target",
      currentProgress: Math.min(weeksWith100Percent, 1),
      maxProgress: 1,
      progressUnit: "semana",
      unlocked: weeksWith100Percent >= 1,
      xpPoints: 150,
      criteriaLabel: "1 semana com 100%+ das horas cumpridas",
    },
    {
      id: "goals-2",
      title: "Hat-Trick de Metas (3x)",
      description: "Bateu a meta integral de horas em 3 semanas diferentes.",
      category: "weekly_goals",
      tier: "silver",
      iconName: "Trophy",
      currentProgress: Math.min(weeksWith100Percent, 3),
      maxProgress: 3,
      progressUnit: "semanas",
      unlocked: weeksWith100Percent >= 3,
      xpPoints: 350,
      criteriaLabel: "3 semanas com 100%+ das horas cumpridas",
    },
    {
      id: "goals-3",
      title: "Precisão Cirúrgica (85%+ Acertos)",
      description: "Manteve média de acertos superior a 85% na resolução de questões e simulados.",
      category: "weekly_goals",
      tier: "gold",
      iconName: "Crosshair",
      currentProgress: Math.min(avgAccuracy, 85),
      maxProgress: 85,
      progressUnit: "%",
      unlocked: avgAccuracy >= 85,
      xpPoints: 450,
      criteriaLabel: "Média de acertos global ≥ 85%",
    },
    {
      id: "goals-4",
      title: "Tríplice Coroa Semanal",
      description: "Alcançou o ápice semanal: 100%+ das horas, acertos ≥ 85% e foco ≥ 85% juntos.",
      category: "weekly_goals",
      tier: "diamond",
      iconName: "Sparkles",
      currentProgress: hasTripleCrown ? 1 : 0,
      maxProgress: 1,
      progressUnit: "semana",
      unlocked: hasTripleCrown,
      xpPoints: 600,
      criteriaLabel: "Horas ≥ 100%, Acertos ≥ 85% e Foco ≥ 85% simultâneos",
    },
    {
      id: "goals-5",
      title: "Resiliência & Ajuste Ativo",
      description: "Identificou gargalos de aprendizado e aplicou ajustes pedagógicos no cronograma.",
      category: "weekly_goals",
      tier: "bronze",
      iconName: "RotateCcw",
      currentProgress: hasAdjustmentsMade ? 1 : 0,
      maxProgress: 1,
      progressUnit: "ajuste",
      unlocked: hasAdjustmentsMade,
      xpPoints: 120,
      criteriaLabel: "Registrar dificuldades e medidas de ajuste",
    },

    // 3. REPETIÇÃO ESPAÇADA & FLASHCARDS
    {
      id: "spaced-1",
      title: "Curva de Ebbinghaus (1D)",
      description: "Executou o primeiro ciclo de revisão espaçada de 24h para estancar o esquecimento.",
      category: "spaced_repetition",
      tier: "bronze",
      iconName: "RefreshCw",
      currentProgress: Math.min(completedReviews1D + (checkinRevisionsDone > 0 ? 1 : 0), 1),
      maxProgress: 1,
      progressUnit: "bloco 1D",
      unlocked: completedReviews1D >= 1 || checkinRevisionsDone >= 1,
      xpPoints: 120,
      criteriaLabel: "Completar 1 bloco de revisão 1D",
    },
    {
      id: "spaced-2",
      title: "Consolidação 7D & 15D",
      description: "Concluiu blocos de revisão espaçada de 7 ou 15 dias, transferindo dados para a memória média.",
      category: "spaced_repetition",
      tier: "silver",
      iconName: "Layers",
      currentProgress: Math.min(completedReviews7D15D + (checkinRevisionsDone >= 2 ? 1 : 0), 1),
      maxProgress: 1,
      progressUnit: "bloco 7D/15D",
      unlocked: completedReviews7D15D >= 1 || checkinRevisionsDone >= 2,
      xpPoints: 300,
      criteriaLabel: "Completar bloco de revisão 7D ou 15D",
    },
    {
      id: "spaced-3",
      title: "Arquiteto da Memória (Ciclo 30D)",
      description: "Completou o ciclo completo de 30 dias de repetição espaçada em uma disciplina.",
      category: "spaced_repetition",
      tier: "gold",
      iconName: "BrainCircuit",
      currentProgress: Math.min(completedReviews30D + (checkinRevisionsDone >= 3 ? 1 : 0), 1),
      maxProgress: 1,
      progressUnit: "ciclo 30D",
      unlocked: completedReviews30D >= 1 || checkinRevisionsDone >= 3,
      xpPoints: 550,
      criteriaLabel: "Completar ciclo de revisão de 30 dias",
    },
    {
      id: "spaced-4",
      title: "Construtor de Decks (10+ Flashcards)",
      description: "Criou ou adicionou 10 ou mais flashcards ao seu acervo de estudo ativo.",
      category: "spaced_repetition",
      tier: "bronze",
      iconName: "CreditCard",
      currentProgress: Math.min(totalFlashcards, 10),
      maxProgress: 10,
      progressUnit: "flashcards",
      unlocked: totalFlashcards >= 10,
      xpPoints: 150,
      criteriaLabel: "10 flashcards cadastrados no baralho",
    },
    {
      id: "spaced-5",
      title: "Cofre Leitner (Avanço Caixa 2)",
      description: "Evoluiu ao menos 5 cartões para as caixas avançadas de memorização Leitner.",
      category: "spaced_repetition",
      tier: "silver",
      iconName: "Boxes",
      currentProgress: Math.min(box2PlusCount, 5),
      maxProgress: 5,
      progressUnit: "cartões C2+",
      unlocked: box2PlusCount >= 5,
      xpPoints: 350,
      criteriaLabel: "5 flashcards promovidos para Caixa 2 ou 3",
    },
    {
      id: "spaced-6",
      title: "Memória Blindada (Caixa 3)",
      description: "Consolidou 10 ou mais flashcards na Caixa 3 de retenção permanente.",
      category: "spaced_repetition",
      tier: "diamond",
      iconName: "Shield",
      currentProgress: Math.min(box3Count, 10),
      maxProgress: 10,
      progressUnit: "cartões C3",
      unlocked: box3Count >= 10,
      xpPoints: 700,
      criteriaLabel: "10 flashcards no nível máximo (Caixa 3)",
    },

    // 4. MAESTRIA MULTIDISCIPLINAR
    {
      id: "mastery-1",
      title: "Primeira Disciplina Dominada",
      description: "Alcançou status de Maestria (acertos ≥ 85%) em ao menos uma matéria do edital.",
      category: "mastery",
      tier: "bronze",
      iconName: "CheckCheck",
      currentProgress: Math.min(masteredSubjectsCount, 1),
      maxProgress: 1,
      progressUnit: "matéria",
      unlocked: masteredSubjectsCount >= 1,
      xpPoints: 150,
      criteriaLabel: "1 matéria com acertos ≥ 85%",
    },
    {
      id: "mastery-2",
      title: "Polímata Multidisciplinar",
      description: "Manteve 3 ou mais disciplinas simultaneamente com aproveitamento acima de 80%.",
      category: "mastery",
      tier: "gold",
      iconName: "Compass",
      currentProgress: Math.min(goodSubjectsCount, 3),
      maxProgress: 3,
      progressUnit: "matérias",
      unlocked: goodSubjectsCount >= 3,
      xpPoints: 500,
      criteriaLabel: "3 matérias com acertos ≥ 80%",
    },
    {
      id: "mastery-3",
      title: "Gargalo Superado",
      description: "Superou sua disciplina de maior dificuldade inicial alcançando acertos ≥ 75%.",
      category: "mastery",
      tier: "diamond",
      iconName: "Award",
      currentProgress: overcameDifficulties ? 1 : 0,
      maxProgress: 1,
      progressUnit: "superação",
      unlocked: overcameDifficulties,
      xpPoints: 650,
      criteriaLabel: "Matéria difícil superada com acertos ≥ 75%",
    },
  ];

  return badges;
}

export interface UserLevelInfo {
  level: number;
  title: string;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  unlockedCount: number;
  totalBadges: number;
}

export function computeUserLevel(badges: AchievementBadge[]): UserLevelInfo {
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const totalXp = unlockedBadges.reduce((acc, b) => acc + b.xpPoints, 0);

  // Level thresholds (each level takes progressively more XP)
  // Level 1: 0 - 300 XP (Iniciado dos Estudos)
  // Level 2: 300 - 800 XP (Aprendiz Consistente)
  // Level 3: 800 - 1500 XP (Estrategista em Foco)
  // Level 4: 1500 - 2500 XP (Mestre da Retenção)
  // Level 5: 2500 - 4000 XP (Polímata Supremo)
  // Level 6+: 4000+ XP (Lenda Acadêmica)
  
  const levels = [
    { level: 1, title: "Iniciado dos Estudos", minXp: 0, maxXp: 350 },
    { level: 2, title: "Aprendiz Consistente", minXp: 350, maxXp: 900 },
    { level: 3, title: "Estrategista em Foco", minXp: 900, maxXp: 1800 },
    { level: 4, title: "Mestre da Retenção", minXp: 1800, maxXp: 3000 },
    { level: 5, title: "Polímata Supremo", minXp: 3000, maxXp: 4500 },
    { level: 6, title: "Lenda dos Concursos & Provas", minXp: 4500, maxXp: 7000 },
  ];

  let currentLevelObj = levels[0];
  for (const lvl of levels) {
    if (totalXp >= lvl.minXp) {
      currentLevelObj = lvl;
    }
  }

  const range = currentLevelObj.maxXp - currentLevelObj.minXp;
  const currentInLevel = Math.max(0, totalXp - currentLevelObj.minXp);
  const progressPercent = Math.min(100, Math.round((currentInLevel / range) * 100));

  return {
    level: currentLevelObj.level,
    title: currentLevelObj.title,
    totalXp,
    currentLevelXp: totalXp,
    nextLevelXp: currentLevelObj.maxXp,
    progressPercent,
    unlockedCount: unlockedBadges.length,
    totalBadges: badges.length,
  };
}
