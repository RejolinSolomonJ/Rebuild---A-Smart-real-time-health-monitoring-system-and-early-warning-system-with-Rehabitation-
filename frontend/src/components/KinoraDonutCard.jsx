import React from "react";
import { Calendar, PieChart } from "lucide-react";

export default function KinoraDonutCard({ lang = "en" }) {
  const size = 150;
  const center = size / 2;
  const r = 54;
  const circ = 2 * Math.PI * r;

  return (
    <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-wide">
          {lang === "ta" ? "கலோரிகள் & உடல் சமநிலை" : "Calories & Macros"}
        </h2>

        <div className="flex items-center gap-1 bg-[#18211b] border border-[#25332a] px-2.5 py-1 rounded-lg text-[10px] text-[#9ca3af]">
          <Calendar className="w-3 h-3 text-[#84cc16]" />
          <span>{lang === "ta" ? "இன்று" : "Today"}</span>
        </div>
      </div>

      {/* Donut Chart with Center Metric */}
      <div className="flex items-center justify-center py-3">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background Track */}
            <circle cx={center} cy={center} r={r} stroke="#1b251e" strokeWidth="12" fill="none" />

            {/* Glowing Segments: Lime (39%), Emerald (31%), Cyan (30%) */}
            <circle
              cx={center}
              cy={center}
              r={r}
              stroke="#84cc16"
              strokeWidth="12"
              strokeDasharray={`${circ * 0.39} ${circ}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 6px #84cc16)" }}
            />
            <circle
              cx={center}
              cy={center}
              r={r}
              stroke="#22c55e"
              strokeWidth="12"
              strokeDasharray={`${circ * 0.31} ${circ}`}
              strokeDashoffset={-circ * 0.40}
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 5px #22c55e)" }}
            />
            <circle
              cx={center}
              cy={center}
              r={r}
              stroke="#15803d"
              strokeWidth="12"
              strokeDasharray={`${circ * 0.28} ${circ}`}
              strokeDashoffset={-circ * 0.72}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Center Callout: 1,841 kcal */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-white leading-tight">1,841</span>
            <span className="text-[10px] text-[#6b7280] font-medium uppercase tracking-wider">kcal</span>
          </div>
        </div>
      </div>

      {/* Breakdown Percentages at Bottom */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1e2721] text-center">
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
            <span className="text-xs font-black text-white">39%</span>
          </div>
          <span className="text-[10px] text-[#9ca3af] block">Carbs</span>
          <span className="text-[9px] text-[#6b7280] block">180g</span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-xs font-black text-white">31%</span>
          </div>
          <span className="text-[10px] text-[#9ca3af] block">Protein</span>
          <span className="text-[9px] text-[#6b7280] block">142g</span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
            <span className="text-xs font-black text-white">30%</span>
          </div>
          <span className="text-[10px] text-[#9ca3af] block">Fats</span>
          <span className="text-[9px] text-[#6b7280] block">61g</span>
        </div>
      </div>
    </div>
  );
}
