import React from "react";
import { Heart, TrendingUp } from "lucide-react";

export default function KinoraHeartRateChart({
  latestReading,
  readings = [],
  lang = "en"
}) {
  const hrOk = Boolean(latestReading && latestReading.hr_ok && Number(latestReading.hr) > 0);
  const currentBpm = hrOk ? latestReading.hr : 72;

  // 7 Points for the spline curve
  const points = [
    { day: "Tue", bpm: 68, y: 72 },
    { day: "Wed", bpm: 74, y: 55 },
    { day: "Thu", bpm: 71, y: 64 },
    { day: "Fri", bpm: 78, y: 45 },
    { day: "Sat", bpm: 73, y: 58 },
    { day: "Sun", bpm: 69, y: 70 },
    { day: "Mon", bpm: currentBpm, y: 50 },
  ];

  // SVG coordinates for width 280, height 90
  const svgPoints = points.map((p, idx) => {
    const x = 20 + idx * 40;
    return `${x},${p.y}`;
  });

  const pathD = `M ${svgPoints[0]} ` + svgPoints.slice(1).map((pt, i) => `L ${pt}`).join(" ");

  return (
    <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <span>{lang === "ta" ? "இதயத் துடிப்பு (வாராந்திரம்)" : "Heart Rate (Weekly)"}</span>
        </h2>
        <span className="text-[10px] text-[#84cc16] font-bold bg-[#18231c] px-2 py-0.5 rounded border border-[#253528]">
          BPM
        </span>
      </div>

      {/* Main Stats Callout */}
      <div className="flex items-baseline justify-between pt-3 pb-1">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{currentBpm}</span>
            <span className="text-xs text-[#9ca3af]">BPM</span>
          </div>
          <span className="text-[10px] text-[#6b7280] block">
            {lang === "ta" ? "சராசரி துடிப்பு" : "Avg. BPM"}
          </span>
        </div>

        <div className="text-center">
          <div className="flex items-center gap-1 text-[#84cc16] text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5%</span>
          </div>
          <span className="text-[10px] text-[#6b7280] block">
            {lang === "ta" ? "கடந்த வாரத்தை விட" : "vs last week"}
          </span>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-white block">58 - 148</span>
          <span className="text-[10px] text-[#6b7280] block">
            {lang === "ta" ? "வார வரம்பு" : "Weekly range"}
          </span>
        </div>
      </div>

      {/* Glowing Neon Line Graph */}
      <div className="pt-2">
        <div className="relative h-28 w-full flex items-end">
          <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="25" x2="280" y2="25" stroke="#1c2820" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="55" x2="280" y2="55" stroke="#1c2820" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="85" x2="280" y2="85" stroke="#1c2820" strokeWidth="1" strokeDasharray="3 3" />

            {/* Glowing gradient area under line */}
            <path
              d={`${pathD} L 260,95 L 20,95 Z`}
              fill="url(#hr-glow-area)"
              opacity="0.3"
            />

            {/* Neon Spline Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#84cc16"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px #84cc16)" }}
            />

            {/* Data Point Dots */}
            {points.map((p, idx) => {
              const x = 20 + idx * 40;
              const isLast = idx === points.length - 1;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={p.y}
                  r={isLast ? 4 : 2.5}
                  fill={isLast ? "#d9f99d" : "#84cc16"}
                  stroke="#131915"
                  strokeWidth="1.5"
                  style={isLast ? { filter: "drop-shadow(0 0 8px #84cc16)" } : undefined}
                />
              );
            })}

            <defs>
              <linearGradient id="hr-glow-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* X-axis Day Labels */}
        <div className="flex items-center justify-between px-2 pt-1">
          {points.map((p, i) => (
            <span key={i} className="text-[10px] text-[#6b7280] font-mono">
              {p.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
