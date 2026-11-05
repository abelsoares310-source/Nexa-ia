import React, { useState } from "react";
import { 
  Calendar, 
  Target, 
  Clock, 
  PieChart, 
  CheckCircle2, 
  Layers, 
  AlertOctagon, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sliders
} from "lucide-react";
import { Month1Plan, GeneratedPlans, UserProfile } from "../types";
import { getDifficultyMeta } from "./ProfileForm";
import { YouTubeExplanationLink } from "./YouTubeExplanationLink";

interface Month1PlanViewProps {
  plans: GeneratedPlans;
  profile: UserProfile;
  onLaunchTopicTutor: (topic: string, subject?: string) => void;
}

export const Month1PlanView: React.FC<Month1PlanViewProps> = ({
  plans,
  profile,
  onLaunchTopicTutor,
}) => {
  const monthPlan = plans.month1Plan;
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  if (!monthPlan) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Plano Mensal Não Encontrado</h2>
        <p className="text-sm text-slate-400">Gere o plano de estudos a partir do seu perfil ou diagnóstico.</p>
      </div>
    );
  }

  const { theoryPercent, practicePercent, revisionPercent, simulationPercent } = monthPlan.sessionDistribution || {
    theoryPercent: 30,
    practicePercent: 40,
    revisionPercent: 20,
    simulationPercent: 10,
  };

  const totalSubjectHours = monthPlan.hoursPerSubject.reduce((acc, s) => acc + s.hours, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Central Objective Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Plano Mensal Detalhado • Mês 1 (Fundação & Aceleração)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {monthPlan.centralObjective}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Detalhamento semana a semana, proporção equilibrada de estudo ativo, metas por matéria e critérios objetivos de retenção.
            </p>
          </div>
          <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Carga do Mês 1</span>
            <p className="text-2xl font-bold text-white">{totalSubjectHours} horas</p>
          </div>
        </div>

        {/* Proportions Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center">
              <PieChart className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Divisão das Sessões de Estudo Ativo
            </span>
            <span className="text-slate-400">Total: 100%</span>
          </div>

          <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
            <div
              style={{ width: `${theoryPercent}%` }}
              className="bg-sky-500"
              title={`Teoria: ${theoryPercent}%`}
            />
            <div
              style={{ width: `${practicePercent}%` }}
              className="bg-emerald-500"
              title={`Prática / Exercícios: ${practicePercent}%`}
            />
            <div
              style={{ width: `${revisionPercent}%` }}
              className="bg-amber-500"
              title={`Revisão Espaçada: ${revisionPercent}%`}
            />
            <div
              style={{ width: `${simulationPercent}%` }}
              className="bg-rose-500"
              title={`Simulado / Teste: ${simulationPercent}%`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-sky-500" />
              <span className="text-slate-300">Teoria: <strong>{theoryPercent}%</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Prática: <strong>{practicePercent}%</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-300">Revisão Espaçada: <strong>{revisionPercent}%</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-300">Simulados: <strong>{simulationPercent}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Hours per subject & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours per Subject */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-emerald-400" />
            Horas por Matéria no Mês
          </h2>
          <div className="space-y-3">
            {monthPlan.hoursPerSubject.map((item, idx) => {
              const pct = totalSubjectHours > 0 ? Math.round((item.hours / totalSubjectHours) * 100) : 0;
              const diff = profile.subjectDifficulties?.[item.subject] ?? 5;
              const meta = getDifficultyMeta(diff);

              return (
                <div key={idx} className="space-y-1.5 p-2 rounded-xl bg-slate-800/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium gap-2">
                    <span className="text-slate-200 truncate">{item.subject}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <YouTubeExplanationLink
                        topic={item.subject}
                        variant="compact"
                        customLabel="Vídeos"
                        className="py-0.5 text-[10px]"
                      />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${meta.badgeColor}`} title={`Dificuldade: ${diff}/10 (${meta.label})`}>
                        Dif. {diff}/10
                      </span>
                      <span className="text-emerald-400 font-bold">{item.hours}h ({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${meta.barColor} h-1.5 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliverables & Criteria */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center mb-3">
              <Target className="w-4 h-4 mr-2 text-emerald-400" />
              Entregas e Resultados Esperados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {monthPlan.expectedDeliverables.map((del, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{del}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center mb-2 text-teal-300">
              <BookOpen className="w-4 h-4 mr-2 text-teal-400" />
              Critérios para Verificar se Você Realmente Aprendeu
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {monthPlan.learningVerificationCriteria.map((crit, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span className="leading-relaxed">{crit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown (Weeks 1 to 4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
              Metas Semanais Detalhadas (Semanas 1 a 4)
            </h2>
            <p className="text-xs text-slate-400">
              Selecione a semana para visualizar os tópicos e praticar com o tutor socrático
            </p>
          </div>

          {/* Week Selector Tabs */}
          <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl">
            {monthPlan.weeklyBreakdown.map((w) => (
              <button
                key={w.week}
                type="button"
                onClick={() => setSelectedWeek(w.week)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedWeek === w.week
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Semana {w.week}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Week Detail Card */}
        {(() => {
          const currentWeek = monthPlan.weeklyBreakdown.find((w) => w.week === selectedWeek) || monthPlan.weeklyBreakdown[0];
          if (!currentWeek) return null;
          return (
            <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Semana {currentWeek.week}
                  </span>
                  <span className="text-sm font-bold text-white">{currentWeek.weekGoal}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Checkpoint: <strong className="text-slate-200">{currentWeek.checkpoint}</strong>
                </div>
              </div>

              {/* Subjects & Topics list */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Conteúdos e Matérias Programados:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentWeek.subjectsAndTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between group hover:border-emerald-500/50 transition"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-200 truncate">{item}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <YouTubeExplanationLink
                          topic={item}
                          variant="compact"
                          customLabel="Vídeo"
                          className="py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => onLaunchTopicTutor(item)}
                          className="opacity-90 group-hover:opacity-100 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center shrink-0 transition"
                        >
                          <span>Estudar</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Tasks */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Atividades Práticas da Semana:
                </p>
                <div className="space-y-2">
                  {currentWeek.practiceTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-xs text-slate-300 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Recovery Plan Card */}
      {monthPlan.recoveryPlanIfBehind && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Plano de Recuperação para Atrasos (Sem Sobrecarga Diária)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {monthPlan.recoveryPlanIfBehind}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
