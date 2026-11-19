import React, { useState } from "react";
import {
  Play,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Sliders,
  Clock,
  Repeat,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ExerciseIllustration } from "./ExerciseIllustrations";

const CANONICAL_EXERCISES_DATA = [
  {
    id: "seated_knee_extension",
    name: "Seated Knee Extension",
    tamil_name: "நாற்காலியில் அமர்ந்து முழங்கால் நீட்டுதல்",
    category: "Lower Body Strengthening",
    target_muscle: "Quadriceps & Patellar Tendon",
    purpose: "Strengthens quadriceps muscles and stabilizes the patellofemoral joint without axial joint loading, ideal for knee osteoarthritis.",
    instructions: "Sit upright on a sturdy chair with feet flat. Slowly extend your knee until your lower leg is nearly horizontal, hold for 1 second, and gently lower with control.",
    default_sets: 2,
    default_reps: 10,
    default_duration: "60 seconds",
    rest_s: 30,
    why_selected: "Selected for Ramesh Kumar: Builds peri-articular knee strength to offload cartilage wear from mild knee osteoarthritis without weight-bearing joint compression."
  },
  {
    id: "sit_to_stand",
    name: "Sit to Stand (Chair Stand)",
    tamil_name: "நாற்காலியிலிருந்து எழுந்து அமருதல்",
    category: "Functional Mobility & Fall Prevention",
    target_muscle: "Gluteus Maximus, Quadriceps, Core",
    purpose: "Enhances lower body functional power, dynamic balance, and safe transfer independence as assessed in the CDC STEADI Chair Stand protocol.",
    instructions: "Sit on the front half of a stable chair with arms folded across chest. Lean forward slightly from the hips and stand up fully, pause, then lower gently back down.",
    default_sets: 2,
    default_reps: 8,
    default_duration: "60 seconds",
    rest_s: 45,
    why_selected: "Selected for Ramesh Kumar: Preserves bilateral hip extensor and quadriceps functional strength to prevent chair-transfer falls during solo living."
  },
  {
    id: "standing_heel_raise",
    name: "Standing Heel Raise",
    tamil_name: "குதிங்கால் உயர்த்துதல்",
    category: "Balance & Venous Return",
    target_muscle: "Gastrocnemius, Soleus (Calf Muscle Pump)",
    purpose: "Activates the peripheral skeletal muscle pump to facilitate venous blood return from lower limbs and reinforces ankle proprioceptive stability.",
    instructions: "Stand tall holding onto a wall or chair for light balance. Push through the balls of both feet to elevate your heels, pause for 1 second at the peak, and smoothly lower.",
    default_sets: 2,
    default_reps: 12,
    default_duration: "45 seconds",
    rest_s: 30,
    why_selected: "Selected for Ramesh Kumar: Counteracts mild dependent peripheral edema from amlodipine calcium channel blocker medication and trains ankle proprioception."
  },
  {
    id: "shoulder_raise",
    name: "Shoulder Front Raise",
    tamil_name: "தோள்பட்டை முன்பக்க உயர்த்துதல்",
    category: "Upper Body Posture & Mobility",
    target_muscle: "Anterior Deltoid, Rotator Cuff, Upper Trapezius",
    purpose: "Promotes thoracic spinal upright posture, shoulder flexion range of motion, and scapular stabilization with low cardiovascular demand.",
    instructions: "Sit or stand tall with arms at sides. Slowly elevate arms forward to shoulder height with elbows straight, hold for 1 second, and gently lower down.",
    default_sets: 2,
    default_reps: 10,
    default_duration: "60 seconds",
    rest_s: 30,
    why_selected: "Selected for Ramesh Kumar: Expands thoracic lung volume and overhead functional reach while maintaining minimal cardiac afterload for hypertension safety."
  }
];

export default function ExerciseRecommendationsPanel({
  vitalEvaluation,
  onStartSession,
  customThresholds,
  onUpdateThresholds,
  lang = "en"
}) {
  const [selectedExId, setSelectedExId] = useState("seated_knee_extension");
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [tempThresholds, setTempThresholds] = useState(customThresholds || {});

  const overallCategory = vitalEvaluation?.overallCategory || "GREEN";
  const canStart = vitalEvaluation?.canStartExercise;

  const currentEx = CANONICAL_EXERCISES_DATA.find((e) => e.id === selectedExId) || CANONICAL_EXERCISES_DATA[0];

  return (
    <div className="bg-[#141a16] border border-[#222e26] rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2721] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wider text-[#a3e635] uppercase bg-[#84cc16]/10 px-2 py-0.5 rounded border border-[#84cc16]/30">
              PHYSIO APPROVED PROTOCOL (DR. KAVITHA)
            </span>
            <span className="text-xs text-[#9ca3af]">4 Prescribed Canonical Exercises</span>
          </div>
          <h2 className="text-base font-black text-white mt-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#84cc16]" />
            <span>{lang === "ta" ? "பரிந்துரைக்கப்பட்ட உடற்பயிற்சிகள் குழு" : "Exercise Recommendations Panel"}</span>
          </h2>
        </div>

        {/* Safety Clearance Status Badge & Threshold Button */}
        <div className="flex items-center gap-2">
          {overallCategory === "RED" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-bold font-mono animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>MEDICAL STOP (OVERRIDDEN)</span>
            </div>
          ) : overallCategory === "YELLOW" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-bold font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>PAUSED (VITALS WARNING)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/50 text-xs font-bold font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>CLEARED TO EXERCISE</span>
            </div>
          )}

          <button
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className="p-2 rounded-xl bg-[#1b231d] hover:bg-[#253228] text-[#9ca3af] hover:text-white border border-[#2b392f] transition-colors"
            title="Configure Patient Safety Thresholds"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Alert Directive if Vitals are abnormal */}
      {overallCategory === "RED" && (
        <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-4 text-xs text-red-200 space-y-1">
          <div className="font-bold text-red-400 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4" />
            <span>Exercise is strictly prohibited: Critical vital sign safety breach detected.</span>
          </div>
          <p>
            Do not perform any exercise routine. Exercises are not prescribed as treatment for abnormal vitals.
            Please sit quietly, rest with back supported, and notify caregiver Anita (+919876543210) or doctor.
          </p>
        </div>
      )}

      {overallCategory === "YELLOW" && (
        <div className="bg-amber-950/70 border border-amber-500/50 rounded-2xl p-4 text-xs text-amber-200 space-y-1">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Exercise temporarily paused: Parameter requires normalization.</span>
          </div>
          <p>
            Reassess heart rate, body temperature, or SpO2 after a 5-minute seated rest. Once parameters return to Green bounds, you may resume guided practice.
          </p>
        </div>
      )}

      {/* Threshold Configuration Drawer */}
      {showThresholdConfig && (
        <div className="bg-[#101512] border border-[#26352a] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono">
              Configurable Patient Safety Limits (Ramesh Kumar)
            </span>
            <button
              onClick={() => setShowThresholdConfig(false)}
              className="text-xs text-[#9ca3af] hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[#9ca3af] block text-[11px] mb-1">Max HR Limit (BPM)</label>
              <input
                type="number"
                value={tempThresholds.max_hr_exercise || 125}
                onChange={(e) => setTempThresholds({ ...tempThresholds, max_hr_exercise: Number(e.target.value) })}
                className="w-full bg-[#18211b] border border-[#2b3a2f] rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] block text-[11px] mb-1">Min HR Limit (BPM)</label>
              <input
                type="number"
                value={tempThresholds.min_hr || 50}
                onChange={(e) => setTempThresholds({ ...tempThresholds, min_hr: Number(e.target.value) })}
                className="w-full bg-[#18211b] border border-[#2b3a2f] rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] block text-[11px] mb-1">Fever Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={tempThresholds.fever_temp || 38.0}
                onChange={(e) => setTempThresholds({ ...tempThresholds, fever_temp: Number(e.target.value) })}
                className="w-full bg-[#18211b] border border-[#2b3a2f] rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] block text-[11px] mb-1">Min SpO2 Warning (%)</label>
              <input
                type="number"
                value={tempThresholds.min_spo2_warning || 95}
                onChange={(e) => setTempThresholds({ ...tempThresholds, min_spo2_warning: Number(e.target.value) })}
                className="w-full bg-[#18211b] border border-[#2b3a2f] rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                if (onUpdateThresholds) onUpdateThresholds(tempThresholds);
                setShowThresholdConfig(false);
              }}
              className="px-4 py-1.5 bg-[#84cc16] hover:bg-[#9ee838] text-black font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Save Thresholds
            </button>
          </div>
        </div>
      )}

      {/* Exercise Selector Strip (The 4 Canonical Exercises) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CANONICAL_EXERCISES_DATA.map((ex, idx) => {
          const isSelected = selectedExId === ex.id;
          return (
            <button
              key={ex.id}
              onClick={() => setSelectedExId(ex.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#18261b] border-[#84cc16] shadow-[0_0_15px_rgba(132,204,22,0.25)] scale-[1.01]"
                  : "bg-[#101512] border-[#1e2721] hover:border-[#2e3e31] text-[#9ca3af] hover:text-white"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-[#84cc16] font-bold uppercase block mb-1">
                  Exercise {idx + 1}
                </span>
                <h3 className={`font-bold text-xs sm:text-sm ${isSelected ? "text-white" : "text-[#d1d5db]"}`}>
                  {ex.name}
                </h3>
                <span className="text-[10px] text-[#6b7280] block truncate">{ex.tamil_name}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-[#1a231d] flex items-center justify-between text-[10px]">
                <span className="text-[#84cc16] font-mono">{ex.default_sets} × {ex.default_reps}</span>
                <span className="text-[#6b7280] font-mono">{ex.rest_s}s rest</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Card for the Selected Exercise */}
      <div className="bg-[#101512] border border-[#1e2721] rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: SVG Illustration (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b0e0c] border border-[#1b231d] rounded-2xl p-4 flex flex-col items-center justify-center relative">
          <ExerciseIllustration exerciseId={currentEx.id} className="w-full h-48" />
          <div className="absolute top-3 left-3 bg-[#101512]/90 border border-[#222e26] px-2.5 py-1 rounded-xl text-[10px] text-[#9ca3af] font-mono">
            {currentEx.target_muscle}
          </div>
        </div>

        {/* Right: Purpose, Instructions, Rationale, and Action (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono uppercase bg-[#84cc16]/10 text-[#a3e635] px-2 py-0.5 rounded border border-[#84cc16]/20">
                  {currentEx.category}
                </span>
                <span className="text-xs text-[#9ca3af]">{currentEx.tamil_name}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">{currentEx.name}</h3>
            </div>

            {/* Purpose */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#84cc16] block">
                Clinical Purpose:
              </span>
              <p className="text-xs text-[#d1d5db] leading-relaxed">{currentEx.purpose}</p>
            </div>

            {/* Instructions */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8] block">
                Movement Instructions:
              </span>
              <p className="text-xs text-[#9ca3af] leading-relaxed">{currentEx.instructions}</p>
            </div>

            {/* Why This Exercise Was Selected (Prescription Rationale) */}
            <div className="bg-[#141d17] border border-[#202e24] p-3 rounded-xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Why this exercise was selected:</span>
              </span>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                {currentEx.why_selected}
              </p>
            </div>

            {/* Prescription parameters */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#18211b]">
              <div className="bg-[#161e18] p-2 rounded-xl text-center">
                <span className="text-[10px] text-[#6b7280] uppercase block">Sets & Reps</span>
                <span className="font-bold text-white font-mono">{currentEx.default_sets} sets × {currentEx.default_reps} reps</span>
              </div>
              <div className="bg-[#161e18] p-2 rounded-xl text-center">
                <span className="text-[10px] text-[#6b7280] uppercase block">Rest Interval</span>
                <span className="font-bold text-[#84cc16] font-mono">{currentEx.rest_s} seconds</span>
              </div>
              <div className="bg-[#161e18] p-2 rounded-xl text-center">
                <span className="text-[10px] text-[#6b7280] uppercase block">Duration</span>
                <span className="font-bold text-white font-mono">{currentEx.default_duration}</span>
              </div>
            </div>
          </div>

          {/* Start Button with Safety Interlock */}
          <div>
            <button
              onClick={() => {
                if (canStart && onStartSession) {
                  onStartSession(currentEx.id);
                }
              }}
              disabled={!canStart}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                canStart
                  ? "bg-[#84cc16] hover:bg-[#9ee838] text-black shadow-[0_0_20px_rgba(132,204,22,0.35)] scale-100 hover:scale-[1.01]"
                  : "bg-[#1f2821] text-[#6b7280] cursor-not-allowed border border-[#2b372e]"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {canStart
                  ? (lang === "ta" ? "வழிகாட்டப்பட்ட AI பயிற்சியைத் தொடங்கு" : `Start Guided ${currentEx.name}`)
                  : (lang === "ta" ? "பாதுகாப்புத் தடை: உயிர் அளவீடுகளை சரிபார்க்கவும்" : "Start Disabled: Vital Safety Interlock Engaged")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
