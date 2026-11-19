import React, { useState } from "react";
import {
  HeartPulse,
  Radio,
  Volume2,
  Cpu,
  Usb,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Terminal,
  Layers
} from "lucide-react";
import SentinelLcdDisplay from "../components/SentinelLcdDisplay";

export default function SentinelNodeView({
  latestReading,
  onOpenHardware,
  lang = "en"
}) {
  const [buzzerMsg, setBuzzerMsg] = useState("");

  const triggerBuzzer = async (pattern) => {
    try {
      setBuzzerMsg(`Triggering buzzer pattern ${pattern}...`);
      const res = await fetch(`/api/hardware/buzz?pattern=${pattern}`, { method: "POST" });
      if (res.ok) {
        setBuzzerMsg(`Buzzer Pattern ${pattern} dispatched to hardware successfully!`);
      }
    } catch (err) {
      setBuzzerMsg(`Error sending buzzer command: ${err.message}`);
    }
  };

  const wiring = [
    { pin: "A1", desc: "DHT22 Data (Temperature & Humidity)" },
    { pin: "A2", desc: "IR Motion Module (Active LOW)" },
    { pin: "A3", desc: "SW-420 Vibration & Impact Sensor" },
    { pin: "A4", desc: "Safety Piezo Buzzer (Transistor base / 1k)" },
    { pin: "8,9,4,5,6,7", desc: "16x2 LCD Display (RS, EN, D4-D7)" },
    { pin: "USB COM3", desc: "Serial Gateway (9600 Baud, 8-N-1)" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "சென்டினல் ஹார்டுவேர் முனை மையம்" : "Sentinel Embedded Hardware Station"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "Arduino Uno / Nano சாதனத்தின் 16x2 LCD மற்றும் நேரலை சென்சார் கன்சோல்" : "Autonomous edge node emulator with 16x2 LCD, 9600 Baud serial bus & safety buzzer"}
          </p>
        </div>

        <button
          onClick={onOpenHardware}
          className="px-4 py-2 bg-[#84cc16] hover:bg-[#9ee838] text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#84cc16]/20"
        >
          <Usb className="w-4 h-4" />
          <span>Manage USB COM Port</span>
        </button>
      </div>

      {/* Top Section: 16x2 LCD Emulator & Real-Time Status */}
      <SentinelLcdDisplay latestReading={latestReading} lang={lang} />

      {/* Middle Section: Buzzer Actuator Test Controller */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#84cc16]" />
            <span>Hardware Buzzer Actuation Bus</span>
          </h3>
          <span className="text-[11px] text-[#9ca3af]">Test physical buzzer sound patterns</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => triggerBuzzer(1)}
            className="p-3 bg-[#18201a] hover:bg-[#84cc16] hover:text-black text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 1</span>
            <span className="text-[10px] opacity-70">Start Beep (150ms)</span>
          </button>

          <button
            onClick={() => triggerBuzzer(2)}
            className="p-3 bg-[#18201a] hover:bg-blue-600 hover:text-white text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 2</span>
            <span className="text-[10px] opacity-70">Inactivity Prompt</span>
          </button>

          <button
            onClick={() => triggerBuzzer(3)}
            className="p-3 bg-[#18201a] hover:bg-amber-600 hover:text-white text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 3</span>
            <span className="text-[10px] opacity-70">Warning (3 Beeps)</span>
          </button>

          <button
            onClick={() => triggerBuzzer(4)}
            className="p-3 bg-[#18201a] hover:bg-rose-600 hover:text-white text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 4</span>
            <span className="text-[10px] opacity-70">Fall Alarm Siren</span>
          </button>

          <button
            onClick={() => triggerBuzzer(5)}
            className="p-3 bg-[#18201a] hover:bg-purple-600 hover:text-white text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 5</span>
            <span className="text-[10px] opacity-70">Safe Pause Gate</span>
          </button>
        </div>

        {buzzerMsg && (
          <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#84cc16]/30 text-[#a3e635] text-xs font-mono animate-fade-in">
            {buzzerMsg}
          </div>
        )}
      </div>

      {/* Bottom Section: Pinout Specification Table */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#84cc16]" />
          <span>Physical Pin Wiring Reference (sentinel_lcdac.ino)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {wiring.map((w, idx) => (
            <div key={idx} className="bg-[#0e1410] border border-[#1e2721] p-3 rounded-xl flex items-center justify-between">
              <span className="font-mono font-bold text-[#84cc16] text-xs">{w.pin}</span>
              <span className="text-xs text-[#9ca3af]">{w.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
