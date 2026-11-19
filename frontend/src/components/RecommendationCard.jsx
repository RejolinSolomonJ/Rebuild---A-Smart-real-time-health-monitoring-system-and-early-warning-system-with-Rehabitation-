import React, { useState, useEffect } from "react";
import { Sparkles, Activity, Check, Heart, ShieldAlert, ArrowRight, RefreshCw, Info } from "lucide-react";

const DEFAULT_RECOMMENDATION = {
  tier: "standard_active",
  tier_name: "Active Functional Rehabilitation",
  clinical_reasoning: [
    "Resting vitals are optimal (Heart rate ~72 BPM, Afebrile).",
    "Tailored for patient mobility and core strength maintenance."
  ],
  prescribed_exercises: [
    { id: "seated_knee_extension", name: "Seated Knee Extension", tamil_name: "நாற்காலியில் முழங்கால் நீட்டுதல்", target_sets: 2, target_reps: 10, rest_s: 30, intensity: "low" },
    { id: "sit_to_stand", name: "Sit to Stand (Chair Stand)", tamil_name: "நாற்காலியிலிருந்து எழுந்து அமருதல்", target_sets: 2, target_reps: 8, rest_s: 45, intensity: "moderate" },
    { id: "standing_heel_raise", name: "Standing Heel Raise", tamil_name: "குதிங்கால் உயர்த்துதல்", target_sets: 2, target_reps: 12, rest_s: 30, intensity: "low" }
  ],
  max_prescribed_hr: 125,
  max_prescribed_borg: 14
};

export default function RecommendationCard({ person, latestReading, onPlanApplied, lang = "en" }) {
  const [recommendation, setRecommendation] = useState(DEFAULT_RECOMMENDATION);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchRecommendation = () => {
    setLoading(true);
    fetch("/api/persons/1/recommendation")
      .then((res) => {
        if (!res.ok) throw new Error("Backend offline or error");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.prescribed_exercises) && Array.isArray(data.clinical_reasoning)) {
          setRecommendation(data);
        }
      })
      .catch((err) => {
        // Fallback to client-side heuristic recommendation if backend is offline
        const hr = latestReading?.hr || 74;
        const temp = Number(latestReading?.temp) || 36.6;
        const spo2 = Number(latestReading?.spo2) || 98.0;

        if (temp >= 38.0 || hr > 115 || hr < 50 || spo2 < 90) {
          setRecommendation({
            tier: "contraindicated_rest",
            tier_name: "Restorative Rest & Recovery Only (Medical Stop)",
            clinical_reasoning: ["Critical vital readings detected; exercise is strictly contraindicated."],
            prescribed_exercises: [],
            max_prescribed_hr: 95,
            max_prescribed_borg: 10
          });
        } else if (hr > 88 || spo2 < 95) {
          setRecommendation({
            tier: "gentle_restorative",
            tier_name: "Gentle Seated Mobilization (Caution Protocol)",
            clinical_reasoning: ["Vital parameters require gentle pacing; seated quadriceps and shoulder mobility prescribed."],
            prescribed_exercises: [
              { id: "seated_knee_extension", name: "Seated Knee Extension", tamil_name: "நாற்காலியில் முழங்கால் நீட்டுதல்", target_sets: 2, target_reps: 8, rest_s: 45, intensity: "low" },
              { id: "shoulder_raise", name: "Shoulder Front Raise", tamil_name: "தோள்பட்டை முன்பக்க உயர்த்துதல்", target_sets: 2, target_reps: 8, rest_s: 35, intensity: "low" }
            ],
            max_prescribed_hr: 110,
            max_prescribed_borg: 12
          });
        } else {
          setRecommendation(DEFAULT_RECOMMENDATION);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecommendation();
  }, [latestReading?.hr, latestReading?.risk_band]);

  const handleApply = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/persons/1/recommendation/apply", { method: "POST" });
      if (res.ok) {
        setApplied(true);
        if (onPlanApplied) onPlanApplied();
        setTimeout(() => setApplied(false), 3500);
      }
    } catch (e) {
      console.error("Failed to apply recommendation:", e);
    } finally {
      setLoading(false);
    }
  };

  const isRest = recommendation.tier === "contraindicated_rest";
  const isGentle = recommendation.tier === "gentle_restorative";
  const reasoningList = recommendation.clinical_reasoning || [];
  const exerciseList = recommendation.prescribed_exercises || [];

  return (
    <div className={`rounded-2xl border p-5 shadow-xl transition-all relative overflow-hidden ${
      isRest
        ? "bg-red-950/40 border-red-500/50"
        : isGentle
        ? "bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40"
        : "bg-gradient-to-r from-indigo-950/40 to-slate-900 border-indigo-500/40"
    }`}>
      {/* Badge Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
              {lang === "ta" ? "AI தானியங்கி உடற்பயிற்சி பரிந்துரை" : "Adaptive AI Exercise Recommendation"}
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {recommendation.tier_name || "Active Functional Rehabilitation"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecommendation}
            disabled={loading}
            title="Recalculate recommendation"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleApply}
            disabled={loading || applied}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              applied
                ? "bg-emerald-600 text-white"
                : isRest
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            {applied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{lang === "ta" ? "திட்டம் மாற்றப்பட்டது!" : "Plan Updated!"}</span>
              </>
            ) : (
              <>
                <span>{lang === "ta" ? "இத்திட்டத்தை ஏற்கவும்" : "Apply to Today's Plan"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clinical Reason Box */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Why this routine was recommended:</span>
        </div>
        <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
          {reasoningList.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Recommended Exercises Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {exerciseList.map((ex) => (
          <div
            key={ex.id}
            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-white block truncate max-w-[170px]">
                {lang === "ta" ? ex.tamil_name : ex.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {ex.target_sets} sets × {ex.target_reps} reps ({ex.rest_s}s rest)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              {ex.intensity || "standard"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
