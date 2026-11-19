import React, { useState, useEffect, useRef } from "react";
import { Sliders, Play, Square, Activity, AlertOctagon, Flame, Thermometer, UserCheck, Radio, Clock, ChevronDown, ChevronUp, HeartOff } from "lucide-react";

export default function LiveSimulatorBar({ lang = "en" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const timerRef = useRef(null);

  const scenarios = [
    { id: "normal", label: "Normal Vitals", icon: Activity, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", desc: "Stable resting HR 72, Temp 36.6°C, normal movement." },
    { id: "hr_disconnected", label: "HR Sensor Off", icon: HeartOff, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", desc: "Pulse sensor unplugged (hr_ok=0): displays 'Heartbeat Not Connected' across all views." },
    { id: "drift", label: "Cardiac Drift", icon: Sliders, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", desc: "Resting HR slowly elevates +18% while patient remains still." },
    { id: "fever", label: "Fever (38.5°C)", icon: Thermometer, color: "text-red-400 border-red-500/30 bg-red-500/10", desc: "Core temperature climbs to 38.5°C (mild hyperthermia)." },
    { id: "heat_stress", label: "Heat Stress", icon: Flame, color: "text-orange-400 border-orange-500/30 bg-orange-500/10", desc: "Outdoor worker: High HR + elevated temp in active motion." },
    { id: "fall", label: "Simulate Fall", icon: AlertOctagon, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", desc: "Sudden impact burst (vib=55) followed by stillness (30s countdown)." },
    { id: "inactivity", label: "Inactivity (30s)", icon: Clock, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", desc: "PIR motion=0 for >30s demo threshold (prompts movement buzzer 2)." },
    { id: "low_signal", label: "Arm Artifact", icon: Radio, color: "text-purple-400 border-purple-500/30 bg-purple-500/10", desc: "Arm=1 wrist movement: verifies artifact suppression (no false alerts)." },
    { id: "vitals_spike", label: "HR Spike (135)", icon: AlertOctagon, color: "text-red-400 border-red-500/30 bg-red-500/10", desc: "Exercise HR exceeds 125 limit to trigger MoveSafe Safe Pause." },
  ];

  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setActiveScenario(null);
    setStepCount(0);
  };

  const startScenario = (scenId) => {
    stopSimulation();
    setActiveScenario(scenId);
    let step = 0;

    timerRef.current = setInterval(async () => {
      step++;
      setStepCount(step);

      let hr = 72;
      let hr_ok = true;
      let temp = 36.6;
      let humidity = 52.0;
      let motion = step % 8 === 0 ? 1 : 0;
      let idle_s = motion === 1 ? 0 : step;
      let vib = 2;
      let impact = 0;
      let arm = 0;

      if (scenId === "normal") {
        hr = 72 + (step % 3) - 1;
        humidity = 52.0 + (step % 3) * 0.5;
      } else if (scenId === "hr_disconnected") {
        hr = 0;
        hr_ok = false;
        humidity = 52.0;
        motion = 0;
      } else if (scenId === "drift") {
        motion = 0;
        idle_s = step;
        hr = Math.min(94, 72 + Math.floor(step * 1.5));
        humidity = 54.0;
      } else if (scenId === "fever") {
        temp = Math.min(38.8, +(36.6 + step * 0.15).toFixed(1));
        hr = 72 + Math.floor((temp - 36.6) * 10);
        humidity = 64.0;
      } else if (scenId === "heat_stress") {
        temp = Math.min(38.3, +(37.2 + step * 0.1).toFixed(1));
        hr = Math.min(118, 98 + step);
        motion = 1;
        vib = 15;
        humidity = Math.min(85.0, +(72.0 + step * 1.2).toFixed(1));
      } else if (scenId === "fall") {
        humidity = 50.0;
        if (step === 2) {
          vib = 55;
          impact = 1;
          motion = 0;
          idle_s = 0;
        } else if (step > 2) {
          vib = 0;
          impact = 0;
          motion = 0;
          idle_s = step - 2;
        }
      } else if (scenId === "inactivity") {
        motion = 0;
        idle_s = step + 25; // Accelerate to exceed 30s threshold quickly
        humidity = 48.0;
      } else if (scenId === "low_signal") {
        arm = 1;
        vib = 22;
        hr = 115; // Spike with arm movement; must be discarded as low_signal
        humidity = 52.5;
      } else if (scenId === "vitals_spike") {
        hr = Math.min(140, 95 + step * 5);
        motion = 1;
        humidity = 58.0;
      }

      const readingPayload = {
        t: Date.now(),
        hr,
        hr_ok,
        temp,
        humidity,
        motion,
        idle_s,
        vib,
        impact,
        arm,
        fw: "1.0",
      };

      try {
        await fetch("/api/readings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(readingPayload),
        });
      } catch (err) {
        console.warn("Simulator post failed:", err);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeScenario ? "bg-amber-400 animate-ping" : "bg-slate-600"}`} />
          <span className="font-semibold text-slate-300">
            {lang === "ta" ? "ஹார்டுவேர் சிமுலேட்டர் டூல்" : "Hardware & Telemetry Simulator"}
          </span>
          {activeScenario && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
              Active: {activeScenario.toUpperCase()} (Step {stepCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <button
              onClick={stopSimulation}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer"
          >
            <span>{isOpen ? "Hide Controls" : "Show Simulator Scenarios"}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Buttons Bar */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 pb-3 pt-1 border-t border-slate-800/60 animate-fade-in">
          <p className="text-[11px] text-slate-400 mb-2">
            Click any scenario to inject 1-Hz telemetry directly into Sentinel & MoveSafe (no Arduino hardware needed):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {scenarios.map((scen) => {
              const Icon = scen.icon;
              const isCurrent = activeScenario === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => startScenario(scen.id)}
                  title={scen.desc}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 ${
                    isCurrent
                      ? "ring-2 ring-blue-500 bg-blue-600/30 border-blue-500 text-white"
                      : `${scen.color} hover:brightness-125`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-3.5 h-3.5" />
                    {isCurrent && <Play className="w-2.5 h-2.5 fill-current text-white animate-pulse" />}
                  </div>
                  <span className="font-bold text-[11px] leading-tight block">{scen.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
