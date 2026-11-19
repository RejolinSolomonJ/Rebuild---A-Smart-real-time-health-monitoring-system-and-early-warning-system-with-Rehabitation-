import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  CheckCircle,
  Shield,
  Plus,
  Trash2,
  Award,
  AlertCircle,
  Save,
  Clock,
  Activity,
  ChevronRight
} from "lucide-react";

export default function PhysioView({ plan, onSavePlan, lang = "en" }) {
  const [title, setTitle] = useState(plan?.title || "Home Rehabilitation Plan");
  const [notes, setNotes] = useState(plan?.notes || "Perform exercises slowly with controlled breathing.");
  const [maxHR, setMaxHR] = useState(plan?.max_hr_limit || 125);
  const [maxBorg, setMaxBorg] = useState(plan?.max_borg_limit || 14);
  const [approved, setApproved] = useState(plan?.approved_by_physio || true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Exercise items list
  const [items, setItems] = useState(
    plan?.items && plan.items.length > 0
      ? plan.items
      : [
          { exercise_id: "seated_knee_extension", exercise_name: "Seated Knee Extension", target_sets: 2, target_reps: 10, rest_s: 30 },
          { exercise_id: "sit_to_stand", exercise_name: "Sit to Stand (Chair Stand)", target_sets: 2, target_reps: 8, rest_s: 45 }
        ]
  );

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    setLoadingSessions(true);
    fetch("/api/sessions?person_id=1")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data || []);
        setLoadingSessions(false);
      })
      .catch((e) => {
        console.warn("Failed fetching sessions:", e);
        setLoadingSessions(false);
      });
  };

  const handleAddItem = (exId, exName) => {
    setItems([...items, { exercise_id: exId, exercise_name: exName, target_sets: 2, target_reps: 10, rest_s: 30 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSavePlan({
      title,
      notes,
      max_hr_limit: parseInt(maxHR),
      max_borg_limit: parseInt(maxBorg),
      approved_by_physio: approved,
      physio_name: "Dr. Kavitha (PT)",
      items,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {lang === "ta" ? "மருத்துவ பிசியோதெரபிஸ்ட் போர்டல்" : "Clinical Physiotherapist Dashboard"}
            </span>
            <h1 className="text-xl font-bold text-white">Dr. Kavitha (PT) — Patient: Ramesh Kumar</h1>
            <p className="text-xs text-slate-400">
              Prescribe home exercises, customize safety limits, and review Recovery Intelligence Scores.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save & Update Plan</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Rehabilitation plan and clinician safety limits updated successfully!</span>
        </div>
      )}

      {/* Plan Builder Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Exercise Prescription & Repetition Targets
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Plan Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Clinical Instructions for Patient</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Prescribed Items */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-300 block">Selected Library Exercises</span>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-[160px]">
                    <span className="font-bold text-white block">{item.exercise_name}</span>
                    <span className="text-[10px] text-slate-400">{item.exercise_id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Sets:</span>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={item.target_sets}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].target_sets = parseInt(e.target.value);
                          setItems(updated);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Reps:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={item.target_reps}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].target_reps = parseInt(e.target.value);
                          setItems(updated);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-white"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Exercise from Library */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center">Add:</span>
              <button
                onClick={() => handleAddItem("seated_knee_extension", "Seated Knee Extension")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Knee Extension
              </button>
              <button
                onClick={() => handleAddItem("sit_to_stand", "Sit to Stand (Chair Stand)")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Chair Stand
              </button>
              <button
                onClick={() => handleAddItem("standing_heel_raise", "Standing Heel Raise")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Heel Raise
              </button>
              <button
                onClick={() => handleAddItem("shoulder_raise", "Shoulder Front Raise")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Shoulder Raise
              </button>
              <button
                onClick={() => handleAddItem("back_extension", "Prone Back Extension")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-purple-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Back Extension
              </button>
              <button
                onClick={() => handleAddItem("squat_guided", "Assisted Wall Squat")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-purple-400 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Wall Squat
              </button>
            </div>
          </div>
        </div>

        {/* Clinician Safety Limits Shield */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Clinician Safety Limits
              </h3>
            </div>

            <p className="text-[11px] text-slate-400">
              MoveSafe enforces these physiological guardrails. Crossing them triggers immediate safe-pause and buzzer 5.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Max Safe Heart Rate</span>
                  <span className="font-bold text-red-400">{maxHR} BPM</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="160"
                  value={maxHR}
                  onChange={(e) => setMaxHR(e.target.value)}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Max Borg RPE Exertion</span>
                  <span className="font-bold text-amber-400">{maxBorg} (Hard)</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="18"
                  value={maxBorg}
                  onChange={(e) => setMaxBorg(e.target.value)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">Physiotherapist Approval</span>
                    <span className="text-[10px] text-slate-400">Allows patient to initiate session</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Adherence & Session Compliance History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Recent Guided Sessions & Recovery Intelligence Scores
            </h2>
          </div>
          <button
            onClick={fetchSessions}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Session #{s.id}
                    </span>
                    <span className="text-slate-400">
                      {s.start_time ? new Date(s.start_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Today"}
                    </span>
                  </div>
                  {s.summary && (
                    <span className="text-base font-black text-amber-400 font-mono">
                      {Math.round(s.summary.recovery_score)}/100
                    </span>
                  )}
                </div>

                {s.summary ? (
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block">Valid Reps</span>
                      <span className="font-bold text-white">{s.summary.valid_reps} / {s.summary.target_reps}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Form Quality</span>
                      <span className="font-bold text-emerald-400">{s.summary.fault_free_reps} clean</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Effort (Borg)</span>
                      <span className="font-bold text-blue-400">{s.summary.final_borg || s.pre_borg || 6}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    Status: <strong className="capitalize text-slate-200">{s.status}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">
            {loadingSessions ? "Loading sessions..." : "No guided rehabilitation sessions recorded yet."}
          </p>
        )}
      </div>
    </div>
  );
}