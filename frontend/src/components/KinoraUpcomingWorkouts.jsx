import React from "react";
import { Dumbbell, Flame, Zap, Shield, ChevronRight, Play } from "lucide-react";

export default function KinoraUpcomingWorkouts({
  plan,
  onStartSession,
  lang = "en"
}) {
  const exercises = [
    {
      id: "knee_extension",
      title: lang === "ta" ? "முழங்கால் நீட்சி பயிற்சி" : "Knee Extension (Active)",
      duration: "10 reps • 3 sets",
      target: "170° Target",
      icon: Dumbbell,
      color: "text-[#84cc16] bg-[#84cc16]/10 border-[#84cc16]/30",
      active: true,
      badge: "Today"
    },
    {
      id: "cardio_blast",
      title: lang === "ta" ? "மிதமான நடை & கார்டியோ" : "HIIT Cardio Blast",
      duration: "30 min",
      target: "HR < 125 BPM",
      icon: Flame,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      active: false,
      badge: "Tomorrow"
    },
    {
      id: "leg_power",
      title: lang === "ta" ? "சுவர் அமர்வு பயிற்சி" : "Leg Day Power (Wall Squats)",
      duration: "8 reps • 2 sets",
      target: "90° Knee Angle",
      icon: Zap,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      active: false,
      badge: "Thu, Sep 24"
    },
    {
      id: "core_mobility",
      title: lang === "ta" ? "கணுக்கால் இயக்கம் & சமநிலை" : "Core & Mobility",
      duration: "25 min",
      target: "CDC STEADI",
      icon: Shield,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      active: false,
      badge: "Sat"
    }
  ];

  return (
    <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-bold text-white tracking-wide">
          {lang === "ta" ? "வரவிருக்கும் பயிற்சிகள்" : "Upcoming Workouts"}
        </h2>

        <button className="text-[11px] text-[#84cc16] hover:underline font-semibold cursor-pointer">
          {lang === "ta" ? "அனைத்தையும் காட்டு" : "View all"}
        </button>
      </div>

      {/* Workout Items List */}
      <div className="space-y-2.5 flex-1">
        {exercises.map((ex) => {
          const Icon = ex.icon;
          return (
            <div
              key={ex.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                ex.active
                  ? "bg-[#18231c] border-[#84cc16]/40 shadow-sm"
                  : "bg-[#161d18] border-[#222e25] hover:border-[#2f4033]"
              }`}
            >
              {/* Left: Thumbnail Icon & Titles */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${ex.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-snug">{ex.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#9ca3af]">{ex.duration}</span>
                    <span className="text-[10px] text-[#6b7280]">•</span>
                    <span className="text-[10px] text-[#84cc16] font-medium">{ex.target}</span>
                  </div>
                </div>
              </div>

              {/* Right: Badge or Start Button */}
              <div className="shrink-0 flex items-center gap-2">
                {ex.active ? (
                  <button
                    onClick={onStartSession}
                    className="py-1.5 px-3 bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1411] font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(132,204,22,0.35)] cursor-pointer transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === "ta" ? "தொடங்கு" : "Start"}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-[#6b7280] font-mono bg-[#111713] px-2 py-1 rounded-lg border border-[#1e2721]">
                    {ex.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
