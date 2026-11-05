import { UserProfile } from "../types";

export interface ExpertTip {
  id: string;
  title: string;
  category: "active_recall" | "spaced_repetition" | "feynman" | "mnemonics" | "focus_pomodoro" | "neuroscience" | "mindset" | "interleaving" | "dual_coding";
  categoryLabel: string;
  quoteOrInsight: string;
  authorOrSource: string;
  techniqueName: string;
  actionableStep: string;
  applicableMethodologyKeywords: string[];
  difficultyLevel: "Todos" | "Iniciante" | "Intermediário" | "Avançado";
  tags: string[];
  practicalExample?: string;
}

export const EXPERT_TIPS_DATABASE: ExpertTip[] = [
  // 1. ACTIVE RECALL / TESTAGEM
  {
    id: "tip-active-recall-1",
    title: "O Efeito de Testagem (Testing Effect)",
    category: "active_recall",
    categoryLabel: "Recuperação Ativa",
    quoteOrInsight: "Tentar recuperar uma informação da memória fortalece as conexões neurais muito mais do que reler o mesmo texto 10 vezes.",
    authorOrSource: "Dra. Barbara Oakley & Dr. John Dunlosky (Neurociência da Aprendizagem)",
    techniqueName: "Método do Livro Fechado (Closed-Book Recall)",
    actionableStep: "Ao terminar de ler uma página ou assistir a uma aula, feche tudo e anote em uma folha em branco tudo o que você lembra por 3 minutos antes de consultar.",
    applicableMethodologyKeywords: ["exercícios", "questões", "simulados", "flashcards", "ativo", "prática", "recuperação"],
    difficultyLevel: "Todos",
    tags: ["#ActiveRecall", "#Neurociência", "#TestingEffect", "#Retenção"],
    practicalExample: "Pergunte-se: 'Quais foram os 3 pontos centrais deste tópico?' sem olhar o material.",
  },
  {
    id: "tip-active-recall-2",
    title: "Geração Ativa de Perguntas",
    category: "active_recall",
    categoryLabel: "Recuperação Ativa",
    quoteOrInsight: "Quem formula a pergunta aprende o dobro de quem apenas lê a resposta pronta.",
    authorOrSource: "Henry L. Roediger III & Mark A. McDaniel (Make It Stick)",
    techniqueName: "Inversão de Resumo em Flashcards",
    actionableStep: "Em vez de fazer resumos passivos sublinhados, transforme cada parágrafo de teoria em uma pergunta no anverso de um flashcard.",
    applicableMethodologyKeywords: ["flashcards", "resumos", "anki", "exercícios", "perguntas"],
    difficultyLevel: "Intermediário",
    tags: ["#Flashcards", "#Elaboração", "#EstudoAtivo"],
    practicalExample: "Em vez de anotar 'A mitocôndria produz ATP', crie: 'Qual organela produz ATP e por qual processo?'",
  },
  {
    id: "tip-active-recall-3",
    title: "Interrogação Elaborativa (Elaborative Interrogation)",
    category: "active_recall",
    categoryLabel: "Recuperação Ativa",
    quoteOrInsight: "Perguntar 'Por que isso faz sentido?' conecta o fato isolado à sua rede semântica prévia.",
    authorOrSource: "Dr. John Dunlosky (Improving Students' Learning With Effective Techniques)",
    techniqueName: "A Pergunta 'Por Quê?' Sistemática",
    actionableStep: "Sempre que se deparar com uma regra, fórmula ou conceito novo, force-se a explicar a causa fundamental ou a mecânica por trás.",
    applicableMethodologyKeywords: ["teoria", "conceitos", "leis", "fórmulas", "compreensão"],
    difficultyLevel: "Todos",
    tags: ["#InterrogaçãoElaborativa", "#CompreensãoProfunda", "#Lógica"],
    practicalExample: "Em vez de só decorar 'Aumentar a temperatura acelera a reação', pergunte: 'Por que? Porque aumenta a energia cinética e a frequência de choques efetivos.'",
  },

  // 2. SPACED REPETITION / CURVA DO ESQUECIMENTO
  {
    id: "tip-spaced-rep-1",
    title: "A Curva do Esquecimento de Ebbinghaus",
    category: "spaced_repetition",
    categoryLabel: "Repetição Espaçada",
    quoteOrInsight: "Esquecemos cerca de 70% do que aprendemos em até 48 horas se não houver um estímulo de resgate espaçado no tempo.",
    authorOrSource: "Hermann Ebbinghaus (Pioneiro dos Estudos de Memória)",
    techniqueName: "Ciclo de Intervalos Crescentes (1 - 7 - 15 - 30 dias)",
    actionableStep: "Resolva 3 a 5 questões do tema estudado hoje amanhã (D+1), na próxima semana (D+7) e no fim do mês (D+30).",
    applicableMethodologyKeywords: ["repetição", "espaçada", "revisão", "cronograma", "longo prazo"],
    difficultyLevel: "Todos",
    tags: ["#Ebbinghaus", "#RepetiçãoEspaçada", "#MemoriaDeLongoPrazo"],
    practicalExample: "Dedique os primeiros 15 minutos do seu bloco de estudos diário para a revisão rápida dos flashcards de ontem.",
  },
  {
    id: "tip-spaced-rep-2",
    title: "O Princípio da Dificuldade Desejável",
    category: "spaced_repetition",
    categoryLabel: "Repetição Espaçada",
    quoteOrInsight: "Quanto mais difícil e trabalhoso for o esforço mental para lembrar, mais duradouro e sólido será o traço de memória gravado no cérebro.",
    authorOrSource: "Dr. Robert Bjork (University of California, Los Angeles - UCLA)",
    techniqueName: "Revisão no Limiar do Esquecimento",
    actionableStep: "Não revise imediatamente quando o assunto ainda está fresco na memória de trabalho. Espere o momento em que você precisa 'puxar' o conceito com esforço.",
    applicableMethodologyKeywords: ["revisão", "dificuldade", "retenção", "eficiência"],
    difficultyLevel: "Avançado",
    tags: ["#DesirableDifficulties", "#RobertBjork", "#Neuroplasticidade"],
  },

  // 3. TÉCNICA DE FEYNMAN
  {
    id: "tip-feynman-1",
    title: "A Técnica de Feynman para Clareza Absoluta",
    category: "feynman",
    categoryLabel: "Técnica de Feynman",
    quoteOrInsight: "Se você não consegue explicar um conceito em palavras simples para uma criança de 10 anos, você não o entendeu verdadeiramente.",
    authorOrSource: "Richard Feynman (Prêmio Nobel de Física)",
    techniqueName: "Ensino Simulado Sem Jargões",
    actionableStep: "Grave um áudio de 60 segundos ou fale em voz alta explicando o tema mais difícil do dia, proibido de usar palavras técnicas sem explicá-las.",
    applicableMethodologyKeywords: ["resumos", "feynman", "explicar", "ensinar", "socrático", "voz"],
    difficultyLevel: "Todos",
    tags: ["#Feynman", "#AutoExplicação", "#Metacognição"],
    practicalExample: "Explique 'inflação' não com jargões macroeconômicos, mas como 'muito dinheiro disputando poucas maçãs na feira'.",
  },
  {
    id: "tip-feynman-2",
    title: "Mapeamento de Lacunas Conceituais",
    category: "feynman",
    categoryLabel: "Técnica de Feynman",
    quoteOrInsight: "O momento exato em que você trava ao tentar explicar é onde reside a sua real oportunidade de aprendizado.",
    authorOrSource: "Richard Feynman",
    techniqueName: "Varredura de Ilusão de Competência",
    actionableStep: "Quando gaguejar ou hesitar ao tentar explicar um conceito, anote essa lacuna exata e volte ao material original apenas para sanar aquele ponto cirúrgico.",
    applicableMethodologyKeywords: ["diagnóstico", "lacunas", "dificuldades", "clareza"],
    difficultyLevel: "Intermediário",
    tags: ["#IlusãoDeCompetência", "#DiagnósticoAtivo", "#Domínio"],
  },

  // 4. MNEMÔNICOS & PALÁCIO DA MEMÓRIA
  {
    id: "tip-mnemonics-1",
    title: "O Palácio da Memória (Método de Loci)",
    category: "mnemonics",
    categoryLabel: "Mnemônica & Imagens Mentais",
    quoteOrInsight: "A evolução moldou nosso cérebro para lembrar de espaços físicos e imagens visuais bizarras com facilidade extrema.",
    authorOrSource: "Tradição Greco-Romana / Joshua Foer (Moonwalking with Einstein)",
    techniqueName: "Ancoragem Espacial em Rota Conhecida",
    actionableStep: "Associe itens de uma lista ou sequência que precisa memorizar aos cômodos da sua casa, visualizando objetos absurdos e coloridos em cada canto.",
    applicableMethodologyKeywords: ["mnemônicos", "memorização", "decoreba", "leis", "tabelas", "listas"],
    difficultyLevel: "Todos",
    tags: ["#PalacioDaMemoria", "#MetodoDeLoci", "#ImagensMentais"],
    practicalExample: "Para lembrar dos princípios da Administração Pública (LIMPE), imagine uma vassoura gigante na porta de entrada da sua casa.",
  },
  {
    id: "tip-mnemonics-2",
    title: "Acrônimos e Frases-Gatilho de Impacto",
    category: "mnemonics",
    categoryLabel: "Mnemônica & Imagens Mentais",
    quoteOrInsight: "Agrupar dados em pedaços com significado reduz a sobrecarga cognitiva da memória de trabalho de 7 para 1 item.",
    authorOrSource: "George A. Miller (The Magical Number Seven, Plus or Minus Two)",
    techniqueName: "Chunking Cognitivo com Acrônimos",
    actionableStep: "Crie palavras mnemônicas com a primeira letra de cada termo essencial de fórmulas, taxonomias ou artigos de lei.",
    applicableMethodologyKeywords: ["leis", "fórmulas", "química", "gramática", "decoreba"],
    difficultyLevel: "Iniciante",
    tags: ["#Chunking", "#Acrônimos", "#MemóriaDeTrabalho"],
  },

  // 5. FOCO PROFUNDO & POMODORO
  {
    id: "tip-focus-1",
    title: "Alternância entre Foco e Modo Difuso",
    category: "focus_pomodoro",
    categoryLabel: "Foco & Ritmo Cognitivo",
    quoteOrInsight: "Grandes ideias e conexões entre matérias não ocorrem durante o esforço tenso, mas nos minutos de descanso do modo difuso.",
    authorOrSource: "Dra. Barbara Oakley (A Mind for Numbers / Aprendendo a Aprender)",
    techniqueName: "Pausas Verdadeiramente Desconectadas",
    actionableStep: "Nos 5 minutos de intervalo do Pomodoro, afaste-se de telas e redes sociais. Olhe para o horizonte, caminhe ou beba água para ativar o modo difuso.",
    applicableMethodologyKeywords: ["pomodoro", "foco", "pausas", "cansaço", "gestão do tempo"],
    difficultyLevel: "Todos",
    tags: ["#ModoDifuso", "#Pomodoro", "#FocoProfundo", "#HigieneMental"],
  },
  {
    id: "tip-focus-2",
    title: "Ritmos Ultradianos e Blocos de 90 Minutos",
    category: "focus_pomodoro",
    categoryLabel: "Foco & Ritmo Cognitivo",
    quoteOrInsight: "O cérebro humano atinge o pico de concentração profunda entre 45 e 90 minutos, após o qual os níveis de atenção decaem naturalmente.",
    authorOrSource: "Dr. Andrew Huberman (Stanford University School of Medicine)",
    techniqueName: "Sprints de Foco de 50 a 90 Minutos",
    actionableStep: "Divida seu tempo de estudo diário em blocos estruturados de 50 minutos de resolução intensa seguidos por 10 minutos de descompressão absoluta.",
    applicableMethodologyKeywords: ["horas", "rotina", "tempo", "ritmo", "alta performance"],
    difficultyLevel: "Intermediário",
    tags: ["#RitmoUltradiano", "#HubermanLab", "#AltaPerformance"],
  },

  // 6. PRÁTICA INTERCALADA (INTERLEAVING)
  {
    id: "tip-interleaving-1",
    title: "Prática Intercalada vs. Estudo em Bloco",
    category: "interleaving",
    categoryLabel: "Prática Intercalada",
    quoteOrInsight: "Estudar 3 matérias alternadas no mesmo dia produz até 43% mais retenção a longo prazo do que passar 6 horas na mesma disciplina.",
    authorOrSource: "Dr. Doug Rohrer & Dr. Harold Pashler (Cognitive Psychology)",
    techniqueName: "Interleaving de Disciplinas Complementares",
    actionableStep: "Em vez de dedicar um dia inteiro à Matemática, faça 1 bloco de Matemática, 1 de Biologia e 1 de Direito/Linguagens.",
    applicableMethodologyKeywords: ["intercalado", "ciclo de estudos", "rotina", "matérias", "cronograma"],
    difficultyLevel: "Todos",
    tags: ["#Interleaving", "#DiscriminaçãoDePadrões", "#CiclosDeEstudo"],
    practicalExample: "Misture questões de Cinemática e Dinâmica no mesmo simulado para aprender a identificar qual fórmula aplicar.",
  },

  // 7. NEUROCIÊNCIA DO SONO & CONSOLIDAÇÃO
  {
    id: "tip-neuroscience-1",
    title: "O Sono como Gravador de Memórias",
    category: "neuroscience",
    categoryLabel: "Neurociência & Biologia",
    quoteOrInsight: "Você não aprende durante o estudo; você estimula o cérebro durante o estudo e consolida o conhecimento durante as fases de sono profundo.",
    authorOrSource: "Dr. Matthew Walker (Why We Sleep / UC Berkeley)",
    techniqueName: "Revisão Imediatamente Pré-Sono",
    actionableStep: "Revise mentalmente ou passe os olhos nos 3 pontos principais que aprendeu hoje nos 10 minutos antes de dormir.",
    applicableMethodologyKeywords: ["sono", "noite", "cansaço", "saúde", "rotina"],
    difficultyLevel: "Todos",
    tags: ["#NeurobiologiaDoSono", "#MatthewWalker", "#ConsolidaçãoSináptica"],
  },

  // 8. CODIFICAÇÃO DUPLA (DUAL CODING)
  {
    id: "tip-dual-coding-1",
    title: "A Teoria da Codificação Dupla",
    category: "dual_coding",
    categoryLabel: "Codificação Dupla",
    quoteOrInsight: "Informações processadas simultaneamente por canais verbais e canais visuais têm o dobro de probabilidade de serem recuperadas.",
    authorOrSource: "Allan Paivio (Dual Coding Theory)",
    techniqueName: "Mapas Mentais & Esquemas Visuais com Setas",
    actionableStep: "Ao lado de cada definição conceitual, desenhe um pequeno diagrama, flecha de causa-efeito ou gráfico simplificado.",
    applicableMethodologyKeywords: ["mapas mentais", "visual", "esquemas", "resumos", "desenho"],
    difficultyLevel: "Iniciante",
    tags: ["#DualCoding", "#MapasMentais", "#PensamentoVisual"],
  },

  // 9. MINDSET & GESTÃO EMOCIONAL
  {
    id: "tip-mindset-1",
    title: "O Erro como Sinalizador Neuroquímico de Aprendizado",
    category: "mindset",
    categoryLabel: "Mindset & Resiliência",
    quoteOrInsight: "O cérebro só libera acetilcolina e dopamina para reconfigurar circuitos sinápticos quando detecta um erro em uma previsão.",
    authorOrSource: "Dra. Carol Dweck (Mindset) & Dr. Andrew Huberman",
    techniqueName: "Caderno de Erros Estruturado",
    actionableStep: "Comemore os erros nos simulados: cada questão errada é uma pista exata de onde você precisa calibrar antes do dia da prova oficial.",
    applicableMethodologyKeywords: ["erros", "simulados", "ansiedade", "mindset", "questões", "caderno de erros"],
    difficultyLevel: "Todos",
    tags: ["#CadernoDeErros", "#MindsetDeCrescimento", "#Neuroplasticidade"],
    practicalExample: "Para cada erro, classifique em: (1) Falha de Atenção, (2) Lacuna Teórica ou (3) Pegadinha do Enunciado.",
  },
  {
    id: "tip-mindset-2",
    title: "Desarmando a Ansiedade com o Suspiro Fisiológico",
    category: "mindset",
    categoryLabel: "Mindset & Resiliência",
    quoteOrInsight: "A respiração é a única alavanca autonômica sob controle consciente capaz de reduzir a frequência cardíaca em menos de 30 segundos.",
    authorOrSource: "Jack Feldman (UCLA) & Huberman Lab",
    techniqueName: "Dupla Inspiração + Expiração Prolongada",
    actionableStep: "Ao travar em uma questão ou sentir tensão, faça duas inspirações rápidas pelo nariz seguidas de uma expiração longa e lenta pela boca.",
    applicableMethodologyKeywords: ["ansiedade", "prova", "nervosismo", "estresse", "foco"],
    difficultyLevel: "Todos",
    tags: ["#FocoCalmo", "#Biofeedback", "#GestãoDeAnsiedade"],
  }
];

/**
 * Deterministic hash based on a string (e.g. date YYYY-MM-DD + user methodology keywords)
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get date string formatted as YYYY-MM-DD in local time
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Filter and score tips based on the user's profile and learning methodology
 */
export function getRankedTipsForProfile(profile: UserProfile): ExpertTip[] {
  const methodStr = `${profile.learningMethod || ""} ${profile.objective || ""} ${profile.difficulties || ""} ${profile.priorityTopics || ""} ${profile.materials || ""}`.toLowerCase();
  const level = profile.currentLevel || "Intermediário";

  const scoredTips = EXPERT_TIPS_DATABASE.map((tip) => {
    let score = 10; // base score

    // Match keywords from user profile methodology
    tip.applicableMethodologyKeywords.forEach((kw) => {
      if (methodStr.includes(kw.toLowerCase())) {
        score += 8;
      }
    });

    // Level compatibility bonus
    if (tip.difficultyLevel === "Todos" || tip.difficultyLevel === level) {
      score += 5;
    }

    // Specific profile context boosts
    if (profile.isSchoolMode && (tip.category === "feynman" || tip.category === "dual_coding" || tip.category === "active_recall")) {
      score += 6;
    }
    if (profile.dailyHours && profile.dailyHours >= 4 && (tip.category === "focus_pomodoro" || tip.category === "neuroscience")) {
      score += 5;
    }

    return { tip, score };
  });

  // Sort descending by relevance score
  scoredTips.sort((a, b) => b.score - a.score);

  return scoredTips.map((st) => st.tip);
}

/**
 * Returns the daily expert tip deterministically updated once per day, with support for cycling through tips.
 */
export function getDailyExpertTip(
  profile: UserProfile,
  dateKey: string = getTodayDateKey(),
  offset: number = 0
): {
  tip: ExpertTip;
  totalTips: number;
  currentIndex: number;
  isDailyDefault: boolean;
  dateFormatted: string;
} {
  const rankedTips = getRankedTipsForProfile(profile);
  const totalTips = rankedTips.length;

  // Use the date key + profile objective to seed the day's tip
  const seedString = `${dateKey}_${profile.objective || "studies"}_${profile.learningMethod || "active"}`;
  const baseHash = simpleHash(seedString);
  const baseIndex = baseHash % totalTips;

  const effectiveIndex = (baseIndex + offset) % totalTips;
  const normalizedIndex = effectiveIndex >= 0 ? effectiveIndex : (effectiveIndex + totalTips) % totalTips;

  const tip = rankedTips[normalizedIndex] || rankedTips[0];

  // Format date in PT-BR
  const [y, m, d] = dateKey.split("-");
  const dateFormatted = `${d}/${m}`;

  return {
    tip,
    totalTips,
    currentIndex: normalizedIndex,
    isDailyDefault: offset === 0,
    dateFormatted,
  };
}

const SAVED_TIPS_KEY = "study_tutor_saved_expert_tips";

export function getSavedExpertTipIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_TIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveExpertTipId(tipId: string): boolean {
  try {
    const saved = getSavedExpertTipIds();
    let updated: string[];
    let isSaved: boolean;
    if (saved.includes(tipId)) {
      updated = saved.filter((id) => id !== tipId);
      isSaved = false;
    } else {
      updated = [...saved, tipId];
      isSaved = true;
    }
    localStorage.setItem(SAVED_TIPS_KEY, JSON.stringify(updated));
    return isSaved;
  } catch {
    return false;
  }
}
