import React, { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Terminal,
  Play,
  Pause,
  RotateCw,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Sliders,
  Sparkles,
  Layers
} from "lucide-react";

/**
 * Sentinel 16x2 LCD Display Emulator
 * Recreates the physical 1602 HD44780 LCD Shield (pins 8, 9, 4, 5, 6, 7)
 * Cycling every 3 seconds between 3 pages:
 *   - Page 0: Vitals (Temp & Humidity, Heart Rate)
 *   - Page 1: Activity (PIR Motion, Idle Seconds, Vibration Count)
 *   - Page 2: Sentinel FSM State (Normal, High Temp, Inactive, Fall Alarm)
 * Also includes a live 1-Hz Serial Monitor Console (115200 Baud).
 */
export default function SentinelLcdDisplay({ latestReading, lang = "en" }) {
  // LCD Display States
  const [activePage, setActivePage] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [backlightTheme, setBacklightTheme] = useState("blue"); // 'blue' | 'green' | 'amber'
  const [cycleProgress, setCycleProgress] = useState(0); // 0 to 100%

  // Serial Console States
  const [showConsole, setShowConsole] = useState(false);
  const [consolePaused, setConsolePaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [packetHistory, setPacketHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [rxBlink, setRxBlink] = useState(false);

  const consoleEndRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Pad or trim text strictly to 16 characters for authentic 16x2 display
  const pad16 = (text) => {
    const s = String(text || "");
    if (s.length >= 16) return s.slice(0, 16);
    return s + " ".repeat(16 - s.length);
  };

  // Safe vital extractions
  const tempVal = typeof latestReading?.temp === "number"
    ? latestReading.temp.toFixed(1)
    : (Number(latestReading?.temp) || 36.6).toFixed(1);
  const humidityVal = typeof latestReading?.humidity === "number"
    ? latestReading.humidity.toFixed(1)
    : (Number(latestReading?.humidity) || 52.0).toFixed(1);
  const hrVal = latestReading?.hr_ok ? latestReading?.hr : "--";
  const motionVal = latestReading?.motion === 1 ? "YES" : "NO";
  const idleSec = latestReading?.idle_s || 0;
  const vibVal = latestReading?.vib || 0;
  const impactVal = latestReading?.impact || 0;
  const fsmState = latestReading?.system_state || "S_NORMAL";

  // Build 16x2 text lines for each page
  const pages = [
    {
      id: 0,
      title: "Vitals (T / H / HR)",
      titleTa: "உடல்நிலைகள் (T / H / HR)",
      line0: pad16(`T:${tempVal}C H:${Math.round(Number(humidityVal))}%`),
      line1: pad16(latestReading?.hr_ok ? `HR:${hrVal}BPM (OK)` : "HR:NOT CONNECTED")
    },
    {
      id: 1,
      title: "Motion & Stillness",
      titleTa: "இயக்கம் & அமைதி",
      line0: pad16(`Motion: ${motionVal}`),
      line1: pad16(`Idle:${idleSec}s  Vib:${vibVal}`)
    },
    {
      id: 2,
      title: "Sentinel State",
      titleTa: "சென்டினல் நிலை",
      line0: pad16(
        fsmState === "S_FALL_ALARM"
          ? "FALL: ALARM!!"
          : fsmState === "S_FALL_CHECK"
          ? "FALL: COUNTDOWN"
          : `STATE:${fsmState}`
      ),
      line1: pad16(`Impact:${impactVal} Buzz:${fsmState.includes("ALARM") || fsmState.includes("CHECK") ? "1" : "0"}`)
    }
  ];

  // Raw serial formatted string
  const currentSerialLine = latestReading?.raw_serial_line ||
    `T=${tempVal},H=${humidityVal},HR=${latestReading?.hr || 72},HR_OK=${latestReading?.hr_ok ? 1 : 0},MOT=${latestReading?.motion || 0},IDLE=${idleSec},VIB=${vibVal},IMP=${impactVal},STATE=${fsmState}`;

  // Log serial line to history
  useEffect(() => {
    if (!consolePaused && currentSerialLine) {
      setRxBlink(true);
      const timer = setTimeout(() => setRxBlink(false), 200);

      setPacketHistory((prev) => {
        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
        const entry = { time: timeStr, text: currentSerialLine };
        return [...prev.slice(-39), entry];
      });

      return () => clearTimeout(timer);
    }
  }, [currentSerialLine, consolePaused]);

  // Auto-scroll console
  useEffect(() => {
    if (autoScroll && showConsole && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [packetHistory, autoScroll, showConsole]);

  // 3-second Auto-rotation loop
  useEffect(() => {
    if (!autoRotate) {
      setCycleProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalMs = 50; // smooth 20fps progress update
    const totalDurationMs = 3000;
    let elapsed = 0;

    progressTimerRef.current = setInterval(() => {
      elapsed += intervalMs;
      const progress = (elapsed / totalDurationMs) * 100;
      setCycleProgress(progress);

      if (elapsed >= totalDurationMs) {
        elapsed = 0;
        setActivePage((prev) => (prev + 1) % 3);
      }
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [autoRotate]);

  const handleCopyPacket = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentSerialLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  // Backlight Theme Styling
  const themeStyles = {
    blue: {
      screenBg: "bg-[#002844]",
      screenBorder: "border-[#004f85]",
      textColor: "text-[#38bdf8]",
      textGlow: "drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]",
      cellInactive: "text-[#003961]",
      lcdLabel: "HD44780 1602A (Blue Backlight)",
    },
    green: {
      screenBg: "bg-[#8aa700]",
      screenBorder: "border-[#667c00]",
      textColor: "text-[#142300]",
      textGlow: "drop-shadow-[0_1px_1px_rgba(255,255,255,0.25)]",
      cellInactive: "text-[#758e00]",
      lcdLabel: "HD44780 1602A (Classic Yellow-Green)",
    },
    amber: {
      screenBg: "bg-[#2b1700]",
      screenBorder: "border-[#663800]",
      textColor: "text-[#fbbf24]",
      textGlow: "drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]",
      cellInactive: "text-[#472600]",
      lcdLabel: "HD44780 1602A (Amber CRT)",
    }
  };

  const currentTheme = themeStyles[backlightTheme] || themeStyles.blue;
  const activeLine0 = pages[activePage].line0;
  const activeLine1 = pages[activePage].line1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header with Title and Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {lang === "ta" ? "சென்டினல் 16x2 LCD காட்சி சாதனம்" : "Sentinel 16x2 LCD Display Emulator"}
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                1602A HD44780
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "3 வினாடி சுழற்சி: உடல்நிலை • இயக்கம் • விழுதல் கண்டறிதல் நிலை"
                : "Automatic 3-second rotation matching Arduino hardware sketch"}
            </p>
          </div>
        </div>

        {/* Backlight Selector & Auto-Rotate Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoRotate
                ? "bg-blue-600/30 border border-blue-500/40 text-blue-300"
                : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
            title="Auto-rotate page every 3 seconds"
          >
            {autoRotate ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                <span>Auto (3s)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* Theme switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setBacklightTheme("blue")}
              className={`w-5 h-5 rounded-md cursor-pointer transition-transform ${
                backlightTheme === "blue" ? "ring-2 ring-blue-400 scale-110" : "opacity-60 hover:opacity-100"
              } bg-blue-600`}
              title="HD44780 Blue Backlight"
            />
            <button
              onClick={() => setBacklightTheme("green")}
              className={`w-5 h-5 rounded-md ml-1.5 cursor-pointer transition-transform ${
                backlightTheme === "green" ? "ring-2 ring-lime-400 scale-110" : "opacity-60 hover:opacity-100"
              } bg-lime-500`}
              title="HD44780 Yellow-Green Backlight"
            />
            <button
              onClick={() => setBacklightTheme("amber")}
              className={`w-5 h-5 rounded-md ml-1.5 cursor-pointer transition-transform ${
                backlightTheme === "amber" ? "ring-2 ring-amber-400 scale-110" : "opacity-60 hover:opacity-100"
              } bg-amber-500`}
              title="HD44780 Amber Backlight"
            />
          </div>
        </div>
      </div>

      {/* 16x2 PHYSICAL LCD CHASSIS */}
      <div className="relative bg-zinc-950 border-4 border-zinc-800 rounded-xl p-4 sm:p-5 shadow-2xl">
        {/* Corner Screws / PCB Mounting Holes */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-900 rotate-45" />
        </div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-900 -rotate-45" />
        </div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-900 -rotate-45" />
        </div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-900 rotate-45" />
        </div>

        {/* Chassis PCB Silkscreen Labels */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-2 px-1 uppercase tracking-wider select-none">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold">REBUILD SENTINEL-NODE</span>
            <span>LCD1602 // PINS: 8,9,4,5,6,7</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
              PWR: 5V
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${rxBlink ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-zinc-700"} transition-colors`} />
              RX: 1Hz
            </span>
          </div>
        </div>

        {/* THE 16x2 CHARACTER GLASS DISPLAY */}
        <div className={`relative border-2 rounded-lg p-3 sm:p-4 shadow-inner overflow-hidden transition-colors duration-300 ${currentTheme.screenBg} ${currentTheme.screenBorder}`}>
          {/* Subtle Glass Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* 16x2 Grid Character Lines */}
          <div className="font-mono text-sm sm:text-lg md:text-xl font-bold tracking-[0.2em] select-none space-y-1 sm:space-y-2">
            {/* Row 0 */}
            <div className={`flex items-center justify-between ${currentTheme.textColor} ${currentTheme.textGlow}`}>
              {activeLine0.split("").map((ch, idx) => (
                <span
                  key={`r0-${idx}`}
                  className="w-[1ch] text-center inline-block transform hover:scale-105"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </div>

            {/* Row 1 */}
            <div className={`flex items-center justify-between ${currentTheme.textColor} ${currentTheme.textGlow}`}>
              {activeLine1.split("").map((ch, idx) => (
                <span
                  key={`r1-${idx}`}
                  className="w-[1ch] text-center inline-block transform hover:scale-105"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Second Cycle Progress Bar */}
        {autoRotate && (
          <div className="w-full bg-zinc-800 h-1 mt-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-75 ease-linear"
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Manual Page Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePage(p.id);
                setAutoRotate(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activePage === p.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
            >
              <span>{lang === "ta" ? p.titleTa : p.title}</span>
              {activePage === p.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          ))}
        </div>

        {/* Toggle Serial Monitor Drawer */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showConsole ? (lang === "ta" ? "சீரியல் கன்சோலை மறை" : "Hide Serial Stream") : (lang === "ta" ? "சீரியல் கன்சோலை காட்டு" : "View Serial Stream")}</span>
          {showConsole ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* COLLAPSIBLE SERIAL STREAM MONITOR CONSOLE */}
      {showConsole && (
        <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3 animate-fade-in shadow-2xl">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${rxBlink ? "bg-emerald-400 animate-ping" : "bg-emerald-600"}`} />
              <span className="text-emerald-400 font-bold tracking-wide">
                SENTINEL TELEMETRY BUS (115200 BAUD, 8-N-1)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => setConsolePaused(!consolePaused)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  consolePaused ? "bg-amber-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {consolePaused ? "Resume" : "Pause"}
              </button>

              <button
                onClick={() => setPacketHistory([])}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center gap-1 cursor-pointer"
                title="Clear console buffer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleCopyPacket}
                className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                title="Copy latest packet line"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Current Packet Live Inspection */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">LATEST: </span>
              <span className="text-slate-200">{currentSerialLine}</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">
              {fsmState}
            </span>
          </div>

          {/* Scrolling Packet Stream Log */}
          <div className="h-44 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-800">
            {packetHistory.length === 0 ? (
              <div className="text-slate-600 text-center py-8">
                Listening for 1-Hz Sentinel telemetry packets...
              </div>
            ) : (
              packetHistory.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 hover:bg-slate-900/60 px-1 py-0.5 rounded transition-colors">
                  <span className="text-slate-500 select-none shrink-0">[{item.time}]</span>
                  <span className="text-emerald-400 font-semibold shrink-0">RX &gt;</span>
                  <span className="text-slate-300 break-all">{item.text}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
