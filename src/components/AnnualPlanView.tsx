import React from "react";
import { 
  CalendarRange, 
  Clock, 
  CheckCircle2, 
  Target, 
  BookOpen, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BarChart2
} from "lucide-react";
import { AnnualMonthPlan, GeneratedPlans, UserProfile } from "../types";

interface AnnualPlanViewProps {
  plans: GeneratedPlans;
  profile: UserProfile;
  onSelectMonth: (monthNum: number) => void;
  onToggleMonthComplete: (monthNum: number) => void;
}

export const AnnualPlanView: React.FC<AnnualPlanViewProps> = ({
  plans,
  profile,
  onSelectMonth,
  onToggleMonthComplete,
}) => {
  const totalMonths = plans.annualPlan.length;
  const totalHoursYear = plans.annualPlan.reduce((acc, m) => acc + m.totalHours, 0);
  const completedMonths = plans.annualPlan.filter((m) => m.completed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Metric Highlights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Visão Macro Estratégica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Plano de Estudos Anual ({totalMonths} Meses)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Conteúdos ordenados por relevância e pré-requisitos, com carga horária realista, 
              períodos dedicados para simulados, exercícios e revisões 1-7-15-30.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prazo</span>
              <p className="text-sm sm:text-lg font-bold text-white">{totalMonths} M</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Carga</span>
              <p className="text-sm sm:text-lg font-bold text-emerald-400">{totalHoursYear}h</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Concluído</span>
              <p className="text-sm sm:text-lg font-bold text-teal-300">{completedMonths}/{totalMonths}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary Quote */}
        {plans.executiveSummary && (
          <div className="mt-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-3">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Estratégia do Tutor: </span>
              <span className="leading-relaxed">{plans.executiveSummary}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Annual Table (Desktop) & Cards (Mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white flex items-center">
            <CalendarRange className="w-5 h-5 mr-2 text-emerald-400" />
            Plano Anual & Metas Mensais
          </h2>
          <span className="text-xs text-slate-400">
            Selecione o mês para detalhamento semanal
          </span>
        </div>

        {/* Mobile View: Cards (< 768px) */}
        <div className="md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
          {plans.annualPlan.map((m) => {
            const isCompleted = !!m.completed;
            return (
              <div
                key={m.month}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted ? "bg-emerald-950/15 border-emerald-500/30" : "bg-slate-850/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onToggleMonthComplete(m.month)}
                      title="Marcar como concluído"
                      className="text-slate-500 hover:text-emerald-400 transition"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          isCompleted ? "text-emerald-400 fill-emerald-500/20" : ""
                        }`}
                      />
                    </button>
                    <div>
                      <span className="font-bold text-white text-sm block">
                        Mês {m.month}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {m.monthName || `Etapa ${m.month}`}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 font-bold text-emerald-400 border border-slate-700 text-xs">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    {m.totalHours}h
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-start space-x-1.5 text-xs font-semibold text-slate-200">
                    <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{m.mainFocus}</span>
                  </div>
                </div>

                {/* Topics */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {m.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Practical Activities & Performance Goal */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px]">
                    <span className="text-slate-400 font-medium">Prática: </span>
                    {m.practicalActivities}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px]">
                    <span className="text-emerald-400 font-semibold">Meta de Acertos: </span>
                    {m.performanceGoal}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectMonth(m.month)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                  >
                    <span>Ver Mês {m.month} Detalhado</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Mês</th>
                <th className="py-3.5 px-4 min-w-[160px]">Foco Principal</th>
                <th className="py-3.5 px-4 min-w-[220px]">Conteúdos</th>
                <th className="py-3.5 px-3 text-center">Carga Horária</th>
                <th className="py-3.5 px-4 min-w-[180px]">Atividades Práticas</th>
                <th className="py-3.5 px-4 min-w-[180px]">Revisão</th>
                <th className="py-3.5 px-4 min-w-[160px]">Meta de Desempenho</th>
                <th className="py-3.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {plans.annualPlan.map((m) => {
                const isCompleted = !!m.completed;
                return (
                  <tr
                    key={m.month}
                    className={`hover:bg-slate-800/40 transition ${
                      isCompleted ? "bg-emerald-950/10 opacity-80" : ""
                    }`}
                  >
                    {/* Mês */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => onToggleMonthComplete(m.month)}
                          title="Marcar como concluído"
                          className="text-slate-500 hover:text-emerald-400 transition"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              isCompleted ? "text-emerald-400 fill-emerald-500/20" : ""
                            }`}
                          />
                        </button>
                        <div>
                          <span className="font-bold text-white text-sm block whitespace-nowrap">
                            Mês {m.month}
                          </span>
                          <span className="text-[11px] text-slate-400 block whitespace-nowrap">
                            {m.monthName || `Etapa ${m.month}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Foco Principal */}
                    <td className="py-4 px-4 align-top font-semibold text-slate-100">
                      <div className="flex items-start space-x-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{m.mainFocus}</span>
                      </div>
                    </td>

                    {/* Conteúdos */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {m.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Carga Horária */}
                    <td className="py-4 px-3 align-top text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 font-bold text-emerald-400 border border-slate-700 text-xs">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {m.totalHours}h
                      </span>
                    </td>

                    {/* Atividades Práticas */}
                    <td className="py-4 px-4 align-top leading-relaxed text-slate-300">
                      {m.practicalActivities}
                    </td>

                    {/* Revisão */}
                    <td className="py-4 px-4 align-top leading-relaxed text-slate-300">
                      <div className="flex items-start space-x-1">
                        <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{m.revisionSchedule}</span>
                      </div>
                    </td>

                    {/* Meta de Desempenho */}
                    <td className="py-4 px-4 align-top leading-relaxed text-emerald-300 font-medium">
                      <div className="flex items-start space-x-1">
                        <BarChart2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{m.performanceGoal}</span>
                      </div>
                    </td>

                    {/* Ação */}
                    <td className="py-4 px-3 align-top text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectMonth(m.month)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                      >
                        <span>Ver Mês</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
