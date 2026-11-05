import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Sparkles,
  Calendar,
  Smile,
  Zap,
  Target,
  Search,
  Filter,
  Trash2,
  Edit3,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Bookmark,
  Share2,
  Download,
  BookOpenCheck,
  Brain,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  Award,
  BarChart2,
  X,
  Tag,
  Shield,
  Crown,
  Medal,
  Lock
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  StudyJournalEntry,
  UserProfile,
  GeneratedPlans,
  JournalMood,
  JournalEntryType,
  SubjectSentimentStatus,
  JournalSubjectSentiment
} from "../types";
import { getDifficultyMeta } from "./ProfileForm";
import { SentimentThermometerChart } from "./SentimentThermometerChart";
import { computeJournalConsistency } from "../utils/achievements";

interface StudyJournalViewProps {
  journalEntries: StudyJournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<StudyJournalEntry[]>>;
  profile: UserProfile;
  plans: GeneratedPlans | null;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
}

const MOOD_CONFIG: Record<
  JournalMood,
  { label: string; emoji: string; color: string; bg: string; border: string; desc: string }
> = {
  confident: {
    label: "Confiante & Fluido",
    emoji: "🌟",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    desc: "Compreensão sólida e alta sensação de domínio.",
  },
  motivated: {
    label: "Motivado & Focado",
    emoji: "🚀",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    desc: "Excelente ritmo de execução e disciplina.",
  },
  neutral: {
    label: "Equilibrado & Regular",
    emoji: "⚖️",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    desc: "Dia estável com cumprimento regular das metas.",
  },
  tired: {
    label: "Cansado & Baixa Energia",
    emoji: "🥱",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    desc: "Fadiga física ou mental acumulada.",
  },
  challenged: {
    label: "Desafiado por Dificuldades",
    emoji: "🧩",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    desc: "Conteúdos complexos que demandaram esforço extra.",
  },
  overwhelmed: {
    label: "Sobrecarregado / Ansioso",
    emoji: "🤯",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    desc: "Pressão de tempo ou volume excessivo de matéria.",
  },
};

const ENTRY_TYPE_CONFIG: Record<
  JournalEntryType,
  { label: string; icon: any; color: string; badgeBg: string }
> = {
  reflection: { label: "Reflexão Diária", icon: BookOpen, color: "text-emerald-400", badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  quick_note: { label: "Anotação Rápida", icon: Edit3, color: "text-blue-400", badgeBg: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  insight: { label: "Insight / Epifania", icon: Sparkles, color: "text-amber-400", badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  difficulty: { label: "Gargalo / Dificuldade", icon: AlertCircle, color: "text-rose-400", badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  breakthrough: { label: "Vitória / Avanço", icon: Award, color: "text-teal-400", badgeBg: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
};

const SENTIMENT_STATUS_CONFIG: Record<
  SubjectSentimentStatus,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  confident: { label: "Confiante & Dominado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  improving: { label: "Melhorando & Em Evolução", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: TrendingUp },
  challenging: { label: "Desafiador / Exige Atenção", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: HelpCircle },
  needs_attention: { label: "Crítico / Precisa de Reforço", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: AlertCircle },
};

export const StudyJournalView: React.FC<StudyJournalViewProps> = ({
  journalEntries,
  setJournalEntries,
  profile,
  plans,
  onLaunchTopicTutor,
}) => {
  // Modal & Edit State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState<string>("");
  const [entryType, setEntryType] = useState<JournalEntryType>("reflection");
  const [overallMood, setOverallMood] = useState<JournalMood>("motivated");
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [focusScore, setFocusScore] = useState<number>(8);
  const [content, setContent] = useState<string>("");
  const [keyTakeaway, setKeyTakeaway] = useState<string>("");
  const [tomorrowGoal, setTomorrowGoal] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [subjectSentiments, setSubjectSentiments] = useState<JournalSubjectSentiment[]>([]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMood, setFilterMood] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");

  // AI Mentor Analysis State
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Expanded card state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Available subjects from profile and plans
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    if (profile.subjects && Array.isArray(profile.subjects)) {
      profile.subjects.forEach((s) => {
        if (typeof s === "string" && s.trim()) subs.add(s.trim());
      });
    }
    if (plans?.annualPlan) {
      plans.annualPlan.forEach((m) => {
        m.topics?.forEach((t) => {
          const sub = t.split(":")[0]?.trim();
          if (sub && sub.length < 30) subs.add(sub);
        });
      });
    }
    // Fallback default subjects if none found
    if (subs.size === 0) {
      ["Matemática", "Física", "Química", "Biologia", "Português/Redação", "História", "Geografia"].forEach((s) => subs.add(s));
    }
    return Array.from(subs);
  }, [profile, plans]);

  // Open modal for new entry
  const handleOpenNewModal = (prefilledType: JournalEntryType = "reflection") => {
    setEditingEntryId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setTitle(
      prefilledType === "reflection"
        ? "Reflexão do Dia de Estudos"
        : prefilledType === "insight"
        ? "Insight de Aprendizado"
        : prefilledType === "difficulty"
        ? "Registro de Ponto de Dificuldade"
        : prefilledType === "breakthrough"
        ? "Avanço / Conquista de Hoje"
        : "Anotação Rápida"
    );
    setEntryType(prefilledType);
    setOverallMood("motivated");
    setEnergyLevel(4);
    setFocusScore(8);
    setContent("");
    setKeyTakeaway("");
    setTomorrowGoal("");
    setTags([]);
    setTagInput("");

    // Initialize 2-3 subjects based on profile
    const initialSubjs: JournalSubjectSentiment[] = availableSubjects.slice(0, 3).map((sub) => ({
      subject: sub,
      sentiment: "improving",
      notes: "",
    }));
    setSubjectSentiments(initialSubjs);
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (entry: StudyJournalEntry) => {
    setEditingEntryId(entry.id);
    setDate(entry.date);
    setTitle(entry.title);
    setEntryType(entry.entryType);
    setOverallMood(entry.overallMood);
    setEnergyLevel(entry.energyLevel);
    setFocusScore(entry.focusScore);
    setContent(entry.content);
    setKeyTakeaway(entry.keyTakeaway || "");
    setTomorrowGoal(entry.tomorrowGoal || "");
    setTags(entry.tags || []);
    setTagInput("");
    setSubjectSentiments(entry.subjectSentiments || []);
    setShowModal(true);
  };

  // Save Entry (Create or Update)
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("Por favor, escreva uma breve reflexão ou anotação.");
      return;
    }

    const finalTitle = title.trim() || `Registro de ${date}`;

    if (editingEntryId) {
      // Update
      setJournalEntries((prev) =>
        prev.map((item) =>
          item.id === editingEntryId
            ? {
                ...item,
                date,
                title: finalTitle,
                entryType,
                overallMood,
                energyLevel,
                focusScore,
                content,
                subjectSentiments: subjectSentiments.filter((s) => s.subject.trim()),
                keyTakeaway: keyTakeaway.trim() || undefined,
                tomorrowGoal: tomorrowGoal.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
              }
            : item
        )
      );
    } else {
      // Create new
      const newEntry: StudyJournalEntry = {
        id: `journal-${Date.now()}`,
        date,
        title: finalTitle,
        entryType,
        overallMood,
        energyLevel,
        focusScore,
        content,
        subjectSentiments: subjectSentiments.filter((s) => s.subject.trim()),
        keyTakeaway: keyTakeaway.trim() || undefined,
        tomorrowGoal: tomorrowGoal.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        createdAt: new Date().toISOString(),
      };

      setJournalEntries((prev) => [newEntry, ...prev]);

      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }
    }

    setShowModal(false);
  };

  // Delete Entry
  const handleDeleteEntry = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta anotação do seu Diário de Bordo?")) {
      setJournalEntries((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Add Subject to Form
  const handleAddSubjectSentiment = () => {
    const remaining = availableSubjects.find((s) => !subjectSentiments.some((item) => item.subject === s));
    const newSubjectName = remaining || `Nova Matéria ${subjectSentiments.length + 1}`;
    setSubjectSentiments([...subjectSentiments, { subject: newSubjectName, sentiment: "improving", notes: "" }]);
  };

  // Remove Subject from Form
  const handleRemoveSubjectSentiment = (index: number) => {
    setSubjectSentiments(subjectSentiments.filter((_, i) => i !== index));
  };

  // Update Subject Sentiment Field
  const handleUpdateSubjectField = (index: number, field: keyof JournalSubjectSentiment, value: any) => {
    setSubjectSentiments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Toggle Card Expansion
  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // AI Mentor Journal Analysis Handler
  const handleAnalyzeJournal = async () => {
    if (journalEntries.length === 0) {
      alert("Adicione pelo menos um registro no Diário de Bordo para a IA gerar a análise reflexiva.");
      return;
    }

    setIsAnalyzing(true);
    setShowAIAnalysisModal(true);
    try {
      const res = await fetch("/api/study/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: journalEntries,
          profile,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do servidor");
      }

      const data = await res.json();
      setAiAnalysisResult(data);
    } catch (err: any) {
      console.error("Erro ao analisar diário de bordo:", err);
      // Fallback local pedagogical analysis
      setAiAnalysisResult({
        emotionalDiagnosis: "Seus registros indicam uma mentalidade de crescimento e consistência nos blocos de estudo.",
        subjectSentimentsOverview: availableSubjects.slice(0, 3).map((sub) => ({
          subject: sub,
          trend: "Em consolidação",
          pedagogicalAdvice: "Intercale resolução de questões difíceis com revisões ativas de 15 minutos.",
        })),
        energyAndFocusAnalysis: "Mantenha o hábito de registrar os picos de energia para agendar as disciplinas mais densas nos horários nobres.",
        actionableRecommendations: [
          "Priorize a resolução de questões de bancas nas matérias que geram maior desafio.",
          "Use a técnica de pausa ativa a cada 50 minutos para manter o nível de energia alto.",
          "Comemore cada pequeno avanço diário registrado no diário de bordo.",
        ],
        mentorMessage: "A clareza sobre suas emoções e seu ritmo de aprendizagem é a base para o alto rendimento sustentável.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export Journal to Markdown / Text File
  const handleExportJournal = () => {
    if (journalEntries.length === 0) {
      alert("Não há registros no diário para exportar.");
      return;
    }

    let md = `# Diário de Bordo & Reflexões de Estudo\n`;
    md += `**Objetivo / Foco**: ${profile.objective || "Estudos e Provas"}\n`;
    md += `**Total de Registros**: ${journalEntries.length}\n`;
    md += `**Exportado em**: ${new Date().toLocaleDateString("pt-BR")}\n\n---\n\n`;

    journalEntries.forEach((entry, idx) => {
      const mood = MOOD_CONFIG[entry.overallMood];
      const type = ENTRY_TYPE_CONFIG[entry.entryType];
      md += `## ${idx + 1}. ${entry.title} (${entry.date})\n`;
      md += `- **Tipo**: ${type.label}\n`;
      md += `- **Humor/Sentimento**: ${mood.emoji} ${mood.label}\n`;
      md += `- **Nível de Energia**: ${"⭐".repeat(entry.energyLevel)} (${entry.energyLevel}/5)\n`;
      md += `- **Score de Foco**: ${entry.focusScore}/10\n\n`;
      md += `### Reflexão / Anotações:\n${entry.content}\n\n`;

      if (entry.subjectSentiments && entry.subjectSentiments.length > 0) {
        md += `### Sentimento por Matéria:\n`;
        entry.subjectSentiments.forEach((s) => {
          const st = SENTIMENT_STATUS_CONFIG[s.sentiment];
          md += `- **${s.subject}**: ${st.label}${s.notes ? ` - "${s.notes}"` : ""}\n`;
        });
        md += `\n`;
      }

      if (entry.keyTakeaway) {
        md += `> **💡 Principal Lição/Takeaway**: ${entry.keyTakeaway}\n\n`;
      }

      if (entry.tomorrowGoal) {
        md += `> **🎯 Meta para Amanhã**: ${entry.tomorrowGoal}\n\n`;
      }

      if (entry.tags && entry.tags.length > 0) {
        md += `*Tags*: ${entry.tags.map((t) => `#${t}`).join(" ")}\n\n`;
      }

      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `diario_de_bordo_${new Date().toISOString().split("T")[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed Stats
  const stats = useMemo(() => {
    if (journalEntries.length === 0) {
      return {
        total: 0,
        avgFocus: 0,
        avgEnergy: 0,
        dominantMood: null,
        topSubjectFeelings: {},
      };
    }

    const total = journalEntries.length;
    const avgFocus = (journalEntries.reduce((acc, curr) => acc + (curr.focusScore || 0), 0) / total).toFixed(1);
    const avgEnergy = (journalEntries.reduce((acc, curr) => acc + (curr.energyLevel || 0), 0) / total).toFixed(1);

    // Mood counts
    const moodCounts: Record<string, number> = {};
    journalEntries.forEach((e) => {
      moodCounts[e.overallMood] = (moodCounts[e.overallMood] || 0) + 1;
    });
    let dominantMood: JournalMood = "motivated";
    let maxCount = -1;
    Object.entries(moodCounts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = m as JournalMood;
      }
    });

    // Subject feelings summary (latest sentiment per subject)
    const latestSubjectSentiments: Record<string, { sentiment: SubjectSentimentStatus; notes?: string; date: string }> = {};
    journalEntries.forEach((entry) => {
      entry.subjectSentiments?.forEach((ss) => {
        if (!latestSubjectSentiments[ss.subject]) {
          latestSubjectSentiments[ss.subject] = {
            sentiment: ss.sentiment,
            notes: ss.notes,
            date: entry.date,
          };
        }
      });
    });

    return {
      total,
      avgFocus,
      avgEnergy,
      dominantMood,
      latestSubjectSentiments,
    };
  }, [journalEntries]);

  // Consistency Milestones & Badges for 30, 60, 90 days
  const consistencyMilestones = useMemo(() => {
    return computeJournalConsistency(journalEntries);
  }, [journalEntries]);

  // Extract all Subject Tags and Custom Tags with counts
  const tagStats = useMemo(() => {
    const counts: Record<string, { type: "subject" | "tag"; count: number }> = {};

    journalEntries.forEach((entry) => {
      // Subjects from sentiments
      entry.subjectSentiments?.forEach((ss) => {
        const sub = ss.subject?.trim();
        if (sub) {
          if (!counts[sub]) {
            counts[sub] = { type: "subject", count: 0 };
          }
          counts[sub].count += 1;
        }
      });

      // Custom tags
      entry.tags?.forEach((t) => {
        const cleanTag = t.trim().replace(/^#/, "");
        if (cleanTag) {
          const key = `#${cleanTag}`;
          if (!counts[key]) {
            counts[key] = { type: "tag", count: 0 };
          }
          counts[key].count += 1;
        }
      });
    });

    // Also include availableSubjects that might not have entries yet
    availableSubjects.forEach((sub) => {
      if (!counts[sub]) {
        counts[sub] = { type: "subject", count: 0 };
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        type: data.type,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [journalEntries, availableSubjects]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(term);
        const matchesContent = entry.content.toLowerCase().includes(term);
        const matchesTakeaway = entry.keyTakeaway?.toLowerCase().includes(term);
        const matchesGoal = entry.tomorrowGoal?.toLowerCase().includes(term);
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(term));
        const matchesSubject = entry.subjectSentiments?.some(
          (s) => s.subject.toLowerCase().includes(term) || s.notes?.toLowerCase().includes(term)
        );
        if (!matchesTitle && !matchesContent && !matchesTakeaway && !matchesGoal && !matchesTags && !matchesSubject) {
          return false;
        }
      }

      // Filter Mood
      if (filterMood !== "all" && entry.overallMood !== filterMood) {
        return false;
      }

      // Filter Type
      if (filterType !== "all" && entry.entryType !== filterType) {
        return false;
      }

      // Filter Subject from dropdown
      if (filterSubject !== "all") {
        const hasSubject = entry.subjectSentiments?.some((s) => s.subject === filterSubject);
        if (!hasSubject) return false;
      }

      // Filter from Quick Tag Chips (selectedTagFilter)
      if (selectedTagFilter !== "all") {
        if (selectedTagFilter.startsWith("#")) {
          const rawTag = selectedTagFilter.replace(/^#/, "").toLowerCase();
          const hasTag = entry.tags?.some((t) => t.toLowerCase() === rawTag);
          if (!hasTag) return false;
        } else {
          const hasSubjectOrTag =
            entry.subjectSentiments?.some((s) => s.subject.toLowerCase() === selectedTagFilter.toLowerCase()) ||
            entry.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());
          if (!hasSubjectOrTag) return false;
        }
      }

      return true;
    });
  }, [journalEntries, searchTerm, filterMood, filterType, filterSubject, selectedTagFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Autoconsciência & Reflexão Pedagógica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Diário de Bordo & Registro de Sentimentos
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Registre reflexões diárias, anotações rápidas pós-estudo e monitore como você se sente em relação ao progresso de cada matéria. A neurociência comprova que a autorreflexão acelera a consolidação da memória e previne o esgotamento.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenNewModal("reflection")}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Registro
            </button>

            <button
              type="button"
              onClick={handleAnalyzeJournal}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 transition"
              title="Análise com Inteligência Artificial"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
              Mentor IA
            </button>

            <button
              type="button"
              onClick={handleExportJournal}
              className="inline-flex items-center px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Exportar Diário em Markdown"
            >
              <Download className="w-4 h-4 sm:mr-1.5 text-slate-400" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Quick Quick-add buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Adicionar rápido:</span>
          <button
            type="button"
            onClick={() => handleOpenNewModal("quick_note")}
            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition flex items-center"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Anotação Rápida
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewModal("insight")}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition flex items-center"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Insight do Dia
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewModal("difficulty")}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition flex items-center"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Gargalo / Dúvida
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewModal("breakthrough")}
            className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 transition flex items-center"
          >
            <Award className="w-3 h-3 mr-1" />
            Vitória / Avanço
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Entries */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total de Registros</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Average Focus */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium">Foco Médio</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-400 mt-1">
              {stats.avgFocus} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Average Energy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium">Energia Média</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
              {stats.avgEnergy} <span className="text-xs text-slate-400 font-normal">/ 5 ⭐</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Dominant Mood */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium">Humor Predominante</p>
            <p className="text-sm font-bold text-white mt-1 truncate max-w-[120px]">
              {stats.dominantMood ? (
                <>
                  <span className="mr-1">{MOOD_CONFIG[stats.dominantMood].emoji}</span>
                  {MOOD_CONFIG[stats.dominantMood].label.split("&")[0].trim()}
                </>
              ) : (
                "Sem registros"
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Smile className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Radar of Feelings per Subject (Status mais recente) */}
      {stats.latestSubjectSentiments && Object.keys(stats.latestSubjectSentiments).length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
              Termômetro de Sentimentos por Matéria (Última Percepção)
            </h3>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Atualizado automaticamente pelos seus registros
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {Object.entries(stats.latestSubjectSentiments).map(([subject, data]) => {
              const statusCfg = SENTIMENT_STATUS_CONFIG[data.sentiment];
              const StatusIcon = statusCfg.icon;

              const score = profile.subjectDifficulties?.[subject] ?? 5;
              const meta = getDifficultyMeta(score);

              return (
                <div
                  key={subject}
                  className={`p-3 rounded-xl border ${statusCfg.bg} ${statusCfg.border} transition flex flex-col justify-between space-y-2`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white block">{subject}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded border font-mono font-bold ${meta.badgeColor}`} title={`Dificuldade: ${score}/10`}>
                          Dif. {score}/10
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold flex items-center mt-0.5 ${statusCfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1 inline" />
                        {statusCfg.label}
                      </span>
                    </div>
                    {onLaunchTopicTutor && (
                      <button
                        type="button"
                        onClick={() => onLaunchTopicTutor(subject, subject)}
                        title={`Praticar ${subject} com o Tutor IA`}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {data.notes && (
                    <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                      "{data.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consistency Milestones & Badges for 30, 60, 90 Days */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/70 rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Crown className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Marcos de Consistência no Diário de Bordo
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Mantenha o registro diário contínuo para desbloquear insígnias de elite e bonificações de XP
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shrink-0">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Sequência Atual</p>
              <p className="text-sm font-extrabold text-white">
                {consistencyMilestones.currentStreak}{" "}
                <span className="text-xs font-medium text-slate-400">
                  {consistencyMilestones.currentStreak === 1 ? "dia consecutivo" : "dias consecutivos"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 30, 60 and 90 Days Milestone Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {Object.values(consistencyMilestones.milestones).map((ms) => {
            const is30 = ms.daysRequired === 30;
            const is60 = ms.daysRequired === 60;
            const is90 = ms.daysRequired === 90;
            const remainingDays = Math.max(0, ms.daysRequired - ms.progress);

            const badgeTheme = is30
              ? {
                  border: ms.unlocked ? "border-amber-700/60" : "border-slate-800",
                  bg: ms.unlocked ? "bg-amber-950/20" : "bg-slate-950/60",
                  iconBg: ms.unlocked ? "bg-amber-700/30 text-amber-300" : "bg-slate-800 text-slate-500",
                  accent: "text-amber-400",
                  bar: "bg-amber-600",
                  icon: <Medal className="w-5 h-5" />,
                }
              : is60
              ? {
                  border: ms.unlocked ? "border-slate-400/60" : "border-slate-800",
                  bg: ms.unlocked ? "bg-slate-800/40" : "bg-slate-950/60",
                  iconBg: ms.unlocked ? "bg-slate-600/40 text-slate-200" : "bg-slate-800 text-slate-500",
                  accent: "text-slate-300",
                  bar: "bg-slate-300",
                  icon: <Shield className="w-5 h-5" />,
                }
              : {
                  border: ms.unlocked ? "border-amber-400/60" : "border-slate-800",
                  bg: ms.unlocked ? "bg-amber-950/30" : "bg-slate-950/60",
                  iconBg: ms.unlocked ? "bg-amber-500/30 text-amber-300" : "bg-slate-800 text-slate-500",
                  accent: "text-amber-300",
                  bar: "bg-gradient-to-r from-amber-400 to-yellow-300",
                  icon: <Crown className="w-5 h-5" />,
                };

            return (
              <div
                key={ms.badgeId}
                onClick={() => {
                  if (ms.unlocked) {
                    try {
                      confetti({
                        particleCount: 50,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    } catch (e) {
                      // ignore
                    }
                  }
                }}
                className={`p-4 rounded-2xl border ${badgeTheme.border} ${badgeTheme.bg} transition relative overflow-hidden flex flex-col justify-between space-y-3 ${
                  ms.unlocked ? "shadow-md hover:scale-[1.01] cursor-pointer" : "opacity-90"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${badgeTheme.iconBg} border border-white/5 flex items-center justify-center shrink-0`}>
                      {badgeTheme.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-white leading-tight">{ms.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{ms.subtitle}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      ms.unlocked
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {ms.unlocked ? "Desbloqueado" : `Faltam ${remainingDays}d`}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {ms.description}
                </p>

                {/* Progress Bar & Reward */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">
                      Progresso: {ms.progress}/{ms.daysRequired} dias
                    </span>
                    <span className={`font-bold ${badgeTheme.accent}`}>+{ms.xpReward} XP</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${badgeTheme.bar}`}
                      style={{ width: `${ms.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico Recharts de Evolução do Termômetro de Sentimentos ao Longo do Mês */}
      <SentimentThermometerChart
        journalEntries={journalEntries}
        profile={profile}
      />

      {/* Filter and Search Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar registros por palavras-chave, matéria, lições, metas ou tags..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Mood Filter */}
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos os Humores</option>
              {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.emoji} {cfg.label}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos os Tipos</option>
              {Object.entries(ENTRY_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>

            {/* Subject Dropdown */}
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                if (e.target.value !== "all") {
                  setSelectedTagFilter("all");
                }
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todas as Matérias</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Tag Filter Chips */}
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
              <Tag className="w-3 h-3 mr-1.5 text-emerald-400" />
              Filtrar por Matéria / Tag:
            </span>
            {(selectedTagFilter !== "all" || filterSubject !== "all" || filterMood !== "all" || filterType !== "all" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTagFilter("all");
                  setFilterSubject("all");
                  setFilterMood("all");
                  setFilterType("all");
                  setSearchTerm("");
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center hover:underline"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar filtros ({filteredEntries.length} de {journalEntries.length} registros)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedTagFilter("all");
                setFilterSubject("all");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedTagFilter === "all" && filterSubject === "all"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              <span>Todos os Registros</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-400">
                {journalEntries.length}
              </span>
            </button>

            {tagStats.map(({ name, type, count }) => {
              const isSelected = selectedTagFilter === name || (type === "subject" && filterSubject === name);
              const isTag = name.startsWith("#");

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTagFilter("all");
                      setFilterSubject("all");
                    } else {
                      if (type === "subject" && !isTag) {
                        setFilterSubject(name);
                        setSelectedTagFilter(name);
                      } else {
                        setSelectedTagFilter(name);
                        setFilterSubject("all");
                      }
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400 font-bold shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700/60"
                  }`}
                >
                  <Tag className={`w-3 h-3 ${isSelected ? "text-emerald-300" : isTag ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-400">
                {searchTerm || filterMood !== "all" || filterType !== "all" || filterSubject !== "all"
                  ? "Tente ajustar os filtros de busca para visualizar outros registros."
                  : "Comece seu Diário de Bordo registrando sua primeira reflexão ou anotação rápida sobre os estudos de hoje."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenNewModal("reflection")}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Primeiro Registro
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const mood = MOOD_CONFIG[entry.overallMood];
            const type = ENTRY_TYPE_CONFIG[entry.entryType];
            const TypeIcon = type.icon;
            const isExpanded = expandedCards[entry.id] ?? true;

            return (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition shadow-sm space-y-4"
              >
                {/* Header of Entry */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl ${mood.bg} ${mood.border} border text-xl flex items-center justify-center flex-shrink-0`}>
                      {mood.emoji}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-white tracking-tight">{entry.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${type.badgeBg}`}>
                          <TypeIcon className="w-3 h-3 mr-1 inline" />
                          {type.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className={`font-semibold ${mood.color}`}>{mood.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    {/* Energy & Focus indicators */}
                    <div className="hidden sm:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-amber-400 font-bold flex items-center" title="Nível de Energia">
                        <Zap className="w-3.5 h-3.5 mr-1" />
                        {entry.energyLevel}/5
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-teal-400 font-bold flex items-center" title="Score de Foco">
                        <Target className="w-3.5 h-3.5 mr-1" />
                        {entry.focusScore}/10
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(entry)}
                      title="Editar Registro"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Excluir Registro"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCardExpand(entry.id)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Mobile indicators */}
                <div className="flex sm:hidden items-center space-x-3 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-semibold flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1" /> Energia: {entry.energyLevel}/5
                  </span>
                  <span className="text-teal-400 font-semibold flex items-center">
                    <Target className="w-3.5 h-3.5 mr-1" /> Foco: {entry.focusScore}/10
                  </span>
                </div>

                {/* Main Content */}
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </div>

                {/* Expanded Sections */}
                {isExpanded && (
                  <div className="space-y-3 pt-2">
                    {/* Subject Sentiments List */}
                    {entry.subjectSentiments && entry.subjectSentiments.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                        <p className="text-xs font-bold text-slate-300 flex items-center">
                          <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          Sentimento & Percepção por Disciplina:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {entry.subjectSentiments.map((ss, sIdx) => {
                            const st = SENTIMENT_STATUS_CONFIG[ss.sentiment];
                            const StIcon = st.icon;

                            return (
                              <div
                                key={sIdx}
                                className={`p-2.5 rounded-lg border ${st.bg} ${st.border} flex items-start justify-between space-x-2`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFilterSubject(ss.subject);
                                        setSelectedTagFilter(ss.subject);
                                      }}
                                      title={`Filtrar por ${ss.subject}`}
                                      className="text-xs font-bold text-white hover:text-emerald-300 hover:underline transition"
                                    >
                                      {ss.subject}
                                    </button>
                                    <span className={`text-[10px] font-semibold flex items-center ${st.color}`}>
                                      <StIcon className="w-3 h-3 mr-0.5 inline" />
                                      {st.label.split("&")[0].trim()}
                                    </span>
                                  </div>
                                  {ss.notes && <p className="text-[11px] text-slate-300 italic">"{ss.notes}"</p>}
                                </div>
                                {onLaunchTopicTutor && (
                                  <button
                                    type="button"
                                    onClick={() => onLaunchTopicTutor(ss.notes ? `${ss.subject}: ${ss.notes}` : ss.subject, ss.subject)}
                                    title="Tirar dúvidas com o Tutor IA"
                                    className="p-1 rounded bg-slate-800/90 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition"
                                  >
                                    <Brain className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaway and Tomorrow's Goal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.keyTakeaway && (
                        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1">
                          <span className="font-bold text-emerald-400 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            Principal Lição / Insight:
                          </span>
                          <p className="text-slate-200">{entry.keyTakeaway}</p>
                        </div>
                      )}

                      {entry.tomorrowGoal && (
                        <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-xs space-y-1">
                          <span className="font-bold text-blue-400 flex items-center">
                            <Target className="w-3.5 h-3.5 mr-1" />
                            Foco / Meta para Amanhã:
                          </span>
                          <p className="text-slate-200">{entry.tomorrowGoal}</p>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {entry.tags.map((tag, tIdx) => {
                          const cleanTag = tag.trim().replace(/^#/, "");
                          const tagKey = `#${cleanTag}`;
                          const isTagSelected = selectedTagFilter === tagKey || selectedTagFilter === cleanTag;

                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => {
                                if (isTagSelected) {
                                  setSelectedTagFilter("all");
                                } else {
                                  setSelectedTagFilter(tagKey);
                                }
                              }}
                              title={`Filtrar registros com a tag #${cleanTag}`}
                              className={`px-2 py-0.5 rounded-md border text-[11px] font-mono transition flex items-center space-x-1 ${
                                isTagSelected
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold"
                                  : "bg-slate-800/90 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 border-slate-700/60"
                              }`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>#{cleanTag}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New / Edit Journal Entry */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingEntryId ? "Editar Registro no Diário" : "Novo Registro no Diário de Bordo"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Anotações, percepções e sentimentos sobre o dia de estudos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-6">
              {/* Row: Date, Title & Entry Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título do Registro</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Foco em Funções e Revisão Espaçada de Física"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Entry Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Registro</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(ENTRY_TYPE_CONFIG).map(([key, cfg]) => {
                    const isSelected = entryType === key;
                    const TypeIcon = cfg.icon;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEntryType(key as JournalEntryType)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                        <span className="text-[11px] text-center leading-tight">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mood Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Como você se sentiu com o ritmo de hoje? (Humor Geral)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(MOOD_CONFIG).map(([key, cfg]) => {
                    const isSelected = overallMood === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setOverallMood(key as JournalMood)}
                        className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} border-2 text-white shadow-md`
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{cfg.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">{cfg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders: Energy Level and Focus Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                {/* Energy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center">
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      Nível de Energia Física / Mental
                    </label>
                    <span className="text-xs font-bold text-amber-400">{energyLevel} / 5 ⭐</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEnergyLevel(level)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                          energyLevel >= level
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-500"
                        }`}
                      >
                        {level}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center">
                      <Target className="w-3.5 h-3.5 mr-1 text-teal-400" />
                      Score de Foco e Concentração
                    </label>
                    <span className="text-xs font-bold text-teal-400">{focusScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={focusScore}
                    onChange={(e) => setFocusScore(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 (Disperso)</span>
                    <span>5 (Regular)</span>
                    <span>10 (Deep Work Total)</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Reflexão, Anotações e Observações do Dia *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    O que funcionou bem? O que travou? O que pode melhorar?
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Ex: No bloco matinal consegui manter 2 horas seguidas de resolução de exercícios de Matemática. A técnica de resolver questões antes da teoria acelerou a fixação. Em Física, ainda sinto alguma lentidão na interpretação de vetores..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Subject Sentiments Section */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      Sentimento e Progresso Específico por Matéria
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Como você avalia a sua confiança em cada matéria estudada recentemente?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubjectSentiment}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Matéria
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {subjectSentiments.map((ss, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Subject Select */}
                        <div className="w-full sm:w-1/3">
                          <select
                            value={ss.subject}
                            onChange={(e) => handleUpdateSubjectField(idx, "subject", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                          >
                            {availableSubjects.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sentiment Select */}
                        <div className="w-full sm:w-1/2">
                          <select
                            value={ss.sentiment}
                            onChange={(e) =>
                              handleUpdateSubjectField(idx, "sentiment", e.target.value as SubjectSentimentStatus)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            {Object.entries(SENTIMENT_STATUS_CONFIG).map(([statusKey, cfg]) => (
                              <option key={statusKey} value={statusKey}>
                                {cfg.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectSentiment(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 self-end sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subject Note */}
                      <input
                        type="text"
                        value={ss.notes || ""}
                        onChange={(e) => handleUpdateSubjectField(idx, "notes", e.target.value)}
                        placeholder="Nota rápida (ex: 'Acertei 85% dos exercícios de cinemática', 'Dúvida em logaritmos')"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row: Key Takeaway & Tomorrow's Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Principal Lição / Insight do Dia
                  </label>
                  <input
                    type="text"
                    value={keyTakeaway}
                    onChange={(e) => setKeyTakeaway(e.target.value)}
                    placeholder="Ex: Fazer desenhos gráficos reduz erros de cálculo"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                    <Target className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    Meta / Foco para Amanhã
                  </label>
                  <input
                    type="text"
                    value={tomorrowGoal}
                    onChange={(e) => setTomorrowGoal(e.target.value)}
                    placeholder="Ex: Iniciar com a revisão 1D e simulado de 20 questões"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tags Rápidas</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Ex: foco-profundo, simulado, matematica (Enter para adicionar)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
                  >
                    Adicionar
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700 flex items-center space-x-1"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
                >
                  {editingEntryId ? "Salvar Alterações" : "Salvar no Diário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Mentor Journal Analysis */}
      {showAIAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleIn my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Análise do Diário de Bordo pelo Mentor IA
                  </h2>
                  <p className="text-xs text-slate-400">
                    Insights psicopedagógicos, equilíbrio emocional e recomendações práticas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIAnalysisModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAnalyzing ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-200">
                  O Mentor IA está analisando seus sentimentos, registros e reflexões...
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Cruzando níveis de energia, scores de foco e percepções por disciplina para gerar recomendações personalizadas.
                </p>
              </div>
            ) : aiAnalysisResult ? (
              <div className="space-y-5">
                {/* Mentor Warm Message */}
                {aiAnalysisResult.mentorMessage && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-2">
                    <h3 className="text-xs font-bold text-amber-400 flex items-center uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Mensagem do Mentor
                    </h3>
                    <p className="text-sm text-slate-100 leading-relaxed italic">
                      "{aiAnalysisResult.mentorMessage}"
                    </p>
                  </div>
                )}

                {/* Emotional Diagnosis */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center uppercase tracking-wider">
                    <Smile className="w-4 h-4 mr-1.5 text-purple-400" />
                    Diagnóstico Emocional & Nível de Prontidão
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiAnalysisResult.emotionalDiagnosis}
                  </p>
                </div>

                {/* Energy & Focus Analysis */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center uppercase tracking-wider">
                    <Zap className="w-4 h-4 mr-1.5 text-amber-400" />
                    Relação Energia, Cansaço e Foco Líquido
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiAnalysisResult.energyAndFocusAnalysis}
                  </p>
                </div>

                {/* Subject Sentiments Breakdown */}
                {aiAnalysisResult.subjectSentimentsOverview && aiAnalysisResult.subjectSentimentsOverview.length > 0 && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center uppercase tracking-wider">
                      <Layers className="w-4 h-4 mr-1.5 text-emerald-400" />
                      Mapeamento e Ajustes por Disciplina
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiAnalysisResult.subjectSentimentsOverview.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{item.subject}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.trend}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">{item.pedagogicalAdvice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations */}
                {aiAnalysisResult.actionableRecommendations && aiAnalysisResult.actionableRecommendations.length > 0 && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-400" />
                      Ações Práticas Recomendadas para os Próximos Dias
                    </h3>
                    <ul className="space-y-2">
                      {aiAnalysisResult.actionableRecommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAIAnalysisModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition"
                  >
                    Entendido & Aplicar na Rotina
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
