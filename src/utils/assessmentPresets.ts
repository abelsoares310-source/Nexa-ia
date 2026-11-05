import { DiagnosticData, DiagnosticQuestion, DiagnosticResult, SubjectMasteryBreakdown, UserProfile } from "../types";

export interface AssessmentTemplateOption {
  id: string;
  type: "diagnostic" | "subject_simulado" | "blitz_5" | "placement_test";
  title: string;
  shortDesc: string;
  questionCount: number;
  estimatedMinutes: number;
  badge: string;
  badgeColor: string;
  iconType: "sparkles" | "target" | "zap" | "scale";
}

export const ASSESSMENT_TEMPLATES: AssessmentTemplateOption[] = [
  {
    id: "general_diagnostic_10",
    type: "diagnostic",
    title: "Diagnóstico Global de Nivelamento",
    shortDesc: "Avaliação panorâmica cobrindo todas as matérias do seu perfil para mapear pontos fortes e lacunas.",
    questionCount: 10,
    estimatedMinutes: 15,
    badge: "Completo",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    iconType: "sparkles",
  },
  {
    id: "blitz_5_daily",
    type: "blitz_5",
    title: "Simulado Rápido Blitz Diário",
    shortDesc: "5 questões dinâmicas e focadas para testar retenção e alimentar sua sequência diária em poucos minutos.",
    questionCount: 5,
    estimatedMinutes: 6,
    badge: "Rápido (6 min)",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    iconType: "zap",
  },
  {
    id: "subject_focused_simulado",
    type: "subject_simulado",
    title: "Simulado Temático por Matéria",
    shortDesc: "8 questões aprofundadas focadas exclusivamente em uma disciplina para certificar seu nível de maestria.",
    questionCount: 8,
    estimatedMinutes: 12,
    badge: "Específico",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    iconType: "target",
  },
  {
    id: "placement_progressive_test",
    type: "placement_test",
    title: "Teste de Nivelamento Progressivo",
    shortDesc: "Perguntas em degrau (Fácil → Médio → Avançado) para determinar com precisão seu teto de proficiência.",
    questionCount: 9,
    estimatedMinutes: 14,
    badge: "Nivelamento",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    iconType: "scale",
  },
];

export function calculateDomainAnalytics(
  questions: DiagnosticQuestion[],
  answersRecord: Record<number, number>
): {
  score: number;
  total: number;
  percentage: number;
  dontKnowCount: number;
  strongSkills: string[];
  attentionSkills: string[];
  dontKnowSkills: string[];
  subjectBreakdown: SubjectMasteryBreakdown[];
} {
  const total = questions.length;
  let score = 0;
  let dontKnowCount = 0;

  const subjectStats: Record<
    string,
    { total: number; correct: number; dontKnow: number; strongSkills: string[]; attentionSkills: string[] }
  > = {};

  const strongSkillsList: string[] = [];
  const attentionSkillsList: string[] = [];
  const dontKnowSkillsList: string[] = [];

  questions.forEach((q) => {
    const selected = answersRecord[q.id] ?? -1;
    const isDontKnow = selected === -2;
    const isCorrect = selected === q.correctIndex;

    const sub = q.subject || "Geral";
    if (!subjectStats[sub]) {
      subjectStats[sub] = { total: 0, correct: 0, dontKnow: 0, strongSkills: [], attentionSkills: [] };
    }
    subjectStats[sub].total += 1;

    if (isDontKnow) {
      dontKnowCount += 1;
      subjectStats[sub].dontKnow += 1;
      if (q.skillTested && !dontKnowSkillsList.includes(q.skillTested)) {
        dontKnowSkillsList.push(q.skillTested);
      }
    } else if (isCorrect) {
      score += 1;
      subjectStats[sub].correct += 1;
      if (q.skillTested && !strongSkillsList.includes(q.skillTested)) {
        strongSkillsList.push(q.skillTested);
      }
      subjectStats[sub].strongSkills.push(q.skillTested);
    } else {
      if (q.skillTested && !attentionSkillsList.includes(q.skillTested)) {
        attentionSkillsList.push(q.skillTested);
      }
      subjectStats[sub].attentionSkills.push(q.skillTested);
    }
  });

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const subjectBreakdown: SubjectMasteryBreakdown[] = Object.entries(subjectStats).map(
    ([subject, data]) => {
      const subPerc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      let masteryStatus: "mastered" | "solid" | "developing" | "critical" = "developing";
      if (subPerc >= 80) masteryStatus = "mastered";
      else if (subPerc >= 60) masteryStatus = "solid";
      else if (subPerc >= 40) masteryStatus = "developing";
      else masteryStatus = "critical";

      return {
        subject,
        total: data.total,
        correct: data.correct,
        dontKnow: data.dontKnow,
        percentage: subPerc,
        masteryStatus,
        strongSkills: data.strongSkills,
        attentionSkills: data.attentionSkills,
      };
    }
  );

  return {
    score,
    total,
    percentage,
    dontKnowCount,
    strongSkills: strongSkillsList,
    attentionSkills: attentionSkillsList,
    dontKnowSkills: dontKnowSkillsList,
    subjectBreakdown,
  };
}

export const FALLBACK_BLITZ_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 101,
    subject: "Matemática",
    difficulty: "Fácil",
    question: "Se uma reta possui a equação y = 2x + 4, em qual ponto ela intercepta o eixo das ordenadas (eixo y)?",
    options: ["(0, 4)", "(4, 0)", "(-2, 0)", "(0, -2)"],
    correctIndex: 0,
    skillTested: "Intersecção com o eixo Y e Coeficiente Linear",
    explanation: "O coeficiente linear 'b' na forma y = ax + b representa a ordenada onde x = 0. Logo, y = 2(0) + 4 = 4 -> Ponto (0, 4).",
    detailedExplanation: {
      concept: "Na função afim f(x) = ax + b, o termo independente 'b' é exatamente o valor onde a reta corta o eixo vertical Y (quando x = 0).",
      stepByStep: [
        "1. Identifique a equação dada: y = 2x + 4.",
        "2. A intersecção com o eixo Y ocorre quando x = 0.",
        "3. Substitua x por 0: y = 2(0) + 4 = 4.",
        "4. As coordenadas são (x, y) = (0, 4)."
      ],
      keyTakeaway: "Para achar onde qualquer gráfico corta o eixo Y, faça x = 0!",
      mnemonicTip: "Eixo Y = Vertical = O 'b' é a base onde a reta encosta no muro Y.",
      whyWrongOptions: [
        { option: "(4, 0)", reason: "Inverteu x e y (esse ponto estaria no eixo X)." },
        { option: "(-2, 0)", reason: "Essa é a raiz da função (onde corta o eixo X), não o eixo Y." },
        { option: "(0, -2)", reason: "Sinal invertido indevidamente." }
      ]
    }
  },
  {
    id: 102,
    subject: "Física",
    difficulty: "Médio",
    question: "Um corpo de massa 3 kg é acelerado a 4 m/s² em uma superfície horizontal sem atrito. Qual é o módulo da força resultante aplicada?",
    options: ["12 N", "7 N", "1,33 N", "0,75 N"],
    correctIndex: 0,
    skillTested: "2ª Lei de Newton (Princípio Fundamental da Dinâmica)",
    explanation: "Pela 2ª Lei de Newton: F = m · a. Assim, F = 3 kg · 4 m/s² = 12 N.",
    detailedExplanation: {
      concept: "A Segunda Lei de Newton estabelece que a Força Resultante (F) que atua sobre um corpo é o produto de sua massa (m) pela sua aceleração (a).",
      stepByStep: [
        "1. Identifique os dados: massa (m) = 3 kg, aceleração (a) = 4 m/s².",
        "2. Aplique a fórmula fundamental: F_resultante = m · a.",
        "3. Multiplique os valores: F = 3 · 4 = 12.",
        "4. A unidade no Sistema Internacional é Newtons (N)."
      ],
      keyTakeaway: "Força é o empurrão que acelera a massa: F = m · a.",
      mnemonicTip: "Fórmula Fácil: Fama (F = m · a) ou 'Física Minha Amiga'.",
      whyWrongOptions: [
        { option: "7 N", reason: "Somou a massa com a aceleração em vez de multiplicar." },
        { option: "1,33 N", reason: "Dividiu a aceleração pela massa (4 / 3)." },
        { option: "0,75 N", reason: "Dividiu a massa pela aceleração (3 / 4)." }
      ]
    }
  },
  {
    id: 103,
    subject: "Química",
    difficulty: "Médio",
    question: "Qual tipo de ligação química ocorre entre átomos com grande diferença de eletronegatividade, envolvendo transferência definitiva de elétrons?",
    options: ["Ligação Iônica", "Ligação Covalente Apolar", "Ligação Metálica", "Ligação de Hidrogênio"],
    correctIndex: 0,
    skillTested: "Tipos de Ligações Químicas e Eletronegatividade",
    explanation: "A ligação iônica ocorre tipicamente entre metais (baixa eletronegatividade) e ametais (alta eletronegatividade), com transferência de elétrons e formação de íons.",
    detailedExplanation: {
      concept: "Quando um elemento quer muito perder elétrons (metal) e outro quer muito ganhar (não-metal), ocorre transferência de elétrons, formando cátions (+) e ânions (-). A atração eletrostática entre eles é a ligação iônica.",
      stepByStep: [
        "1. Observe a palavra-chave: 'transferência definitiva de elétrons'.",
        "2. Na ligação covalente, os elétrons são compartilhados (não transferidos).",
        "3. Na ligação metálica, existe um 'mar de elétrons' livres.",
        "4. Portanto, a transferência gera íons, caracterizando a Ligação Iônica."
      ],
      keyTakeaway: "Transferência de elétrons = Íons = Ligação Iônica. Compartilhamento = Covalente.",
      mnemonicTip: "Iônica = Íons (um dá, outro recebe e ficam grudados como ímãs).",
      whyWrongOptions: [
        { option: "Ligação Covalente Apolar", reason: "Compartilha elétrons igualmente, sem transferência." },
        { option: "Ligação Metálica", reason: "Ocorre entre cátions metálicos em nuvem eletrônica." },
        { option: "Ligação de Hidrogênio", reason: "É uma força intermolecular, não uma ligação interatômica." }
      ]
    }
  },
  {
    id: 104,
    subject: "Língua Portuguesa",
    difficulty: "Fácil",
    question: "Em 'Ele agiu com prudência, porém não evitou o acidente', a conjunção 'porém' introduz uma oração com valor de:",
    options: ["Oposição / Adversidade", "Explicação / Causa", "Conclusão / Dedução", "Concessão / Ressalva"],
    correctIndex: 0,
    skillTested: "Conjunções Coordenadas Adversativas",
    explanation: "'Porém' é uma conjunção coordenativa adversativa, que expressa contraste, oposição ou quebra de expectativa em relação à oração anterior.",
    detailedExplanation: {
      concept: "As conjunções adversativas (mas, porém, contudo, todavia, entretanto, no entanto) ligam ideias contrárias, introduzindo uma quebra de expectativa.",
      stepByStep: [
        "1. Analise o contexto: agir com prudência normalmente evitaria o acidente.",
        "2. A segunda oração mostra o desfecho oposto: não evitou o acidente.",
        "3. A palavra 'porém' estabelece esse contraste direto.",
        "4. Portanto, a relação semântica é de oposição (adversativa)."
      ],
      keyTakeaway: "Mas, porém, contudo, todavia, entretanto = Oposição / Contraste.",
      mnemonicTip: "Lembre-se da família do MAS: Mas/Porém/Contudo/Todavia = ideia adversa.",
      whyWrongOptions: [
        { option: "Explicação / Causa", reason: "Usaria 'porque', 'pois', 'já que'." },
        { option: "Conclusão / Dedução", reason: "Usaria 'portanto', 'logo', 'assim'." },
        { option: "Concessão / Ressalva", reason: "Usaria 'embora', 'ainda que' (subordinada concessiva)." }
      ]
    }
  },
  {
    id: 105,
    subject: "Biologia",
    difficulty: "Fácil",
    question: "Qual organela celular é responsável pela respiração celular aeróbica e produção da maior parte do ATP da célula?",
    options: ["Mitocôndria", "Ribossomo", "Complexo Golgiense", "Lisossomo"],
    correctIndex: 0,
    skillTested: "Citologia e Função das Organelas Celulares",
    explanation: "A mitocôndria é a 'usina de energia' celular, realizando o ciclo de Krebs e a fosforilação oxidativa para produzir ATP.",
    detailedExplanation: {
      concept: "A mitocôndria é a organela responsável por converter glicose e oxigênio em energia química utilizável pela célula (moléculas de ATP).",
      stepByStep: [
        "1. O enunciado fala sobre 'respiração celular' e 'produção de ATP'.",
        "2. Ribossomos sintetizam proteínas.",
        "3. Complexo de Golgi secreta e empacota substâncias.",
        "4. Lisossomos realizam digestão intracelular.",
        "5. A usina energética aeróbica é a Mitocôndria."
      ],
      keyTakeaway: "Mitocôndria = Usina de Energia = Respiração Celular = ATP.",
      mnemonicTip: "Mito = Muito poder / Muita energia (ATP)!",
      whyWrongOptions: [
        { option: "Ribossomo", reason: "Responsável pela síntese de proteínas." },
        { option: "Complexo Golgiense", reason: "Responsável pelo armazenamento e secreção de substâncias." },
        { option: "Lisossomo", reason: "Responsável pela digestão intracelular e autofagia." }
      ]
    }
  }
];
