import React from "react";
import {
  Dumbbell,
  Play,
  CheckCircle,
  Clock,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  Layers
} from "lucide-react";

export default function WorkoutsView({
  plan,
  onStartSession,
  latestReading,
  lang = "en"
}) {
  const exercises = [
    {
      id: "seated_knee_extension",
      title: "Seated Knee Extension",
      target: "Quadriceps & Patellar Tendon",
      sets: "2 sets",
      reps: "10 reps each leg",
      rest: "30s rest",
      rom: "30° to 90° extension",
      status: "Prescribed",
      badge: "Targeted Knee Care"
    },
    {
      id: "sit_to_stand",
      title: "Sit to Stand (Chair Stand)",
      target: "Lower Body Functional Strength",
      sets: "2 sets",
      reps: "8 reps",
      rest: "45s rest",
      rom: "Full extension to 90° chair sit",
      status: "Prescribed",
      badge: "Fall Prevention"
    },
    {
      id: "arm_overhead_reach",
      title: "Arm & Shoulder Overhead Reach",
      target: "Shoulder Mobility & Core Posture",
      sets: "2 sets",
      reps: "10 reps",
      rest: "30s rest",
      rom: "120° to 170° arm elevation",
      status: "Optional",
      badge: "Postural Stability"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase bg-[#84cc16]/20 text-[#a3e635] px-2 py-0.5 rounded border border-[#84cc16]/30">
              PHYSIO APPROVED PROTOCOL
            </span>
            <span className="text-xs text-[#9ca3af]">Prescribed by Dr. Kavitha (PT)</span>
          </div>
          <h1 className="text-xl font-black text-white">
            {plan?.title || "Post-Knee Care & Core Stability Plan"}
          </h1>
          <p className="text-xs text-[#9ca3af] max-w-xl">
            {plan?.notes || "Perform seated knee extensions slowly. Maintain upright spinal posture and breathe rhythmically."}
          </p>
        </div>

        {/* Start Guided Session CTA */}
        <button
          onClick={onStartSession}
          className="py-3.5 px-6 rounded-xl bg-[#84cc16] hover:bg-[#9ee838] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_25px_rgba(132,204,22,0.4)] scale-100 hover:scale-[1.02] shrink-0"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{lang === "ta" ? "AI பயிற்சி அமர்வை தொடங்கு" : "Start MoveSafe AI Session"}</span>
        </button>
      </div>

      {/* Safety Gate Thresholds Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#151c17] border border-[#222e26] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
            HR
          </div>
          <div>
            <div className="text-[10px] text-[#9ca3af] font-semibold uppercase">Max Cardiac Limit</div>
            <div className="text-xs font-bold text-white">{plan?.max_hr_limit || 125} BPM</div>
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            BORG
          </div>
          <div>
            <div className="text-[10px] text-[#9ca3af] font-semibold uppercase">Max Effort Limit</div>
            <div className="text-xs font-bold text-white">{plan?.max_borg_limit || 14} / 20 (Somewhat Hard)</div>
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
            TEMP
          </div>
          <div>
            <div className="text-[10px] text-[#9ca3af] font-semibold uppercase">Thermal Safety Margin</div>
            <div className="text-xs font-bold text-white">&lt; 38.0 °C (Fever Contraindication)</div>
          </div>
        </div>
      </div>

      {/* Exercise Routine Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#84cc16]" />
          <span>Prescribed Rehabilitation Exercises</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exercises.map((ex, idx) => (
            <div
              key={idx}
              className="bg-[#151c17] border border-[#222e26] hover:border-[#84cc16]/50 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#84cc16] bg-[#84cc16]/10 px-2 py-0.5 rounded border border-[#84cc16]/30">
                    {ex.badge}
                  </span>
                  <span className="text-[10px] text-[#9ca3af] font-mono">Exercise {idx + 1}</span>
                </div>

                <h3 className="font-bold text-base text-white">{ex.title}</h3>
                <p className="text-xs text-[#9ca3af]">{ex.target}</p>

                <div className="pt-2 border-t border-[#1e2721] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Volume:</span>
                    <span className="text-white font-semibold">{ex.sets} × {ex.reps}</span>
                  </div>
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Rest Interval:</span>
                    <span className="text-white font-semibold">{ex.rest}</span>
                  </div>
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Target ROM:</span>
                    <span className="text-[#a3e635] font-semibold">{ex.rom}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onStartSession}
                className="w-full py-2 bg-[#1f2a22] hover:bg-[#84cc16] text-[#a3e635] hover:text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Practice Exercise</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
