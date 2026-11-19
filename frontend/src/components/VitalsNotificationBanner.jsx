import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Volume2,
  VolumeX,
  X,
  Clock,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  AlertOctagon
} from "lucide-react";
import { audioAlerts } from "../rehab/vitalRehabEngine";

export default function VitalsNotificationBanner({
  overallCategory = "GREEN",
  notifications = [],
  onAcknowledge,
  lang = "en"
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  // Filter unacknowledged notifications
  const activeNotifications = notifications.filter(
    (n) => !acknowledgedIds.has(n.id || `${n.parameter}_${n.value}`)
  );

  // Trigger sound when category changes
  useEffect(() => {
    if (overallCategory && activeNotifications.length > 0) {
      audioAlerts.play(overallCategory);
    }
  }, [overallCategory, activeNotifications.length]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioAlerts.setMuted(nextMuted);
  };

  const handleAcknowledge = (notif) => {
    const id = notif.id || `${notif.parameter}_${notif.value}`;
    setAcknowledgedIds((prev) => new Set([...prev, id]));
    if (onAcknowledge) onAcknowledge(notif);
  };

  const handleAcknowledgeAll = () => {
    const allIds = new Set(notifications.map((n) => n.id || `${n.parameter}_${n.value}`));
    setAcknowledgedIds(allIds);
    if (onAcknowledge) onAcknowledge({ all: true });
  };

  if (activeNotifications.length === 0) return null;

  // Critical RED Notification Banner
  if (overallCategory === "RED") {
    return (
      <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold font-mono tracking-wider bg-red-500 text-black px-2 py-0.5 rounded uppercase">
                CATEGORY RED: CRITICAL MEDICAL STOP
              </span>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5">
                {lang === "ta"
                  ? "முக்கிய எச்சரிக்கை: உடற்பயிற்சி உடனடியாக நிறுத்தப்பட்டது!"
                  : "Critical Safety Threshold Exceeded: Rehabilitation Halted"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-200 transition-colors"
              title={isMuted ? "Unmute alert sound" : "Mute alert sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
            </button>
            <button
              onClick={handleAcknowledgeAll}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              {lang === "ta" ? "அறிவிப்பை உறுதிசெய்" : "Acknowledge Alert"}
            </button>
          </div>
        </div>

        {/* List of active critical notifications */}
        <div className="space-y-2.5">
          {activeNotifications.map((notif, idx) => (
            <div
              key={idx}
              className="bg-red-900/40 border border-red-500/30 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-red-100"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{notif.parameter}:</span>
                  <span className="font-black text-red-300 font-mono text-sm bg-red-950 px-2 py-0.5 rounded border border-red-500/40">
                    {notif.value}
                  </span>
                  <span className="text-[10px] text-red-300/70 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-red-200 font-medium">
                  <span className="text-red-400 font-bold">Reason:</span> {notif.reason}
                </p>
                <p className="text-xs text-amber-200 font-semibold bg-red-950/60 p-2 rounded-lg border border-red-500/20">
                  <span className="text-amber-400 font-bold">Safety Directive:</span> {notif.safety_action}
                </p>
              </div>

              <button
                onClick={() => handleAcknowledge(notif)}
                className="self-end md:self-center px-2.5 py-1 rounded-lg bg-red-800/60 hover:bg-red-700 text-[11px] font-bold text-red-100 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Warning YELLOW Notification Banner
  if (overallCategory === "YELLOW") {
    return (
      <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold font-mono tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded uppercase">
                CATEGORY YELLOW: PARAMETER WARNING (PAUSE & REASSESS)
              </span>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5">
                {lang === "ta"
                  ? "பாதுகாப்பு இடைநிறுத்தம்: அளவீடுகள் அனுமதிக்கப்பட்ட வரம்பிற்கு வெளியே உள்ளது"
                  : "Session Paused: Vital Parameters Require Reassessment"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-amber-900/50 hover:bg-amber-800 text-amber-200 transition-colors"
              title={isMuted ? "Unmute alert" : "Mute alert"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleAcknowledgeAll}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Acknowledge & Clear
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {activeNotifications.map((notif, idx) => (
            <div
              key={idx}
              className="bg-amber-900/30 border border-amber-500/20 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-amber-100"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{notif.parameter}:</span>
                  <span className="font-black text-amber-300 font-mono bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                    {notif.value}
                  </span>
                  <span className="text-[10px] text-amber-300/70 font-mono">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-amber-200">
                  <span className="text-amber-400 font-bold">Observation:</span> {notif.reason}
                </p>
                <p className="text-xs text-white font-medium bg-amber-950/50 p-1.5 rounded-lg">
                  <span className="text-amber-400 font-bold">Recommended Action:</span> {notif.safety_action}
                </p>
              </div>

              <button
                onClick={() => handleAcknowledge(notif)}
                className="self-end md:self-center px-2 py-1 rounded-lg bg-amber-800/60 hover:bg-amber-700 text-[11px] font-bold text-amber-100 transition-colors shrink-0"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal GREEN Notification Banner
  return (
    <div className="bg-[#121c15] border border-[#233527] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-[#a3e635]">
      <div className="flex items-center gap-2.5">
        <CheckCircle className="w-4 h-4 text-[#84cc16] shrink-0" />
        <span className="font-semibold text-white">
          {lang === "ta"
            ? "அனைத்து உயிர் அளவுருக்களும் (HR, Temp, SpO2, Humidity) அனுமதிக்கப்பட்ட வரம்பிற்குள் உள்ளன."
            : "All vital parameters (HR, Body Temp, SpO2, Humidity) are within safe clinical bounds."}
        </span>
      </div>
      <span className="text-[10px] font-mono bg-[#84cc16]/15 text-[#a3e635] px-2.5 py-1 rounded-lg font-bold border border-[#84cc16]/30 shrink-0">
        CATEGORY GREEN: CLEARED
      </span>
    </div>
  );
}
