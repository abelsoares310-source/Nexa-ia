import { VisualMnemonicData, FlashcardItem } from "../types";

/**
 * Generates an SVG visual mnemonic illustration data URI
 */
export function generateConceptSvg(
  metaphorTitle: string,
  mnemonicAnchor: string,
  tag: string,
  visualElements: string[] = []
): string {
  const safeTitle = metaphorTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeAnchor = mnemonicAnchor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeTag = (tag || "Conceito").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Color schemes based on tag/subject
  let primaryColor = "#10b981"; // Emerald default
  let secondaryColor = "#065f46";
  let accentColor = "#34d399";
  let bgGradient = "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)";

  const lowerTag = (tag || "").toLowerCase();
  if (lowerTag.includes("físic") || lowerTag.includes("math") || lowerTag.includes("matemát")) {
    primaryColor = "#0284c7"; // Sky / Blue
    secondaryColor = "#0369a1";
    accentColor = "#38bdf8";
    bgGradient = "linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)";
  } else if (lowerTag.includes("químic") || lowerTag.includes("quim")) {
    primaryColor = "#8b5cf6"; // Purple
    secondaryColor = "#6d28d9";
    accentColor = "#a78bfa";
    bgGradient = "linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)";
  } else if (lowerTag.includes("biolog") || lowerTag.includes("saúde") || lowerTag.includes("med")) {
    primaryColor = "#10b981"; // Emerald
    secondaryColor = "#047857";
    accentColor = "#34d399";
    bgGradient = "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)";
  } else if (lowerTag.includes("histór") || lowerTag.includes("human") || lowerTag.includes("geogr")) {
    primaryColor = "#f59e0b"; // Amber
    secondaryColor = "#b45309";
    accentColor = "#fbbf24";
    bgGradient = "linear-gradient(135deg, #78350f 0%, #0f172a 100%)";
  } else if (lowerTag.includes("portugu") || lowerTag.includes("ingl") || lowerTag.includes("idiom") || lowerTag.includes("ling")) {
    primaryColor = "#ec4899"; // Pink
    secondaryColor = "#be185d";
    accentColor = "#f472b6";
    bgGradient = "linear-gradient(135deg, #831843 0%, #0f172a 100%)";
  }

  const elementsXml = visualElements.slice(0, 3).map((elem, i) => {
    const yOffset = 180 + i * 28;
    const safeElem = elem.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
      <g transform="translate(40, ${yOffset})">
        <rect width="320" height="22" rx="6" fill="#1e293b" fill-opacity="0.8" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="1"/>
        <circle cx="12" cy="11" r="4" fill="${accentColor}"/>
        <text x="24" y="15" fill="#e2e8f0" font-size="10" font-weight="600" font-family="system-ui, -apple-system, sans-serif">
          ${safeElem.substring(0, 45)}
        </text>
      </g>
    `;
  }).join("");

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.05"/>
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Background Card -->
      <rect width="400" height="300" rx="16" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5"/>
      <circle cx="200" cy="110" r="90" fill="url(#halo)"/>

      <!-- Subject Tag Badge -->
      <g transform="translate(24, 20)">
        <rect width="80" height="20" rx="10" fill="${primaryColor}" fill-opacity="0.15" stroke="${primaryColor}" stroke-opacity="0.4" stroke-width="1"/>
        <text x="40" y="14" fill="${accentColor}" font-size="9.5" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif">
          ${safeTag.toUpperCase()}
        </text>
      </g>

      <!-- Visual Symbol Icon Group -->
      <g transform="translate(200, 75)" text-anchor="middle">
        <!-- Floating central orb -->
        <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="${primaryColor}" stroke-width="2"/>
        <circle cx="0" cy="0" r="24" fill="${primaryColor}" fill-opacity="0.2"/>
        <text x="0" y="8" font-size="24" text-anchor="middle">🧠</text>
      </g>

      <!-- Metaphor Title -->
      <text x="200" y="125" fill="#f8fafc" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
        ${safeTitle.substring(0, 36)}
      </text>

      <!-- Mnemonic Anchor Box -->
      <g transform="translate(30, 138)">
        <rect width="340" height="32" rx="8" fill="${primaryColor}" fill-opacity="0.12" stroke="${primaryColor}" stroke-opacity="0.35" stroke-width="1"/>
        <text x="170" y="20" fill="${accentColor}" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
          💡 "${safeAnchor.substring(0, 52)}"
        </text>
      </g>

      <!-- Key Visual Elements Bullets -->
      ${elementsXml}

      <!-- Bottom Branding Pill -->
      <g transform="translate(290, 272)">
        <text x="90" y="12" fill="#64748b" font-size="8.5" font-weight="600" text-anchor="end" font-family="system-ui, sans-serif">
          ✦ Visual Memory Anchor AI
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * Prepares default visual mnemonics for standard topics
 */
export function createDefaultVisualMnemonic(
  front: string,
  back: string,
  topic: string,
  tag: string
): VisualMnemonicData {
  let metaphorTitle = `Âncora Visual: ${topic || "Conceito"}`;
  let mnemonicAnchor = `Lembre-se da relação direta entre ${front.substring(0, 30)} e o resultado.`;
  let visualElements = ["Esquema de fluxo de causa e efeito", "Destaque nas fórmulas ou termos centrais", "Associação com analogia do dia a dia"];
  let visualExplanation = "Esta imagem organiza as variáveis-chave em posições espaciais distintas no cérebro, ativando a codificação dupla (verbal + visual) para retenção de longo prazo.";

  const lowerTopic = (topic + " " + front + " " + back + " " + tag).toLowerCase();

  if (lowerTopic.includes("velocidade") || lowerTopic.includes("cinemát")) {
    metaphorTitle = "O Triângulo de Velocidade Média (ΔS / Δt)";
    mnemonicAnchor = "Velocímetro na Estrada: Distância percorrida dividida pelo Cronômetro";
    visualElements = ["Triângulo mnemônico (Vm no topo, ΔS e Δt na base)", "Carro em pista reta com cronômetro brilhante", "Seta de vetor apontando para o deslocamento"];
    visualExplanation = "A visualização de uma pista com cronômetro aciona o córtex parietal, conectando a fórmula abstrata a um objeto em movimento rápido.";
  } else if (lowerTopic.includes("mitocôndria") || lowerTopic.includes("citologia") || lowerTopic.includes("atp")) {
    metaphorTitle = "A Usina Elétrica Celular (Mitocôndria & ATP)";
    mnemonicAnchor = "Mitocôndria = Usina com Baterias de ATP douradas fluindo";
    visualElements = ["Estrutura de feijão com cristas internas como turbinas", "Baterias douradas com símbolo de raio (ATP)", "Engrenagens do Ciclo de Krebs gerando energia"];
    visualExplanation = "Personificar a organela celular como uma usina hidrelétrica com baterias douradas substitui termos difíceis por uma metáfora funcional instantânea.";
  } else if (lowerTopic.includes("logaritm") || lowerTopic.includes("produto")) {
    metaphorTitle = "A Ponte dos Logaritmos: Multiplicar vira Somar";
    mnemonicAnchor = "Log do Produto = Soma dos Logs (Multiplicação entra, Soma sai)";
    visualElements = ["Dois blocos pesados (x e y) atravessando uma ponte", "Sinal de multiplicação transformando-se em (+) no outro lado", "Balança matemática perfeitamente equilibrada"];
    visualExplanation = "O cérebro tem dificuldade em lembrar propriedades abstratas. A metáfora de uma ponte transformadora cria uma narrativa visual de fácil resgate.";
  } else if (lowerTopic.includes("avogadro") || lowerTopic.includes("mol") || lowerTopic.includes("estequiometria")) {
    metaphorTitle = "A Caixa de 1 Mol: 6,02 × 10²³ Pacotes";
    mnemonicAnchor = "1 Dúzia = 12 ovos | 1 Mol = 6,02 × 10²³ partículas microscópicas";
    visualElements = ["Uma caixa de ovos gigante contendo galáxias de átomos", "O número 6,02 × 10²³ gravado em ouro", "Balança comparando 1 átomo isolado vs 1 mol de massa atômica"];
    visualExplanation = "Comparar o Mol com a 'dúzia dos químicos' ancora a grandeza astronômica (10²³) a uma contagem cotidiana do supermercado.";
  }

  const imageUrl = generateConceptSvg(metaphorTitle, mnemonicAnchor, tag, visualElements);

  return {
    imageUrl,
    metaphorTitle,
    mnemonicAnchor,
    visualElements,
    visualExplanation,
    imagePrompt: `Educational visual mnemonic diagram representing ${topic}: ${metaphorTitle}, featuring ${visualElements.join(", ")}. Clean infographic style, dark background, vivid neon highlights.`,
    style: "infographic_diagram",
    generatedAt: new Date().toISOString(),
  };
}
