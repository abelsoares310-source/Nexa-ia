import React, { useState } from "react";
import { 
  Compass, 
  Calendar, 
  CalendarRange, 
  Clock, 
  BookOpenCheck, 
  Layers, 
  BarChart3, 
  Sparkles,
  ClipboardCheck,
  Printer,
  BookOpen,
  Flame,
  Target,
  Zap,
  PlayCircle,
  Menu,
  X,
  ChevronRight,
  Cloud,
  User as UserIcon,
  RefreshCw,
  Award
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { UserProfile, DiagnosticResult, QuestionStreakState, DailyChallengesState } from "../types";

export type NavTab = 
  | "profile" 
  | "diagnostic" 
  | "past_exams"
  | "annual" 
  | "monthly" 
  | "weekly" 
  | "study_now" 
  | "goals" 
  | "tutor" 
  | "flashcards" 
  | "journal" 
  | "tracking";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profile: UserProfile;
  diagnosticResult: DiagnosticResult | null;
  hasPlans: boolean;
  onPrint: () => void;
  streakState?: QuestionStreakState;
  onOpenStreak?: () => void;
  dailyChallengesState?: DailyChallengesState;
  onOpenChallenges?: () => void;
  hasActiveStudySession?: boolean;
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  diagnosticResult,
  hasPlans,
  onPrint,
  streakState,
  onOpenStreak,
  dailyChallengesState,
  onOpenChallenges,
  hasActiveStudySession,
  currentUser,
  onOpenAuthModal,
  isSyncing,
  lastSyncTime,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "profile", label: "Perfil & Metas", icon: Compass, category: "Configuração" },
    { 
      id: "diagnostic", 
      label: "Diagnóstico (10Q)", 
      icon: ClipboardCheck,
      badge: diagnosticResult ? `${diagnosticResult.score}/10` : undefined,
      category: "Avaliação"
    },
    { 
      id: "past_exams", 
      label: "Provas Antigas & Bancas", 
      icon: Award,
      badge: "IFF • CN • UFRJ",
      category: "Prática Ativa"
    },
    { 
      id: "study_now", 
      label: "Estudar Agora", 
      icon: Zap,
      badge: hasActiveStudySession ? "Em Foco" : "IA Dinâmica",
      category: "Prática Ativa"
    },
    { id: "annual", label: "Plano Anual", icon: CalendarRange, disabled: !hasPlans, category: "Cronogramas" },
    { id: "monthly", label: "Plano Mensal", icon: Calendar, disabled: !hasPlans, category: "Cronogramas" },
    { id: "weekly", label: "Rotina Semanal", icon: Clock, disabled: !hasPlans, category: "Cronogramas" },
    { id: "goals", label: "Metas de Aprendizagem", icon: Target, category: "Acompanhamento" },
    { id: "tutor", label: "Tutor & Recuperação", icon: BookOpenCheck, category: "Prática Ativa" },
    { id: "flashcards", label: "Flashcards & Revisão", icon: Layers, category: "Prática Ativa" },
    { id: "journal", label: "Diário de Bordo", icon: BookOpen, category: "Acompanhamento" },
    { id: "tracking", label: "Acompanhamento", icon: BarChart3, category: "Acompanhamento" },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo / Brand */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" 
            onClick={() => handleSelectTab("profile")}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-semibold text-sm sm:text-base md:text-lg tracking-tight text-white whitespace-nowrap">
                  Plano & Tutor IA
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Adaptativo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[180px] md:max-w-xs">
                {profile.objective || "Planejamento Educacional"}
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Daily challenges pill */}
            {dailyChallengesState && onOpenChallenges && (
              <button
                id="daily-challenges-navbar-btn"
                type="button"
                onClick={onOpenChallenges}
                title={`Desafios Diários: ${dailyChallengesState.challenges.filter((c) => c.completed).length}/${dailyChallengesState.challenges.length}`}
                className="inline-flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Desafios</span>
                <span>{dailyChallengesState.challenges.filter((c) => c.completed).length}/{dailyChallengesState.challenges.length}</span>
              </button>
            )}

            {/* Streak pill */}
            {streakState && (
              <button
                id="streak-status-btn"
                type="button"
                onClick={onOpenStreak}
                title={`Sequência de ${streakState.currentStreak} dias respondendo questões!`}
                className="inline-flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-red-500/15 hover:from-orange-500/25 border border-orange-500/40 text-orange-300 text-[11px] sm:text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>{streakState.currentStreak}d</span>
              </button>
            )}

            {/* Main Action "Estudar Agora" */}
            <button
              id="study-now-quick-navbar-btn"
              type="button"
              onClick={() => handleSelectTab("study_now")}
              title="Iniciar Sessão Dinâmica de Estudos"
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition shadow-sm cursor-pointer ${
                activeTab === "study_now"
                  ? "bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/15 hover:scale-105"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden xs:inline sm:inline">Estudar</span>
              <span className="xs:hidden">Foco</span>
              {hasActiveStudySession && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
              )}
            </button>

            {/* User Account & Cloud Sync Button */}
            {currentUser ? (
              <button
                id="user-account-navbar-btn"
                type="button"
                onClick={onOpenAuthModal}
                title={`Conectado como ${currentUser.displayName || currentUser.email} - Clique para ver o status da nuvem`}
                className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer shadow-sm"
              >
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
                  </div>
                  <span 
                    className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 ${
                      isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-400 ring-1 ring-slate-900"
                    }`} 
                    title={isSyncing ? "Sincronizando..." : "Sincronizado na nuvem"}
                  />
                </div>
                <span className="hidden lg:inline max-w-[85px] truncate text-[11px]">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
              </button>
            ) : (
              <button
                id="create-account-navbar-btn"
                type="button"
                onClick={onOpenAuthModal}
                title="Criar conta ou entrar para salvar e sincronizar seu progresso"
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] sm:text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Criar Conta</span>
                <span className="xs:hidden">Conta</span>
              </button>
            )}

            {/* Print/Export Button (hidden on tiny screens) */}
            <button
              id="print-plan-btn"
              onClick={onPrint}
              title="Imprimir / Exportar Plano"
              className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Exportar</span>
            </button>

            {/* Mobile Drawer Trigger Button */}
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              aria-label="Abrir Menu de Navegação"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Scroll Bar for Medium & Large Screens */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-none py-1.5 border-t border-slate-800/60 text-xs sm:text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                disabled={item.disabled}
                onClick={() => handleSelectTab(item.id as NavTab)}
                className={`flex items-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm shrink-0 ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-sm font-semibold"
                    : item.disabled
                    ? "text-slate-600 cursor-not-allowed opacity-40"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-slate-950 text-emerald-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Slide-over Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[56px] z-50 bg-slate-950/90 backdrop-blur-md flex flex-col border-t border-slate-800 animate-fadeIn">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg w-full mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
              <span>Selecione uma seção</span>
              <button 
                type="button" 
                onClick={onPrint}
                className="flex items-center text-emerald-400 hover:underline"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Exportar / Imprimir
              </button>
            </div>

            {/* Mobile Account status banner */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold">
                  {currentUser ? (currentUser.displayName || currentUser.email || "U")[0].toUpperCase() : <Cloud className="w-5 h-5 text-slate-950" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {currentUser ? (currentUser.displayName || "Minha Conta") : "Conta & Sincronização"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Progresso salvo na Nuvem
                      </span>
                    ) : (
                      "Faça login para salvar em qualquer dispositivo"
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal?.();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition cursor-pointer"
              >
                {currentUser ? "Gerenciar" : "Entrar / Criar"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => handleSelectTab(item.id as NavTab)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500 text-white font-bold"
                        : item.disabled
                        ? "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-40 cursor-not-allowed"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isActive ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </div>
                    </div>
                    {item.badge ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Fechar Menu
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
