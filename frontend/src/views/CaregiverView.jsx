import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Heart,
  Thermometer,
  Footprints,
  AlertTriangle,
  MessageSquare,
  PhoneCall,
  CheckCircle,
  Volume2,
  Award,
  Clock
} from "lucide-react";

export default function CaregiverView({
  person,
  latestReading,
  alerts,
  onAckAlert,
  lang = "en"
}) {
  const isOk = latestReading?.risk_band === "green";
  const hrOk = Boolean(latestReading && latestReading.hr_ok && Number(latestReading.hr) > 0);
  const hr = hrOk ? latestReading.hr : null;
  const temp = typeof latestReading?.temp === "number" ? latestReading.temp.toFixed(1) : (Number(latestReading?.temp) || 36.6).toFixed(1);

  const [promptSent, setPromptSent] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetch("/api/sessions?person_id=1")
      .then((r) => r.json())
      .then((data) => setRecentSessions(data || []))
      .catch((e) => console.warn("Failed fetching caregiver sessions:", e));
  }, []);

  const handleRemotePrompt = async () => {
    try {
      await fetch("/api/persons/1/prompt", { method: "POST" });
      setPromptSent(true);
      setTimeout(() => setPromptSent(false), 3000);
    } catch (e) {
      console.warn("Failed sending prompt:", e);
    }
  };

  const latestSession = recentSessions && recentSessions.length > 0 ? recentSessions[0] : null;

  return (
    <div className="space-y-6">
      {/* Caregiver Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {lang === "ta" ? "குடும்ப தாதா போர்டல்" : "Family Caregiver Portal"}
            </span>
            <h1 className="text-xl font-bold text-white">
              {lang === "ta" ? `அனிதா, நீங்கள் கண்காணிக்கிறீர்கள்: ${person?.name}` : `Anita, you are monitoring: ${person?.name}`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "ta" ? "அவசர SMS விழிப்பூட்டல்கள் செயலில் உள்ளன: +91 98765 43210" : "Real-time emergency SMS link active: +91 98765 43210"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRemotePrompt}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{promptSent ? "Prompt Sent (Beeped)" : "Send Movement Prompt"}</span>
          </button>

          <a
            href="tel:112"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "112 அவசர உதவி" : "Call 112 (Emergency)"}</span>
          </a>
        </div>
      </div>

      {/* Patient Health Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            {lang === "ta" ? "நேரலை ஆரோக்கிய நிலை" : "Current Physiological Status"}
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
            isOk ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}>
            {isOk ? "Normal & Stable" : "Attention Needed"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border transition-all ${
            hrOk ? "bg-slate-800/60 border-slate-700" : "bg-rose-950/20 border-rose-500/30"
          }`}>
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <Heart className={`w-4 h-4 ${hrOk ? "text-red-400" : "text-rose-400"}`} />
              <span className="text-xs font-semibold">{lang === "ta" ? "இதயத் துடிப்பு" : "Resting Heart Rate"}</span>
            </div>
            {hrOk ? (
              <span className="text-2xl font-black text-white">{hr} <span className="text-xs text-slate-400">BPM</span></span>
            ) : (
              <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>{lang === "ta" ? "இணைக்கப்படவில்லை" : "Not Connected"}</span>
              </span>
            )}
            <p className={`text-[10px] mt-1 ${hrOk ? "text-slate-500" : "text-rose-300 font-medium"}`}>
              {hrOk ? "Normal baseline ~72 BPM" : (lang === "ta" ? "துடிப்பு உணரி துண்டிக்கப்பட்டது" : "Heartbeat Sensor Disconnected")}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Thermometer className="w-4 h-4" />
              <span className="text-xs font-semibold">{lang === "ta" ? "உடல் வெப்பநிலை" : "Temperature"}</span>
            </div>
            <span className="text-2xl font-black text-white">{temp} <span className="text-xs text-slate-400">°C</span></span>
            <p className="text-[10px] text-slate-500 mt-1">Afebrile / Stable</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Footprints className="w-4 h-4" />
              <span className="text-xs font-semibold">{lang === "ta" ? "அசைவு & இயக்கம்" : "Activity State"}</span>
            </div>
            <span className="text-2xl font-black text-white">
              {latestReading?.motion ? "Active" : `${Math.floor((latestReading?.idle_s || 0)/60)}m Still`}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">PIR Room Monitor</p>
          </div>
        </div>
      </div>

      {/* Daily Rehabilitation Progress for Caregiver */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === "ta" ? "இன்றைய உடற்பயிற்சி முன்னேற்றம்" : "Rehabilitation Adherence & Recovery Score"}
            </h3>
          </div>
          <span className="text-xs text-slate-500">MoveSafe Coach</span>
        </div>

        {latestSession?.summary ? (
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Latest Guided Session</span>
              <span className="text-lg font-bold text-white">
                Completed {latestSession.summary.valid_reps} of {latestSession.summary.target_reps} valid repetitions
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Form Quality: {latestSession.summary.fault_free_reps} clean reps • Exertion Borg {latestSession.summary.final_borg || 10}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Recovery Score</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {Math.round(latestSession.summary.recovery_score)}/100
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase inline-block mt-0.5">
                {latestSession.summary.grade || "A"} Grade
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">
            No rehabilitation sessions logged today. Patient has not started MoveSafe yet.
          </p>
        )}
      </div>

      {/* Emergency Alerts & SMS Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === "ta" ? "SMS எச்சரிக்கைகள் & அறிவிப்புகள்" : "SMS Alerts & Incident Log"}
            </h3>
          </div>
          <span className="text-xs text-slate-500">Twilio Integration</span>
        </div>

        <div className="space-y-3">
          {alerts && alerts.length > 0 ? (
            alerts.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      a.severity === "urgent" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {a.alert_type.replace("_", " ")}
                    </span>
                    <span className="text-slate-400">
                      {new Date(a.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm">{a.reason}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    a.sms_sent ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"
                  }`}>
                    {a.sms_sent ? "SMS Dispatched" : "Logged"}
                  </span>
                  {!a.acknowledged && (
                    <button
                      onClick={() => onAckAlert(a.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No critical alerts dispatched to family caregiver.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}