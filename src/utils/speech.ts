// Speech Recognition (STT) and Speech Synthesis (TTS) utilities for Socratic Tutor

export interface VoiceLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  samplePrompt: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  {
    code: "pt-BR",
    name: "Português (Brasil)",
    nativeName: "Português",
    flag: "🇧🇷",
    samplePrompt: "Professor, pode me explicar como aplicar a regra da mão direita no eletromagnetismo?",
  },
  {
    code: "it-IT",
    name: "Italiano",
    nativeName: "Italiano",
    flag: "🇮🇹",
    samplePrompt: "Ciao! Vorrei fare pratica con i verbi al passato prossimo e l'accordo del participio.",
  },
  {
    code: "en-US",
    name: "Inglês (US)",
    nativeName: "English",
    flag: "🇺🇸",
    samplePrompt: "Could you explain the difference between Present Perfect and Past Simple with examples?",
  },
  {
    code: "es-ES",
    name: "Espanhol",
    nativeName: "Español",
    flag: "🇪🇸",
    samplePrompt: "¿Cómo puedo diferenciar cuándo usar 'por' y 'para' en situaciones cotidianas?",
  },
  {
    code: "fr-FR",
    name: "Francês",
    nativeName: "Français",
    flag: "🇫🇷",
    samplePrompt: "Bonjour! Pouvez-vous m'expliquer l'accord du participe passé avec l'auxiliaire être?",
  },
  {
    code: "de-DE",
    name: "Alemão",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    samplePrompt: "Kannst du mir den Unterschied zwischen Dativ und Akkusativ bei Wechselpräpositionen erklären?",
  },
];

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition
  );
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function detectLanguageFromSubject(subjectName: string): string {
  const norm = (subjectName || "").toLowerCase().trim();
  if (norm.includes("ital") || norm.includes("it-")) return "it-IT";
  if (norm.includes("ingl") || norm.includes("engl") || norm.includes("en-")) return "en-US";
  if (norm.includes("espan") || norm.includes("span") || norm.includes("es-")) return "es-ES";
  if (norm.includes("franc") || norm.includes("fren") || norm.includes("fr-")) return "fr-FR";
  if (norm.includes("alem") || norm.includes("germ") || norm.includes("de-")) return "de-DE";
  if (norm.includes("jap") || norm.includes("nihon") || norm.includes("ja-")) return "ja-JP";
  return "pt-BR";
}

// Clean markdown, symbols, formulas, code blocks for fluent natural speech
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  let clean = text;
  // Remove markdown headers
  clean = clean.replace(/#{1,6}\s+/g, "");
  // Remove bold/italics
  clean = clean.replace(/(\*\*|__)(.*?)\1/g, "$2");
  clean = clean.replace(/(\*|_)(.*?)\1/g, "$2");
  // Remove backticks / code fences
  clean = clean.replace(/```[\s\S]*?```/g, " [exemplo de código] ");
  clean = clean.replace(/`([^`]+)`/g, "$1");
  // Remove markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove emojis and special bullet symbols
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "");
  // Remove multiple spaces/newlines
  clean = clean.replace(/\n{2,}/g, ". ");
  clean = clean.replace(/\n/g, ", ");
  clean = clean.replace(/\s{2,}/g, " ");
  // Remove math delta/symbols if necessary
  clean = clean.replace(/Δ/g, "delta ");
  clean = clean.replace(/→/g, " para ");
  clean = clean.replace(/≠/g, " diferente de ");
  clean = clean.replace(/≤/g, " menor ou igual a ");
  clean = clean.replace(/≥/g, " maior ou igual a ");
  return clean.trim();
}

// Speech Recognition Instance Creator
export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(options: {
  lang?: string;
  continuous?: boolean;
  onStart?: () => void;
  onResult?: (finalTranscript: string, isFinal: boolean) => void;
  onInterim?: (interimTranscript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): SpeechRecognitionController {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: () => options.onError?.("Reconhecimento de voz não suportado pelo navegador atual."),
      stop: () => {},
      abort: () => {},
      isSupported: false,
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.lang = options.lang || "pt-BR";
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let isExplicitStop = false;

  recognition.onstart = () => {
    isExplicitStop = false;
    options.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const trans = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += trans;
      } else {
        interim += trans;
      }
    }

    if (final) {
      options.onResult?.(final.trim(), true);
    }
    if (interim) {
      options.onInterim?.(interim.trim());
      options.onResult?.(interim.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === "no-speech") {
      // User remained silent, non-critical
      return;
    }
    let friendlyMessage = "Erro no reconhecimento de voz.";
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      friendlyMessage = "Permissão de microfone negada. Por favor, libere o acesso ao microfone no navegador.";
    } else if (event.error === "network") {
      friendlyMessage = "Falha de conexão com o serviço de voz do navegador.";
    }
    options.onError?.(friendlyMessage);
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Could not start recognition (maybe already running):", e);
      }
    },
    stop: () => {
      isExplicitStop = true;
      try {
        recognition.stop();
      } catch (e) {}
    },
    abort: () => {
      isExplicitStop = true;
      try {
        recognition.abort();
      } catch (e) {}
    },
    isSupported: true,
  };
}

// Global active utterance tracker to handle cancellation and speech chunking
let currentUtterance: SpeechSynthesisUtterance | null = null;
let speechChunkQueue: string[] = [];
let currentLang = "pt-BR";
let currentRate = 1.0;
let currentPitch = 1.0;
let currentOnEndCallback: (() => void) | null = null;

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    speechChunkQueue = [];
    currentOnEndCallback = null;
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking;
}

// Split text into coherent chunks for seamless browser TTS without timeout dropouts
function splitIntoSpeechChunks(text: string): string[] {
  const clean = cleanTextForSpeech(text);
  if (!clean) return [];

  // Match sentences or clauses ending with punctuation
  const rawSentences = clean.match(/[^.!?;\n]+[.!?;\n]+/g) || [clean];
  const chunks: string[] = [];
  let buffer = "";

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((buffer + " " + trimmed).length < 180) {
      buffer = buffer ? buffer + " " + trimmed : trimmed;
    } else {
      if (buffer) chunks.push(buffer);
      buffer = trimmed;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length > 0 ? chunks : [clean];
}

export function speakText(
  text: string,
  options: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): void {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.("Síntese de voz não suportada neste navegador.");
    return;
  }

  stopSpeech();

  const chunks = splitIntoSpeechChunks(text);
  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  speechChunkQueue = [...chunks];
  currentLang = options.lang || "pt-BR";
  currentRate = options.rate || 1.0;
  currentPitch = options.pitch || 1.0;
  currentOnEndCallback = options.onEnd || null;

  options.onStart?.();
  speakNextChunk(options.onError);
}

function getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = langCode.split("-")[0].toLowerCase();

  // 1. Exact match e.g. "pt-BR"
  const exact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === langCode.toLowerCase());
  if (exact) return exact;

  // 2. Prefix match e.g. "pt" or "it" or "en"
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (prefixMatch) return prefixMatch;

  // 3. Default voice
  const def = voices.find((v) => v.default);
  return def || voices[0] || null;
}

function speakNextChunk(onError?: (err: any) => void) {
  if (speechChunkQueue.length === 0) {
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    cb?.();
    return;
  }

  const chunk = speechChunkQueue.shift()!;
  const utterance = new SpeechSynthesisUtterance(chunk);
  currentUtterance = utterance;

  utterance.lang = currentLang;
  utterance.rate = currentRate;
  utterance.pitch = currentPitch;

  const voice = getBestVoiceForLanguage(currentLang);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => {
    speakNextChunk(onError);
  };

  utterance.onerror = (event: any) => {
    console.warn("Speech synthesis chunk error:", event);
    // If canceled manually, do not call error
    if (event.error === "canceled" || event.error === "interrupted") {
      return;
    }
    onError?.(event);
    speakNextChunk(onError);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("speechSynthesis.speak error:", e);
    onError?.(e);
  }
}
