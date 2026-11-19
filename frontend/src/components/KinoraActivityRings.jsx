import React from "react";
import { Flame, Timer, Footprints, Calendar } from "lucide-react";

export default function KinoraActivityRings({ lang = "en" }) {
  // Ring geometry
  const size = 160;
  const center = size / 2;

  // Ring 1 (Outer - Move/Calories)
  const r1 = 66;
  const circ1 = 2 * Math.PI * r1;
  const val1 = 812 / 1000;
  const stroke1 = circ1 * val1;

  // Ring 2 (Middle - Exercise/Rehab)
  const r2 = 50;
  const circ2 = 2 * Math.PI * r2;
  const val2 = Math.min(1, 64 / 30); // 100% full
  const stroke2 = circ2 * 0.85;

  // Ring 3 (Inner - Stand/Active hours)
  const r3 = 34;
  const circ3 = 2 * Math.PI * r3;
  const val3 = 10 / 12;
  const stroke3 = circ3 * val3;

  return (
    <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-wide">
          {lang === "ta" ? "செயல்பாட்டு முன்னேற்றம்" : "Activity Progress"}
        </h2>

        <div className="flex items-center gap-1 bg-[#18211b] border border-[#25332a] px-2.5 py-1 rounded-lg text-[10px] text-[#9ca3af]">
          <Calendar className="w-3 h-3 text-[#84cc16]" />
          <span>{lang === "ta" ? "இன்று" : "Today"}</span>
        </div>
      </div>

      {/* Center Concentric SVG Rings */}
      <div className="flex items-center justify-center py-3">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background Track Rings */}
            <circle cx={center} cy={center} r={r1} stroke="#1b251e" strokeWidth="10" fill="none" />
            <circle cx={center} cy={center} r={r2} stroke="#1b251e" strokeWidth="10" fill="none" />
            <circle cx={center} cy={center} r={r3} stroke="#1b251e" strokeWidth="10" fill="none" />

            {/* Glowing Active Ring 1: Move (Lime) */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              stroke="#84cc16"
              strokeWidth="10"
              strokeDasharray={`${stroke1} ${circ1}`}
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 6px #84cc16)" }}
            />

            {/* Glowing Active Ring 2: Exercise (Emerald) */}
            <circle
              cx={center}
              cy={center}
              r={r2}
              stroke="#22c55e"
              strokeWidth="10"
              strokeDasharray={`${stroke2} ${circ2}`}
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 5px #22c55e)" }}
            />

            {/* Glowing Active Ring 3: Stand (Cyan) */}
            <circle
              cx={center}
              cy={center}
              r={r3}
              stroke="#06b6d4"
              strokeWidth="10"
              strokeDasharray={`${stroke3} ${circ3}`}
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 4px #06b6d4)" }}
            />
          </svg>

          {/* Center Runner Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#18231c] flex items-center justify-center text-[#84cc16] shadow-sm">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Columns at bottom */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1e2721] text-center">
        {/* Move */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#9ca3af]">
            <Flame className="w-3 h-3 text-[#84cc16]" />
            <span>{lang === "ta" ? "இயக்கம்" : "Move"}</span>
          </div>
          <div className="text-sm font-black text-white">
            812 <span className="text-[10px] font-normal text-[#6b7280]">/ 1,000</span>
          </div>
          <span className="text-[9px] text-[#6b7280] block">kcal</span>
        </div>

        {/* Exercise */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#9ca3af]">
            <Timer className="w-3 h-3 text-[#22c55e]" />
            <span>{lang === "ta" ? "பயிற்சி" : "Exercise"}</span>
          </div>
          <div className="text-sm font-black text-white">
            64 <span className="text-[10px] font-normal text-[#6b7280]">/ 30</span>
          </div>
          <span className="text-[9px] text-[#6b7280] block">min</span>
        </div>

        {/* Stand */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#9ca3af]">
            <Footprints className="w-3 h-3 text-[#06b6d4]" />
            <span>{lang === "ta" ? "செயலில்" : "Stand"}</span>
          </div>
          <div className="text-sm font-black text-white">
            10 <span className="text-[10px] font-normal text-[#6b7280]">/ 12</span>
          </div>
          <span className="text-[9px] text-[#6b7280] block">hrs</span>
        </div>
      </div>
    </div>
  );
}
