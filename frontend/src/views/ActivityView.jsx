import React from "react";
import {
  Activity,
  Flame,
  Timer,
  Footprints,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Clock
} from "lucide-react";
import KinoraActivityRings from "../components/KinoraActivityRings";

export default function ActivityView({ latestReading, lang = "en" }) {
  const hourlyData = [
    { hour: "6 AM", cal: 45 },
    { hour: "8 AM", cal: 120 },
    { hour: "10 AM", cal: 180 },
    { hour: "12 PM", cal: 95 },
    { hour: "2 PM", cal: 70 },
    { hour: "4 PM", cal: 160 },
    { hour: "6 PM", cal: 142 }
  ];

  const maxCal = Math.max(...hourlyData.map((d) => d.cal));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "செயல்பாடு மற்றும் இயக்க முன்னேற்றம்" : "Activity & Movement Intelligence"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "தினசரி உடற்பயிற்சி மற்றும் தொடர் இயக்க அளவீடுகள்" : "Daily caloric expenditure, active time, and posture transitions"}
          </p>
        </div>

        {/* Real-Time Hardware Motion Status */}
        <div className="flex items-center gap-2 bg-[#0e1410] px-3.5 py-2 rounded-xl border border-[#1e2721]">
          <span className={`w-2 h-2 rounded-full ${latestReading?.motion ? "bg-[#84cc16] animate-ping" : "bg-amber-400"}`} />
          <span className="text-xs font-mono font-bold text-white">
            {latestReading?.motion ? "MOTION DETECTED" : `STILL (${latestReading?.idle_s || 0}s)`}
          </span>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Active Energy</span>
            <Flame className="w-4 h-4 text-[#84cc16]" />
          </div>
          <div className="text-2xl font-black text-white">812 <span className="text-xs text-[#9ca3af] font-normal">kcal</span></div>
          <div className="text-[11px] text-[#84cc16] flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>81% of 1,000 kcal goal</span>
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Exercise Time</span>
            <Timer className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div className="text-2xl font-black text-white">64 <span className="text-xs text-[#9ca3af] font-normal">min</span></div>
          <div className="text-[11px] text-[#a3e635] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Goal achieved (30 min)</span>
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Stand Hours</span>
            <Zap className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div className="text-2xl font-black text-white">10 <span className="text-xs text-[#9ca3af] font-normal">/ 12 hrs</span></div>
          <div className="text-[11px] text-[#9ca3af]">
            2 hours remaining
          </div>
        </div>

        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Steps Today</span>
            <Footprints className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">8,420 <span className="text-xs text-[#9ca3af] font-normal">steps</span></div>
          <div className="text-[11px] text-blue-400 font-semibold">
            ~ 5.8 km walked
          </div>
        </div>
      </div>

      {/* Middle Grid: Ring Visualizer + Hourly Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ring Card */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col items-center justify-center">
          <KinoraActivityRings
            move={812}
            moveGoal={1000}
            exercise={64}
            exerciseGoal={30}
            stand={10}
            standGoal={12}
          />
        </div>

        {/* Hourly Distribution Chart */}
        <div className="lg:col-span-2 bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#84cc16]" />
              <span>Today's Calorie Burn Velocity</span>
            </h3>
            <span className="text-xs text-[#84cc16] font-bold">Peak at 10 AM (180 kcal)</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-[#1e2721] pb-2">
            {hourlyData.map((d, i) => {
              const hPct = (d.cal / maxCal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.cal}
                  </span>
                  <div className="w-full max-w-[36px] bg-[#1e2721] rounded-t-lg overflow-hidden h-32 flex items-end">
                    <div
                      className="w-full bg-[#84cc16] group-hover:bg-[#a3e635] transition-all rounded-t-lg"
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#6b7280]">{d.hour}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#9ca3af] pt-1">
            <span>Morning Rehabilitation Routine: <strong>+320 kcal</strong></span>
            <span>Resting Metabolic Rate: <strong>~1,450 kcal/day</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
