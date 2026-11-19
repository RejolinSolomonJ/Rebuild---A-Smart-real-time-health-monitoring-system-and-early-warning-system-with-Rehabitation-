import React from "react";
import { Heart, Zap, RefreshCw, Sparkles, AlertCircle } from "lucide-react";

export default function KinoraHeroOverview({
  person,
  latestReading,
  lang = "en"
}) {
  const hrOk = Boolean(latestReading && latestReading.hr_ok && Number(latestReading.hr) > 0);
  const hr = hrOk ? latestReading.hr : null;

  return (
    <div className="relative bg-[#131915] border border-[#202b23] rounded-3xl p-6 sm:p-7 overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Background Ambient Radial Glow */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#84cc16]/10 blur-3xl pointer-events-none" />

      {/* Top Greeting & Header */}
      <div className="space-y-2 max-w-md relative z-10">
        <span className="text-xs text-[#9ca3af] font-medium tracking-wide">
          {lang === "ta" ? `காலை வணக்கம், ${person?.name || "ரமேஷ்"}` : `Good morning, ${person?.name || "Ramesh"}`}
        </span>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {lang === "ta" ? "உடற்தகுதி மற்றும் மீட்பு கண்ணோட்டம்" : "Fitness & Recovery Overview"}
          </h1>
          <Sparkles className="w-5 h-5 text-[#84cc16] animate-pulse" />
        </div>

        <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed pt-1">
          {lang === "ta"
            ? "நீங்கள் சிறப்பாக செய்து வருகிறீர்கள்! உங்கள் மீட்பு எல்லைகளை சீராக பேணுங்கள்."
            : "You're doing great! Keep pushing your limits and stay consistent."}
        </p>
      </div>

      {/* Anatomical Silhouette Graphic (Middle-Right) */}
      <div className="absolute right-0 bottom-0 top-0 w-64 sm:w-72 pointer-events-none flex items-end justify-end opacity-90">
        <svg
          viewBox="0 0 280 340"
          className="w-full h-full object-contain"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Torso Contours */}
          <path
            d="M80 80 Q140 60 200 80 Q220 130 210 180 Q190 240 180 310 Q140 330 100 310 Q90 240 70 180 Z"
            fill="#0d1410"
            stroke="#1c2820"
            strokeWidth="1.5"
          />
          {/* Shoulders & Deltoids */}
          <path
            d="M60 110 Q40 160 55 210 Q70 210 75 160 Z"
            fill="#101813"
            stroke="#1f2c23"
            strokeWidth="1"
          />
          <path
            d="M220 110 Q240 160 225 210 Q210 210 205 160 Z"
            fill="#101813"
            stroke="#1f2c23"
            strokeWidth="1"
          />

          {/* Glowing Neon Green Chest / Pectorals Highlight */}
          <path
            d="M100 120 Q140 135 180 120 Q170 165 140 170 Q110 165 100 120 Z"
            fill="url(#neon-chest-grad)"
            opacity="0.85"
            filter="url(#neon-filter)"
          />
          {/* Glowing Center Sternum line */}
          <line
            x1="140"
            y1="100"
            x2="140"
            y2="170"
            stroke="#a3e635"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#neon-filter)"
          />
          {/* Glowing Abs Lines */}
          <line
            x1="125"
            y1="190"
            x2="155"
            y2="190"
            stroke="#84cc16"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <line
            x1="122"
            y1="220"
            x2="158"
            y2="220"
            stroke="#84cc16"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <line
            x1="126"
            y1="250"
            x2="154"
            y2="250"
            stroke="#84cc16"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Shoulder glow accents */}
          <circle cx="70" cy="120" r="12" fill="#84cc16" opacity="0.3" filter="url(#neon-filter)" />
          <circle cx="210" cy="120" r="12" fill="#84cc16" opacity="0.3" filter="url(#neon-filter)" />

          <defs>
            <linearGradient id="neon-chest-grad" x1="140" y1="120" x2="140" y2="170" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a3e635" stopOpacity="0.7" />
              <stop stopColor="#4d7c0f" stopOpacity="0.2" />
            </linearGradient>
            <filter id="neon-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Floating Frosted Glass Stats Card (Bottom-Left) */}
      <div className="pt-8 sm:pt-10 relative z-10">
        <div className="bg-[#0b100d]/75 backdrop-blur-md border border-[#27382d] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center gap-6 sm:gap-8 max-w-md">
          {/* Heart Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <Heart className={`w-3.5 h-3.5 ${hrOk ? "text-red-400" : "text-rose-500"}`} />
              <span>{lang === "ta" ? "இதயத் துடிப்பு" : "Heart Rate"}</span>
            </div>
            <div className="flex items-baseline gap-1">
              {hrOk ? (
                <>
                  <span className="text-2xl font-black text-white">{hr}</span>
                  <span className="text-xs text-[#9ca3af]">BPM</span>
                </>
              ) : (
                <span className="text-sm font-bold text-rose-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {lang === "ta" ? "இணைக்கப்படவில்லை" : "Not Connected"}
                </span>
              )}
            </div>
            <span className={`text-[10px] block ${hrOk ? "text-[#84cc16]" : "text-rose-300"}`}>
              {hrOk ? "Resting" : "Attach sensor"}
            </span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-9 bg-[#233328]" />

          {/* Energy / Stability */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <Zap className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>{lang === "ta" ? "ஆற்றல்" : "Energy"}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">86</span>
              <span className="text-xs text-[#9ca3af]">%</span>
            </div>
            <span className="text-[10px] text-[#84cc16] block">Good</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-9 bg-[#233328]" />

          {/* Recovery */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "ta" ? "மீட்பு" : "Recovery"}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">91</span>
              <span className="text-xs text-[#9ca3af]">%</span>
            </div>
            <span className="text-[10px] text-[#84cc16] block">Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
