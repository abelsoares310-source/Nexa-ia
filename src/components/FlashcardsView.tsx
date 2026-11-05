import React, { useState, useMemo } from "react";
import { 
  Layers, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Plus, 
  Calendar, 
  Clock, 
  BookOpen,
  Trash2,
  ThumbsUp,
  Flame,
  Search,
  Tag,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Eye,
  EyeOff,
  BookMarked,
  Image as ImageIcon,
  Brain,
  Lightbulb,
  Maximize2,
  Sliders,
  RefreshCw,
  Zap,
  HelpCircle,
  Award
} from "lucide-react";
import confetti from "canvas-confetti";
import { FlashcardItem, SpacedReviewItem, VisualMnemonicData } from "../types";
import { VisualMnemonicCard } from "./VisualMnemonicCard";
import { VisualMnemonicLightboxModal } from "./VisualMnemonicLightboxModal";
import { createDefaultVisualMnemonic, generateConceptSvg } from "../utils/visualMnemonic";

interface FlashcardsViewProps {
  flashcards: FlashcardItem[];
  setFlashcards: React.Dispatch<React.SetStateAction<FlashcardItem[]>>;
  spacedReviews: SpacedReviewItem[];
  setSpacedReviews: React.Dispatch<React.SetStateAction<SpacedReviewItem[]>>;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards,
  setFlashcards,
  spacedReviews,
  setSpacedReviews,
}) => {
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [newFront, setNewFront] = useState<string>("");
  const [newBack, setNewBack] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");
  const [autoGenerateVisualOnAdd, setAutoGenerateVisualOnAdd] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Search, Subject Tag, Box, and Visual Status Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedBox, setSelectedBox] = useState<string>("all");
  const [selectedVisualFilter, setSelectedVisualFilter] = useState<"all" | "with_visual" | "without_visual">("all");
  const [viewMode, setViewMode] = useState<"player" | "explorer">("player");
  const [reviewSearchQuery, setReviewSearchQuery] = useState<string>("");
  const [selectedReviewSubject, setSelectedReviewSubject] = useState<string>("all");

  // Visual Generation State
  const [generatingCardIds, setGeneratingCardIds] = useState<Record<string, boolean>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string;
    title: string;
    anchor: string;
    elements?: string[];
    explanation?: string;
  } | null>(null);

  // Extract all distinct subject tags with their occurrence counts
  const tagStats = useMemo(() => {
    const map = new Map<string, number>();
    flashcards.forEach((card) => {
      const tag = card.tag?.trim() || "Geral";
      map.set(tag, (map.get(tag) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [flashcards]);

  // Statistics for Visuals
  const visualStats = useMemo(() => {
    const withVisualCount = flashcards.filter((c) => !!c.visualMnemonic?.imageUrl).length;
    const withoutVisualCount = flashcards.length - withVisualCount;
    const percentage = flashcards.length > 0 ? Math.round((withVisualCount / flashcards.length) * 100) : 0;
    return { withVisualCount, withoutVisualCount, percentage };
  }, [flashcards]);

  // Extract distinct spaced review subjects
  const reviewSubjects = useMemo(() => {
    const set = new Set<string>();
    spacedReviews.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return Array.from(set).sort();
  }, [spacedReviews]);

  // Filtered flashcards based on search term, tag, box, and visual status
  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      // Tag filter
      if (selectedTag !== "all") {
        const cardTag = (card.tag || "Geral").toLowerCase();
        const targetTag = selectedTag.toLowerCase();
        if (cardTag !== targetTag && !cardTag.startsWith(targetTag) && !cardTag.includes(targetTag)) {
          return false;
        }
      }

      // Box filter
      if (selectedBox !== "all") {
        if ((card.box || 1).toString() !== selectedBox) {
          return false;
        }
      }

      // Visual status filter
      if (selectedVisualFilter === "with_visual" && !card.visualMnemonic?.imageUrl) {
        return false;
      }
      if (selectedVisualFilter === "without_visual" && !!card.visualMnemonic?.imageUrl) {
        return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFront = card.front.toLowerCase().includes(q);
        const matchesBack = card.back.toLowerCase().includes(q);
        const matchesTag = (card.tag || "").toLowerCase().includes(q);
        const matchesTopic = (card.topic || "").toLowerCase().includes(q);
        const matchesAnchor = (card.visualMnemonic?.mnemonicAnchor || "").toLowerCase().includes(q);
        const matchesMetaphor = (card.visualMnemonic?.metaphorTitle || "").toLowerCase().includes(q);
        if (!matchesFront && !matchesBack && !matchesTag && !matchesTopic && !matchesAnchor && !matchesMetaphor) {
          return false;
        }
      }

      return true;
    });
  }, [flashcards, selectedTag, selectedBox, selectedVisualFilter, searchQuery]);

  // Filtered spaced reviews
  const filteredSpacedReviews = useMemo(() => {
    return spacedReviews.filter((rev) => {
      if (selectedReviewSubject !== "all" && rev.subject !== selectedReviewSubject) {
        return false;
      }
      if (reviewSearchQuery.trim()) {
        const q = reviewSearchQuery.toLowerCase();
        const matchesTopic = rev.topic.toLowerCase().includes(q);
        const matchesSubject = rev.subject.toLowerCase().includes(q);
        if (!matchesTopic && !matchesSubject) return false;
      }
      return true;
    });
  }, [spacedReviews, selectedReviewSubject, reviewSearchQuery]);

  const totalFiltered = filteredFlashcards.length;
  const safeActiveIdx = totalFiltered > 0 ? Math.min(activeCardIdx, totalFiltered - 1) : 0;
  const currentCard = filteredFlashcards[safeActiveIdx];

  // Handler for Rating a Card (Leitner System)
  const handleRateCard = (rating: "hard" | "good" | "easy") => {
    if (!currentCard) return;

    let nextBox = currentCard.box || 1;
    let nextInterval = currentCard.interval || 1;

    if (rating === "hard") {
      nextBox = 1;
      nextInterval = 1; // 1 day
    } else if (rating === "good") {
      nextBox = Math.min(4, nextBox + 1);
      nextInterval = nextBox === 2 ? 7 : nextBox === 3 ? 15 : 30;
    } else if (rating === "easy") {
      nextBox = 4;
      nextInterval = 30;
      try {
        confetti({ particleCount: 40, spread: 40, origin: { y: 0.8 } });
      } catch (e) {}
    }

    const nextReview = new Date(Date.now() + nextInterval * 86400000).toISOString();

    const updated = flashcards.map((c) => 
      c.id === currentCard.id 
        ? { ...c, box: nextBox, interval: nextInterval, nextReviewDate: nextReview } 
        : c
    );
    setFlashcards(updated);

    setIsFlipped(false);
    if (safeActiveIdx < totalFiltered - 1) {
      setActiveCardIdx(safeActiveIdx + 1);
    } else {
      setActiveCardIdx(0);
    }
  };

  // Handler for Generating Visual Mnemonic via AI Backend Endpoint
  const handleGenerateVisualForCard = async (cardId: string, customPrompt?: string) => {
    const card = flashcards.find((c) => c.id === cardId);
    if (!card) return;

    setGeneratingCardIds((prev) => ({ ...prev, [cardId]: true }));
    try {
      const response = await fetch("/api/study/generate-flashcard-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: card.front,
          back: card.back,
          topic: card.topic || card.tag,
          tag: card.tag,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar apoio visual");
      }

      const visualData: VisualMnemonicData = await response.json();

      setFlashcards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, visualMnemonic: visualData } : c))
      );

      try {
        confetti({ particleCount: 25, spread: 35, origin: { y: 0.7 } });
      } catch (e) {}
    } catch (error) {
      console.warn("Falha no endpoint visual, utilizando gerador mnemônico local resiliente:", error);
      const fallbackMnemonic = createDefaultVisualMnemonic(
        card.front,
        card.back,
        card.topic || "Conceito",
        card.tag || "Geral"
      );
      setFlashcards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, visualMnemonic: fallbackMnemonic } : c))
      );
    } finally {
      setGeneratingCardIds((prev) => ({ ...prev, [cardId]: false }));
    }
  };

  // Handler for Batch Generating Visuals for all cards missing visual support
  const handleBatchGenerateVisuals = async () => {
    const cardsWithoutVisual = flashcards.filter((c) => !c.visualMnemonic?.imageUrl);
    if (cardsWithoutVisual.length === 0) return;

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: cardsWithoutVisual.length });

    for (let i = 0; i < cardsWithoutVisual.length; i++) {
      const card = cardsWithoutVisual[i];
      setBatchProgress({ current: i + 1, total: cardsWithoutVisual.length });
      await handleGenerateVisualForCard(card.id);
      // Small delay between calls
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsBatchGenerating(false);
    setBatchProgress(null);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
  };

  // Handler for Removing Visual Support from a Card
  const handleRemoveVisualFromCard = (cardId: string) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, visualMnemonic: undefined } : c))
    );
  };

  // Handler for Adding a New Card Manually
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const cardId = `fc-manual-${Date.now()}`;
    const tag = newTag.trim() || (selectedTag !== "all" ? selectedTag : "Geral");
    const topic = newTag.trim() || "Estudo";

    let initialVisual: VisualMnemonicData | undefined = undefined;
    if (autoGenerateVisualOnAdd) {
      initialVisual = createDefaultVisualMnemonic(newFront.trim(), newBack.trim(), topic, tag);
    }

    const newCard: FlashcardItem = {
      id: cardId,
      front: newFront.trim(),
      back: newBack.trim(),
      tag,
      topic,
      nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
      interval: 1,
      box: 1,
      visualMnemonic: initialVisual,
    };

    setFlashcards([newCard, ...flashcards]);
    setNewFront("");
    setNewBack("");
    setNewTag("");
    setShowAddModal(false);

    // If auto-generate visual requested, request rich AI visual in background
    if (autoGenerateVisualOnAdd) {
      handleGenerateVisualForCard(cardId);
    }
  };

  const handleDeleteCard = (id: string) => {
    setFlashcards(flashcards.filter((c) => c.id !== id));
    if (safeActiveIdx >= totalFiltered - 1) {
      setActiveCardIdx(Math.max(0, totalFiltered - 2));
    }
  };

  const handleToggleSpacedReview = (id: string) => {
    setSpacedReviews(
      spacedReviews.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
    setSelectedBox("all");
    setSelectedVisualFilter("all");
    setActiveCardIdx(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Lightbox Zoom Modal */}
      <VisualMnemonicLightboxModal
        isOpen={!!lightboxData}
        onClose={() => setLightboxData(null)}
        data={lightboxData}
      />

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Sistema Leitner & Apoio Visual com IA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Flashcards & Associações Visuais Mnemônicas
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Integração com IA para gerar esquemas, ilustrações mnemônicas e gatilhos mentais visuais em conceitos complexos, acelerando o resgate e fixação na memória de longo prazo.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl shadow flex items-center transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Flashcard
            </button>
          </div>
        </div>

        {/* Visual Support Coverage Banner */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-purple-300 font-semibold">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Cobertura de Apoio Visual:</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 font-mono font-bold">
              {visualStats.withVisualCount} / {flashcards.length} cards ({visualStats.percentage}%)
            </span>
          </div>

          {visualStats.withoutVisualCount > 0 && (
            <button
              type="button"
              onClick={handleBatchGenerateVisuals}
              disabled={isBatchGenerating}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {isBatchGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Gerando Visuais ({batchProgress?.current}/{batchProgress?.total})...
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Gerar Apoio Visual para Cards Restantes ({visualStats.withoutVisualCount})</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Batch Progress Bar if active */}
        {isBatchGenerating && batchProgress && (
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Pre-made Decks with Rich Visual Mnemonics */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Carregar Baralhos Temáticos com Apoio Visual IA:
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const scienceCards: FlashcardItem[] = [
                {
                  id: `fc-sci-${Date.now()}-1`,
                  front: "⚡ [Física] Como determinar o sentido da Força Magnética (Fm) pela Regra da Mão Direita?",
                  back: "Polegar = Velocidade da carga (v); Dedos estendidos = Campo Magnético (B); Palma da mão 'empurra' = Força Magnética (Fm) para cargas positivas (dorso para negativas). Fm = q * v * B * sen(θ).",
                  tag: "Física / Eletromagnetismo",
                  topic: "Força Magnética & Regra da Mão Direita",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "Regra da Mão Direita (F = q·v·B)",
                      "Polegar = Velocidade, Dedos = Campo, Palma = Força",
                      "Física",
                      ["Polegar apontando para v (trajetória)", "Dedos alinhados com linhas de B", "Palma empurrando o vetor Força (Fm)"]
                    ),
                    metaphorTitle: "A Mão Tridimensional Vetorial (Fm, v, B)",
                    mnemonicAnchor: "Polegar v, Dedos B, Palma empurra a Força Fm!",
                    visualElements: ["Polegar = Velocidade (v)", "Dedos estendidos = Campo (B)", "Palma da mão = Força Magnética (Fm)"],
                    visualExplanation: "A regra da mão direita converte a álgebra vetorial abstrata do produto vetorial em uma representação somatossensorial e visual imediata no corpo.",
                    generatedAt: new Date().toISOString(),
                  },
                },
                {
                  id: `fc-sci-${Date.now()}-2`,
                  front: "🧬 [Biologia] O que é o Ciclo de Krebs e em que parte da célula ele ocorre?",
                  back: "É a matriz mitocondrial que sedia o ciclo do ácido cítrico, degradando acetil-CoA em CO2, gerando NADH, FADH2 e ATP para a cadeia respiratória.",
                  tag: "Biologia / Bioquímica",
                  topic: "Respiração Celular & Ciclo de Krebs",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "O Carrossel do Ciclo de Krebs",
                      "Matriz da Mitocôndria = Fábrica geradora de NADH & ATP",
                      "Biologia",
                      ["Roda gigante girando com moléculas de Citrato", "Baterias de NADH e FADH2 saindo douradas", "Chaminés liberando bolhas de CO2"]
                    ),
                    metaphorTitle: "O Carrossel Energético de Krebs",
                    mnemonicAnchor: "Gira no meio da mitocôndria, solta CO2 e enche as baterias de NADH e ATP!",
                    visualElements: ["Matriz mitocondrial (núcleo da usina)", "Carrossel giratório de 8 etapas", "Baterias de NADH/FADH2 prontas para a cadeia respiratória"],
                    visualExplanation: "Mapear o ciclo como um carrossel em uma usina substitui nomes enzimáticos pesados por uma narrativa visual funcional de geração contínua de energia.",
                    generatedAt: new Date().toISOString(),
                  },
                },
                {
                  id: `fc-sci-${Date.now()}-3`,
                  front: "🧪 [Química] Qual a diferença entre Ligação Iônica e Ligação Covalente?",
                  back: "Iônica: Transferência definitiva de elétrons (metal + não metal, formando cátions e ânions com atração eletrostática). Covalente: Compartilhamento de pares de elétrons (não metais).",
                  tag: "Química / Ligações",
                  topic: "Ligações Químicas",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "Doação vs Compartilhamento Eletrônico",
                      "Iônica = Dá o elétron de presente | Covalente = Aperto de mãos",
                      "Química",
                      ["Metal entregando caixa de elétrons para não metal", "Dois não-metais segurando juntos a mesma nuvem eletrônica", "Balança de cargas (+) e (-)"]
                    ),
                    metaphorTitle: "O Presente Iônico vs O Abraço Covalente",
                    mnemonicAnchor: "Iônica = Doação com ímãs (+ e -) | Covalente = Compartilhamento conjunto!",
                    visualElements: ["Cátion e Ânion atraídos como ímãs", "Nuvem de elétrons compartilhada no centro", "Tabela de eletronegatividade em gradiente"],
                    visualExplanation: "A metáfora do 'presente' versus 'aperto de mãos' conecta a definição química a interações sociais intuitivas, eliminando a confusão de termos.",
                    generatedAt: new Date().toISOString(),
                  },
                },
              ];
              setFlashcards((prev) => [...scienceCards, ...prev]);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-sky-950/40 border border-slate-700 hover:border-sky-500/50 rounded-xl text-xs font-semibold text-sky-300 transition flex items-center"
          >
            🔬 Deck Ciências & Exatas (3 Cards com Apoio Visual)
          </button>

          <button
            type="button"
            onClick={() => {
              const italianGrammarCards: FlashcardItem[] = [
                {
                  id: `fc-ita-${Date.now()}-1`,
                  front: "🇮🇹 No Passato Prossimo, quais verbos utilizam o auxiliar ESSERE?",
                  back: "Verbos de movimento (andare, venire, partire), estado em lugar (stare, essere, rimanere), mudança de estado (nascere, morire, diventare) e todos os verbos reflexivos (lavarsi, svegliarsi). Exige concordância de gênero e número: 'Lui è andato' / 'Lei è andata' / 'Loro sono andati'.",
                  tag: "Italiano / Grammatica",
                  topic: "Passato Prossimo & Ausiliari",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "A Casa dos Verbos de ESSERE",
                      "Movimento, Estado, Mudança e Reflexivos usam ESSERE",
                      "Italiano",
                      ["Casa italiana com portas de entrada/saída (andare/venire)", "Pessoa se olhando no espelho (reflexivos)", "Bebê nascendo e flor crescendo (nascere/diventare)"]
                    ),
                    metaphorTitle: "A 'Casa di Essere' (Verbos de Movimento e Estado)",
                    mnemonicAnchor: "Entrar, sair, ficar em casa e se olhar no espelho = ESSERE!",
                    visualElements: ["A Casa de campo italiana (movimento/estado)", "Espelho reflexivo (lavarsi/svegliarsi)", "Concordância final (-o, -a, -i, -e)"],
                    visualExplanation: "A famosa técnica mnemônica italiana da 'Casa di Essere' organiza espacialmente todos os verbos que exigem o auxiliar essere.",
                    generatedAt: new Date().toISOString(),
                  },
                },
                {
                  id: `fc-ita-${Date.now()}-2`,
                  front: "🇮🇹 Qual a função e uso do pronome partitivo 'NE' em italiano?",
                  back: "Substitui uma quantidade ou parte de algo ('di questo/di quello'). Exemplo: 'Quanti caffè bevi al giorno?' -> 'Ne bevo due' (Bebo dois [deles]).",
                  tag: "Italiano / Pronomi",
                  topic: "Partitivo NE",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "A Xícara & O Contador do 'NE'",
                      "NE = 'Disto / Desta quantidade'",
                      "Italiano",
                      ["Balcão de café com 5 xícaras e 2 selecionadas", "Seta mnemônica: 'Quanti? -> NE + número'", "Balança de fração/quantidade"]
                    ),
                    metaphorTitle: "A Fatia da Torta: Pronome Partitivo NE",
                    mnemonicAnchor: "Perguntou 'Quanto?' e respondeu a quantidade = use NE antes do verbo!",
                    visualElements: ["Xícaras de café em contagem", "Pronome NE como pinça de quantidade", "Exemplo 'Ne prendo tre' em destaque"],
                    visualExplanation: "A visualização de uma pinça destacando 2 de 5 itens esclarece a função partitiva do pronome 'NE' instantaneamente.",
                    generatedAt: new Date().toISOString(),
                  },
                },
              ];
              setFlashcards((prev) => [...italianGrammarCards, ...prev]);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-purple-950/40 border border-slate-700 hover:border-purple-500/50 rounded-xl text-xs font-semibold text-purple-300 transition flex items-center"
          >
            🇮🇹 Deck Italiano Mnemônico (2 Cards com Imagem)
          </button>

          <button
            type="button"
            onClick={() => {
              const lawCards: FlashcardItem[] = [
                {
                  id: `fc-dir-${Date.now()}-1`,
                  front: "⚖️ [Direito Constitucional] Quem possui legitimidade ativa para propor Ação Direta de Inconstitucionalidade (ADI)?",
                  back: "Art. 103 da CF/88: Presidente da República, Mesas do Senado e Câmara, Mesas de Assembleias Legislativas/CLDF, Governadores, PGR, Conselho Federal da OAB, partido político com representação no Congresso, confederação sindical ou entidade de classe de âmbito nacional.",
                  tag: "Direito / Constitucional",
                  topic: "Controle Concentrado",
                  nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
                  interval: 1,
                  box: 1,
                  visualMnemonic: {
                    imageUrl: generateConceptSvg(
                      "A Tríade dos 3 (3 Pessoas, 3 Mesas, 3 Entidades)",
                      "3 Chefes + 3 Mesas + 3 Instituições = Art. 103 CF",
                      "Direito",
                      ["3 Autoridades (Presidente, PGR, Governador)", "3 Mesas (Senado, Câmara, Assembleias)", "3 Entidades (OAB, Partidos, Sindicatos)"]
                    ),
                    metaphorTitle: "A Regra Mnemônica 3-3-3 da ADI",
                    mnemonicAnchor: "3 Pessoas (PR, PGR, Gov) + 3 Mesas (Sen, Câm, AL) + 3 Entidades (OAB, Part, Sind)",
                    visualElements: ["Pirâmide 3x3x3 no topo do STF", "Balança da Justiça", "Artigo 103 cravado em pedra"],
                    visualExplanation: "Dividir os 9 legitimados da ADI no esquema simétrico 3-3-3 impede o esquecimento de qualquer membro na prova da OAB/concursos.",
                    generatedAt: new Date().toISOString(),
                  },
                },
              ];
              setFlashcards((prev) => [...lawCards, ...prev]);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center"
          >
            ⚖️ Deck Direito: Macetes OAB (1 Card Visual)
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Layers className="w-4 h-4 mr-2 text-purple-400" />
              Novo Flashcard de Alta Retenção
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleAddCard} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Frente (Pergunta / Gatilho Mental)
              </label>
              <textarea
                rows={2}
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Ex: Qual é a fórmula do vértice da parábola Xv e Yv?"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Verso (Resposta Direta / Definição)
              </label>
              <textarea
                rows={2}
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Ex: Xv = -b / (2a) e Yv = -Δ / (4a)"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Etiqueta / Matéria (ex: Matemática)..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />

              <label className="flex items-center space-x-2 text-xs text-purple-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateVisualOnAdd}
                  onChange={(e) => setAutoGenerateVisualOnAdd(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-800"
                />
                <span>✨ Gerar Apoio Visual IA</span>
              </label>

              <button
                type="submit"
                className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl transition shadow"
              >
                Salvar Flashcard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search, Subject Tag & Visual Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveCardIdx(0);
              }}
              placeholder="Buscar por pergunta, resposta, metáfora visual ou matéria..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCardIdx(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Box Filter & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("player")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  viewMode === "player"
                    ? "bg-purple-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Praticar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("explorer")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  viewMode === "explorer"
                    ? "bg-purple-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Explorar Deck ({totalFiltered})</span>
              </button>
            </div>

            <select
              value={selectedBox}
              onChange={(e) => {
                setSelectedBox(e.target.value);
                setActiveCardIdx(0);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Todas as Caixas</option>
              <option value="1">Caixa 1 (1 dia)</option>
              <option value="2">Caixa 2 (7 dias)</option>
              <option value="3">Caixa 3 (15 dias)</option>
              <option value="4">Caixa 4 (30 dias)</option>
            </select>
          </div>
        </div>

        {/* Visual Support Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
              <ImageIcon className="w-3 h-3 mr-1.5 text-purple-400" />
              Apoio Visual:
            </span>
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedVisualFilter("all");
                  setActiveCardIdx(0);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  selectedVisualFilter === "all"
                    ? "bg-purple-500/20 text-purple-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos ({flashcards.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisualFilter("with_visual");
                  setActiveCardIdx(0);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center space-x-1 ${
                  selectedVisualFilter === "with_visual"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🖼️ Com Imagem IA</span>
                <span className="text-[10px] px-1 rounded bg-slate-900 font-mono">
                  {visualStats.withVisualCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisualFilter("without_visual");
                  setActiveCardIdx(0);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  selectedVisualFilter === "without_visual"
                    ? "bg-amber-500/20 text-amber-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sem Imagem ({visualStats.withoutVisualCount})
              </button>
            </div>
          </div>

          {(selectedTag !== "all" || selectedBox !== "all" || selectedVisualFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center hover:underline"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar filtros ({totalFiltered} de {flashcards.length})
            </button>
          )}
        </div>

        {/* Subject Tag Filter Chips */}
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
              <Tag className="w-3 h-3 mr-1.5 text-purple-400" />
              Filtrar por Matéria:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedTag("all");
                setActiveCardIdx(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedTag === "all"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              <span>Todas as Matérias</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-400">
                {flashcards.length}
              </span>
            </button>

            {tagStats.map(({ name, count }) => {
              const isSelected = selectedTag === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedTag(name);
                    setActiveCardIdx(0);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-purple-500/30 text-purple-200 border border-purple-400 font-bold shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:text-purple-300 hover:border-purple-500/40 border border-slate-700/60"
                  }`}
                >
                  <Tag className={`w-3 h-3 ${isSelected ? "text-purple-300" : "text-slate-500"}`} />
                  <span>{name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Flashcard View: Player vs Explorer */}
      {viewMode === "player" ? (
        totalFiltered > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Card {safeActiveIdx + 1} de {totalFiltered}
                </span>
                {selectedTag !== "all" && (
                  <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Filtro: {selectedTag}
                  </span>
                )}
                {currentCard.visualMnemonic?.imageUrl && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Com Apoio Visual
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {currentCard.tag || "Geral"}
                </span>
                <span className="text-[11px] text-slate-400">
                  Caixa Leitner: <strong>{currentCard.box || 1}/4</strong> ({currentCard.interval || 1}d)
                </span>
                <button
                  onClick={() => handleDeleteCard(currentCard.id)}
                  title="Excluir card"
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Flip Card Stage */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[220px] p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 cursor-pointer flex flex-col justify-between items-center text-center shadow-lg hover:border-purple-500/40 transition group space-y-4"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center">
                  <RotateCw className="w-3 h-3 mr-1 group-hover:rotate-180 transition-transform duration-500" />
                  {isFlipped ? "Verso (Resposta & Apoio Visual)" : "Frente (Gatilho Mental)"}
                </span>

                <span className="text-[10px] text-purple-400 font-semibold">
                  {isFlipped ? "Clique para virar para a Frente" : "Clique para revelar a Resposta"}
                </span>
              </div>

              {/* Card Question or Answer Text */}
              <p className="text-base sm:text-xl font-medium text-white max-w-xl leading-relaxed py-2">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {/* Visual Mnemonic Component Integrated Inside Card */}
              <div className="w-full pt-2">
                <VisualMnemonicCard
                  card={currentCard}
                  onGenerateVisual={handleGenerateVisualForCard}
                  isGenerating={generatingCardIds[currentCard.id]}
                  isFlipped={isFlipped}
                  onOpenLightbox={setLightboxData}
                  onRemoveVisual={handleRemoveVisualFromCard}
                />
              </div>

              <span className="text-[11px] text-slate-400">
                {isFlipped ? "Como foi seu resgate de memória?" : "Tente lembrar a resposta antes de virar"}
              </span>
            </div>

            {/* Card Navigator / Progress dots */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={safeActiveIdx === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setActiveCardIdx(Math.max(0, safeActiveIdx - 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <span className="text-xs text-slate-400 font-mono">
                {safeActiveIdx + 1} / {totalFiltered}
              </span>

              <button
                type="button"
                disabled={safeActiveIdx >= totalFiltered - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setActiveCardIdx(Math.min(totalFiltered - 1, safeActiveIdx + 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold flex items-center space-x-1"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rating Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRateCard("hard")}
                  className="py-3 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Difícil (1 dia)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard("good")}
                  className="py-3 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Bom (7-15 dias)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard("easy")}
                  className="py-3 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fácil (30 dias)</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Mostrar Resposta
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum Flashcard com os Filtros Selecionados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Não encontramos nenhum card com os critérios informados.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold"
            >
              Limpar Filtros de Busca
            </button>
          </div>
        )
      ) : (
        /* Explorer Mode: Grid of all matching flashcards */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <BookMarked className="w-4 h-4 mr-2 text-purple-400" />
              Baralho Completo ({totalFiltered} cards correspondentes)
            </h3>
            <span className="text-xs text-slate-400">
              Clique em um card para praticá-lo ou ver sua imagem mnemônica
            </span>
          </div>

          {totalFiltered > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFlashcards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => {
                    setActiveCardIdx(idx);
                    setViewMode("player");
                    setIsFlipped(false);
                  }}
                  className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {card.tag || "Geral"}
                        </span>
                        {card.visualMnemonic?.imageUrl && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center">
                            <ImageIcon className="w-2.5 h-2.5 mr-0.5" />
                            Visual IA
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Caixa {card.box || 1}/4 • {card.interval || 1}d
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      {card.visualMnemonic?.imageUrl && (
                        <img
                          src={card.visualMnemonic.imageUrl}
                          alt={card.visualMnemonic.metaphorTitle || "Apoio Visual"}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover border border-purple-500/30 shrink-0"
                        />
                      )}
                      <p className="text-xs font-semibold text-white group-hover:text-purple-200 line-clamp-2">
                        {card.front}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                    <p className="line-clamp-1 italic text-slate-300 max-w-[200px]">
                      {card.back}
                    </p>
                    <span className="text-purple-400 font-semibold group-hover:underline flex items-center text-[10px]">
                      Praticar <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhum card encontrado com esses filtros.
            </div>
          )}
        </div>
      )}

      {/* Spaced Review Schedule Queue with Search and Subject Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-teal-400" />
              Fila de Revisões Espaçadas Agendadas ({filteredSpacedReviews.length} de {spacedReviews.length})
            </h2>
            <span className="text-xs text-slate-400">Ciclos de memorização (1D, 7D, 15D e 30D)</span>
          </div>

          {/* Review Filter Controls */}
          {spacedReviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  placeholder="Buscar tópicos..."
                  className="pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              {reviewSubjects.length > 1 && (
                <select
                  value={selectedReviewSubject}
                  onChange={(e) => setSelectedReviewSubject(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">Todas as Matérias</option>
                  {reviewSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {filteredSpacedReviews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredSpacedReviews.map((rev) => (
              <div
                key={rev.id}
                onClick={() => handleToggleSpacedReview(rev.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                  rev.completed
                    ? "bg-slate-800/30 border-slate-800 text-slate-500 line-through"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-teal-500/50"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      rev.completed ? "text-teal-400 fill-teal-500/20" : "text-slate-500"
                    }`}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-slate-100 truncate">{rev.topic}</p>
                    <span className="text-[10px] text-slate-400">{rev.subject}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                  {rev.stage}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            {spacedReviews.length === 0
              ? "Nenhuma revisão agendada ainda. Entre na aba Tutor para estudar um tópico e agendar o ciclo de 1, 7, 15 e 30 dias com 1 clique."
              : "Nenhuma revisão encontrada para os filtros de busca informados."}
          </p>
        )}
      </div>
    </div>
  );
};
