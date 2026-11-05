import React, { useState } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Layers, 
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  Sliders,
  Compass
} from "lucide-react";
import { UserProfile } from "../types";
import { SCHOOL_GRADES, SchoolGradeData, generateSchoolProfile, ALL_SCHOOL_SUBJECTS } from "../utils/schoolCurriculum";

interface SchoolCurriculumExplorerProps {
  currentProfile: UserProfile;
  onApplyGradeProfile: (profile: UserProfile, gradeName: string) => void;
  onSelectTopicForTutor?: (subject: string, topic: string) => void;
}

export const SchoolCurriculumExplorer: React.FC<SchoolCurriculumExplorerProps> = ({
  currentProfile,
  onApplyGradeProfile,
  onSelectTopicForTutor,
}) => {
  const [selectedStage, setSelectedStage] = useState<"all" | "fundamental_1" | "fundamental_2" | "ensino_medio">("fundamental_2");
  const [activeGradeId, setActiveGradeId] = useState<string>("ef-7"); // default to 7º ano or current
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);

  const activeGrade = SCHOOL_GRADES.find((g) => g.id === activeGradeId) || SCHOOL_GRADES[6];

  const filteredGrades = SCHOOL_GRADES.filter((g) => {
    if (selectedStage === "all") return true;
    return g.stage === selectedStage;
  });

  const isCurrentGradeActive = currentProfile.schoolGrade === activeGrade.fullName;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header with Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="uppercase tracking-wider">Matérias Escolares & BNCC Brasil</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Classificação por Ano & Série Escolar
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Escolha seu ano escolar no <strong>Ensino Fundamental (1º ao 9º Ano)</strong> ou <strong>Ensino Médio (1º ao 3º Ano)</strong> para carregar automaticamente a grade curricular com Português, Matemática, História, Ciências/Física/Química e Geografia alinhadas à BNCC.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onApplyGradeProfile(generateSchoolProfile(activeGrade), activeGrade.fullName)}
          className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition shrink-0 ${
            isCurrentGradeActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          }`}
        >
          {isCurrentGradeActive ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              {activeGrade.shortName} Selecionado
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5 text-slate-950" />
              Aplicar Grade do {activeGrade.shortName}
            </>
          )}
        </button>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedStage("fundamental_1")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            selectedStage === "fundamental_1"
              ? "bg-emerald-500 text-slate-950 shadow-md"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span>🎒 Ensino Fundamental I</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 font-bold">1º ao 5º Ano</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStage("fundamental_2")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            selectedStage === "fundamental_2"
              ? "bg-emerald-500 text-slate-950 shadow-md"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span>📚 Ensino Fundamental II</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 font-bold">6º ao 9º Ano</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStage("ensino_medio")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            selectedStage === "ensino_medio"
              ? "bg-emerald-500 text-slate-950 shadow-md"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span>🎓 Ensino Médio</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 font-bold">1ª a 3ª Série</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStage("all")}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
            selectedStage === "all"
              ? "bg-slate-700 text-white font-bold"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Ver Todos ({SCHOOL_GRADES.length})
        </button>
      </div>

      {/* Grade Cards Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {filteredGrades.map((grade) => {
          const isSelected = activeGradeId === grade.id;
          const isCurrentInProfile = currentProfile.schoolGrade === grade.fullName;

          return (
            <button
              key={grade.id}
              type="button"
              onClick={() => {
                setActiveGradeId(grade.id);
                setSelectedSubjectFilter(null);
              }}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                isSelected
                  ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 text-white"
                  : "bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                    {grade.badge}
                  </span>
                  {isCurrentInProfile && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Perfil Atual Ativo" />
                  )}
                </div>
                <p className="font-bold text-xs mt-1 text-slate-100 line-clamp-1">
                  {grade.shortName}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {grade.ageRange}
                </p>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[9px] text-slate-400">
                <span>{grade.coreSubjects.length} matérias</span>
                <span className="text-emerald-400 font-bold">Ver →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Grade Deep Dive Panel */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                {activeGrade.stageLabel}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {activeGrade.fullName}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {activeGrade.description}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Sugerido: <strong>{activeGrade.suggestedDailyHours}h/dia</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <strong>{activeGrade.coreSubjects.length}</strong> Disciplinas
            </span>
          </div>
        </div>

        {/* Subjects & BNCC Topics Explorer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Matérias & Conteúdos BNCC para o {activeGrade.shortName}:
            </p>
            <span className="text-[11px] text-slate-400">
              Clique em uma matéria para ver os tópicos
            </span>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap gap-2">
            {activeGrade.coreSubjects.map((sub) => {
              const isSelected = selectedSubjectFilter === sub || (!selectedSubjectFilter && activeGrade.coreSubjects[0] === sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Topics for Selected Subject */}
          {(() => {
            const currentSub = selectedSubjectFilter || activeGrade.coreSubjects[0];
            const topics = activeGrade.bnccTopicsBySubject[currentSub] || [];

            return (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    Tópicos Prioritários da BNCC em <strong>{currentSub}</strong>:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {topics.length} tópicos estruturados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topics.map((top, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs text-slate-300 flex items-start justify-between group hover:border-slate-700"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{top}</span>
                      </div>
                      {onSelectTopicForTutor && (
                        <button
                          type="button"
                          onClick={() => onSelectTopicForTutor(currentSub, top)}
                          className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 hover:underline font-semibold shrink-0 ml-2 transition"
                          title="Abrir aula no Tutor Interativo"
                        >
                          Estudar →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Pedagogical Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-300">
              <span className="font-bold text-rose-300 block mb-1">
                ⚠️ Dificuldades Comuns nesta série:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeGrade.typicalDifficulties}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300">
              <span className="font-bold text-emerald-300 block mb-1">
                ✨ Potencialidades e Pontos Fortes típicos:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeGrade.typicalStrengths}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
