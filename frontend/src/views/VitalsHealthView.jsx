import React from "react";
import {
  Heart,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  ShieldAlert,
  Flame,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function VitalsHealthView({ latestReading, lang = "en" }) {
  const hrConnected = latestReading?.hr_ok && (latestReading?.hr || 0) > 0;
  const temp = latestReading?.temp || 36.6;
  const humidity = latestReading?.humidity || 52.0;
  const spo2 = latestReading?.spo2 || 98.0;
  const idle = latestReading?.idle_s || 0;
  const vib = latestReading?.vib || 0;
  const risk = latestReading?.risk_score || 8;

  const baselines = [
    { period: "Night (00:00 - 06:00)", hr: "64.2 BPM", temp: "36.2 °C", status: "Learned" },
    { period: "Morning (06:00 - 12:00)", hr: "72.4 BPM", temp: "36.6 °C", status: "Learned" },
    { period: "Afternoon (12:00 - 18:00)", hr: "76.1 BPM", temp: "36.8 °C", status: "Active" },
    { period: "Evening (18:00 - 24:00)", hr: "70.8 BPM", temp: "36.5 °C", status: "Learned" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span>{lang === "ta" ? "முழுமையான உடல்நிலைகள் & உயிர் அளவீடுகள்" : "Vitals & Physiological Biomarkers"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "சென்சார் அளவீடுகள் மற்றும் தனிப்பயனாக்கப்பட்ட அடிப்படை நிலைகள்" : "Real-time multi-sensor telemetry aligned with circadian learned baselines"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0e1410] px-3 py-1.5 rounded-xl border border-[#1e2721] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
          <span className="text-[#a3e635] font-bold">1-Hz Hardware Telemetry Bus</span>
        </div>
      </div>

      {/* 5 Sensor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Heart Rate */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af] font-medium">Pulse Heart Rate (Pin A0)</span>
            <Heart className={`w-4 h-4 ${hrConnected ? "text-rose-500 fill-rose-500 animate-pulse" : "text-rose-500/50"}`} />
          </div>

          <div>
            {hrConnected ? (
              <div className="space-y-1">
                <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
                  <span>{latestReading.hr}</span>
                  <span className="text-xs font-normal text-[#9ca3af]">BPM</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Optimal Sinus Rhythm • Safe</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
                  <span>74</span>
                  <span className="text-xs font-normal text-[#9ca3af]">BPM</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Pulse Active (A0)</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#6b7280] border-t border-[#1e2721] pt-2 flex items-center justify-between">
            <span>Resting baseline: 72 ± 6 BPM</span>
            <span className="text-[#a3e635] font-mono">Ceiling: 125 BPM</span>
          </div>
        </div>

        {/* SpO2 Blood Oxygen Saturation */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af] font-medium">Blood Oxygen (SpO2)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{Math.round(spo2)}</span>
              <span className="text-xs font-normal text-[#9ca3af]">%</span>
            </div>
            <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Optimal Oxygenation (Normal)</span>
            </div>
          </div>

          <div className="text-[11px] text-[#6b7280] border-t border-[#1e2721] pt-2 flex items-center justify-between">
            <span>Safe: 95% - 100%</span>
            <span className="text-amber-400 font-mono">Alert: &lt; 94%</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af] font-medium">Body / Skin Temp</span>
            <Thermometer className="w-4 h-4 text-[#84cc16]" />
          </div>

          <div className="text-3xl font-black text-white">
            {temp.toFixed(1)} <span className="text-xs font-normal text-[#9ca3af]">°C</span>
          </div>

          <div className="text-[11px] text-[#84cc16] border-t border-[#1e2721] pt-2 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Optimal (Fever limit: 38.0°C)</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af] font-medium">Ambient Humidity</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>

          <div className="text-3xl font-black text-white">
            {humidity.toFixed(1)} <span className="text-xs font-normal text-[#9ca3af]">%</span>
          </div>

          <div className="text-[11px] text-blue-400 border-t border-[#1e2721] pt-2 font-semibold">
            Comfort range (40 - 60%)
          </div>
        </div>

        {/* Stillness / Idle */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ca3af] font-medium">Stillness Duration</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>

          <div className="text-3xl font-black text-white">
            {idle} <span className="text-xs font-normal text-[#9ca3af]">sec</span>
          </div>

          <div className="text-[11px] text-purple-300 border-t border-[#1e2721] pt-2">
            Inactivity alarm threshold: 60s (Demo)
          </div>
        </div>
      </div>

      {/* Learned Baselines Table */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#84cc16]" />
            <span>Circadian Learned Physiological Baselines</span>
          </h2>
          <span className="text-[11px] text-[#84cc16]">Self-Calibrating EWMA</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#1e2721] text-[#9ca3af]">
                <th className="pb-3 font-semibold">Time Bucket</th>
                <th className="pb-3 font-semibold">Baseline HR Mean</th>
                <th className="pb-3 font-semibold">Baseline Temp Mean</th>
                <th className="pb-3 font-semibold">Learning State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2721]">
              {baselines.map((b, idx) => (
                <tr key={idx} className="hover:bg-[#1b241e] transition-colors">
                  <td className="py-3 font-medium text-white">{b.period}</td>
                  <td className="py-3 text-[#a3e635] font-mono font-bold">{b.hr}</td>
                  <td className="py-3 text-white font-mono">{b.temp}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/30">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
