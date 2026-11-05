import React from "react";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  BrainCircuit, 
  BookOpen, 
  Layers, 
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  RotateCw,
  Flame,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { SpacedReviewItem, FlashcardItem, UserProfile } from "../types";
import { getDifficultyMeta } from "./ProfileForm";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";

export interface PriorityReviewSubject {
  subject: string;
  maxOverdueDays: number;
  overdueCount: number;
  dueTodayCount: number;
  totalPendingCount: number;
  criticalTopics: string[];
  stagesPending: string[];
  estimatedRetention: number; // e.g. 35%
  urgencyLevel: "critical" | "high" | "warning" | "on_track";
  urgencyScore: number;
  oldestReviewId?: string;
  representativeTopic?: string;
  difficultyScore: number;
}

interface PriorityReviewCardProps {
  spacedReviews?: SpacedReviewItem[];
  flashcards?: FlashcardItem[];
  profile: UserProfile;
  onLaunchTopicTutor?: (topic: string, subject: string) => void;
  onNavigateToFlashcards?: (subject?: string) => void;
  onToggleSpacedReview?: (reviewId: string) => void;
  className?: string;
  compact?: boolean;
}

export const PriorityReviewCard: React.FC<PriorityReviewCardProps> = ({
  spacedReviews = [],
  flashcards = [],
  profile,
  onLaunchTopicTutor,
  onNavigateToFlashcards,
  onToggleSpacedReview,
  className = "",
  compact = false,
}) => {
  const now = Date.now();

  // Aggregate and compute top overdue subjects based on spaced repetition & flashcards data
  const prioritySubjects: PriorityReviewSubject[] = React.useMemo(() => {
    const subjectMap = new Map<string, {
      overdueReviews: { item: SpacedReviewItem; daysOverdue: number }[];
      todayReviews: SpacedReviewItem[];
      upcomingReviews: SpacedReviewItem[];
      overdueCards: { card: FlashcardItem; daysOverdue: number }[];
      allTopics: Set<string>;
      stages: Set<string>;
    }>();

    // Initialize all profile subjects
    (profile.subjects || []).forEach((sub) => {
      subjectMap.set(sub, {
        overdueReviews: [],
        todayReviews: [],
        upcomingReviews: [],
        overdueCards: [],
        allTopics: new Set<string>(),
        stages: new Set<string>(),
      });
    });

    // Process spaced repetition reviews
    spacedReviews.forEach((rev) => {
      if (rev.completed) return;
      const sub = rev.subject?.trim() || "Geral";
      if (!subjectMap.has(sub)) {
        subjectMap.set(sub, {
          overdueReviews: [],
          todayReviews: [],
          upcomingReviews: [],
          overdueCards: [],
          allTopics: new Set<string>(),
          stages: new Set<string>(),
        });
      }

      const data = subjectMap.get(sub)!;
      if (rev.topic) data.allTopics.add(rev.topic);
      if (rev.stage) data.stages.add(rev.stage);

      const scheduledTime = new Date(rev.scheduledFor).getTime();
      const diffMs = now - scheduledTime;
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays >= 1) {
        data.overdueReviews.push({ item: rev, daysOverdue: diffDays });
      } else if (diffDays === 0) {
        data.todayReviews.push(rev);
      } else {
        data.upcomingReviews.push(rev);
      }
    });

    // Process flashcards
    flashcards.forEach((card) => {
      const sub = card.tag?.trim() || card.topic || "Geral";
      if (!subjectMap.has(sub)) {
        subjectMap.set(sub, {
          overdueReviews: [],
          todayReviews: [],
          upcomingReviews: [],
          overdueCards: [],
          allTopics: new Set<string>(),
          stages: new Set<string>(),
        });
      }

      const data = subjectMap.get(sub)!;
      if (card.topic) data.allTopics.add(card.topic);

      if (card.nextReviewDate) {
        const nextTime = new Date(card.nextReviewDate).getTime();
        const diffMs = now - nextTime;
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays >= 1) {
          data.overdueCards.push({ card, daysOverdue: diffDays });
        }
      }
    });

    // Compute metrics for each subject
    const list: PriorityReviewSubject[] = [];

    subjectMap.forEach((data, subject) => {
      // Find max overdue days
      let maxDays = 0;
      let oldestRevId: string | undefined;

      data.overdueReviews.forEach((r) => {
        if (r.daysOverdue > maxDays) {
          maxDays = r.daysOverdue;
          oldestRevId = r.item.id;
        }
      });
      data.overdueCards.forEach((c) => {
        if (c.daysOverdue > maxDays) {
          maxDays = c.daysOverdue;
        }
      });

      const overdueCount = data.overdueReviews.length + data.overdueCards.length;
      const dueTodayCount = data.todayReviews.length;
      const totalPending = overdueCount + dueTodayCount;

      // Subject difficulty weighting
      const diffScore = profile.subjectDifficulties?.[subject] ?? 
        (profile.difficulties?.toLowerCase().includes(subject.toLowerCase()) ? 8 : 5);

      // Estimated Retention according to Ebbinghaus curve: R = 100 * e^(-0.2 * t)
      // When 0 days overdue: ~85% retention; 1 day: ~68%; 2 days: ~55%; 3 days: ~42%; 5+ days: ~25%
      let retention = 100;
      if (maxDays >= 5) {
        retention = Math.max(15, 30 - (maxDays - 5) * 2);
      } else if (maxDays === 4) {
        retention = 35;
      } else if (maxDays === 3) {
        retention = 44;
      } else if (maxDays === 2) {
        retention = 56;
      } else if (maxDays === 1) {
        retention = 68;
      } else if (dueTodayCount > 0) {
        retention = 80;
      } else {
        retention = 92;
      }

      // Urgency Level
      let urgencyLevel: "critical" | "high" | "warning" | "on_track" = "on_track";
      if (maxDays >= 3 || (maxDays >= 2 && overdueCount >= 2)) {
        urgencyLevel = "critical";
      } else if (maxDays >= 1 || overdueCount >= 1) {
        urgencyLevel = "high";
      } else if (dueTodayCount > 0) {
        urgencyLevel = "warning";
      }

      // Urgency score for deterministic ranking
      const urgencyScore = 
        maxDays * 25 + 
        overdueCount * 12 + 
        dueTodayCount * 6 + 
        diffScore * 3;

      const topicsArr = Array.from(data.allTopics);
      const repTopic = topicsArr[0] || profile.priorityTopics.split(",")[0] || `${subject} - Fundamentos`;

      list.push({
        subject,
        maxOverdueDays: maxDays,
        overdueCount,
        dueTodayCount,
        totalPendingCount: totalPending,
        criticalTopics: topicsArr.slice(0, 3),
        stagesPending: Array.from(data.stages),
        estimatedRetention: retention,
        urgencyLevel,
        urgencyScore,
        oldestReviewId: oldestRevId || data.todayReviews[0]?.id,
        representativeTopic: repTopic,
        difficultyScore: diffScore,
      });
    });

    // Sort descending by urgency score and pick top 3
    return list
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 3);
  }, [spacedReviews, flashcards, profile, now]);

  const hasAnyOverdue = prioritySubjects.some((s) => s.maxOverdueDays > 0 || s.overdueCount > 0 || s.dueTodayCount > 0);

  const handleQuickComplete = (subject: PriorityReviewSubject) => {
    if (subject.oldestReviewId && onToggleSpacedReview) {
      onToggleSpacedReview(subject.oldestReviewId);
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }
  };

  return (
    <section 
      id="priority-review-section"
      className={`bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Revisão Prioritária
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Atenção Imediata
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Top 3 matérias com repetições espaçadas mais atrasadas para resgatar a curva de retenção
              </p>
            </div>
          </div>
        </div>

        {/* Global Repetition Status Badge */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300 font-semibold">
            Ciclos de Retenção: <strong className="text-white">1D, 7D, 15D e 30D</strong>
          </span>
        </div>
      </div>

      {/* Top 3 Overdue Subjects Cards Grid */}
      {hasAnyOverdue ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {prioritySubjects.map((item, idx) => {
            const rank = idx + 1;
            const diffMeta = getDifficultyMeta(item.difficultyScore);

            // Styling based on rank & urgency
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;

            const cardTheme = isRank1
              ? {
                  border: "border-rose-500/40 hover:border-rose-500/70",
                  bg: "bg-slate-950/90",
                  badgeBg: "bg-rose-500 text-white shadow-rose-500/20 shadow-md",
                  rankLabel: "#1 Prioridade Máxima",
                  accentText: "text-rose-400",
                  retentionBar: "bg-gradient-to-r from-rose-500 to-rose-400",
                  delayBadge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
                }
              : isRank2
              ? {
                  border: "border-amber-500/35 hover:border-amber-500/60",
                  bg: "bg-slate-950/80",
                  badgeBg: "bg-amber-500 text-slate-950 font-bold",
                  rankLabel: "#2 Alta Urgência",
                  accentText: "text-amber-400",
                  retentionBar: "bg-gradient-to-r from-amber-500 to-amber-400",
                  delayBadge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                }
              : {
                  border: "border-teal-500/30 hover:border-teal-500/50",
                  bg: "bg-slate-950/70",
                  badgeBg: "bg-teal-500 text-slate-950 font-bold",
                  rankLabel: "#3 Atenção",
                  accentText: "text-teal-400",
                  retentionBar: "bg-gradient-to-r from-teal-500 to-emerald-400",
                  delayBadge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
                };

            return (
              <div
                key={item.subject}
                className={`rounded-2xl border ${cardTheme.border} ${cardTheme.bg} p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all duration-300 hover:scale-[1.01]`}
              >
                {/* Card Top: Rank & Delay Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-extrabold ${cardTheme.badgeBg}`}>
                      {cardTheme.rankLabel}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cardTheme.delayBadge}`}>
                      {item.maxOverdueDays > 0
                        ? `Atraso: ${item.maxOverdueDays} ${item.maxOverdueDays === 1 ? "dia" : "dias"}`
                        : item.dueTodayCount > 0
                        ? "Vence Hoje"
                        : "Programado"}
                    </span>
                  </div>

                  {/* Subject Name & Difficulty */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {item.subject}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffMeta.badgeColor}`}>
                        {diffMeta.shortLabel || diffMeta.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.overdueCount > 0
                        ? `${item.overdueCount} ${item.overdueCount === 1 ? "revisão pendente" : "revisões pendentes"} no ciclo espaçado`
                        : `${item.dueTodayCount} revisão para hoje`}
                    </p>
                  </div>
                </div>

                {/* Retention Bar & Memory Curve Indicator */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center">
                      <BrainCircuit className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Retenção Estimada:
                    </span>
                    <span className={`font-mono font-extrabold ${cardTheme.accentText}`}>
                      ~{item.estimatedRetention}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cardTheme.retentionBar}`}
                      style={{ width: `${item.estimatedRetention}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Curva de Ebbinghaus</span>
                    <span className={item.estimatedRetention < 50 ? "text-rose-400 font-bold" : "text-amber-400"}>
                      {item.estimatedRetention < 45 ? "Risco Crítico de Esquecimento" : "Atenção Necessária"}
                    </span>
                  </div>
                </div>

                {/* Critical Overdue Topics Chips */}
                {item.criticalTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Tópicos com revisão atrasada:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.criticalTopics.map((top, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => onLaunchTopicTutor?.(top, item.subject)}
                          title="Clique para estudar com o Tutor IA"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 hover:border-rose-500/40 transition text-left truncate max-w-full"
                        >
                          📌 {top}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {/* YouTube Video Link */}
                    <YouTubeExplanationLink
                      topic={item.representativeTopic || item.subject}
                      subject={item.subject}
                      variant="compact"
                      customLabel="Vídeo"
                      className="w-full justify-center text-xs py-2"
                    />

                    {/* Tutor Button */}
                    <button
                      type="button"
                      onClick={() => onLaunchTopicTutor?.(item.representativeTopic || item.subject, item.subject)}
                      className="px-2.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Tutor IA</span>
                    </button>

                    {/* Flashcards Button */}
                    <button
                      type="button"
                      onClick={() => onNavigateToFlashcards?.(item.subject)}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cards</span>
                    </button>
                  </div>

                  {/* Mark quick reviewed button */}
                  {item.oldestReviewId && onToggleSpacedReview && (
                    <button
                      type="button"
                      onClick={() => handleQuickComplete(item)}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluir Revisão e Salvar Retenção</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* All caught up banner */
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Todas as Revisões em Dia!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Excelente consistência! Nenhuma matéria está com repetição espaçada atrasada. Sua curva de retenção de memória está protegida.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToFlashcards?.()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Praticar Baralho Geral</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchTopicTutor?.(profile.priorityTopics.split(",")[0] || "Revisão Geral", profile.subjects[0] || "Geral")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Estudar Novo Tópico com Tutor</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
