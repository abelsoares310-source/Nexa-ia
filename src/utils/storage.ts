import { UserProfile, DiagnosticData, DiagnosticResult, GeneratedPlans, FlashcardItem, SpacedReviewItem, WeeklyCheckin, StudyJournalEntry, QuestionStreakState, QuestionRecord, SubjectLearningGoal, StudyNowSession, DailyStudySummary } from "../types";
import { PRESET_PROFILES } from "./presets";
import { getTodayDateStr, calculateStreakFromHistory } from "./streak";
import { createDefaultVisualMnemonic } from "./visualMnemonic";

const STORAGE_KEYS = {
  PROFILE: "study_tutor_profile",
  DIAGNOSTIC_DATA: "study_tutor_diagnostic_data",
  DIAGNOSTIC_RESULT: "study_tutor_diagnostic_result",
  GENERATED_PLANS: "study_tutor_plans",
  FLASHCARDS: "study_tutor_flashcards",
  SPACED_REVIEWS: "study_tutor_spaced_reviews",
  CHECKINS: "study_tutor_checkins",
  JOURNAL_ENTRIES: "study_tutor_journal_entries",
  ACTIVE_TAB: "study_tutor_active_tab",
  QUESTION_STREAK: "study_tutor_question_streak",
  QUESTION_RECORDS: "study_tutor_question_records",
  LEARNING_GOALS: "study_tutor_learning_goals",
  ASSESSMENT_HISTORY: "study_tutor_assessment_history",
  ACTIVE_STUDY_NOW_SESSION: "study_tutor_active_study_now_session",
  STUDY_NOW_HISTORY: "study_tutor_study_now_history",
  DAILY_SUMMARY: "study_tutor_daily_summary",
};


export function getStoredProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (data) {
      const parsed: UserProfile = JSON.parse(data);
      if (!parsed.subjectDifficulties) {
        parsed.subjectDifficulties = {};
      }
      // Ensure all subjects have a default difficulty (5 if not set)
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        parsed.subjects.forEach((s) => {
          if (typeof parsed.subjectDifficulties![s] !== "number") {
            parsed.subjectDifficulties![s] = 5;
          }
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler profile:", e);
  }
  const defaultProf = { ...PRESET_PROFILES[0].profile };
  if (!defaultProf.subjectDifficulties) {
    defaultProf.subjectDifficulties = {};
    defaultProf.subjects.forEach((s) => {
      defaultProf.subjectDifficulties![s] = 6;
    });
  }
  return defaultProf;
}

export function saveStoredProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function getStoredDiagnostic(): { data: DiagnosticData | null; result: DiagnosticResult | null } {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_DATA);
    const resStr = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_RESULT);
    return {
      data: dataStr ? JSON.parse(dataStr) : null,
      result: resStr ? JSON.parse(resStr) : null,
    };
  } catch (e) {
    return { data: null, result: null };
  }
}

export function saveStoredDiagnostic(data: DiagnosticData, result?: DiagnosticResult): void {
  localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_DATA, JSON.stringify(data));
  if (result) {
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_RESULT, JSON.stringify(result));
  }
}

export function getStoredPlans(): GeneratedPlans | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GENERATED_PLANS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler planos:", e);
  }
  return null;
}

export function saveStoredPlans(plans: GeneratedPlans): void {
  localStorage.setItem(STORAGE_KEYS.GENERATED_PLANS, JSON.stringify(plans));
}

const DEMO_FLASHCARDS: FlashcardItem[] = [
  {
    id: "fc-demo-1",
    front: "Qual a fórmula da velocidade média e quando usá-la?",
    back: "Vm = ΔS / Δt. Usada para quantificar o deslocamento total dividido pelo intervalo de tempo decorrido.",
    tag: "Física",
    topic: "Cinemática Vetorial",
    nextReviewDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    interval: 1,
    box: 1,
    visualMnemonic: createDefaultVisualMnemonic(
      "Qual a fórmula da velocidade média e quando usá-la?",
      "Vm = ΔS / Δt. Usada para quantificar o deslocamento total dividido pelo intervalo de tempo decorrido.",
      "Cinemática Vetorial",
      "Física"
    ),
  },
  {
    id: "fc-demo-2",
    front: "O que diz a propriedade logarítmica do produto: log_b(x * y)?",
    back: "log_b(x * y) = log_b(x) + log_b(y). Transforma multiplicação em soma de expoentes.",
    tag: "Matemática",
    topic: "Logaritmos",
    nextReviewDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    interval: 7,
    box: 2,
    visualMnemonic: createDefaultVisualMnemonic(
      "O que diz a propriedade logarítmica do produto: log_b(x * y)?",
      "log_b(x * y) = log_b(x) + log_b(y). Transforma multiplicação em soma de expoentes.",
      "Logaritmos",
      "Matemática"
    ),
  },
  {
    id: "fc-demo-3",
    front: "O que é a Constante de Avogadro e qual o seu valor aproximado?",
    back: "6,02 × 10²³ entidades elementares/mol. Representa o número de átomos ou moléculas contidos em 1 mol de substância.",
    tag: "Química",
    topic: "Estequiometria",
    nextReviewDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    interval: 1,
    box: 1,
    visualMnemonic: createDefaultVisualMnemonic(
      "O que é a Constante de Avogadro e qual o seu valor aproximado?",
      "6,02 × 10²³ entidades elementares/mol. Representa o número de átomos ou moléculas contidos em 1 mol de substância.",
      "Estequiometria",
      "Química"
    ),
  },
  {
    id: "fc-demo-4",
    front: "Qual a função principal da mitocôndria na célula eucariótica?",
    back: "Respiração celular e síntese de ATP (energia química) através do ciclo de Krebs e fosforilação oxidativa.",
    tag: "Biologia",
    topic: "Citologia",
    nextReviewDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    interval: 15,
    box: 3,
    visualMnemonic: createDefaultVisualMnemonic(
      "Qual a função principal da mitocôndria na célula eucariótica?",
      "Respiração celular e síntese de ATP (energia química) através do ciclo de Krebs e fosforilação oxidativa.",
      "Citologia",
      "Biologia"
    ),
  },
];

const DEMO_SPACED_REVIEWS: SpacedReviewItem[] = [
  {
    id: "sr-demo-1",
    topic: "Cinemática Vetorial & Movimento Oblíquo",
    subject: "Física",
    stage: "1D",
    scheduledFor: new Date(Date.now() - 3 * 86400000).toISOString(),
    completed: false,
  },
  {
    id: "sr-demo-2",
    topic: "Funções Trigonométricas e Logaritmos",
    subject: "Matemática",
    stage: "7D",
    scheduledFor: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed: false,
  },
  {
    id: "sr-demo-3",
    topic: "Estequiometria e Equilíbrio Químico",
    subject: "Química",
    stage: "1D",
    scheduledFor: new Date(Date.now() - 1 * 86400000).toISOString(),
    completed: false,
  },
  {
    id: "sr-demo-4",
    topic: "Citologia e Membrana Plasmática",
    subject: "Biologia",
    stage: "15D",
    scheduledFor: new Date(Date.now() + 1 * 86400000).toISOString(),
    completed: false,
  },
  {
    id: "sr-demo-5",
    topic: "Sintaxe, Regência e Conectivos",
    subject: "Português",
    stage: "30D",
    scheduledFor: new Date(Date.now() + 4 * 86400000).toISOString(),
    completed: false,
  },
];

export function getStoredFlashcards(): FlashcardItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler flashcards:", e);
  }
  return DEMO_FLASHCARDS;
}

export function saveStoredFlashcards(cards: FlashcardItem[]): void {
  localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
}

export function getStoredSpacedReviews(): SpacedReviewItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SPACED_REVIEWS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler revisões:", e);
  }
  return DEMO_SPACED_REVIEWS;
}

export function saveStoredSpacedReviews(reviews: SpacedReviewItem[]): void {
  localStorage.setItem(STORAGE_KEYS.SPACED_REVIEWS, JSON.stringify(reviews));
}

export function getStoredCheckins(): WeeklyCheckin[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler checkins:", e);
  }
  return [
    {
      id: "checkin-demo-1",
      weekNumber: 1,
      date: "01/08/2026",
      plannedHours: 24,
      completedHours: 22.5,
      completedTopics: ["Fundamentos teóricos", "Revisão de pré-requisitos", "30 exercícios introdutórios"],
      accuracyRate: 72,
      difficultiesFaced: "Adaptação ao ritmo de estudo e interpretação de questões mais densas",
      topicsNeedingRevision: ["Pré-requisitos básicos", "Formulário inicial"],
      adjustmentsMade: "Criados flashcards para termos essenciais",
      subjectMetrics: [
        { subject: "Matemática", accuracy: 68, hoursSpent: 6.5, weakTopics: ["Funções de 2º Grau", "Logaritmos"], status: "warning" },
        { subject: "Física", accuracy: 58, hoursSpent: 5.0, weakTopics: ["Cinemática Vetorial", "Leis de Newton"], status: "critical" },
        { subject: "Química", accuracy: 74, hoursSpent: 4.0, weakTopics: ["Estequiometria básica"], status: "warning" },
        { subject: "Biologia", accuracy: 84, hoursSpent: 4.0, weakTopics: ["Organelas celulares"], status: "good" },
        { subject: "Redação", accuracy: 88, hoursSpent: 3.0, weakTopics: ["Conectivos interparágrafos"], status: "mastered" },
      ],
    },
    {
      id: "checkin-demo-2",
      weekNumber: 2,
      date: "08/08/2026",
      plannedHours: 24,
      completedHours: 23,
      completedTopics: ["Aprofundamento de matérias prioritárias", "Simulado intermediário", "Ciclo 1D e 7D"],
      accuracyRate: 78,
      difficultiesFaced: "Gestão do tempo na resolução de questões cronometradas",
      topicsNeedingRevision: ["Questões de nível difícil", "Interpretação gráfica"],
      adjustmentsMade: "Utilização do cronômetro de foco Pomodoro em blocos de 25 min",
      subjectMetrics: [
        { subject: "Matemática", accuracy: 76, hoursSpent: 7.0, weakTopics: ["Geometria Espacial"], status: "warning" },
        { subject: "Física", accuracy: 64, hoursSpent: 5.5, weakTopics: ["Circuitos Elétricos", "Potência"], status: "critical" },
        { subject: "Química", accuracy: 80, hoursSpent: 4.5, weakTopics: ["Termoquímica"], status: "good" },
        { subject: "Biologia", accuracy: 86, hoursSpent: 3.5, weakTopics: ["Genética Mendeliana"], status: "mastered" },
        { subject: "Redação", accuracy: 92, hoursSpent: 2.5, weakTopics: ["Proposta de intervenção detalhada"], status: "mastered" },
      ],
    },
    {
      id: "checkin-demo-3",
      weekNumber: 3,
      date: "15/08/2026",
      plannedHours: 24,
      completedHours: 24,
      completedTopics: ["Exercícios de fixação e aprofundamento", "Revisão quinzenal (15D)", "Simulado temático"],
      accuracyRate: 85,
      difficultiesFaced: "Pequena fadiga no final de semana compensada com descanso ativo",
      topicsNeedingRevision: ["Detalhes conceituais avançados"],
      adjustmentsMade: "Ajuste na alternância entre matérias fáceis e difíceis",
      subjectMetrics: [
        { subject: "Matemática", accuracy: 84, hoursSpent: 7.0, weakTopics: ["Análise Combinatória"], status: "good" },
        { subject: "Física", accuracy: 71, hoursSpent: 6.0, weakTopics: ["Eletrodinâmica"], status: "warning" },
        { subject: "Química", accuracy: 88, hoursSpent: 4.0, weakTopics: ["Isomeria Plana"], status: "mastered" },
        { subject: "Biologia", accuracy: 90, hoursSpent: 4.0, weakTopics: ["Ecologia aplicada"], status: "mastered" },
        { subject: "Redação", accuracy: 95, hoursSpent: 3.0, weakTopics: ["Repertório sociocultural"], status: "mastered" },
      ],
    },
  ];
}

export function saveStoredCheckins(checkins: WeeklyCheckin[]): void {
  localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkins));
}

export function getStoredJournalEntries(): StudyJournalEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler journal entries:", e);
  }

  // Initial sample journal entries demonstrating rich reflections, feelings and subject tracking across the month
  return [
    {
      id: "entry-sample-1",
      date: "2026-08-03",
      title: "Início do Ciclo: Diagnóstico e Ajuste de Ritmo",
      entryType: "reflection",
      overallMood: "motivated",
      energyLevel: 4,
      focusScore: 7,
      content: "Primeiro ciclo de estudos focado em mapear os pontos cegos. O volume inicial de teoria foi desafiador, especialmente nas matérias de cálculo e fórmulas.",
      subjectSentiments: [
        { subject: "Matemática", sentiment: "challenging", notes: "Dificuldade na interpretação de enunciados complexos de probabilidade." },
        { subject: "Física", sentiment: "needs_attention", notes: "Cinemática vetorial e conservação de energia exigem base mais sólida." },
        { subject: "Química", sentiment: "improving", notes: "Tabela periódica e ligações químicas fluindo bem." },
        { subject: "Redação", sentiment: "improving", notes: "Estrutura do texto dissertativo compreendida." },
      ],
      keyTakeaway: "Constância diária vale mais do que maratonas isoladas no fim de semana.",
      tomorrowGoal: "Organizar flashcards para o ciclo D1.",
      tags: ["planejamento", "inicio", "organizacao"],
      createdAt: new Date("2026-08-03T20:00:00Z").toISOString(),
    },
    {
      id: "entry-sample-2",
      date: "2026-08-08",
      title: "Consolidação de Dúvidas & Primeiro Salto de Foco",
      entryType: "insight",
      overallMood: "motivated",
      energyLevel: 5,
      focusScore: 8,
      content: "Aplicação do método de resolução ativa antes da teoria gerou grande avanço. O uso de pomodoros de 25 min com pausas ativas impediu a fadiga do fim de tarde.",
      subjectSentiments: [
        { subject: "Matemática", sentiment: "improving", notes: "Evolução nas funções de 1º e 2º grau com 75% de acertos." },
        { subject: "Física", sentiment: "challenging", notes: "Leis de Newton fixadas após resolver 20 exercícios comentados." },
        { subject: "Química", sentiment: "improving", notes: "Estequiometria compreendida com método das proporções." },
        { subject: "Redação", sentiment: "confident", notes: "Redação completa produzida em 55 minutos." },
      ],
      keyTakeaway: "Resolver questões erradas no dia seguinte consolida o aprendizado definitivo.",
      tomorrowGoal: "Fazer mini-simulado de exatas.",
      tags: ["foco", "questoes", "metodo-ativo"],
      createdAt: new Date("2026-08-08T20:00:00Z").toISOString(),
    },
    {
      id: "entry-sample-3",
      date: "2026-08-12",
      title: "Superação em Resolução de Questões e Foco Sustentado",
      entryType: "reflection",
      overallMood: "motivated",
      energyLevel: 4,
      focusScore: 9,
      content: "Hoje o bloco matinal rendeu muito acima da média. Consegui manter a concentração sem distrações durante 2h30 seguidas. A técnica de desenhar o problema reduziu erros.",
      subjectSentiments: [
        { subject: "Matemática", sentiment: "improving", notes: "Acertei 14 de 16 questões de funções exponenciais e logaritmos." },
        { subject: "Física", sentiment: "improving", notes: "Diagramas de corpo livre fluindo com naturalidade." },
        { subject: "Química", sentiment: "confident", notes: "Termoquímica e entalpia dominadas." },
        { subject: "Redação", sentiment: "confident", notes: "Rascunhei a introdução e D1 com conectivos excelentes em 35 minutos." },
      ],
      keyTakeaway: "Esquematizar o problema no papel antes de fazer cálculos matemáticos reduz erros por afobação.",
      tomorrowGoal: "Fazer o bloco de repetição espaçada (1D) logo na primeira hora do dia.",
      tags: ["foco-profundo", "matematica", "redacao", "superacao"],
      createdAt: new Date("2026-08-12T20:00:00Z").toISOString(),
    },
    {
      id: "entry-sample-4",
      date: "2026-08-15",
      title: "Insight sobre o Ciclo de Repetição Espaçada & Alta Confiança",
      entryType: "insight",
      overallMood: "confident",
      energyLevel: 4,
      focusScore: 9,
      content: "Percebi claramente a diferença que faz o ciclo de 24h, 7D e 15D nos flashcards. Conceitos que na semana passada pareciam difíceis agora vieram de forma quase instantânea na memória ativa.",
      subjectSentiments: [
        { subject: "Matemática", sentiment: "confident", notes: "Geometria plana e trigonometria com índice de 88% de acerto." },
        { subject: "Física", sentiment: "improving", notes: "Revisei as leis de Newton com flashcards e acertei 80% do simulado." },
        { subject: "Química", sentiment: "confident", notes: "Estequiometria e soluções no piloto automático." },
        { subject: "Redação", sentiment: "confident", notes: "Proposta de intervenção nota máxima no simulado." },
      ],
      keyTakeaway: "A retenção melhora drasticamente quando nos testamos ativamente em vez de apenas fazer leitura passiva.",
      tomorrowGoal: "Simulado semanal cronometrado de 40 questões.",
      tags: ["insight", "flashcards", "ebbinghaus", "energia"],
      createdAt: new Date("2026-08-15T20:00:00Z").toISOString(),
    },
  ];
}

export function saveStoredJournalEntries(entries: StudyJournalEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
}

export function getStoredQuestionStreak(): QuestionStreakState {
  const todayStr = getTodayDateStr();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUESTION_STREAK);
    if (data) {
      const parsed: QuestionStreakState = JSON.parse(data);
      // Recalculate streak dynamic against current date
      const { currentStreak, longestStreak } = calculateStreakFromHistory(parsed.history || {}, todayStr);
      parsed.currentStreak = currentStreak;
      parsed.longestStreak = Math.max(parsed.longestStreak || 0, longestStreak);
      parsed.todayQuestionsCount = parsed.history?.[todayStr]?.total || 0;
      parsed.todayCorrectCount = parsed.history?.[todayStr]?.correct || 0;
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler question streak:", e);
  }

  // Initial rich sample history showing 6 days of consistent practice
  const sampleHistory: Record<string, { total: number; correct: number }> = {
    "2026-08-11": { total: 12, correct: 10 },
    "2026-08-12": { total: 15, correct: 13 },
    "2026-08-13": { total: 10, correct: 8 },
    "2026-08-14": { total: 16, correct: 14 },
    "2026-08-15": { total: 18, correct: 16 },
    "2026-08-16": { total: 8, correct: 7 },
  };

  const { currentStreak, longestStreak } = calculateStreakFromHistory(sampleHistory, todayStr);
  const totalQuestionsAnswered = Object.values(sampleHistory).reduce((acc, h) => acc + h.total, 0);
  const totalCorrect = Object.values(sampleHistory).reduce((acc, h) => acc + h.correct, 0);

  return {
    currentStreak: currentStreak > 0 ? currentStreak : 6,
    longestStreak: Math.max(longestStreak, 6),
    lastActiveDate: todayStr,
    totalQuestionsAnswered,
    totalCorrect,
    todayQuestionsCount: sampleHistory[todayStr]?.total || 8,
    todayCorrectCount: sampleHistory[todayStr]?.correct || 7,
    history: sampleHistory,
  };
}

export function saveStoredQuestionStreak(state: QuestionStreakState): void {
  localStorage.setItem(STORAGE_KEYS.QUESTION_STREAK, JSON.stringify(state));
}

export function getStoredQuestionRecords(): QuestionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUESTION_RECORDS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler question records:", e);
  }
  return [
    {
      id: "sample-qr-1",
      date: "2026-08-16",
      question: "Qual o vértice da parábola y = -x² + 4x - 3?",
      subject: "Matemática",
      topic: "Função Quadrática",
      isCorrect: true,
      source: "tutor",
      timestamp: "2026-08-16T10:15:00.000Z",
    },
    {
      id: "sample-qr-2",
      date: "2026-08-16",
      question: "Aplicação da 2ª Lei de Newton em plano inclinado com atrito",
      subject: "Física",
      topic: "Dinâmica e Leis de Newton",
      isCorrect: true,
      source: "tutor",
      timestamp: "2026-08-16T11:00:00.000Z",
    },
    {
      id: "sample-qr-3",
      date: "2026-08-15",
      question: "Cálculo de rendimento em reações termoquímicas exotérmicas",
      subject: "Química",
      topic: "Termoquímica",
      isCorrect: true,
      source: "diagnostic",
      timestamp: "2026-08-15T15:30:00.000Z",
    },
  ];
}

export function saveStoredQuestionRecords(records: QuestionRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.QUESTION_RECORDS, JSON.stringify(records));
}

export function generateDefaultLearningGoals(profile?: UserProfile): SubjectLearningGoal[] {
  const subjects = profile?.subjects && profile.subjects.length > 0 
    ? profile.subjects 
    : ["Matemática", "Física", "Química", "Biologia", "Redação"];

  const difficulties = profile?.subjectDifficulties || {};
  const totalDailyHours = profile?.dailyHours || 4;
  const availableDaysCount = profile?.availableDays?.length || 6;
  const totalWeeklyHours = totalDailyHours * availableDaysCount;

  // Distribute weekly hours proportionally according to difficulty
  let totalDiffScore = 0;
  subjects.forEach((s) => {
    totalDiffScore += difficulties[s] || 5;
  });
  if (totalDiffScore === 0) totalDiffScore = subjects.length * 5;

  return subjects.map((subject, idx) => {
    const diff = difficulties[subject] || (6 - idx % 3);
    const weight = diff / totalDiffScore;
    const allocatedHours = Math.max(2, Math.round(totalWeeklyHours * weight * 10) / 10);
    // Rough estimate: ~6 to 8 questions per planned hour for STEM, ~4-6 for Humanities/Redação
    const isRedacao = subject.toLowerCase().includes("redação");
    const questionsTarget = isRedacao ? Math.max(3, Math.round(allocatedHours * 1.5)) : Math.max(15, Math.round(allocatedHours * 7));
    const targetAccuracy = diff >= 8 ? 70 : diff >= 6 ? 75 : 85;
    const priority: "high" | "medium" | "low" = diff >= 8 ? "high" : diff >= 5 ? "medium" : "low";

    return {
      id: `goal-${subject.toLowerCase().replace(/[^a-z0-9]/g, "")}-${idx}`,
      subject,
      weeklyQuestionsTarget: questionsTarget,
      weeklyHoursTarget: allocatedHours,
      targetAccuracy,
      priority,
      notes: diff >= 8 ? "Prioridade alta devido ao alto peso/dificuldade." : undefined,
      manualQuestionsThisWeek: 0,
      manualHoursThisWeek: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function getStoredLearningGoals(profile?: UserProfile): SubjectLearningGoal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEARNING_GOALS);
    if (data) {
      const parsed: SubjectLearningGoal[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler learning goals:", e);
  }
  return generateDefaultLearningGoals(profile);
}

export function saveStoredLearningGoals(goals: SubjectLearningGoal[]): void {
  localStorage.setItem(STORAGE_KEYS.LEARNING_GOALS, JSON.stringify(goals));
}

export function getStoredAssessmentHistory(): DiagnosticResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_HISTORY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler histórico de avaliações:", e);
  }
  return [];
}

export function saveStoredAssessmentHistory(history: DiagnosticResult[]): void {
  localStorage.setItem(STORAGE_KEYS.ASSESSMENT_HISTORY, JSON.stringify(history));
}

export function addAssessmentToHistory(result: DiagnosticResult): DiagnosticResult[] {
  const current = getStoredAssessmentHistory();
  const updated = [result, ...current.filter((item) => item.id !== result.id && item.completedAt !== result.completedAt)];
  saveStoredAssessmentHistory(updated);
  return updated;
}

export function getStoredActiveStudySession(): StudyNowSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDY_NOW_SESSION);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    console.error("Erro ao carregar sessão ativa de Estudar Agora:", e);
  }
  return null;
}

export function saveStoredActiveStudySession(session: StudyNowSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDY_NOW_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDY_NOW_SESSION, JSON.stringify(session));
    }
  } catch (e) {
    console.error("Erro ao salvar sessão ativa de Estudar Agora:", e);
  }
}

export function clearStoredActiveStudySession(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDY_NOW_SESSION);
}

export function getStoredStudySessionsHistory(): StudyNowSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDY_NOW_HISTORY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler histórico de sessões Estudar Agora:", e);
  }
  return [];
}

export function saveStoredStudySessionsHistory(history: StudyNowSession[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDY_NOW_HISTORY, JSON.stringify(history));
}

export function addStudySessionToHistory(session: StudyNowSession): StudyNowSession[] {
  const current = getStoredStudySessionsHistory();
  const updated = [session, ...current.filter((s) => s.id !== session.id)].slice(0, 30);
  saveStoredStudySessionsHistory(updated);
  return updated;
}

export function getStoredDailySummary(dateStr: string = getTodayDateStr()): DailyStudySummary | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.DAILY_SUMMARY}_${dateStr}`);
    if (raw) {
      const parsed: DailyStudySummary = JSON.parse(raw);
      if (parsed && parsed.date === dateStr) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler resumo diário salvo:", e);
  }
  return null;
}

export function saveStoredDailySummary(summary: DailyStudySummary): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_SUMMARY}_${summary.date}`, JSON.stringify(summary));
  } catch (e) {
    console.error("Erro ao salvar resumo diário:", e);
  }
}




