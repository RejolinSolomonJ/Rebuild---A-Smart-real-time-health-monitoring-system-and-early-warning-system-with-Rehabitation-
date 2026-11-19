import React from "react";
import {
  Moon,
  Sparkles,
  Bed,
  Heart,
  Clock,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import KinoraSleepChart from "../components/KinoraSleepChart";

export default function SleepRestView({ lang = "en" }) {
  const sleepStages = [
    { stage: "Deep Restorative Sleep", duration: "2h 15m", pct: "30%", color: "#84cc16" },
    { stage: "REM (Cognitive Recovery)", duration: "1h 45m", pct: "24%", color: "#a3e635" },
    { stage: "Light Sleep", duration: "3h 10m", pct: "43%", color: "#4ade80" },
    { stage: "Awake / Micro-arousal", duration: "14m", pct: "3%", color: "#9ca3af" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "தூக்கம் & ஓய்வு மீட்பு பகுப்பாய்வு" : "Sleep & Autonomic Recovery"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "இரவு நேர அமைதி நிலை மற்றும் தசை மீளுருவாக்கம்" : "Circadian rest cycles, sleep continuity, and overnight restorative score"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0e1410] px-3.5 py-1.5 rounded-xl border border-[#1e2721] text-xs">
          <Sparkles className="w-4 h-4 text-[#84cc16]" />
          <span className="text-[#a3e635] font-bold">Quality Score: 82/100 (Optimal)</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Average Sleep Duration</span>
            <Clock className="w-4 h-4 text-[#84cc16]" />
          </div>
          <div className="text-3xl font-black text-white">7h 24m</div>
          <div className="text-[11px] text-[#84cc16] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>+34 min vs last week</span>
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Overnight Resting Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">58 - 64 <span className="text-xs font-normal text-[#9ca3af]">BPM</span></div>
          <div className="text-[11px] text-blue-400 font-semibold">
            Healthy nocturnal dip (-12%)
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Sleep Efficiency</span>
            <Award className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div className="text-3xl font-black text-white">91.4%</div>
          <div className="text-[11px] text-[#a3e635] font-semibold">
            High continuity, minimal waking
          </div>
        </div>
      </div>

      {/* Weekly Sleep Bars & Stages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <KinoraSleepChart avgHours={7.4} qualityScore={82} />
        </div>

        {/* Sleep Stages Breakdown */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Sleep Architecture
            </h3>
            <div className="space-y-3">
              {sleepStages.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#9ca3af]">{s.stage}</span>
                    <span className="text-white font-bold font-mono">{s.duration}</span>
                  </div>
                  <div className="w-full bg-[#1e2721] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: s.pct, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#0d120f] rounded-xl border border-[#1e2721] text-[11px] text-[#9ca3af] space-y-1">
            <span className="font-bold text-white block">Physiotherapy Tip:</span>
            <span>Adequate deep sleep accelerates tendon repair and lowers inflammatory cytokines after knee extension training.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
