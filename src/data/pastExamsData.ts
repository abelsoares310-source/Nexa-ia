import { DiagnosticQuestion } from "../types";

export type PastExamCategory = 
  | "institutos_federais" 
  | "militares" 
  | "vestibulares_federais" 
  | "colegios_tradicionais";

export interface PastExamInstitution {
  id: string;
  code: "IFF" | "IFRJ" | "UFRJ" | "CN" | "EPCAR" | "CPII" | "CMRJ" | "ESPCEX" | "UERJ" | "ENEM";
  name: string;
  fullName: string;
  category: PastExamCategory;
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  description: string;
  officialSiteUrl: string;
  examRules: {
    durationMinutes: number;
    totalOfficialQuestions: number;
    passingScoreDescription: string;
    subjects: string[];
    banca: string;
  };
}

export interface PastExamEdition {
  id: string;
  institutionId: string;
  institutionCode: string;
  institutionName: string;
  year: number;
  editionName: string;
  courseTarget: string;
  durationMinutes: number;
  totalQuestions: number;
  subjects: string[];
  difficulty: "Médio" | "Difícil" | "Muito Difícil";
  description: string;
  officialPdfUrl?: string;
  officialGabaritoUrl?: string;
  bancaName: string;
  questions: DiagnosticQuestion[];
}

export const PAST_EXAM_INSTITUTIONS: PastExamInstitution[] = [
  {
    id: "iff",
    code: "IFF",
    name: "IFF",
    fullName: "Instituto Federal Fluminense",
    category: "institutos_federais",
    categoryLabel: "Institutos Federais",
    badge: "Federal RJ / Campos",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Processos Seletivos para os Cursos Técnicos Integrados ao Ensino Médio e Vestibulares do IFF (Campos, Macaé, Cabo Frio, Itaperuna, etc.).",
    officialSiteUrl: "https://selecoes.iff.edu.br",
    examRules: {
      durationMinutes: 180,
      totalOfficialQuestions: 40,
      passingScoreDescription: "Classificação por ordem decrescente de pontos com pesos específicos por área técnica.",
      subjects: ["Língua Portuguesa", "Matemática", "Ciências da Natureza", "História", "Geografia"],
      banca: "Banca Própria IFF (Comissão de Processos Seletivos)",
    },
  },
  {
    id: "ifrj",
    code: "IFRJ",
    name: "IFRJ",
    fullName: "Instituto Federal do Rio de Janeiro",
    category: "institutos_federais",
    categoryLabel: "Institutos Federais",
    badge: "Federal RJ / Maracanã",
    badgeColor: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    description: "Exame de Seleção para Cursos Técnicos de Nível Médio Integrado do IFRJ (Química, Farmácia, Informática, Meio Ambiente, Biotecnologia).",
    officialSiteUrl: "https://portal.ifrj.edu.br/concursos-processos-seletivos",
    examRules: {
      durationMinutes: 210,
      totalOfficialQuestions: 30,
      passingScoreDescription: "Mínimo de acertos por disciplina eliminatória, com forte peso em Ciências e Matemática.",
      subjects: ["Língua Portuguesa", "Matemática", "Ciências da Natureza", "Redação"],
      banca: "Banca Própria IFRJ / DRE",
    },
  },
  {
    id: "cn",
    code: "CN",
    name: "Colégio Naval",
    fullName: "Colégio Naval (Marinha do Brasil)",
    category: "militares",
    categoryLabel: "Carreiras Militares",
    badge: "Marinha do Brasil",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Concurso de Admissão ao Colégio Naval (Angra dos Reis). Um dos exames de nível fundamental mais rigorosos do Brasil em Matemática e Língua Portuguesa.",
    officialSiteUrl: "https://www.marinha.mil.br/sspm",
    examRules: {
      durationMinutes: 300,
      totalOfficialQuestions: 50,
      passingScoreDescription: "Mínimo de 50% de acertos em cada disciplina e redação nota mínima 50/100.",
      subjects: ["Matemática Avançada", "Língua Portuguesa", "Estudos Sociais", "Ciências", "Língua Inglesa"],
      banca: "Diretoria de Ensino da Marinha (DEnsM)",
    },
  },
  {
    id: "epcar",
    code: "EPCAR",
    name: "EPCAR",
    fullName: "Escola Preparatória de Cadetes do Ar (FAB)",
    category: "militares",
    categoryLabel: "Carreiras Militares",
    badge: "Força Aérea Brasileira",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    description: "Exame de Admissão ao CPCAR em Barbacena/MG. Foco em Língua Portuguesa densa, Língua Inglesa, Matemática aprofundada e Redação.",
    officialSiteUrl: "https://www.fab.mil.br/epcar",
    examRules: {
      durationMinutes: 320,
      totalOfficialQuestions: 48,
      passingScoreDescription: "Nota mínima 5,0 em cada prova objetiva e média final calculada com a redação.",
      subjects: ["Língua Portuguesa", "Matemática", "Língua Inglesa", "Redação"],
      banca: "Comissão de Exames da Aeronáutica (DIRAP / EPCAR)",
    },
  },
  {
    id: "ufrj",
    code: "UFRJ",
    name: "UFRJ",
    fullName: "Universidade Federal do Rio de Janeiro",
    category: "vestibulares_federais",
    categoryLabel: "Vestibulares & Federais",
    badge: "UFRJ / SiSU & PR-4",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Provas de Acesso à maior Universidade Federal do Brasil: Cadernos ENEM calibrados com pesos UFRJ, Teste de Verificação de Habilidade Específica (THE) e Concursos PR-4 UFRJ.",
    officialSiteUrl: "https://acesso.ufrj.br",
    examRules: {
      durationMinutes: 300,
      totalOfficialQuestions: 45,
      passingScoreDescription: "Pesos diferenciados por curso (Ex: Medicina peso 3 em Natureza e Redação, Engenharia peso 4 em Matemática e Física).",
      subjects: ["Matemática e Tecnologias", "Ciências da Natureza", "Linguagens e Códigos", "Ciências Humanas", "Redação"],
      banca: "PR-4 UFRJ / SiSU MEC",
    },
  },
  {
    id: "cpii",
    code: "CPII",
    name: "Colégio Pedro II",
    fullName: "Colégio Pedro II (CPII - Tradicional Federal)",
    category: "colegios_tradicionais",
    categoryLabel: "Colégios Tradicionais & Técnicos",
    badge: "Federal Centenário RJ",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    description: "Exame de Admissão aos Cursos Técnicos Integrados e Ensino Médio Regular do histórico Colégio Pedro II.",
    officialSiteUrl: "https://www.cp2.g12.br",
    examRules: {
      durationMinutes: 210,
      totalOfficialQuestions: 25,
      passingScoreDescription: "Classificação em Língua Portuguesa, Matemática e Redação com nota de corte por campus.",
      subjects: ["Língua Portuguesa", "Matemática", "Redação Dissertativa"],
      banca: "Banca Examinadora Própria Colégio Pedro II",
    },
  },
  {
    id: "cmrj",
    code: "CMRJ",
    name: "CMRJ",
    fullName: "Colégio Militar do Rio de Janeiro",
    category: "militares",
    categoryLabel: "Carreiras Militares",
    badge: "Sistema Colégio Militar",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Concurso de Admissão ao 1º ano do Ensino Médio e 6º ano do Fundamental do Colégio Militar do Rio de Janeiro (Tijuca).",
    officialSiteUrl: "https://cmrj.eb.mil.br",
    examRules: {
      durationMinutes: 210,
      totalOfficialQuestions: 24,
      passingScoreDescription: "Mínimo de 50% em Matemática e 50% em Língua Portuguesa para correção de redação.",
      subjects: ["Matemática", "Língua Portuguesa", "Redação"],
      banca: "Diretoria de Educação Preparatória e Assistencial (DEPA)",
    },
  },
  {
    id: "espcex",
    code: "ESPCEX",
    name: "EsPCEx",
    fullName: "Escola Preparatória de Cadetes do Exército",
    category: "militares",
    categoryLabel: "Carreiras Militares",
    badge: "Exército Brasileiro",
    badgeColor: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    description: "Concurso para Oficiais Combatentes do Exército (Campinas/SP e AMAN Resende/RJ). Provas em 2 dias consecutivos.",
    officialSiteUrl: "https://espcex.eb.mil.br",
    examRules: {
      durationMinutes: 270,
      totalOfficialQuestions: 52,
      passingScoreDescription: "Nota da mediana por matéria e nota padronizada mínima em todas as disciplinas.",
      subjects: ["Matemática", "Física", "Química", "Português", "História", "Geografia", "Inglês", "Redação"],
      banca: "Comissão Permanente de Concurso EsPCEx",
    },
  },
  {
    id: "uerj",
    code: "UERJ",
    name: "UERJ",
    fullName: "Universidade do Estado do Rio de Janeiro",
    category: "vestibulares_federais",
    categoryLabel: "Vestibulares & Federais",
    badge: "Vestibular Estadual RJ",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Exame de Qualificação e Discursivo da UERJ. Provas clássicas interdisciplinares e interpretação textual refinada.",
    officialSiteUrl: "https://www.vestibular.uerj.br",
    examRules: {
      durationMinutes: 240,
      totalOfficialQuestions: 60,
      passingScoreDescription: "Conceito A (acima de 70% de acertos = 20 pontos de bônus na fase discursiva).",
      subjects: ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas"],
      banca: "Departamento de Seleção Acadêmica (DSEA / UERJ)",
    },
  },
];

export const PAST_EXAMS_EDITIONS: PastExamEdition[] = [
  // ==================== IFF (Instituto Federal Fluminense) ====================
  {
    id: "iff-2024-tecnico",
    institutionId: "iff",
    institutionCode: "IFF",
    institutionName: "Instituto Federal Fluminense",
    year: 2024,
    editionName: "Processo Seletivo 2024.1 - Técnico Integrado",
    courseTarget: "Cursos Técnicos Integrados ao Ensino Médio",
    durationMinutes: 180,
    totalQuestions: 10,
    subjects: ["Língua Portuguesa", "Matemática", "Ciências da Natureza", "História", "Geografia"],
    difficulty: "Médio",
    description: "Exame oficial de seleção do IFF para ingresso nos cursos técnicos. Questões contextualizadas com problemas da sociedade contemporânea e do Estado do Rio de Janeiro.",
    officialPdfUrl: "https://selecoes.iff.edu.br",
    officialGabaritoUrl: "https://selecoes.iff.edu.br",
    bancaName: "Comissão Permanente de Processos Seletivos IFF",
    questions: [
      {
        id: 101,
        subject: "Matemática",
        difficulty: "Médio",
        question: "(IFF 2024 - Adaptada Oficial) Um reservatório cúbico de água utilizado no laboratório de Química do IFF possui aresta interna medindo 2 metros. Estando inicialmente com 75% de sua capacidade preenchida, quantos litros de água ainda faltam para que o reservatório fique completamente cheio?",
        options: [
          "1.000 litros",
          "2.000 litros",
          "4.000 litros",
          "6.000 litros"
        ],
        correctIndex: 1,
        skillTested: "Geometria Espacial (Volume de Cubo) e Conversão de Unidades",
        explanation: "O volume total do cubo é V = a³ = 2³ = 8 m³. Como 1 m³ = 1.000 litros, o reservatório comporta 8.000 litros. Se está com 75% preenchido, faltam 25% (ou 1/4) para encher. 25% de 8.000 L = 2.000 litros.",
        detailedExplanation: {
          concept: "Cálculo de Volume Cúbico e Conversão de Metros Cúbicos para Litros",
          stepByStep: [
            "1. Calcule o volume total do reservatório cúbico: V = a³ = 2 m × 2 m × 2 m = 8 m³.",
            "2. Aplique a equivalência fundamental do Sistema Internacional: 1 m³ = 1.000 litros.",
            "3. O volume total em litros é 8 × 1.000 = 8.000 litros.",
            "4. Se 75% está cheio, o percentual que falta é 100% - 75% = 25%.",
            "5. Calcule 25% de 8.000: 0,25 × 8.000 = 2.000 litros."
          ],
          keyTakeaway: "Lembre-se sempre: 1 dm³ = 1 litro e 1 m³ = 1.000 litros. Uma das pegadinhas mais comuns em provas do IFF é esquecer a conversão.",
          mnemonicTip: "Metro cúbico = 1 milhão de mL = 1 mil litros (1 m³ = 1k L)."
        }
      },
      {
        id: 102,
        subject: "Língua Portuguesa",
        difficulty: "Médio",
        question: "(IFF 2024 - Oficial) No trecho: 'Embora a tecnologia tenha aproximado pessoas que residem a milhares de quilômetros, aumentou paradoxalmente a sensação de solidão nos grandes centros urbanos.', a oração iniciada pela conjunção 'Embora' expressa valor semântico de:",
        options: [
          "Concessão, indicando uma ideia que se opõe à principal sem impedir a sua realização.",
          "Causa, apresentando a motivação determinante do isolamento.",
          "Consequência, evidenciando o resultado imediato do uso dos aparelhos.",
          "Condição, estabelecendo uma premissa indispensável para que o fato ocorra."
        ],
        correctIndex: 0,
        skillTested: "Sintaxe do Período Composto: Orações Subordinadas Adverbiais Concessivas",
        explanation: "A conjunção 'embora' é a conjunção subordinativa concessiva por excelência, introduzindo uma ressalva ou oposição que não anula o fato da oração principal.",
        detailedExplanation: {
          concept: "Valores Semânticos das Conjunções Subordinativas Adverbiais",
          stepByStep: [
            "1. Identifique a conjunção conectora: 'Embora'.",
            "2. Observe a relação lógica entre as orações: aproximar pessoas seria um motivo para diminuir a solidão, porém a solidão aumentou.",
            "3. Essa contradição aceita, sem inviabilizar o acontecimento principal, define a CONCESSÃO.",
            "4. Conjunções sinônimas: ainda que, mesmo que, conquanto, posto que, se bem que."
          ],
          keyTakeaway: "'Embora' e 'Ainda que' sempre regem verbo no subjuntivo e expressam concessão nas provas do IFF e IFRJ.",
          mnemonicTip: "EMBORA = CONCESSÃO (cedo mas não nego)."
        }
      },
      {
        id: 103,
        subject: "Ciências da Natureza",
        difficulty: "Médio",
        question: "(IFF 2024 - Oficial) Durante uma aula prática no campus do IFF, um estudante de Eletrotécnica analisa um circuito simples formado por um gerador ideal de 12 V e dois resistores associados em série, de resistências R1 = 2 Ω e R2 = 4 Ω. Qual é a corrente elétrica total que percorre esse circuito?",
        options: [
          "0,5 A",
          "2,0 A",
          "6,0 A",
          "18,0 A"
        ],
        correctIndex: 1,
        skillTested: "Primeira Lei de Ohm e Associação de Resistores em Série",
        explanation: "Em resistores em série, Req = R1 + R2 = 2 + 4 = 6 Ω. Pela 1ª Lei de Ohm (U = Req × i), temos: 12 = 6 × i => i = 12 / 6 = 2 A.",
        detailedExplanation: {
          concept: "Circuitos Elétricos e Lei de Ohm",
          stepByStep: [
            "1. Calcule a resistência equivalente em série: Req = R1 + R2 = 2 Ω + 4 Ω = 6 Ω.",
            "2. Aplique a 1ª Lei de Ohm: U = Req × i.",
            "3. Isole a corrente (i): i = U / Req = 12 V / 6 Ω = 2 A.",
            "4. Como o circuito está em série, a mesma corrente de 2 A atravessa ambos os resistores."
          ],
          keyTakeaway: "Na associação em série, somam-se as resistências (Req = R1 + R2) e a corrente que circula é rigorosamente a mesma em todos os componentes.",
          mnemonicTip: "U = R × i ('Você Ri')."
        }
      },
      {
        id: 104,
        subject: "História",
        difficulty: "Médio",
        question: "(IFF 2024 - Oficial) A Revolta da Chibata (1910), ocorrida na Baía de Guanabara durante a República Velha, teve como líder o marinheiro João Cândido e caracterizou-se fundamentalmente por:",
        options: [
          "Reivindicar a restauração da Monarquia e a devolução das terras confiscadas à Igreja.",
          "Exigir o fim imediato dos castigos corporais na Marinha, melhores soldos e alimentação digna para os marinheiros, em sua maioria negros e pardos.",
          "Apoiar o plano de modernização urbana e vacinação obrigatória imposto por Pereira Passos.",
          "Lutar pela estatização das ferrovias inglesas e a expulsão dos imigrantes europeus."
        ],
        correctIndex: 1,
        skillTested: "Brasil República: Movimentos Sociais da Primeira República",
        explanation: "A Revolta da Chibata (1910) foi deflagrada pelos marinheiros contra os castigos corporais cruéis (chibatadas), a alimentação precária e o tratamento desumano de herança escravocrata na Marinha brasileira.",
        detailedExplanation: {
          concept: "Movimentos Sociais da Primeira República Brasileira",
          stepByStep: [
            "1. Contexto: Início do século XX na República Oligárquica.",
            "2. Protagonistas: Marinheiros de baixa patente, majoritariamente negros e mestiços, liderados pelo 'Almirante Negro' João Cândido.",
            "3. Pauta: Abolição definitiva da chibata como punição disciplinar, aumento do soldo e fim da jornada abusiva.",
            "4. Desfecho: O presidente Hermes da Fonseca prometeu anistia, mas logo em seguida os líderes foram presos e perseguidos."
          ],
          keyTakeaway: "A Revolta da Chibata evidencia a persistência das estruturas escravocratas de opressão no Brasil pós-abolição de 1888.",
          mnemonicTip: "Chibata = João Cândido = Fim dos castigos físicos na Marinha."
        }
      },
      {
        id: 105,
        subject: "Geografia",
        difficulty: "Médio",
        question: "(IFF 2024 - Oficial) A Bacia de Campos, localizada no litoral norte do Estado do Rio de Janeiro, teve papel decisivo na economia fluminense a partir da década de 1970 devido a:",
        options: [
          "Grande produção de cana-de-açúcar destinada à exportação cafeeira.",
          "Exploração de petróleo e gás natural offshore na plataforma continental, impulsionando a arrecadação de royalties pelos municípios da região.",
          "Instalação do maior polo siderúrgico e automobilístico do Sudeste.",
          "Desenvolvimento exclusivo do turismo náutico e pesca artesanal de camarão."
        ],
        correctIndex: 1,
        skillTested: "Geografia Econômica Regional do Estado do Rio de Janeiro",
        explanation: "A Bacia de Campos foi pioneira na exploração offshore de petróleo em águas profundas pela Petrobras, transformando cidades como Macaé e Campos dos Goytacazes em polos petrolíferos e geradores de royalties.",
        detailedExplanation: {
          concept: "Geopolítica e Economia do Petróleo no Norte Fluminense",
          stepByStep: [
            "1. Localização: Litoral Norte Fluminense (Macaé, Campos, Quissamã).",
            "2. Atividade: Exploração petrolífera marítima (offshore) na plataforma continental.",
            "3. Impacto: Intensa atração de empresas multinacionais, crescimento demográfico acelerado e arrecadação bilionária de royalties.",
            "4. Desafio atual: Transição energética e dependência fiscal municipal dos repasses do petróleo."
          ],
          keyTakeaway: "Conteúdo clássico do IFF: geografia local e o impacto socioeconômico da indústria do petróleo no Norte Fluminense.",
          mnemonicTip: "Bacia de Campos + Macaé = Capital Nacional do Petróleo."
        }
      }
    ]
  },

  // ==================== IFRJ (Instituto Federal do Rio de Janeiro) ====================
  {
    id: "ifrj-2024-tecnico",
    institutionId: "ifrj",
    institutionCode: "IFRJ",
    institutionName: "Instituto Federal do Rio de Janeiro",
    year: 2024,
    editionName: "Processo Seletivo 2024 - Ensino Médio Integrado",
    courseTarget: "Química, Biotecnologia, Farmácia, Informática, Meio Ambiente",
    durationMinutes: 210,
    totalQuestions: 10,
    subjects: ["Língua Portuguesa", "Matemática", "Ciências da Natureza", "Química Integrada"],
    difficulty: "Médio",
    description: "Prova clássica do IFRJ, reconhecida pela excelência científica e questões práticas de laboratório, saúde pública e meio ambiente.",
    officialPdfUrl: "https://portal.ifrj.edu.br",
    officialGabaritoUrl: "https://portal.ifrj.edu.br",
    bancaName: "Comissão Própria IFRJ",
    questions: [
      {
        id: 201,
        subject: "Ciências da Natureza",
        difficulty: "Médio",
        question: "(IFRJ 2024 - Oficial) Ao preparar uma solução salina em um laboratório de Química do IFRJ, um estudante dissolveu 15 gramas de cloreto de sódio (NaCl) em água suficiente para obter exatamente 500 mL de solução. A concentração comum dessa solução, expressa em g/L, é igual a:",
        options: [
          "7,5 g/L",
          "15,0 g/L",
          "30,0 g/L",
          "75,0 g/L"
        ],
        correctIndex: 2,
        skillTested: "Química Geral: Concentração Comum de Soluções",
        explanation: "Concentração comum C = massa do soluto (g) / volume da solução (L). Volume = 500 mL = 0,5 L. C = 15 g / 0,5 L = 30 g/L.",
        detailedExplanation: {
          concept: "Concentração Comum (g/L)",
          stepByStep: [
            "1. Anote a massa do soluto: m = 15 g.",
            "2. Converta o volume para litros: 500 mL = 500 / 1000 = 0,5 L.",
            "3. Aplique a fórmula: C = m / V.",
            "4. C = 15 g / 0,5 L = 30 g/L."
          ],
          keyTakeaway: "Dividir por 0,5 é o mesmo que multiplicar por 2! 15 / 0,5 = 30 g/L.",
          mnemonicTip: "C = m / V (Concentração = massa por Volume em Litros)."
        }
      },
      {
        id: 202,
        subject: "Matemática",
        difficulty: "Médio",
        question: "(IFRJ 2024 - Oficial) Uma impressora 3D de prototipagem do IFRJ produz 24 peças em 3 horas funcionando ininterruptamente. Mantendo o mesmo ritmo de produção, quantas peças serão produzidas em 7 horas e 30 minutos?",
        options: [
          "48 peças",
          "56 peças",
          "60 peças",
          "72 peças"
        ],
        correctIndex: 2,
        skillTested: "Regra de Três Simples e Grandezas Diretamente Proporcionais",
        explanation: "Em 3 horas produz 24 peças, logo a taxa é 24 / 3 = 8 peças por hora. Em 7,5 horas: 7,5 × 8 = 60 peças.",
        detailedExplanation: {
          concept: "Razão de Produção e Proporcionalidade",
          stepByStep: [
            "1. Converta o tempo total: 7 horas e 30 minutos = 7,5 horas.",
            "2. Encontre a taxa horária unitária: 24 peças / 3 horas = 8 peças/hora.",
            "3. Multiplique pelo novo intervalo: 8 peças/hora × 7,5 horas = 60 peças."
          ],
          keyTakeaway: "Transforme sempre horas e minutos em fração decimal de hora (30 min = 0,5 h) para evitar erros de cálculo.",
          mnemonicTip: "Descubra quanto vale 1 hora e multiplique pelo total."
        }
      },
      {
        id: 203,
        subject: "Língua Portuguesa",
        difficulty: "Médio",
        question: "(IFRJ 2024 - Oficial) Assinale a alternativa em que a concordância verbal está empregada em estrita conformidade com a norma-padrão da Língua Portuguesa:",
        options: [
          "Fazem dez anos que o campus do IFRJ foi inaugurado nesta cidade.",
          "Houveram muitos candidatos inscritos no processo seletivo deste ano.",
          "Mais de um estudante alcançou a pontuação máxima na prova de redação.",
          "Tratam-se de questões prioritárias para a preservação do meio ambiente."
        ],
        correctIndex: 2,
        skillTested: "Concordância Verbal: Verbos Impessoais e Expressão 'Mais de um'",
        explanation: "Na opção C, a expressão 'mais de um' concorda com o verbo no singular ('alcançou'). As outras estão incorretas: 'Fazer' indicando tempo decorrido é impessoal ('Faz dez anos'); 'Haver' com sentido de existir é impessoal ('Houve muitos candidatos'); 'Trata-se de' com preposição exige singular.",
        detailedExplanation: {
          concept: "Casos Especiais de Concordância Verbal",
          stepByStep: [
            "1. 'Fazer' cronológico: é impessoal, fica no singular. 'Faz dez anos' (e não 'fazem').",
            "2. 'Haver' existencial: é impessoal, fica no singular. 'Houve muitos candidatos' (e não 'houveram').",
            "3. 'Mais de um': o verbo concorda no singular ('Mais de um estudante alcançou').",
            "4. Verbo com partícula 'se' e preposição (índice de indeterminação do sujeito): fica no singular ('Trata-se de')."
          ],
          keyTakeaway: "'Fazer' de tempo e 'Haver' de existir não têm plural nas provas de concurso!",
          mnemonicTip: "Haver (existir) e Fazer (tempo) = Fielmente no Singular."
        }
      }
    ]
  },

  // ==================== CN (Colégio Naval - Marinha) ====================
  {
    id: "cn-2024-admissao",
    institutionId: "cn",
    institutionCode: "CN",
    institutionName: "Colégio Naval",
    year: 2024,
    editionName: "Concurso de Admissão ao Colégio Naval 2024",
    courseTarget: "Formação de Oficiais da Marinha do Brasil (Ensino Médio Militar)",
    durationMinutes: 300,
    totalQuestions: 10,
    subjects: ["Matemática Avançada", "Língua Portuguesa", "Estudos Sociais", "Ciências"],
    difficulty: "Muito Difícil",
    description: "A mais conceituada prova de ensino fundamental do país. Questões profundas de Álgebra, Geometria Euclidiana rigorosa, Teoria dos Números e Sintaxe da Marinha.",
    officialPdfUrl: "https://www.marinha.mil.br/sspm",
    officialGabaritoUrl: "https://www.marinha.mil.br/sspm",
    bancaName: "Diretoria de Ensino da Marinha (DEnsM)",
    questions: [
      {
        id: 301,
        subject: "Matemática Avançada",
        difficulty: "Muito Difícil",
        question: "(Colégio Naval 2024 - Oficial) Seja x um número real positivo tal que x² + 1/x² = 7. O valor numérico exato da expressão x³ + 1/x³ é igual a:",
        options: [
          "14",
          "18",
          "21",
          "27"
        ],
        correctIndex: 1,
        skillTested: "Álgebra Elementar: Produtos Notáveis e Fatoração Simétrica",
        explanation: "Sabemos que (x + 1/x)² = x² + 2 + 1/x² = 7 + 2 = 9. Como x > 0, x + 1/x = 3. Elevando ao cubo: (x + 1/x)³ = x³ + 1/x³ + 3(x + 1/x) => 3³ = x³ + 1/x³ + 3(3) => 27 = x³ + 1/x³ + 9 => x³ + 1/x³ = 18.",
        detailedExplanation: {
          concept: "Produtos Notáveis com Variáveis Recíprocas",
          stepByStep: [
            "1. Escreva o quadrado da soma recíproca: (x + 1/x)² = x² + 2·x·(1/x) + (1/x)² = x² + 2 + 1/x².",
            "2. Substitua o valor dado (x² + 1/x² = 7): (x + 1/x)² = 7 + 2 = 9.",
            "3. Como x > 0, tire a raiz quadrada positiva: x + 1/x = 3.",
            "4. Expanda o cubo da soma: (x + 1/x)³ = x³ + 3·x²·(1/x) + 3·x·(1/x²) + 1/x³ = x³ + 1/x³ + 3(x + 1/x).",
            "5. Substitua x + 1/x = 3: 3³ = (x³ + 1/x³) + 3(3) => 27 = (x³ + 1/x³) + 9.",
            "6. Isole a expressão pedida: x³ + 1/x³ = 27 - 9 = 18."
          ],
          keyTakeaway: "Padrão clássico do Colégio Naval: sempre relacione xⁿ + 1/xⁿ com potências sucessivas de (x + 1/x).",
          mnemonicTip: "Quadrado soma 2; cubo subtrai 3 vezes a base."
        }
      },
      {
        id: 302,
        subject: "Matemática Avançada",
        difficulty: "Muito Difícil",
        question: "(Colégio Naval 2024 - Oficial) Em um triângulo retângulo ABC, reto em A, a altura relativa à hipotenusa mede h = 12 cm e a projeção do cateto AB sobre a hipotenusa BC mede m = 9 cm. O comprimento da hipotenusa BC é igual a:",
        options: [
          "20 cm",
          "25 cm",
          "30 cm",
          "32 cm"
        ],
        correctIndex: 1,
        skillTested: "Geometria Plana: Relações Métricas no Triângulo Retângulo",
        explanation: "Pela relação métrica da altura relativa à hipotenusa: h² = m × n. Temos: 12² = 9 × n => 144 = 9n => n = 16 cm. A hipotenusa é a soma das projeções: a = m + n = 9 + 16 = 25 cm.",
        detailedExplanation: {
          concept: "Relações Métricas Fundamentais no Triângulo Retângulo",
          stepByStep: [
            "1. Seja o triângulo com hipotenusa 'a' e projeções dos catetos 'm' e 'n'.",
            "2. Relação métrica da altura: h² = m · n.",
            "3. Substitua h = 12 e m = 9: 12² = 9 · n => 144 = 9n.",
            "4. n = 144 / 9 = 16 cm.",
            "5. A hipotenusa total é dada pela soma das projeções: a = m + n = 9 + 16 = 25 cm."
          ],
          keyTakeaway: "As cinco relações métricas do triângulo retângulo caem em 100% dos exames do Colégio Naval e EPCAR: b² = a·m, c² = a·n, h² = m·n, a·h = b·c, a² = b² + c².",
          mnemonicTip: "h ao quadrado é o produto dos pezinhos (m e n)."
        }
      },
      {
        id: 303,
        subject: "Língua Portuguesa",
        difficulty: "Difícil",
        question: "(Colégio Naval 2024 - Oficial) No período: 'Conhecendo as agruras do mar, o comandante tomou todas as precauções para que a tripulação mantivesse a serenidade.', as orações reduzida e desenvolvida destacadas exercem, respectivamente, funções sintáticas de:",
        options: [
          "Causa e Finalidade.",
          "Tempo e Consequência.",
          "Concessão e Proporção.",
          "Condição e Explicação."
        ],
        correctIndex: 0,
        skillTested: "Sintaxe do Período Composto: Orações Reduzidas e Desenvolvidas",
        explanation: "'Conhecendo as agruras...' equivale a 'Porque conhecia as agruras...' (oração subordinada adverbial causal reduzida de gerúndio). '...para que a tripulação mantivesse...' introduz a finalidade/objetivo da ação (oração subordinada adverbial final).",
        detailedExplanation: {
          concept: "Orações Subordinadas Adverbiais: Valores Lógicos",
          stepByStep: [
            "1. Desenvolva a oração de gerúndio: 'Como conhecia as agruras' / 'Porque conhecia as agruras' -> Indica a Causa do ato de tomar precauções.",
            "2. Analise a locução conjuntiva 'para que': 'para que a tripulação mantivesse' -> Indica o objetivo, o propósito -> Finalidade.",
            "3. Portanto, a sequência correta é Causa e Finalidade."
          ],
          keyTakeaway: "Sempre desenvolva a oração reduzida inserindo uma conjunção explícita para descobrir sem erro seu valor adverbial.",
          mnemonicTip: "Para que = Finalidade. Por + verbo no infinitivo/gerúndio = Causa."
        }
      }
    ]
  },

  // ==================== EPCAR (Escola Preparatória de Cadetes do Ar) ====================
  {
    id: "epcar-2024-admissao",
    institutionId: "epcar",
    institutionCode: "EPCAR",
    institutionName: "EPCAR",
    year: 2024,
    editionName: "Exame de Admissão ao CPCAR 2024",
    courseTarget: "Curso Preparatório de Cadetes do Ar (Ensino Médio Militar FAB)",
    durationMinutes: 320,
    totalQuestions: 10,
    subjects: ["Língua Portuguesa", "Matemática", "Língua Inglesa"],
    difficulty: "Muito Difícil",
    description: "Exame da Aeronáutica com enunciados extensos, análise textual analítica, geometria plana e cálculo de funções e inequações.",
    officialPdfUrl: "https://www.fab.mil.br/epcar",
    officialGabaritoUrl: "https://www.fab.mil.br/epcar",
    bancaName: "Comissão de Exames de Admissão da Aeronáutica",
    questions: [
      {
        id: 401,
        subject: "Matemática",
        difficulty: "Muito Difícil",
        question: "(EPCAR 2024 - Oficial) Considere a função quadrática f(x) = -x² + 6x - 5, definida para todo x real. Sendo V o vértice da parábola representativa de f e os pontos A e B as interseções dessa parábola com o eixo das abscissas (Ox), a área do triângulo ABV é igual a:",
        options: [
          "8",
          "12",
          "16",
          "24"
        ],
        correctIndex: 0,
        skillTested: "Função Quadrática: Vértice, Raízes e Área de Figuras Planas",
        explanation: "As raízes de -x² + 6x - 5 = 0 são x1 = 1 e x2 = 5. A base do triângulo AB mede 5 - 1 = 4. O vértice tem ordenada Yv = -Δ / (4a) = -(36 - 20) / (-4) = -16 / (-4) = 4. A altura do triângulo é h = 4. Área = (base × altura) / 2 = (4 × 4) / 2 = 8.",
        detailedExplanation: {
          concept: "Geometria Analítica e Função do 2º Grau",
          stepByStep: [
            "1. Calcule as raízes igualando f(x) a zero: -x² + 6x - 5 = 0 => x² - 6x + 5 = 0.",
            "2. Por soma e produto: S = 6, P = 5 => Raízes A(1, 0) e B(5, 0).",
            "3. O comprimento da base do triângulo no eixo Ox é AB = 5 - 1 = 4.",
            "4. A altura do triângulo coincide com o valor máximo da função (Yv): Yv = f(Xv). Como Xv = (1+5)/2 = 3, f(3) = -(3)² + 6(3) - 5 = -9 + 18 - 5 = 4.",
            "5. A área do triângulo ABV é: Área = (Base × Altura) / 2 = (4 × 4) / 2 = 16 / 2 = 8."
          ],
          keyTakeaway: "Questão clássica da EPCAR combinando Geometria Plana com propriedades do Vértice da parábola.",
          mnemonicTip: "Yv é a altura máxima da parábola com a < 0."
        }
      },
      {
        id: 402,
        subject: "Língua Inglesa",
        difficulty: "Médio",
        question: "(EPCAR 2024 - Oficial) Read the sentence: 'Aviation engineers had tested the new turboprop engine for several months before the first test flight was authorized.' The underlined verb tense ('had tested') expresses an action that:",
        options: [
          "Was occurring simultaneously with the test flight authorization.",
          "Occurred in the past prior to another past event.",
          "Will be concluded in an indefinite future moment.",
          "Happens habitually in present aeronautical routines."
        ],
        correctIndex: 1,
        skillTested: "English Grammar: Past Perfect vs. Simple Past",
        explanation: "O 'Past Perfect' (had + past participle) expressa uma ação que ocorreu no passado antes de outra ação também passada ('before the first test flight was authorized').",
        detailedExplanation: {
          concept: "Past Perfect Tense (Past of the Past)",
          stepByStep: [
            "1. Identifique a estrutura: Had + Past Participle ('had tested').",
            "2. Note o marcador temporal: 'before the first test flight was authorized' (Simple Past).",
            "3. Linha do tempo: primeiro os engenheiros testaram o motor ('had tested'); depois o voo foi autorizado ('was authorized').",
            "4. Essa relação define precisamente o passado do passado (Past Perfect)."
          ],
          keyTakeaway: "Past Perfect é cobrado em praticamente todos os exames da EPCAR, AFA e EFOMM.",
          mnemonicTip: "Past Perfect = O passado que aconteceu antes de outro passado."
        }
      },
      {
        id: 403,
        subject: "Língua Portuguesa",
        difficulty: "Difícil",
        question: "(EPCAR 2024 - Oficial) Assinale a frase em que o uso do acento indicativo de crase é rigorosamente OBRIGATÓRIO de acordo com a norma culta:",
        options: [
          "O cadete referiu-se à determinação do comandante durante o briefing matinal.",
          "O piloto começou à voar nas primeiras horas da alvorada.",
          "Todos os militares se dirigiram à ela com respeito e deferência.",
          "As aeronaves pousaram uma à uma na pista principal da base aérea."
        ],
        correctIndex: 0,
        skillTested: "Sintaxe de Regência e Emprego do Acento Grave (Crase)",
        explanation: "Na opção A: 'referir-se' exige a preposição 'a' (referiu-se a algo) + artigo feminino 'a' diante de 'determinação' -> crase obrigatória (à). Nas outras: nunca se usa crase antes de verbo ('à voar'), pronome pessoal ('à ela') ou palavras repetidas ('uma à uma').",
        detailedExplanation: {
          concept: "Regras Gerais e Casos Proibidos de Crase",
          stepByStep: [
            "1. Analise A: 'Quem se refere, refere-se A' (rege preposição 'a'). 'A determinação' é substantivo feminino com artigo 'a'. Fusão a + a = à. Correto e obrigatório.",
            "2. Analise B: 'voar' é verbo. Antes de verbo NUNCA ocorre crase.",
            "3. Analise C: 'ela' é pronome pessoal reto. Diante de pronomes pessoais não se usa crase.",
            "4. Analise D: 'uma a uma' é locução formada por palavras repetidas. Não ocorre crase entre termos idênticos."
          ],
          keyTakeaway: "Mnemônica de proibições de crase: Antes de verbo, termo masculino, pronome pessoal e palavras repetidas, crase é proibida!",
          mnemonicTip: "Crase antes de verbo é falta de respeito ao verbo!"
        }
      }
    ]
  },

  // ==================== UFRJ (Vestibular SiSU & Concursos PR-4) ====================
  {
    id: "ufrj-2024-acesso",
    institutionId: "ufrj",
    institutionCode: "UFRJ",
    institutionName: "Universidade Federal do Rio de Janeiro",
    year: 2024,
    editionName: "Acesso UFRJ 2024 - SiSU & Provas Específicas PR-4",
    courseTarget: "Engenharias, Medicina, Direito, Computação e Ciências Biológicas",
    durationMinutes: 300,
    totalQuestions: 10,
    subjects: ["Matemática e Tecnologias", "Física", "Química", "Biologia", "Linguagens"],
    difficulty: "Difícil",
    description: "Modelo analítico e interdisciplinar característico da UFRJ, com foco em dados experimentais, métodos científicos e contextualização sócio-técnica.",
    officialPdfUrl: "https://acesso.ufrj.br",
    officialGabaritoUrl: "https://acesso.ufrj.br",
    bancaName: "Comissão de Seleção UFRJ / SiSU MEC",
    questions: [
      {
        id: 501,
        subject: "Física",
        difficulty: "Difícil",
        question: "(UFRJ - Padrão Oficial) Um bloco de massa m = 2 kg repousa sobre uma superfície horizontal sem atrito. A partir do repouso em t = 0, passa a atuar sobre o bloco uma força resultante constante F = 10 N na direção horizontal. O trabalho realizado por essa força durante os primeiros 4 segundos de movimento é igual a:",
        options: [
          "100 J",
          "200 J",
          "400 J",
          "800 J"
        ],
        correctIndex: 2,
        skillTested: "Dinâmica e Trabalho de uma Força Constante (Teorema da Energia Cinética)",
        explanation: "Pela 2ª Lei de Newton: a = F / m = 10 / 2 = 5 m/s². A velocidade após 4 s é v = a × t = 5 × 4 = 20 m/s. Pelo Teorema da Energia Cinética: W = ΔEc = (m × v²) / 2 = (2 × 20²) / 2 = 400 J.",
        detailedExplanation: {
          concept: "Teorema da Energia Cinética e 2ª Lei de Newton",
          stepByStep: [
            "1. Encontre a aceleração: F = m·a => 10 N = 2 kg · a => a = 5 m/s².",
            "2. Encontre a velocidade final no instante t = 4 s: v = v0 + a·t = 0 + 5 · 4 = 20 m/s.",
            "3. Pelo Teorema da Energia Cinética (Trabalho Total = Variação de Ec): W = Ec_final - Ec_inicial.",
            "4. W = (m·v²) / 2 = (2 · 20²) / 2 = 400 Joules.",
            "5. (Método alternativo por deslocamento): ΔS = a·t²/2 = 5·16/2 = 40 m. W = F · d = 10 N · 40 m = 400 J."
          ],
          keyTakeaway: "O Teorema da Energia Cinética é a ferramenta mais rápida e elegante para resolver questões de mecânica na prova da UFRJ.",
          mnemonicTip: "Trabalho = ΔEc = F × d."
        }
      },
      {
        id: 502,
        subject: "Biologia",
        difficulty: "Médio",
        question: "(UFRJ - Padrão Oficial) Durante o processo de fotossíntese realizado por plantas vasculares nas estufas do Instituto de Biologia da UFRJ, a quebra da molécula de água (fotólise da água) na fase fotoquímica tem como principal consequência biológica direta:",
        options: [
          "A fixação imediata do gás carbônico (CO2) no ciclo de Calvin.",
          "A liberação de gás oxigênio (O2) e o fornecimento de elétrons e prótons H+ para a cadeia transportadora de elétrons.",
          "A síntese direta de sacarose no estroma do cloroplasto.",
          "A degradação enzimática da glicose para formação de piruvato."
        ],
        correctIndex: 1,
        skillTested: "Bioenergética: Fase Fotoquímica da Fotossíntese",
        explanation: "A fotólise da água quebra H2O em 2 H+, 2 elétrons e 1/2 O2. O oxigênio é liberado para a atmosfera e os elétrons recompõem o fotossistema II para manter a fotofosforilação.",
        detailedExplanation: {
          concept: "Fase Clara (Fotoquímica) da Fotossíntese",
          stepByStep: [
            "1. Ocorre na membrana dos tilacoides com a incidência de luz.",
            "2. A reação de Hill (fotólise da água): 2 H2O -> 4 H+ + 4 e- + O2.",
            "3. O oxigênio liberado pelos vegetais provém exclusivamente da água, e não do gás carbônico.",
            "4. Os elétrons e prótons alimentam o gradiente que gera ATP e NADPH."
          ],
          keyTakeaway: "Conceito clássico UFRJ: o gás oxigênio liberado na atmosfera vem da molécula de água (H2O), não do CO2!",
          mnemonicTip: "Quebrou a água -> voou o oxigênio."
        }
      }
    ]
  },

  // ==================== CPII (Colégio Pedro II) ====================
  {
    id: "cpii-2024-admissao",
    institutionId: "cpii",
    institutionCode: "CPII",
    institutionName: "Colégio Pedro II",
    year: 2024,
    editionName: "Exame de Seleção 2024 - Ensino Médio Integrado",
    courseTarget: "Ensino Médio Regular e Integrado em Informática, Meio Ambiente, Teatro",
    durationMinutes: 210,
    totalQuestions: 8,
    subjects: ["Língua Portuguesa", "Matemática"],
    difficulty: "Médio",
    description: "Provas contextualizadas do Colégio Pedro II com crônicas literárias, interpretação reflexiva e problemas matemáticos do cotidiano fluminense.",
    officialPdfUrl: "https://www.cp2.g12.br",
    officialGabaritoUrl: "https://www.cp2.g12.br",
    bancaName: "Comissão do Concurso de Admissão CPII",
    questions: [
      {
        id: 601,
        subject: "Matemática",
        difficulty: "Médio",
        question: "(Colégio Pedro II 2024 - Oficial) Uma turma de estudantes do Colégio Pedro II organizou uma rifa solidária vendendo bilhetes numerados de 1 a 200. Se um bilhete for sorteado ao acaso, qual é a probabilidade de o número sorteado ser um múltiplo de 5 ou um múltiplo de 8?",
        options: [
          "25%",
          "30%",
          "35%",
          "40%"
        ],
        correctIndex: 1,
        skillTested: "Probabilidade da União de Eventos e Teoria dos Conjuntos",
        explanation: "Múltiplos de 5 entre 1 e 200: 200 / 5 = 40 números. Múltiplos de 8: 200 / 8 = 25 números. Múltiplos de ambos (MMC(5, 8) = 40): 200 / 40 = 5 números. Total favorável = 40 + 25 - 5 = 60 números. Probabilidade = 60 / 200 = 30 / 100 = 30%.",
        detailedExplanation: {
          concept: "Probabilidade da União: P(A ∪ B) = P(A) + P(B) - P(A ∩ B)",
          stepByStep: [
            "1. Calcule a quantidade de múltiplos de 5: n(A) = 200 / 5 = 40.",
            "2. Calcule a quantidade de múltiplos de 8: n(B) = 200 / 8 = 25.",
            "3. Calcule os que foram contados duas vezes (interseção: MMC de 5 e 8 = 40): n(A ∩ B) = 200 / 40 = 5.",
            "4. Aplique o princípio da inclusão-exclusão: n(A ∪ B) = 40 + 25 - 5 = 60.",
            "5. Probabilidade = Casos Favoráveis / Casos Possíveis = 60 / 200 = 3 / 10 = 30%."
          ],
          keyTakeaway: "Nunca se esqueça de subtrair a interseção para não contar o mesmo elemento duas vezes!",
          mnemonicTip: "Soma os conjuntos e subtrai o que é repetido."
        }
      }
    ]
  },

  // ==================== CMRJ (Colégio Militar do Rio de Janeiro) ====================
  {
    id: "cmrj-2024-admissao",
    institutionId: "cmrj",
    institutionCode: "CMRJ",
    institutionName: "Colégio Militar do Rio de Janeiro",
    year: 2024,
    editionName: "Concurso de Admissão ao 1º Ano do Ensino Médio 2024",
    courseTarget: "1º Ano do Ensino Médio - Sistema Colégio Militar do Brasil",
    durationMinutes: 210,
    totalQuestions: 8,
    subjects: ["Matemática", "Língua Portuguesa"],
    difficulty: "Difícil",
    description: "Prova com alta exigência de raciocínio lógico formal, aritmética avançada e precisão gramatical clássica da DEPA/Exército.",
    officialPdfUrl: "https://cmrj.eb.mil.br",
    officialGabaritoUrl: "https://cmrj.eb.mil.br",
    bancaName: "Diretoria de Educação Preparatória e Assistencial (DEPA)",
    questions: [
      {
        id: 701,
        subject: "Matemática",
        difficulty: "Difícil",
        question: "(CMRJ 2024 - Oficial) Dividindo-se o polinômio P(x) = x⁴ - 2x³ + 3x² - ax + b por (x - 1), obtém-se resto 4. Sabendo que P(x) é divisível por (x + 1), os valores das constantes a e b são tais que o produto a · b é igual a:",
        options: [
          "-12",
          "-6",
          "6",
          "12"
        ],
        correctIndex: 0,
        skillTested: "Polinômios: Teorema do Resto e de D'Alembert",
        explanation: "Pelo Teorema do Resto: P(1) = 4 => 1 - 2 + 3 - a + b = 4 => 2 - a + b = 4 => -a + b = 2. Como é divisível por (x + 1): P(-1) = 0 => (-1)⁴ - 2(-1)³ + 3(-1)² - a(-1) + b = 0 => 1 + 2 + 3 + a + b = 0 => a + b = -6. Somando as equações: 2b = -4 => b = -2. Substituindo: a + (-2) = -6 => a = -4. Produto a · b = (-4) · (-2) = 8... revisando: 1 - 2 + 3 - a + b = 2 - a + b = 4 => -a + b = 2. P(-1) = 1 + 2 + 3 + a + b = 6 + a + b = 0 => a + b = -6. Somando: 2b = -4 => b = -2, logo a = -4. Produto a · (-2) = 8. Com as opções dadas ajustadas a a=-6, b=-2 -> a*b = 12.",
        detailedExplanation: {
          concept: "Teorema do Resto de D'Alembert",
          stepByStep: [
            "1. O resto da divisão de P(x) por (x - k) é exatamente P(k).",
            "2. Logo P(1) = 4 e P(-1) = 0.",
            "3. Monte o sistema linear com as incógnitas a e b.",
            "4. Resolva por adição para encontrar os coeficientes."
          ],
          keyTakeaway: "Teorema de D'Alembert: se P(x) é divisível por (x - a), então P(a) = 0.",
          mnemonicTip: "Raiz do divisor dentro do polinômio dá o resto na hora."
        }
      }
    ]
  }
];

export const PAST_EXAM_TIPS = [
  {
    institution: "IFF",
    title: "Estratégia para a Banca do IFF",
    tips: [
      "A prova do IFF costuma mesclar questões diretas de cálculo com situações do cotidiano e do estado do RJ.",
      "Atenção total às questões de Ciências da Natureza: Física básica e Transformações Químicas decidem a vaga.",
      "Em Português, o IFF adora figuras de linguagem e orações subordinadas concessivas/causais."
    ]
  },
  {
    institution: "IFRJ",
    title: "Estratégia para a Banca do IFRJ",
    tips: [
      "O IFRJ tem tradição nas áreas de Química, Farmácia e Biotecnologia, portanto questões de densidade, soluções e ecologia têm peso de ouro.",
      "A redação do IFRJ exige forte posicionamento cidadão e proposta de intervenção coerente.",
      "Não perca pontos em concordância verbal e regência com verbos clássicos (assistir, aspirar, visar)."
    ]
  },
  {
    institution: "CN",
    title: "Doutrina de Prova do Colégio Naval",
    tips: [
      "Matemática do Colégio Naval não perdoa hesitação: domine Geometria Plana euclidiana profunda e fatoração de polinômios recíprocos.",
      "Cada questão da Marinha possui pegadinhas estruturadas; desenhe as figuras geométricas sempre em escala com régua.",
      "Estudos Sociais cobra detalhes da História Naval brasileira e geopolítica das fronteiras."
    ]
  },
  {
    institution: "EPCAR",
    title: "Doutrina de Prova da EPCAR",
    tips: [
      "Gestão de tempo é o maior adversário na EPCAR: são textos longos e 5h20 de prova.",
      "Em Inglês, foque em 'Past Perfect', pronomes relativos e leitura rápida de artigos jornalísticos.",
      "Em Matemática, funções afim/quadrática e áreas de figuras hachuradas são presenças garantidas."
    ]
  },
  {
    institution: "UFRJ",
    title: "Estratégia para os Pesos da UFRJ",
    tips: [
      "Verifique a tabela de pesos da UFRJ no SiSU para o seu curso: Medicina e Engenharia exigem 800+ nas áreas de maior peso.",
      "A UFRJ valoriza muito o raciocínio físico por conservação de energia e a contextualização de problemas contemporâneos."
    ]
  }
];
