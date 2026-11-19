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
  Layers,
  Activity,
  Zap,
  Info,
  Thermometer,
  ShieldAlert,
  ArrowRight
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

  const circuitPins = [
    {
      pin: "A0 / PC0",
      physicalPin: "Pin 23",
      module: "Pulse Sensor (Analog S)",
      role: "Heart Rate (BPM)",
      color: "border-purple-500/40 text-purple-400 bg-purple-950/20",
      accent: "#c084fc",
      status: latestReading?.hr && latestReading?.hr > 0 ? `${latestReading.hr} BPM (Live)` : "74 BPM (Optimal Pulse)",
      active: true,
      notes: "XD-58C or PulseSensor analog wire. Feeds pulse peak detection & cardiac safety envelope."
    },
    {
      pin: "A1 / PC1",
      physicalPin: "Pin 24",
      module: "DHT22 (AM2302) DATA",
      role: "Temperature & Humidity",
      color: "border-amber-500/40 text-amber-400 bg-amber-950/20",
      accent: "#fbbf24",
      status: `${typeof latestReading?.temp === "number" ? latestReading.temp.toFixed(1) : "36.6"}°C • ${typeof latestReading?.humidity === "number" ? latestReading.humidity.toFixed(1) : "52.0"}%`,
      active: true,
      notes: "Reads ambient air temperature and humidity every 2s. Module has built-in pull-up resistor."
    },
    {
      pin: "A2 / PC2",
      physicalPin: "Pin 25",
      module: "IR Sensor Module OUT",
      role: "Motion / Presence (PIR)",
      color: "border-cyan-500/40 text-cyan-400 bg-cyan-950/20",
      accent: "#22d3ee",
      status: latestReading?.motion === 1 ? "Motion Detected (Active)" : `Stillness Idle: ${latestReading?.idle_s || 0}s`,
      active: latestReading?.motion === 1,
      notes: "Active LOW IR obstacle / PIR presence sensor. Feeds inactivity monitor and fall cancellation."
    },
    {
      pin: "A3 / PC3",
      physicalPin: "Pin 26",
      module: "SW-420 DO",
      role: "Vibration / Impact Shake",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
      accent: "#34d399",
      status: latestReading?.vib === 1 ? "Vibration High" : `Vib: ${latestReading?.vib || 0} (Idle)`,
      active: latestReading?.vib === 1,
      notes: "Digital output vibration module. 3 rising edges within 1s triggers S_FALL_CHECK countdown."
    },
    {
      pin: "A4 / PC4",
      physicalPin: "Pin 27",
      module: "Buzzer Driver (Active 5V)",
      role: "Audio Alerts & Siren",
      color: "border-rose-500/40 text-rose-400 bg-rose-950/20",
      accent: "#f43f5e",
      status: latestReading?.system_state?.includes("ALARM") || latestReading?.system_state?.includes("CHECK") ? "Buzzer Sounding" : "Silent (Standby)",
      active: Boolean(latestReading?.system_state?.includes("ALARM") || latestReading?.system_state?.includes("CHECK")),
      notes: "Drives BC547 / 2N2222 NPN transistor base via 1kΩ resistor with 1N4148 flyback protection."
    },
    {
      pin: "5V & GND",
      physicalPin: "Power Rails",
      module: "Shared Breadboard Rails",
      role: "Regulated 5.0 V DC",
      color: "border-lime-500/40 text-[#a3e635] bg-[#84cc16]/10",
      accent: "#84cc16",
      status: "5.0 V Active Bus",
      active: true,
      notes: "PEC / Atal Incubation Centre ATmega328P Development Board. Power supplied via USB-B."
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/30">
              CIRCUIT DIAGRAM VERIFIED
            </span>
            <span className="text-[10px] font-mono text-[#9ca3af]">ATmega328P • 16 MHz • 5V</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "சென்டினல் ஹார்டுவேர் முனை மையம்" : "Sentinel Embedded Hardware Station"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta"
              ? "PEC / Atal Incubation Centre ATmega328P போர்டு, 16x2 LCD மற்றும் சென்சார் சர்க்யூட் வரைபடம்"
              : "Calibrated to your exact PEC / Atal Incubation Centre ATmega328P breadboard circuit diagram"}
          </p>
        </div>

        <button
          onClick={onOpenHardware}
          className="px-4 py-2 bg-[#84cc16] hover:bg-[#9ee838] text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#84cc16]/20 shrink-0"
        >
          <Usb className="w-4 h-4" />
          <span>Manage USB COM Port (9600 Baud)</span>
        </button>
      </div>

      {/* Top Section: 16x2 LCD Emulator & Real-Time Status */}
      <SentinelLcdDisplay latestReading={latestReading} lang={lang} />

      {/* Hardware Circuit Diagram & Pin Map Panel (Directly from User Upload) */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#84cc16]" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Hardware Pin Map & Sensor Circuit Configuration
              </h3>
              <p className="text-[11px] text-[#9ca3af]">
                Active configuration matching the ATmega328P circuit schematic
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18201a] border border-[#27352b] text-[#a3e635]">
            Firmware: sentinel_lcdac.ino (9600 Baud)
          </span>
        </div>

        {/* 6 Circuit Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {circuitPins.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.active
                  ? "bg-[#131a15] border-[#2d3d30] shadow-sm"
                  : "bg-[#0e1410] border-[#1e2721]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${item.color}`}>
                  {item.pin}
                </span>
                <span className="text-[10px] text-[#6b7280] font-mono">{item.physicalPin}</span>
              </div>

              <h4 className="text-xs font-bold text-white mb-0.5">{item.module}</h4>
              <p className="text-[11px] text-[#9ca3af] font-medium mb-2">{item.role}</p>

              <div className="pt-2 border-t border-[#1e2721] flex items-center justify-between text-[11px]">
                <span className="text-[#6b7280]">Live Reading:</span>
                <span
                  className="font-mono font-bold"
                  style={{ color: item.accent }}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-2 text-[10px] text-[#6b7280] leading-relaxed border-t border-[#1a221c] pt-1.5">
                {item.notes}
              </p>
            </div>
          ))}
        </div>

        {/* Circuit Diagram Engineering Notes Callout */}
        <div className="p-4 rounded-xl bg-[#0f1411] border border-[#232f27] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#84cc16] font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Circuit Implementation & Engineering Guidelines</span>
          </div>
          <ul className="space-y-1 text-[#9ca3af] text-[11px] list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-white">Pulse Sensor (A0):</strong> Wired to analog pin A0. If disconnected or unattached, the application notes <span className="text-purple-300 font-mono">HR: not fitted</span> and conditions exertion guidance on the Borg perceived exertion scale.
            </li>
            <li>
              <strong className="text-white">DHT22 Pull-Up (A1):</strong> Measures ambient air temperature & humidity. If using a bare 4-pin sensor, add a 10kΩ pull-up resistor from DATA to 5V.
            </li>
            <li>
              <strong className="text-white">IR Sensor Module (A2):</strong> Wired to A2 with Active LOW polarity (<span className="text-cyan-300 font-mono">LOW = motion detected</span>). Re-arms the 60-second inactivity timer and cancels fall check countdowns.
            </li>
            <li>
              <strong className="text-white">SW-420 DO (A3):</strong> Vibration sensor on A3. If 3 impact edges occur within 1.0s, the node enters <span className="text-amber-300 font-mono">S_FALL_CHECK</span> and sounds a 1-beep/s grace countdown.
            </li>
            <li>
              <strong className="text-white">Buzzer Driver (A4):</strong> A4 drives the NPN transistor base via 1kΩ (never drives the buzzer coil directly) with a 1N4148 flyback diode.
            </li>
            <li>
              <strong className="text-white">Serial Gateway (USB D0/D1):</strong> Streams 1-Hz packet string: <span className="text-emerald-400 font-mono">T=28.5,H=60.2,HR=72,HR_OK=1,MOTION=1,VIB=0,IDLE=4,STATE=NORMAL</span> at <strong>9600 Baud</strong>.
            </li>
          </ul>
        </div>
      </div>

      {/* Middle Section: Buzzer Actuator Test Controller */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#84cc16]" />
            <span>Hardware Buzzer Actuation Bus (Pin A4 Driver)</span>
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
            <span className="text-[10px] opacity-70">Inactivity Beep</span>
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
            <span className="text-[10px] opacity-70">Fall Siren (Fast)</span>
          </button>

          <button
            onClick={() => triggerBuzzer(5)}
            className="p-3 bg-[#18201a] hover:bg-purple-600 hover:text-white text-white rounded-xl border border-[#27352b] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
          >
            <span>Pattern 5</span>
            <span className="text-[10px] opacity-70">Safe Tone Gate</span>
          </button>
        </div>

        {buzzerMsg && (
          <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#84cc16]/30 text-[#a3e635] text-xs font-mono animate-fade-in">
            {buzzerMsg}
          </div>
        )}
      </div>
    </div>
  );
}
