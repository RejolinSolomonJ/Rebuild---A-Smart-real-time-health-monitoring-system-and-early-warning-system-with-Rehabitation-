import React from "react";
import {
  Heart,
  Thermometer,
  Activity,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Cpu,
  Radio,
  AlertTriangle,
  CheckCircle,
  AlertOctagon
} from "lucide-react";

export default function VitalParametersPanel({
  vitalEvaluation,
  lang = "en"
}) {
  const { parameters = {}, isSimulated = false, evaluatedAt } = vitalEvaluation || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case "CRITICAL":
        return {
          label: lang === "ta" ? "ஆபத்தான நிலை" : "CRITICAL",
          bg: "bg-red-500/20 text-red-400 border-red-500/50",
          dot: "bg-red-500 animate-ping",
          icon: AlertOctagon
        };
      case "WARNING":
        return {
          label: lang === "ta" ? "எச்சரிக்கை" : "WARNING",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/50",
          dot: "bg-amber-400 animate-pulse",
          icon: AlertTriangle
        };
      default:
        return {
          label: lang === "ta" ? "சீரான நிலை" : "NORMAL",
          bg: "bg-[#84cc16]/15 text-[#a3e635] border-[#84cc16]/40",
          dot: "bg-[#84cc16]",
          icon: CheckCircle
        };
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "rising") {
      return (
        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400" title="Trending Upward">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>↑ Rising</span>
        </span>
      );
    }
    if (trend === "falling") {
      return (
        <span className="flex items-center gap-0.5 text-xs font-bold text-blue-400" title="Trending Downward">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>↓ Falling</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-[#9ca3af]" title="Stable Baseline">
        <Minus className="w-3.5 h-3.5" />
        <span>→ Stable</span>
      </span>
    );
  };

  const hr = parameters.hr || { value: 74, status: "NORMAL", trend: "stable", lastUpdated: "Just now" };
  const temp = parameters.temp || { value: "36.6", status: "NORMAL", trend: "stable", lastUpdated: "Just now" };
  const spo2 = parameters.spo2 || { value: 98, status: "NORMAL", trend: "stable", lastUpdated: "Just now" };
  const humidity = parameters.humidity || { value: "52.0", status: "NORMAL", trend: "stable", lastUpdated: "Just now" };

  return (
    <div className="bg-[#141a16] border border-[#222e26] rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2721] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wider text-[#84cc16] uppercase bg-[#84cc16]/10 px-2 py-0.5 rounded border border-[#84cc16]/20">
              CLINICAL TELEMETRY BUS
            </span>
            <span className="text-xs text-[#9ca3af] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> Updated: {evaluatedAt || "Live (1 Hz)"}
            </span>
          </div>
          <h2 className="text-base font-black text-white mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#84cc16]" />
            <span>{lang === "ta" ? "உயிர் அளவுருக்கள் கண்காணிப்பு குழு" : "Vital Parameters Monitoring Panel"}</span>
          </h2>
        </div>

        {/* Real Sensor vs Simulated Source Indicator */}
        <div className="flex items-center gap-2">
          {isSimulated ? (
            <div className="flex items-center gap-1.5 bg-[#1e2621] border border-[#2e3b32] px-3 py-1.5 rounded-xl text-xs text-[#9ca3af]">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">Simulated Sensor</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">DEMO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#84cc16]/10 border border-[#84cc16]/30 px-3 py-1.5 rounded-xl text-xs text-[#a3e635]">
              <Radio className="w-3.5 h-3.5 text-[#84cc16] animate-pulse" />
              <span className="font-bold text-white">Real Hardware (COM3)</span>
              <span className="text-[10px] bg-[#84cc16]/20 text-[#a3e635] px-1.5 py-0.2 rounded font-mono">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Monitored Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Heart Rate */}
        <div className="bg-[#101512] border border-[#1e2721] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9ca3af] flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/40 animate-pulse" />
              <span>Heart Rate</span>
            </span>
            {(() => {
              const b = getStatusBadge(hr.status);
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono ${b.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                  {b.label}
                </span>
              );
            })()}
          </div>

          <div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{hr.value}</span>
              <span className="text-xs text-[#9ca3af] font-normal">BPM</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {getTrendIcon(hr.trend)}
              <span className="text-[#6b7280] font-mono">Target: 55–100</span>
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] border-t border-[#18211b] pt-2 flex items-center justify-between">
            <span className="truncate" title={hr.reason}>{hr.reason}</span>
            <span className="text-[9px] font-mono text-[#6b7280] shrink-0">{hr.lastUpdated}</span>
          </div>
        </div>

        {/* 2. Body Temperature */}
        <div className="bg-[#101512] border border-[#1e2721] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9ca3af] flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Body Temperature</span>
            </span>
            {(() => {
              const b = getStatusBadge(temp.status);
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono ${b.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                  {b.label}
                </span>
              );
            })()}
          </div>

          <div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{temp.value}</span>
              <span className="text-xs text-[#9ca3af] font-normal">°C</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {getTrendIcon(temp.trend)}
              <span className="text-[#6b7280] font-mono">Safe: 36.0–37.5°C</span>
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] border-t border-[#18211b] pt-2 flex items-center justify-between">
            <span className="truncate" title={temp.reason}>{temp.reason}</span>
            <span className="text-[9px] font-mono text-[#6b7280] shrink-0">{temp.lastUpdated}</span>
          </div>
        </div>

        {/* 3. SpO2 Blood Oxygen */}
        <div className="bg-[#101512] border border-[#1e2721] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9ca3af] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Blood Oxygen (SpO2)</span>
            </span>
            {(() => {
              const b = getStatusBadge(spo2.status);
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono ${b.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                  {b.label}
                </span>
              );
            })()}
          </div>

          <div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{spo2.value}</span>
              <span className="text-xs text-[#9ca3af] font-normal">%</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {getTrendIcon(spo2.trend)}
              <span className="text-[#6b7280] font-mono">Norm: 95–100%</span>
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] border-t border-[#18211b] pt-2 flex items-center justify-between">
            <span className="truncate" title={spo2.reason}>{spo2.reason}</span>
            <span className="text-[9px] font-mono text-[#6b7280] shrink-0">{spo2.lastUpdated}</span>
          </div>
        </div>

        {/* 4. Environmental Humidity */}
        <div className="bg-[#101512] border border-[#1e2721] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9ca3af] flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span>Humidity (DHT22)</span>
            </span>
            {(() => {
              const b = getStatusBadge(humidity.status);
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono ${b.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                  {b.label}
                </span>
              );
            })()}
          </div>

          <div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{humidity.value}</span>
              <span className="text-xs text-[#9ca3af] font-normal">%</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {getTrendIcon(humidity.trend)}
              <span className="text-[#6b7280] font-mono">Comfort: 30–60%</span>
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] border-t border-[#18211b] pt-2 flex items-center justify-between">
            <span className="truncate" title={humidity.reason}>{humidity.reason}</span>
            <span className="text-[9px] font-mono text-[#6b7280] shrink-0">{humidity.lastUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
