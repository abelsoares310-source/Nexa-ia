import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Award, Clock, Target, ArrowUpRight, BarChart2 } from "lucide-react";
import { WeeklyCheckin, GeneratedPlans } from "../types";

interface TrackingChartsProps {
  checkins: WeeklyCheckin[];
  plans?: GeneratedPlans | null;
  dailyHoursLimit: number;
}

export const TrackingCharts: React.FC<TrackingChartsProps> = ({
  checkins,
  plans,
  dailyHoursLimit,
}) => {
  const [chartView, setChartView] = useState<"combined" | "accuracy" | "hours">("combined");

  // Format and sort chronological data
  const chartData = [...checkins]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((c) => {
      const adherence = c.plannedHours > 0 
        ? Math.min(100, Math.round((c.completedHours / c.plannedHours) * 100))
        : 0;
      return {
        name: `Semana ${c.weekNumber}`,
        shortName: `Sem. ${c.weekNumber}`,
        weekNumber: c.weekNumber,
        date: c.date,
        accuracy: c.accuracyRate,
        completedHours: c.completedHours,
        plannedHours: c.plannedHours,
        adherence,
        targetAccuracy: 80, // Meta padrão de excelência
      };
    });

  if (chartData.length === 0) {
    return null;
  }

  // Calculate trends
  const latestCheckin = chartData[chartData.length - 1];
  const firstCheckin = chartData[0];
  const accuracyDelta = chartData.length > 1 
    ? latestCheckin.accuracy - firstCheckin.accuracy 
    : 0;

  const totalCompletedHours = chartData.reduce((acc, c) => acc + c.completedHours, 0);
  const totalPlannedHours = chartData.reduce((acc, c) => acc + c.plannedHours, 0);
  const overallAdherence = totalPlannedHours > 0 
    ? Math.round((totalCompletedHours / totalPlannedHours) * 100)
    : 0;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px] z-50">
          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] font-normal text-slate-400">{payload[0]?.payload?.date}</span>
          </p>
          {payload.map((entry: any, index: number) => {
            const isPercent = entry.dataKey === "accuracy" || entry.dataKey === "adherence" || entry.dataKey === "targetAccuracy";
            const unit = isPercent ? "%" : "h";
            return (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
                <span className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 capitalize">{entry.name}:</span>
                </span>
                <span className="font-bold text-white font-mono">
                  {entry.value}
                  {unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header with KPI cards & View Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Análise Gráfica de Desempenho & Consistência</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Evolução de Acertos & Cumprimento de Metas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o rendimento nos exercícios e a adesão às horas planejadas ao longo de cada semana.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setChartView("combined")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              chartView === "combined"
                ? "bg-teal-500 text-slate-950 shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => setChartView("accuracy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              chartView === "accuracy"
                ? "bg-emerald-500 text-slate-950 shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Taxa de Acertos (%)
          </button>
          <button
            type="button"
            onClick={() => setChartView("hours")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              chartView === "hours"
                ? "bg-sky-500 text-slate-950 shadow font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Horas Realizadas (h)
          </button>
        </div>
      </div>

      {/* Snapshot Mini Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Última Taxa de Acertos
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {latestCheckin.accuracy}%
              </span>
              {accuracyDelta !== 0 && (
                <span
                  className={`text-xs font-bold flex items-center ${
                    accuracyDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <ArrowUpRight
                    className={`w-3.5 h-3.5 mr-0.5 ${accuracyDelta < 0 ? "rotate-90" : ""}`}
                  />
                  {accuracyDelta > 0 ? `+${accuracyDelta}%` : `${accuracyDelta}%`}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Aderência às Metas de Horas
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-sky-400 font-mono">
                {overallAdherence}%
              </span>
              <span className="text-xs text-slate-400">
                ({totalCompletedHours.toFixed(1)}h de {totalPlannedHours.toFixed(1)}h)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Meta de Eficiência Recomendada
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                ≥ 80%
              </span>
              <span className="text-xs text-slate-400">
                Zona de Alto Retorno
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="shortName"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
            />

            {/* Left Y-Axis for Percentage */}
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              unit="%"
            />

            {/* Right Y-Axis for Hours (if combined or hours view) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, "dataMax + 5"]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              unit="h"
              hide={chartView === "accuracy"}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "14px", fontSize: "12px", color: "#cbd5e1" }}
            />

            {/* Target 80% Reference Line */}
            <ReferenceLine
              yAxisId="left"
              y={80}
              label={{
                value: "Meta 80%",
                fill: "#f59e0b",
                fontSize: 11,
                position: "insideTopRight",
              }}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Render bars / areas / lines based on active view */}
            {(chartView === "combined" || chartView === "hours") && (
              <>
                <Bar
                  yAxisId="right"
                  dataKey="plannedHours"
                  name="Horas Planejadas"
                  fill="#475569"
                  opacity={0.5}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Bar
                  yAxisId="right"
                  dataKey="completedHours"
                  name="Horas Realizadas"
                  fill="url(#hoursGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
              </>
            )}

            {(chartView === "combined" || chartView === "accuracy") && (
              <>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  name="Taxa de Acertos (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#accuracyGradient)"
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#0f172a" }}
                  activeDot={{ r: 7, stroke: "#34d399", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="adherence"
                  name="Aderência de Horas (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: "#38bdf8" }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative Progress Interpretation */}
      <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <span>
            {latestCheckin.accuracy >= 80 ? (
              <strong>Excelente consistência!</strong>
            ) : latestCheckin.accuracy >= 70 ? (
              <strong>Bom progresso.</strong>
            ) : (
              <strong>Atenção recomendada:</strong>
            )}{" "}
            Sua taxa média recente está em <strong>{latestCheckin.accuracy}%</strong> com {latestCheckin.completedHours}h de dedicação semanal.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          Baseado em {chartData.length} avaliações registradas
        </span>
      </div>
    </div>
  );
};
