import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Languages,
  HelpCircle,
  Award,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Settings2,
  CheckCircle2,
  BookOpen,
  Zap,
  Flame,
  Radio,
  Sliders
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  VoiceChatMessage,
  VoiceTutorMode,
  UserProfile,
  QuestionStreakState,
} from "../types";
import {
  SUPPORTED_VOICE_LANGUAGES,
  detectLanguageFromSubject,
  speakText,
  stopSpeech,
  isSpeaking,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SpeechRecognitionController,
} from "../utils/speech";

interface VoiceTutorDialogProps {
  topic: string;
  subject: string;
  profile: UserProfile;
  streakState?: QuestionStreakState;
  onAnswerQuestion?: (record: {
    question: string;
    subject: string;
    topic?: string;
    isCorrect: boolean;
    source: "diagnostic" | "tutor" | "quiz" | "custom";
  }) => void;
  onOpenStreak?: () => void;
}

export const VoiceTutorDialog: React.FC<VoiceTutorDialogProps> = ({
  topic,
  subject,
  profile,
  streakState,
  onAnswerQuestion,
  onOpenStreak,
}) => {
  // Determine initial language based on subject
  const initialLang = detectLanguageFromSubject(subject);
  const isSubjectLanguage = initialLang !== "pt-BR";

  const [mode, setMode] = useState<VoiceTutorMode>(
    isSubjectLanguage ? "language_practice" : "doubt_solver"
  );
  const [targetLang, setTargetLang] = useState<string>(initialLang);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Messages state
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isLoadingReply, setIsLoadingReply] = useState<boolean>(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<SpeechRecognitionController | null>(null);

  const isMicSupported = isSpeechRecognitionSupported();
  const isTtsSupported = isSpeechSynthesisSupported();

  // Initialize initial welcome message
  useEffect(() => {
    stopSpeech();
    let initialGreeting = "";
    let initialAutoSpoken = "";

    if (mode === "language_practice") {
      if (targetLang === "it-IT") {
        initialGreeting = `Ciao! Sono il tuo Tutor di Italiano. Parliamo di "${topic}" o di qualsiasi argomento quotidiano. Premi il microfono e parla in italiano quando vuoi!`;
        initialAutoSpoken = `Ciao! Sono il tuo Tutor di Italiano. Parliamo di ${topic}. Premi il microfono e parla in italiano quando vuoi!`;
      } else if (targetLang === "en-US") {
        initialGreeting = `Hello! I'm your English Socratic Tutor. Let's practice speaking about "${topic}". Tap the microphone button and feel free to talk!`;
        initialAutoSpoken = `Hello! I am your English Socratic Tutor. Let us practice speaking about ${topic}. Tap the microphone button and feel free to talk!`;
      } else if (targetLang === "es-ES") {
        initialGreeting = `¡Hola! Soy tu Tutor de Español. Vamos a practicar conversación sobre "${topic}". ¡Activa el micrófono y cuéntame tus ideas!`;
        initialAutoSpoken = `¡Hola! Soy tu Tutor de Español. Vamos a practicar conversación sobre ${topic}. Activa el micrófono y cuéntame tus ideas!`;
      } else if (targetLang === "fr-FR") {
        initialGreeting = `Bonjour ! Je suis votre tuteur de français. Pratiquons l'oral sur le thème "${topic}". Cliquez sur le micro pour commencer !`;
        initialAutoSpoken = `Bonjour ! Je suis votre tuteur de français. Pratiquons l'oral sur le thème ${topic}. Cliquez sur le micro pour commencer !`;
      } else if (targetLang === "de-DE") {
        initialGreeting = `Hallo! Ich bin dein Deutsch-Tutor. Lass uns über "${topic}" sprechen. Klicke auf das Mikrofon und sprich mit mir!`;
        initialAutoSpoken = `Hallo! Ich bin dein Deutsch-Tutor. Lass uns über ${topic} sprechen. Klicke auf das Mikrofon und sprich mit mir!`;
      } else {
        initialGreeting = `Olá! Sou seu Tutor de Conversação. Vamos praticar sobre "${topic}". Fale ao microfone para treinar pronúncia e fluência!`;
        initialAutoSpoken = `Olá! Sou seu Tutor de Conversação. Vamos praticar sobre ${topic}. Fale ao microfone para treinar pronúncia e fluência!`;
      }
    } else if (mode === "socratic_challenge") {
      initialGreeting = `🎯 **Sabatina Oral Ativa**: Vou testar sua retenção sobre **${topic}** (${subject}). Responda falando ao microfone para fortalecer sua memória sob pressão!\n\n**Primeira Pergunta**: Qual é o conceito central ou fórmula essencial que define "${topic}" e por que ela é aplicada dessa forma?`;
      initialAutoSpoken = `Sabatina Oral Ativa. Vou testar sua retenção sobre ${topic}. Qual é o conceito central ou fórmula essencial que define ${topic} e por que ela é aplicada dessa forma?`;
    } else {
      initialGreeting = `Olá! Estou pronto para tirar todas as suas dúvidas sobre **${topic}** (${subject}). Você pode **falar sua dúvida pelo microfone** ou digitar abaixo. O que gostaria que eu explicasse ou demonstrasse?`;
      initialAutoSpoken = `Olá! Estou pronto para tirar todas as suas dúvidas sobre ${topic}. Você pode falar sua dúvida pelo microfone ou digitar. O que gostaria que eu explicasse?`;
    }

    const initialMsg: VoiceChatMessage = {
      id: `init-${Date.now()}`,
      role: "tutor",
      text: initialGreeting,
      autoSpokenText: initialAutoSpoken,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode,
      targetLanguage: targetLang,
      keyPoints: ["Tutor com resposta por voz", "Microfone interativo integrado"],
    };

    setMessages([initialMsg]);

    if (autoPlayAudio && isTtsSupported) {
      setTimeout(() => {
        playMessageAudio(initialMsg);
      }, 500);
    }

    return () => {
      stopSpeech();
    };
  }, [mode, targetLang, topic, subject]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript, isLoadingReply]);

  // Handle Speech Recognition setup
  const startListening = () => {
    setRecognitionError(null);
    stopSpeech();
    setActivePlayingId(null);

    if (!isMicSupported) {
      setRecognitionError("Seu navegador não possui suporte ao microfone via Web Speech API.");
      return;
    }

    if (recognizerRef.current) {
      recognizerRef.current.abort();
    }

    const recognizer = createSpeechRecognizer({
      lang: targetLang,
      continuous: false,
      onStart: () => {
        setIsListening(true);
        setInterimTranscript("");
      },
      onInterim: (interim) => {
        setInterimTranscript(interim);
      },
      onResult: (finalText, isFinal) => {
        if (isFinal && finalText.trim()) {
          setInterimTranscript("");
          setIsListening(false);
          handleSendMessage(finalText.trim());
        }
      },
      onError: (err) => {
        setIsListening(false);
        setRecognitionError(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
  };

  // Play/Stop Audio for a message
  const playMessageAudio = (msg: VoiceChatMessage) => {
    if (activePlayingId === msg.id) {
      stopSpeech();
      setActivePlayingId(null);
      return;
    }

    stopSpeech();
    setActivePlayingId(msg.id);

    const textToSpeak = msg.autoSpokenText || msg.text;
    speakText(textToSpeak, {
      lang: msg.targetLanguage || targetLang,
      rate: speechRate,
      onStart: () => setActivePlayingId(msg.id),
      onEnd: () => setActivePlayingId(null),
      onError: () => setActivePlayingId(null),
    });
  };

  // Send message to Tutor API
  const handleSendMessage = async (spokenOrTypedText: string) => {
    const textToSend = spokenOrTypedText.trim();
    if (!textToSend || isLoadingReply) return;

    // Add user message
    const userMsg: VoiceChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode,
      targetLanguage: targetLang,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setTextInput("");
    setInterimTranscript("");
    setIsLoadingReply(true);
    setRecognitionError(null);

    // If oral challenge mode, count as question answering in streak
    if (mode === "socratic_challenge" && onAnswerQuestion) {
      onAnswerQuestion({
        question: `Sabatina Oral: ${topic}`,
        subject: subject || "Geral",
        topic,
        isCorrect: true, // evaluated actively
        source: "tutor",
      });
      try {
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.85 } });
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/study/voice-tutor-dialog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSpeech: textToSend,
          topic,
          subject,
          conversationHistory: newHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          mode,
          targetLanguage: targetLang,
          userLevel: profile.currentLevel,
          objective: profile.objective,
          schoolStage: profile.schoolStage || profile.schoolGrade,
          priorityTopics: profile.priorityTopics,
          profile: {
            objective: profile.objective,
            schoolStage: profile.schoolStage,
            schoolGrade: profile.schoolGrade,
            priorityTopics: profile.priorityTopics,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do tutor");
      }

      const data = await res.json();

      const tutorMsg: VoiceChatMessage = {
        id: `tutor-${Date.now()}`,
        role: "tutor",
        text: data.socraticReply || "Entendido! Como podemos aprofundar esse ponto?",
        autoSpokenText: data.autoSpokenText || data.socraticReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode,
        targetLanguage: targetLang,
        keyPoints: data.keyPoints || [],
        suggestedSpokenFollowUp: data.suggestedSpokenFollowUp,
        languageFeedback: data.languageFeedback,
      };

      setMessages((prev) => [...prev, tutorMsg]);

      // Play audio automatically if enabled
      if (autoPlayAudio && isTtsSupported) {
        playMessageAudio(tutorMsg);
      }
    } catch (err: any) {
      console.error("Erro ao dialogar com tutor:", err);
      const errorMsg: VoiceChatMessage = {
        id: `err-${Date.now()}`,
        role: "tutor",
        text: "Desculpe, tive uma instabilidade momentânea ao processar o áudio. Pode repetir sua dúvida ou tentar novamente?",
        autoSpokenText: "Desculpe, tive uma instabilidade momentânea. Pode repetir sua fala?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode,
        targetLanguage: targetLang,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoadingReply(false);
    }
  };

  const handleApplyPresetFollowUp = (promptText: string) => {
    setTextInput(promptText);
    handleSendMessage(promptText);
  };

  const currentLangObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_VOICE_LANGUAGES[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center">
                Tutor Socrático por Voz
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" /> Áudio & Fala
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {subject} • <span className="text-slate-300 font-medium">{topic}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {streakState && (
            <button
              type="button"
              onClick={onOpenStreak}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-xs font-bold transition cursor-pointer"
              title="Sequência de Estudo Ativo"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{streakState.currentStreak}d</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={`p-2 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 ${
              autoPlayAudio
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title={autoPlayAudio ? "Leitura Automática Ativada" : "Leitura Automática Desativada"}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px] font-semibold">
              {autoPlayAudio ? "Voz Ativa" : "Mudo"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl text-xs border transition ${
              showSettings
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Configurações de Idioma e Velocidade"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="px-4 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setMode("doubt_solver")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            mode === "doubt_solver"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tirar Dúvidas por Voz</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("language_practice")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            mode === "language_practice"
              ? "bg-sky-500 text-slate-950 shadow-sm"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>Conversação em Línguas ({currentLangObj.flag} {currentLangObj.nativeName})</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("socratic_challenge")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            mode === "socratic_challenge"
              ? "bg-purple-500 text-white shadow-sm"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Sabatina Oral / Active Recall</span>
        </button>
      </div>

      {/* Voice & Language Settings Tray (Collapsible) */}
      {showSettings && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Target Language Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Idioma de Fala e Reconhecimento:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Speed Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-semibold">
              <span>Velocidade de Leitura (TTS):</span>
              <span className="text-emerald-400 font-mono">{speechRate}x</span>
            </div>
            <div className="flex items-center space-x-2">
              {[0.8, 1.0, 1.2, 1.4].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                    speechRate === rate
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Browser Diagnostic info */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-slate-400 font-semibold block">Diagnóstico de Áudio:</label>
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Microfone (Speech Recognition):</span>
                <span className={isMicSupported ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {isMicSupported ? "Suportado" : "Indisponível"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Voz IA (Speech Synthesis):</span>
                <span className={isTtsSupported ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {isTtsSupported ? "Suportado" : "Indisponível"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Feed Area */}
      <div className="p-4 sm:p-6 space-y-4 max-h-[480px] min-h-[300px] overflow-y-auto bg-slate-900/60">
        {messages.map((msg) => {
          const isTutor = msg.role === "tutor";
          const isPlayingThis = activePlayingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTutor ? "items-start" : "items-end"} space-y-1.5`}
            >
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
                <span className="font-semibold">{isTutor ? "Tutor Socrático IA" : "Você (Voz / Texto)"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {isTutor && isTtsSupported && (
                  <button
                    type="button"
                    onClick={() => playMessageAudio(msg)}
                    className={`ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                      isPlayingThis
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    {isPlayingThis ? (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Ouvindo... (Clique p/ Parar)</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Ouvir em Voz Alta</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div
                className={`p-4 sm:p-5 rounded-2xl max-w-2xl text-xs sm:text-sm leading-relaxed ${
                  isTutor
                    ? "bg-slate-800 border border-slate-700/80 text-slate-100 shadow-sm"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md rounded-br-none"
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Keypoints chips */}
                {msg.keyPoints && msg.keyPoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                    {msg.keyPoints.map((pt, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-slate-900/60 text-slate-300 border border-slate-700 text-[11px]"
                      >
                        ✓ {pt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Language Feedback Card (for language practice) */}
                {msg.languageFeedback && (
                  <div className="mt-3 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs space-y-2 text-sky-200">
                    <div className="flex items-center justify-between font-bold text-sky-300">
                      <span className="flex items-center">
                        <Languages className="w-3.5 h-3.5 mr-1.5" />
                        Análise de Fluência & Gramática
                      </span>
                      {msg.languageFeedback.fluencyScore && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px]">
                          Fluência: {msg.languageFeedback.fluencyScore}/10
                        </span>
                      )}
                    </div>

                    {msg.languageFeedback.grammarCorrections && msg.languageFeedback.grammarCorrections.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-sky-300 block">Correção & Ajustes:</span>
                        {msg.languageFeedback.grammarCorrections.map((corr, idx) => (
                          <p key={idx} className="text-[11px] text-slate-200 pl-2 border-l border-sky-400">
                            {corr}
                          </p>
                        ))}
                      </div>
                    )}

                    {msg.languageFeedback.vocabularySuggestions && msg.languageFeedback.vocabularySuggestions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-sky-300 block">Expressões Nativas Sugeridas:</span>
                        <div className="flex flex-wrap gap-1">
                          {msg.languageFeedback.vocabularySuggestions.map((voc, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-sky-900/50 text-sky-100 text-[10px]">
                              {voc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.languageFeedback.nativePhoneticsTips && (
                      <p className="text-[11px] text-sky-100 italic bg-sky-900/30 p-2 rounded">
                        🗣️ <strong>Dica de Pronúncia:</strong> {msg.languageFeedback.nativePhoneticsTips}
                      </p>
                    )}
                  </div>
                )}

                {/* Suggested follow-up spoken prompt */}
                {msg.suggestedSpokenFollowUp && (
                  <div className="mt-3 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-700/50">
                    <span className="text-[11px] text-slate-400">Sugestão de resposta falada:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetFollowUp(msg.suggestedSpokenFollowUp!)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center self-start sm:self-auto transition"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span>Falar: "{msg.suggestedSpokenFollowUp}"</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Speech Recognition Interim Bubble */}
        {isListening && (
          <div className="flex flex-col items-end space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold animate-pulse flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-ping" />
              Gravando sua voz em tempo real...
            </span>
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm max-w-xl animate-pulse">
              {interimTranscript ? `"${interimTranscript}"` : "Fale agora com o microfone aberto..."}
            </div>
          </div>
        )}

        {/* Thinking skeleton */}
        {isLoadingReply && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-3 bg-slate-800/60 rounded-xl max-w-sm">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>O Tutor está elaborando sua resposta socrática...</span>
          </div>
        )}

        {/* Recognition Error notification */}
        {recognitionError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <span>{recognitionError}</span>
            <button
              type="button"
              onClick={() => setRecognitionError(null)}
              className="text-rose-200 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Speech Prompts */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-slate-400 shrink-0 font-medium text-[11px]">Ideias para falar:</span>
        {mode === "language_practice" ? (
          <>
            <button
              type="button"
              onClick={() => handleSendMessage(currentLangObj.samplePrompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              💬 "{currentLangObj.samplePrompt.substring(0, 45)}..."
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Como posso melhorar minha pronúncia e soar mais natural neste idioma?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              🗣️ Dicas de Pronúncia Nativa
            </button>
          </>
        ) : mode === "socratic_challenge" ? (
          <>
            <button
              type="button"
              onClick={() => handleSendMessage("Pode me fazer uma pergunta oral desafiadora sobre esse tópico?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              🎯 Nova Pergunta Desafiadora
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Como eu explicaria esse conceito para um iniciante do zero?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              💡 Técnica de Feynman (Explicar do Zero)
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSendMessage(`Pode me dar uma analogia prática e simples para entender ${topic}?`)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              💡 Pedir Analogia Prática
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(`Qual é a pegadinha mais comum em provas sobre ${topic}?`)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[11px] transition"
            >
              ⚠️ Pegadinhas Mais Comuns
            </button>
          </>
        )}
      </div>

      {/* Voice & Text Input Controls */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(textInput);
          }}
          className="flex items-center space-x-2"
        >
          {/* Microphone Main Action Button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-3 rounded-xl font-bold transition flex items-center justify-center shrink-0 ${
              isListening
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 animate-pulse ring-4 ring-rose-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
            }`}
            title={isListening ? "Clique para Finalizar e Enviar Fala" : "Pressione para Falar ao Microfone"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input for Typing or displaying speech */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isListening
                  ? "Escutando sua voz... (fale agora)"
                  : mode === "language_practice"
                  ? `Fale ou digite em ${currentLangObj.name}...`
                  : "Fale pelo microfone ou digite sua dúvida aqui..."
              }
              disabled={isListening}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!textInput.trim() || isLoadingReply}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 font-bold rounded-xl text-xs sm:text-sm border border-slate-700 transition flex items-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            {isListening ? (
              <strong className="text-emerald-400">Microfone aberto. Fale claramente no idioma selecionado.</strong>
            ) : (
              "Dica: Pressione o microfone para falar livremente ou clique em 'Ouvir em Voz Alta' nas respostas."
            )}
          </span>
          <span className="font-mono text-slate-400">
            {currentLangObj.flag} {currentLangObj.code}
          </span>
        </div>
      </div>
    </div>
  );
};
