import React, { useState, useMemo } from "react";
import {
  Dumbbell,
  Play,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  Layers,
  Activity,
  Heart,
  Thermometer,
  Droplets
} from "lucide-react";
import { evaluateVitalParameters } from "../rehab/vitalRehabEngine";
import VitalParametersPanel from "../components/VitalParametersPanel";
import ExerciseRecommendationsPanel from "../components/ExerciseRecommendationsPanel";
import VitalsNotificationBanner from "../components/VitalsNotificationBanner";

export default function WorkoutsView({
  plan,
  onStartSession,
  latestReading,
  readingHistory = [],
  lang = "en"
}) {
  const [customThresholds, setCustomThresholds] = useState({});

  // Real-time clinical evaluation of the 4 vital parameters
  const vitalEval = useMemo(() => {
    return evaluateVitalParameters(latestReading, readingHistory, customThresholds);
  }, [latestReading, readingHistory, customThresholds]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Real-Time Visual & Audio Notifications Banner */}
      <VitalsNotificationBanner
        overallCategory={vitalEval.overallCategory}
        notifications={vitalEval.notifications}
        lang={lang}
      />

      {/* 2. Top Header Banner with Protocol Summary */}
      <div className="bg-[#141a16] border border-[#222e26] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase bg-[#84cc16]/20 text-[#a3e635] px-2 py-0.5 rounded border border-[#84cc16]/30">
              SMART REHABILITATION SUITE
            </span>
            <span className="text-xs text-[#9ca3af]">Approved by Dr. Kavitha (PT)</span>
          </div>
          <h1 className="text-xl font-black text-white">
            {plan?.title || "Guided Geriatric Rehabilitation & Biomechanical Coach"}
          </h1>
          <p className="text-xs text-[#9ca3af] max-w-2xl leading-relaxed">
            Continuously monitors Heart Rate, Body Temperature, SpO2, and Humidity. Automatically gates and adapts prescribed exercise routines while enforcing strict clinical safety boundaries.
          </p>
        </div>

        {/* Global Session Launcher */}
        <button
          onClick={() => {
            if (vitalEval.canStartExercise && onStartSession) {
              onStartSession();
            }
          }}
          disabled={!vitalEval.canStartExercise}
          className={`py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 ${
            vitalEval.canStartExercise
              ? "bg-[#84cc16] hover:bg-[#9ee838] text-black shadow-[0_0_25px_rgba(132,204,22,0.4)] scale-100 hover:scale-[1.02]"
              : "bg-[#1f2821] text-[#6b7280] cursor-not-allowed border border-[#2b372e]"
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>
            {vitalEval.canStartExercise
              ? (lang === "ta" ? "AI பயிற்சி அமர்வை தொடங்கு" : "Start Guided AI Session")
              : "Session Gated by Vitals"}
          </span>
        </button>
      </div>

      {/* 3. Panel 1: Vital Parameters Monitoring Panel */}
      <VitalParametersPanel
        vitalEvaluation={vitalEval}
        lang={lang}
      />

      {/* 4. Panel 2: Exercise Recommendations Panel (Strictly 4 Canonical Exercises) */}
      <ExerciseRecommendationsPanel
        vitalEvaluation={vitalEval}
        onStartSession={onStartSession}
        customThresholds={customThresholds}
        onUpdateThresholds={(t) => setCustomThresholds(t)}
        lang={lang}
      />
    </div>
  );
}
