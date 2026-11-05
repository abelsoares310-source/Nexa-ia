import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Clock,
  Crown,
  Zap,
  Target,
  Crosshair,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Layers,
  BrainCircuit,
  CreditCard,
  Boxes,
  Shield,
  CheckCheck,
  Compass,
  Footprints,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Filter,
  Info,
  ChevronRight,
  TrendingUp,
  BookOpenCheck,
  BookOpen,
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  WeeklyCheckin, 
  UserProfile, 
  GeneratedPlans, 
  FlashcardItem, 
  SpacedReviewItem, 
  AchievementBadge, 
  QuestionStreakState,
  StudyJournalEntry
} from "../types";
import { computeAchievements, computeUserLevel, computeJournalConsistency } from "../utils/achievements";
import { getStoredFlashcards, getStoredSpacedReviews, getStoredQuestionStreak, getStoredJournalEntries } from "../utils/storage";

interface AchievementsBadgesViewProps {
  checkins: WeeklyCheckin[];
  profile: UserProfile;
  plans: GeneratedPlans | null;
  flashcards?: FlashcardItem[];
  spacedReviews?: SpacedReviewItem[];
  streakState?: QuestionStreakState;
  journalEntries?: StudyJournalEntry[];
}

export const AchievementsBadgesView: React.FC<AchievementsBadgesViewProps> = ({
  checkins,
  profile,
  plans,
  flashcards: propsFlashcards,
  spacedReviews: propsSpacedReviews,
  streakState: propsStreakState,
  journalEntries: propsJournalEntries,
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "consistency" | "journal_milestones" | "weekly_goals" | "spaced_repetition" | "mastery">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  // Fallback to storage if not provided in props
  const flashcards = propsFlashcards || getStoredFlashcards();
  const spacedReviews = propsSpacedReviews || getStoredSpacedReviews();
  const streakState = propsStreakState || getStoredQuestionStreak();
  const journalEntries = propsJournalEntries || getStoredJournalEntries();

  const badges = computeAchievements(checkins, profile, plans, flashcards, spacedReviews, streakState, journalEntries);
  const userLevel = computeUserLevel(badges);
  const journalStats = computeJournalConsistency(journalEntries);

  const filteredBadges = badges.filter((b) => {
    if (activeCategory === "journal_milestones") {
      if (!b.isSpecialMilestone && !b.id.startsWith("journal-consistency")) return false;
    } else if (activeCategory !== "all" && b.category !== activeCategory) {
      return false;
    }
    if (filterStatus === "unlocked" && !b.unlocked) return false;
    if (filterStatus === "locked" && b.unlocked) return false;
    return true;
  });

  const handleCelebrate = (badge: AchievementBadge) => {
    confetti({
      particleCount: badge.isSpecialMilestone ? 100 : 70,
      spread: badge.isSpecialMilestone ? 80 : 60,
      origin: { y: 0.7 },
      colors: badge.tier === "diamond" ? ["#06b6d4", "#a855f7", "#3b82f6", "#f59e0b"] : badge.tier === "gold" ? ["#eab308", "#f59e0b", "#fbbf24", "#10b981"] : ["#10b981", "#3b82f6"],
    });
  };

  const getTierStyles = (tier: string, unlocked: boolean, isSpecial?: boolean) => {
    if (!unlocked) {
      return {
        bg: "bg-slate-900/60 border-slate-800",
        badgeBg: "bg-slate-800/80 text-slate-400 border-slate-700",
        iconColor: "text-slate-500",
        glow: "border-slate-800",
        label: "Bloqueado",
      };
    }

    if (isSpecial) {
      if (tier === "diamond") {
        return {
          bg: "bg-gradient-to-br from-indigo-950/60 via-slate-900 to-cyan-950/50 border-cyan-400/60 hover:border-cyan-300 shadow-cyan-500/20 shadow-xl",
          badgeBg: "bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 text-cyan-200 border-cyan-400/60",
          iconColor: "text-cyan-300",
          glow: "ring-2 ring-cyan-400/40 animate-pulse",
          label: "Diamante Especial",
        };
      }
      return {
        bg: "bg-gradient-to-br from-amber-950/50 via-slate-900 to-yellow-950/40 border-amber-400/60 hover:border-amber-300 shadow-amber-500/20 shadow-xl",
        badgeBg: "bg-gradient-to-tr from-amber-500/30 to-yellow-500/30 text-amber-200 border-amber-400/60",
        iconColor: "text-amber-300",
        glow: "ring-2 ring-amber-400/40 animate-pulse",
        label: "Ouro Especial",
      };
    }

    switch (tier) {
      case "diamond":
        return {
          bg: "bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 border-cyan-500/40 hover:border-cyan-400/80 shadow-cyan-950/30 shadow-lg",
          badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          iconColor: "text-cyan-400",
          glow: "ring-1 ring-cyan-400/30",
          label: "Diamante",
        };
      case "gold":
        return {
          bg: "bg-gradient-to-br from-amber-950/30 via-slate-900 to-yellow-950/30 border-amber-500/40 hover:border-amber-400/80 shadow-amber-950/30 shadow-lg",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          iconColor: "text-amber-400",
          glow: "ring-1 ring-amber-400/30",
          label: "Ouro",
        };
      case "silver":
        return {
          bg: "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/60 border-slate-600/50 hover:border-slate-400/80 shadow-slate-900/40 shadow-md",
          badgeBg: "bg-slate-700/40 text-slate-200 border-slate-500/40",
          iconColor: "text-slate-200",
          glow: "ring-1 ring-slate-400/20",
          label: "Prata",
        };
      default: // bronze
        return {
          bg: "bg-gradient-to-br from-orange-950/30 via-slate-900 to-amber-950/20 border-orange-700/40 hover:border-orange-500/60 shadow-orange-950/20 shadow-md",
          badgeBg: "bg-orange-500/20 text-orange-300 border-orange-600/40",
          iconColor: "text-orange-400",
          glow: "ring-1 ring-orange-500/20",
          label: "Bronze",
        };
    }
  };

  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "BookOpenCheck":
        return <BookOpenCheck className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Footprints":
        return <Footprints className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "ShieldCheck":
        return <ShieldCheck className={className} />;
      case "Clock":
        return <Clock className={className} />;
      case "Crown":
        return <Crown className={className} />;
      case "Zap":
        return <Zap className={className} />;
      case "Target":
        return <Target className={className} />;
      case "Trophy":
        return <Trophy className={className} />;
      case "Crosshair":
        return <Crosshair className={className} />;
      case "Sparkles":
        return <Sparkles className={className} />;
      case "RotateCcw":
        return <RotateCcw className={className} />;
      case "RefreshCw":
        return <RefreshCw className={className} />;
      case "Layers":
        return <Layers className={className} />;
      case "BrainCircuit":
        return <BrainCircuit className={className} />;
      case "CreditCard":
        return <CreditCard className={className} />;
      case "Boxes":
        return <Boxes className={className} />;
      case "Shield":
        return <Shield className={className} />;
      case "CheckCheck":
        return <CheckCheck className={className} />;
      case "Compass":
        return <Compass className={className} />;
      case "Award":
      default:
        return <Award className={className} />;
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const consistencyUnlocked = badges.filter((b) => b.category === "consistency" && b.unlocked).length;
  const journalMilestonesUnlocked = journalStats.earnedBadgeCount;
  const goalsUnlocked = badges.filter((b) => b.category === "weekly_goals" && b.unlocked).length;
  const spacedUnlocked = badges.filter((b) => b.category === "spaced_repetition" && b.unlocked).length;
  const masteryUnlocked = badges.filter((b) => b.category === "mastery" && b.unlocked).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Banner: Level & Gamification Status */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-400 p-[2px] shadow-lg">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Nível</span>
                  <span className="text-2xl font-black text-white">{userLevel.level}</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 rounded-full p-1 shadow">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {userLevel.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {userLevel.totalXp} XP Total
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Sistema de conquistas pedagógicas baseado na sua consistência de estudo, metas semanais batidas e conclusão dos ciclos de repetição espaçada.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Selos Conquistados</span>
              <p className="text-base font-bold text-white mt-0.5">
                {unlockedCount} <span className="text-xs font-normal text-slate-500">/ {badges.length}</span>
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Consistência Geral</span>
              <p className="text-base font-bold text-white mt-0.5">{consistencyUnlocked} / 9</p>
            </div>
            <div className="bg-slate-900/90 border border-indigo-900/50 rounded-xl p-2.5 text-center bg-indigo-950/20">
              <span className="text-[10px] font-bold text-indigo-300 uppercase">Diário (30/60/90D)</span>
              <p className="text-base font-bold text-indigo-200 mt-0.5">{journalMilestonesUnlocked} / 3</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Metas Batidas</span>
              <p className="text-base font-bold text-white mt-0.5">{goalsUnlocked} / 5</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Rep. Espaçada</span>
              <p className="text-base font-bold text-white mt-0.5">{spacedUnlocked} / 6</p>
            </div>
          </div>
        </div>

        {/* Progress Bar to Next Level */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Progresso para o Próximo Nível (Nível {userLevel.level + 1})
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {userLevel.currentLevelXp} / {userLevel.nextLevelXp} XP ({userLevel.progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${userLevel.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs & Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Category Selector */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCategory === "all"
                ? "bg-slate-800 text-white border border-slate-700 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Todas ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("journal_milestones")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition ${
              activeCategory === "journal_milestones"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow font-bold"
                : "text-slate-400 hover:text-indigo-300"
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Diário (30/60/90D) ({journalMilestonesUnlocked}/3)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("consistency")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition ${
              activeCategory === "consistency"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow font-bold"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <Flame className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Consistência ({consistencyUnlocked}/9)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("weekly_goals")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition ${
              activeCategory === "weekly_goals"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow font-bold"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            <Target className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Metas Batidas ({goalsUnlocked}/5)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("spaced_repetition")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition ${
              activeCategory === "spaced_repetition"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow font-bold"
                : "text-slate-400 hover:text-cyan-300"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Repetição Espaçada ({spacedUnlocked}/6)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("mastery")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition ${
              activeCategory === "mastery"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow font-bold"
                : "text-slate-400 hover:text-purple-300"
            }`}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Maestria ({masteryUnlocked}/3)
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterStatus === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("unlocked")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterStatus === "unlocked" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Desbloqueados ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("locked")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterStatus === "locked" ? "bg-slate-800 text-slate-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Em Progresso ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const styles = getTierStyles(badge.tier, badge.unlocked, badge.isSpecialMilestone);
          const progressPercent = Math.min(100, Math.round((badge.currentProgress / badge.maxProgress) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${styles.bg} ${styles.glow}`}
            >
              {/* Badge Header: Icon, Title & Tier Pill */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                        badge.unlocked ? styles.badgeBg : "bg-slate-800/80 border-slate-700 text-slate-500"
                      }`}
                    >
                      {renderBadgeIcon(badge.iconName, `w-6 h-6 ${styles.iconColor}`)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className={`text-sm font-bold leading-tight ${badge.unlocked ? "text-white group-hover:text-amber-300" : "text-slate-300"}`}>
                          {badge.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          +{badge.xpPoints} XP • {styles.label}
                        </span>
                        {badge.isSpecialMilestone && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold">
                            Marco Diário
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {badge.unlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                      Conquistado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center shrink-0">
                      <Lock className="w-2.5 h-2.5 mr-1 text-slate-500" />
                      Em Curso
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress & Action Bottom */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium truncate max-w-[170px]" title={badge.criteriaLabel}>
                    {badge.criteriaLabel}
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    {badge.currentProgress} / {badge.maxProgress} {badge.progressUnit}
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      badge.unlocked
                        ? badge.tier === "diamond"
                          ? "bg-cyan-400"
                          : badge.tier === "gold"
                          ? "bg-amber-400"
                          : badge.tier === "silver"
                          ? "bg-slate-300"
                          : "bg-orange-400"
                        : "bg-slate-600"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {badge.unlocked && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {badge.unlockedAt ? `Desbloqueado em ${badge.unlockedAt}` : "Meta atingida com sucesso"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCelebrate(badge);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition flex items-center"
                    >
                      <Sparkles className="w-2.5 h-2.5 mr-1" />
                      Comemorar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {renderBadgeIcon(selectedBadge.iconName, "w-6 h-6 text-amber-400")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedBadge.title}</h3>
                  <span className="text-xs text-amber-400 font-semibold">
                    +{selectedBadge.xpPoints} XP • Nível {selectedBadge.tier.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>{selectedBadge.description}</p>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Requisito para Conquista:</span>
                <p className="text-slate-200 font-medium">{selectedBadge.criteriaLabel}</p>
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] pt-1">
                  <span>Progresso Atual:</span>
                  <span className="font-bold text-white">
                    {selectedBadge.currentProgress} / {selectedBadge.maxProgress} {selectedBadge.progressUnit}
                  </span>
                </div>
              </div>

              {selectedBadge.unlocked ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Parabéns! Você desbloqueou este selo e somou {selectedBadge.xpPoints} XP à sua jornada.</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-300 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mantenha sua rotina no painel semanal e conclua os blocos de estudo para liberar este selo.</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              {selectedBadge.unlocked && (
                <button
                  type="button"
                  onClick={() => handleCelebrate(selectedBadge)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center transition"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Soltar Confetes
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
