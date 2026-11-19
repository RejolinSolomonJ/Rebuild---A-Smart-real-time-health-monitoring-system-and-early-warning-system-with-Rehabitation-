import React from "react";
import { Moon, ChevronDown } from "lucide-react";

export default function KinoraSleepChart({ lang = "en" }) {
  const days = [
    { name: "Mon", h: 70, hrs: "7h 10m" },
    { name: "Tue", h: 85, hrs: "8h 15m" },
    { name: "Wed", h: 60, hrs: "6h 40m" },
    { name: "Thu", h: 90, hrs: "8h 45m" },
    { name: "Fri", h: 75, hrs: "7h 30m" },
    { name: "Sat", h: 95, hrs: "9h 10m" },
    { name: "Sun", h: 80, hrs: "7h 50m" }
  ];

  return (
    <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#84cc16]" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            {lang === "ta" ? "அமைதி & உறக்க கண்காணிப்பு" : "Sleep Tracking"}
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-[#18211b] border border-[#25332a] px-2.5 py-1 rounded-lg text-[10px] text-[#9ca3af] cursor-pointer">
          <span>{lang === "ta" ? "வாரம்" : "Week"}</span>
          <ChevronDown className="w-3 h-3 text-[#84cc16]" />
        </div>
      </div>

      {/* Main Stats Callout */}
      <div className="flex items-baseline justify-between pt-3 pb-1">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">7</span>
            <span className="text-xs text-[#9ca3af]">h</span>
            <span className="text-2xl font-black text-white ml-1">24</span>
            <span className="text-xs text-[#9ca3af]">m</span>
          </div>
          <span className="text-[10px] text-[#6b7280] block">
            {lang === "ta" ? "சராசரி அமைதி காலம்" : "Avg. Sleep / Stillness"}
          </span>
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-xl font-black text-[#84cc16]">82</span>
            <span className="text-xs text-[#9ca3af]">/100</span>
          </div>
          <span className="text-[10px] text-[#84cc16] font-medium block">
            {lang === "ta" ? "நல்ல தரம்" : "Quality: Good"}
          </span>
        </div>
      </div>

      {/* Neon 3D Cylindrical Vertical Bars */}
      <div className="pt-4">
        {/* Y-axis grid background and bars */}
        <div className="relative h-28 flex items-end justify-between gap-2 px-1">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
            <div className="w-full border-b border-white" />
            <div className="w-full border-b border-white" />
            <div className="w-full border-b border-white" />
          </div>

          {days.map((d, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 z-10 group cursor-pointer">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-black text-[#84cc16] px-1.5 py-0.5 rounded font-mono border border-[#84cc16]/30 absolute -top-4 pointer-events-none">
                {d.hrs}
              </div>

              {/* Glowing vertical pill cylinder */}
              <div className="w-full max-w-[18px] bg-[#1a231d] h-24 rounded-full flex items-end overflow-hidden p-0.5">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-[#4d7c0f] via-[#84cc16] to-[#d9f99d] transition-all duration-500 shadow-[0_0_10px_rgba(132,204,22,0.4)]"
                  style={{ height: `${d.h}%` }}
                />
              </div>

              {/* Day Label */}
              <span className="text-[10px] text-[#9ca3af] font-medium group-hover:text-white transition-colors">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
