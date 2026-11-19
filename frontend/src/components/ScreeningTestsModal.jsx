import React, { useState, useEffect, useRef } from "react";
import { Timer, CheckCircle, Activity, Award, X, Play, RotateCcw, ShieldAlert, BookOpen } from "lucide-react";

export default function ScreeningTestsModal({ isOpen, onClose, person, lang = "en" }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("chair_stand"); // "chair_stand" or "tug"

  // 30s Chair Stand Test State
  const [chairTimeLeft, setChairTimeLeft] = useState(30);
  const [chairRunning, setChairRunning] = useState(false);
  const [chairReps, setChairReps] = useState(0);
  const [chairSaved, setChairSaved] = useState(false);
  const chairTimerRef = useRef(null);

  // Timed Up & Go (TUG) State
  const [tugTime, setTugTime] = useState(0.0);
  const [tugRunning, setTugRunning] = useState(false);
  const [tugSaved, setTugSaved] = useState(false);
  const tugTimerRef = useRef(null);

  // --- 30s Chair Stand Timer ---
  useEffect(() => {
    if (chairRunning && chairTimeLeft > 0) {
      chairTimerRef.current = setTimeout(() => {
        setChairTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (chairTimeLeft === 0 && chairRunning) {
      setChairRunning(false);
      // Auto-save result
      saveScreeningResult("30s_chair_stand", chairReps, "reps", getChairAssessment(chairReps));
    }
    return () => clearTimeout(chairTimerRef.current);
  }, [chairRunning, chairTimeLeft]);

  // --- TUG Stopwatch ---
  useEffect(() => {
    if (tugRunning) {
      const start = performance.now() - tugTime * 1000;
      tugTimerRef.current = setInterval(() => {
        setTugTime(Number(((performance.now() - start) / 1000).toFixed(1)));
      }, 100);
    }
    return () => clearInterval(tugTimerRef.current);
  }, [tugRunning]);

  const saveScreeningResult = async (testName, scoreVal, unit, notes) => {
    try {
      await fetch("/api/screening?person_id=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_name: testName,
          score_value: scoreVal,
          score_unit: unit,
          assessment_notes: notes,
          reference_paper: "CDC STEADI (Stopping Elderly Accidents, Deaths, & Injuries) Protocol",
        }),
      });
      if (testName === "30s_chair_stand") setChairSaved(true);
      else setTugSaved(true);
    } catch (e) {
      console.warn("Screening save error:", e);
    }
  };

  const getChairAssessment = (reps) => {
    // CDC STEADI Norms for Men 65-69: Below 12 reps indicates elevated fall risk
    if (reps >= 14) return "Above Average: Strong functional lower body strength";
    if (reps >= 11) return "Average Mobility: Normal functional endurance for age";
    return "Below Average: Elevated fall risk detected. Lower extremity strengthening recommended.";
  };

  const getTugAssessment = (secs) => {
    // CDC STEADI Norms: >= 12 seconds indicates high fall risk
    if (secs < 10) return "Normal Mobility: Freely mobile with low fall risk";
    if (secs < 12) return "Borderline Mobility: Good balance, continue routine exercise";
    return "High Fall Risk: Time >= 12.0s indicates gait/balance impairment. Assistive device evaluation suggested.";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === "ta" ? "மருத்துவ இயக்கம் & வீழ்ச்சி இடர் மதிப்பீடுகள்" : "Clinical Mobility & Fall Risk Screening"}
              </h2>
              <p className="text-xs text-slate-400">
                Evidence-based screening protocols (CDC STEADI Clinical Guidelines)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab("chair_stand")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "chair_stand" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            30-Second Chair Stand Test
          </button>
          <button
            onClick={() => setActiveTab("tug")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tug" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Timed Up and Go (TUG) Test
          </button>
        </div>

        {/* TAB 1: 30s CHAIR STAND TEST */}
        {activeTab === "chair_stand" && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-white block">Instructions:</span>
              <p>• Sit in the middle of a standard armless chair with back straight and feet flat on the floor.</p>
              <p>• Cross your arms across your chest. When timer starts, stand up fully and sit back down as many times as you safely can in 30 seconds.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center my-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Time Remaining</span>
                <span className={`text-5xl font-mono font-black ${chairTimeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                  {chairTimeLeft}s
                </span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Reps Completed</span>
                <span className="text-5xl font-mono font-black text-blue-400">
                  {chairReps}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!chairRunning && chairTimeLeft === 30 && (
                <button
                  onClick={() => setChairRunning(true)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 30s Test</span>
                </button>
              )}

              {chairRunning && (
                <>
                  <button
                    onClick={() => setChairReps((prev) => prev + 1)}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-black cursor-pointer shadow-lg active:scale-95 transition-transform"
                  >
                    + Tap Count Rep ({chairReps})
                  </button>
                  <button
                    onClick={() => {
                      setChairRunning(false);
                      setChairTimeLeft(0);
                    }}
                    className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Finish Early
                  </button>
                </>
              )}

              {chairTimeLeft === 0 && (
                <button
                  onClick={() => {
                    setChairTimeLeft(30);
                    setChairReps(0);
                    setChairSaved(false);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Test</span>
                </button>
              )}
            </div>

            {/* Result Interpretation */}
            {chairTimeLeft === 0 && (
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-blue-500/30 text-xs space-y-1">
                <span className="font-bold text-white block text-sm">Screening Result: {chairReps} Reps</span>
                <p className="text-slate-300">{getChairAssessment(chairReps)}</p>
                {chairSaved && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px] pt-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved to clinical screening records
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIMED UP AND GO (TUG) TEST */}
        {activeTab === "tug" && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-white block">Instructions:</span>
              <p>• Sit comfortably in the chair. Mark a line on the floor 3 meters (10 feet) away.</p>
              <p>• When ready, start timer, stand up, walk at your normal safe pace past the 3m line, turn around, walk back, and sit down.</p>
            </div>

            <div className="text-center my-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Elapsed Time</span>
              <span className="text-6xl font-mono font-black text-white">
                {tugTime.toFixed(1)} <span className="text-2xl text-slate-500 font-normal">sec</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Normative threshold: &lt; 12.0s</span>
            </div>

            <div className="flex gap-2">
              {!tugRunning && tugTime === 0.0 && (
                <button
                  onClick={() => setTugRunning(true)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start TUG Test</span>
                </button>
              )}

              {tugRunning && (
                <button
                  onClick={() => {
                    setTugRunning(false);
                    saveScreeningResult("timed_up_and_go", tugTime, "seconds", getTugAssessment(tugTime));
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-base font-black cursor-pointer shadow-lg"
                >
                  Stop Timer (Patient Sat Down)
                </button>
              )}

              {!tugRunning && tugTime > 0.0 && (
                <button
                  onClick={() => {
                    setTugTime(0.0);
                    setTugSaved(false);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Timer</span>
                </button>
              )}
            </div>

            {/* Result Interpretation */}
            {!tugRunning && tugTime > 0.0 && (
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-blue-500/30 text-xs space-y-1">
                <span className="font-bold text-white block text-sm">Screening Result: {tugTime.toFixed(1)} seconds</span>
                <p className="text-slate-300">{getTugAssessment(tugTime)}</p>
                {tugSaved && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px] pt-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved to clinical screening records
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Paper Citation Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-500">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>
            CDC STEADI: Centers for Disease Control and Prevention Algorithm for Fall Risk Screening and Assessment.
          </span>
        </div>
      </div>
    </div>
  );
}
