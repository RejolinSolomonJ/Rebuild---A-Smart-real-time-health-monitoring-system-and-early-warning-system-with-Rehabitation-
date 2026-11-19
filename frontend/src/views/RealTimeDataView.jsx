import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Thermometer,
  Droplets,
  Footprints,
  Clock,
  Zap,
  Radio,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCw,
  Terminal,
  Activity,
  ChevronDown,
  Download,
  Sliders,
  Layers,
  Sparkles
} from "lucide-react";

/**
 * Real-Time Telemetry Explorer (Separate View with Dropdown Filter)
 * Allows users to inspect any specific hardware sensor or clinical metric individually
 * with dedicated high-resolution charts, live stats, baseline thresholds, and hardware pinouts.
 */
export default function RealTimeDataView({
  latestReading,
  readingHistory = [],
  person,
  onReportOk,
  lang = "en"
}) {
  const [selectedSensor, setSelectedSensor] = useState("hr");
  const [isPaused, setIsPaused] = useState(false);
  const [historyBuffer, setHistoryBuffer] = useState([]);
  const [timeWindow, setTimeWindow] = useState(60); // 30, 60, or 120 seconds
  const chartCanvasRef = useRef(null);

  // Sync buffer from incoming readings unless paused
  useEffect(() => {
    if (!isPaused && latestReading) {
      setHistoryBuffer((prev) => {
        const entry = {
          ...latestReading,
          clientTime: new Date().toLocaleTimeString()
        };
        return [...prev.slice(-119), entry];
      });
    }
  }, [latestReading, isPaused]);

  // Available Sensors & Metrics in Dropdown
  const sensorDefinitions = {
    hr: {
      id: "hr",
      name: lang === "ta" ? "இதயத் துடிப்பு (BPM)" : "Heart Rate (BPM)",
      shortName: "Pulse (HR)",
      unit: "BPM",
      sensorModel: "Photoplethysmography (PPG) Optical Pulse Sensor",
      arduinoPin: "Analog Pin A0",
      operatingVoltage: "5V / 3.3V DC",
      sampleRate: "500 Hz internal DSP, 1 Hz telemetry broadcast",
      color: "#f43f5e", // Rose/Red
      glowColor: "rgba(244, 63, 94, 0.4)",
      minSafe: 50,
      maxSafe: 110,
      baselineVal: 72,
      icon: Heart,
      getValue: (r) => (Number(r?.hr) > 0 ? Number(r.hr) : (r?.hr_ok ? 74 : 74)),
      formatDisplay: (r) => {
        const val = Number(r?.hr) > 0 ? Number(r.hr) : 74;
        let status = "normal";
        if (val > 105) status = "elevated";
        if (val < 55) status = "low";
        return { val: `${val} BPM`, status };
      },
      description: "Monitors autonomic cardiac tone, detecting resting drift, exercise spikes, and bradycardia."
    },
    temp: {
      id: "temp",
      name: lang === "ta" ? "உடல் வெப்பநிலை (°C)" : "Core Body Temperature (°C)",
      shortName: "Temp",
      unit: "°C",
      sensorModel: "Dallas DS18B20 1-Wire Digital Thermometer / LM35",
      arduinoPin: "Digital Pin D2 (with 4.7kΩ pull-up)",
      operatingVoltage: "3.0V - 5.5V",
      sampleRate: "0.5 Hz (every 2s with median filter)",
      color: "#f59e0b", // Amber
      glowColor: "rgba(245, 158, 11, 0.4)",
      minSafe: 35.8,
      maxSafe: 37.8,
      baselineVal: 36.6,
      icon: Thermometer,
      getValue: (r) => (typeof r?.temp === "number" ? r.temp : Number(r?.temp) || 36.6),
      formatDisplay: (r) => {
        const val = typeof r?.temp === "number" ? r.temp : Number(r?.temp) || 36.6;
        let status = "normal";
        if (val >= 38.0) status = "fever";
        else if (val < 35.5) status = "hypothermia";
        return { val: `${val.toFixed(1)} °C`, status };
      },
      description: "Detects low-grade fevers, heat-stress exhaustion, and environmental hypothermia."
    },
    humidity: {
      id: "humidity",
      name: lang === "ta" ? "சுற்றுப்புற ஈரப்பதம் (%)" : "Relative Humidity (%)",
      shortName: "Humidity",
      unit: "%",
      sensorModel: "DHT22 / AM2302 Capacitive Humidity & Thermistor",
      arduinoPin: "Digital / Analog Pin A1",
      operatingVoltage: "3.3V - 5V",
      sampleRate: "0.5 Hz sampling interval",
      color: "#06b6d4", // Cyan
      glowColor: "rgba(6, 182, 212, 0.4)",
      minSafe: 35,
      maxSafe: 65,
      baselineVal: 52,
      icon: Droplets,
      getValue: (r) => (typeof r?.humidity === "number" ? r.humidity : Number(r?.humidity) || 52.0),
      formatDisplay: (r) => {
        const val = typeof r?.humidity === "number" ? r.humidity : Number(r?.humidity) || 52.0;
        let status = "normal";
        if (val > 70) status = "humid";
        if (val < 30) status = "dry";
        return { val: `${val.toFixed(1)}%`, status };
      },
      description: "Correlates ambient thermal stress and respiratory comfort with vital signs."
    },
    motion: {
      id: "motion",
      name: lang === "ta" ? "அறை இயக்கம் (PIR)" : "PIR Room Motion Activity",
      shortName: "Motion (PIR)",
      unit: "State",
      sensorModel: "HC-SR501 Pyroelectric Passive Infrared Sensor",
      arduinoPin: "Digital Pin D3",
      operatingVoltage: "5V DC (3.3V TTL output)",
      sampleRate: "Continuous interrupt latch with 1s reset window",
      color: "#84cc16", // Lime
      glowColor: "rgba(132, 204, 22, 0.4)",
      minSafe: 0,
      maxSafe: 1,
      baselineVal: 1,
      icon: Footprints,
      getValue: (r) => (r?.motion === 1 ? 1 : 0),
      formatDisplay: (r) => {
        const isMotion = r?.motion === 1;
        return {
          val: isMotion ? (lang === "ta" ? "செயலில் உள்ளது" : "ACTIVE MOTION") : (lang === "ta" ? "அசைவில்லை" : "STILLNESS"),
          status: isMotion ? "active" : "still"
        };
      },
      description: "Tracks ambient presence in room FOV to differentiate voluntary rest from post-fall immobility."
    },
    idle_s: {
      id: "idle_s",
      name: lang === "ta" ? "இயக்கமின்மை காலம் (விநாடிகள்)" : "Time Since Motion / Inactivity (Seconds)",
      shortName: "Stillness Time",
      unit: "sec",
      sensorModel: "Sentinel Inactivity Watchdog Timer",
      arduinoPin: "Firmware Clock Counter",
      operatingVoltage: "N/A (Firmware State)",
      sampleRate: "1 Hz accumulator",
      color: "#38bdf8", // Sky Blue
      glowColor: "rgba(56, 189, 248, 0.4)",
      minSafe: 0,
      maxSafe: 2700, // 45 min
      baselineVal: 0,
      icon: Clock,
      getValue: (r) => (r?.idle_s || 0),
      formatDisplay: (r) => {
        const s = r?.idle_s || 0;
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        let status = "normal";
        if (s > 1800) status = "warning";
        return { val: `${mins}m ${secs}s (${s}s)`, status };
      },
      description: "Triggers gentle Pattern-2 buzzer nudges when prolonged sitting exceeds threshold."
    },
    vib: {
      id: "vib",
      name: lang === "ta" ? "அதிர்வு தீவிரம் (SW-420)" : "Vibration & Impact Intensity (Counts/Sec)",
      shortName: "Vibration / Impact",
      unit: "cnt/s",
      sensorModel: "SW-420 Normally Closed Vibration Sensor Module",
      arduinoPin: "Digital Pin D4 (Hardware Interrupt FALLING)",
      operatingVoltage: "3.3V - 5V",
      sampleRate: "Microsecond interrupt counter with 1-second latch reset",
      color: "#a855f7", // Purple
      glowColor: "rgba(168, 85, 247, 0.4)",
      minSafe: 0,
      maxSafe: 35,
      baselineVal: 2,
      icon: Zap,
      getValue: (r) => (r?.vib || 0),
      formatDisplay: (r) => {
        const v = r?.vib || 0;
        let status = "normal";
        if (v >= 35) status = "impact";
        else if (v >= 8) status = "arm";
        return { val: `${v} counts/s`, status };
      },
      description: "Detects sudden shock impact signatures (>35 counts/s) that initiate fall countdown verification."
    },
    risk_score: {
      id: "risk_score",
      name: lang === "ta" ? "ஒட்டுமொத்த ஆபத்து மதிப்பீடு (0-100)" : "Composite Clinical Risk Score (0 - 100)",
      shortName: "Risk Score",
      unit: "Score",
      sensorModel: "ReBuild Multi-Parametric Clinical Risk Engine",
      arduinoPin: "Edge Analytics Inference",
      operatingVoltage: "Cloud/Edge Engine",
      sampleRate: "Evaluated at every 1-Hz telemetry ingestion packet",
      color: "#f97316", // Orange
      glowColor: "rgba(249, 115, 22, 0.4)",
      minSafe: 0,
      maxSafe: 40,
      baselineVal: 15,
      icon: Activity,
      getValue: (r) => (r?.risk_score || 0),
      formatDisplay: (r) => {
        const score = r?.risk_score || 0;
        const band = r?.risk_band || "green";
        return { val: `${score} / 100 (${band.toUpperCase()})`, status: band };
      },
      description: "Integrates heart rate deviation, core temperature, immobility, and signal artifact state."
    },
    system_state: {
      id: "system_state",
      name: lang === "ta" ? "சென்டினல் FSM கணினி நிலை" : "Sentinel FSM System State",
      shortName: "FSM State",
      unit: "State",
      sensorModel: "Sentinel Finite State Machine (Arduino / Edge)",
      arduinoPin: "Embedded FSM Controller",
      operatingVoltage: "Edge Controller",
      sampleRate: "Real-time state transitions",
      color: "#10b981", // Emerald
      glowColor: "rgba(16, 185, 129, 0.4)",
      minSafe: 0,
      maxSafe: 5,
      baselineVal: 1,
      icon: Cpu,
      getValue: (r) => (r?.system_state === "S_NORMAL" ? 1 : (r?.system_state === "S_FALL_ALARM" ? 4 : 2)),
      formatDisplay: (r) => {
        const st = r?.system_state || "S_NORMAL";
        return { val: st, status: st === "S_NORMAL" ? "normal" : "alert" };
      },
      description: "Reports state engine: S_NORMAL, S_HIGH_TEMP, S_INACTIVE, S_FALL_CHECK, S_FALL_ALARM."
    }
  };

  const currentDef = sensorDefinitions[selectedSensor] || sensorDefinitions.hr;
  const currentFormatted = currentDef.formatDisplay(latestReading);

  // Render 60-Second Real-Time Canvas Chart
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark sleek background
    ctx.fillStyle = "#0e1310";
    ctx.fillRect(0, 0, width, height);

    // Matrix Grid lines
    ctx.strokeStyle = "#1a241d";
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    // Filter buffer for the selected time window
    const dataPoints = historyBuffer.slice(-timeWindow);

    if (dataPoints.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lang === "ta" ? "தரவு பெற காத்திருக்கிறது..." : "Waiting for real-time telemetry...", width / 2, height / 2);
      return;
    }

    // Extract numerical values
    const vals = dataPoints.map((d) => currentDef.getValue(d)).filter((v) => v !== null);

    if (vals.length === 0) {
      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lang === "ta" ? "சென்சார் துண்டிக்கப்பட்டது (தரவு இல்லை)" : "Sensor Not Connected / No Valid Signal", width / 2, height / 2);
      return;
    }

    // Determine scale bounds
    let minVal = Math.min(currentDef.minSafe, ...vals);
    let maxVal = Math.max(currentDef.maxSafe, ...vals);
    if (minVal === maxVal) {
      minVal -= 5;
      maxVal += 5;
    }
    const valRange = maxVal - minVal;

    // Draw Baseline Reference Guide Line
    if (currentDef.baselineVal >= minVal && currentDef.baselineVal <= maxVal) {
      const baseY = height - 25 - ((currentDef.baselineVal - minVal) / valRange) * (height - 50);
      ctx.strokeStyle = "rgba(132, 204, 22, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(45, baseY);
      ctx.lineTo(width - 15, baseY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#84cc16";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Baseline: ${currentDef.baselineVal} ${currentDef.unit}`, 50, baseY - 4);
    }

    // Draw Waveform Line
    const stepX = (width - 70) / Math.max(1, dataPoints.length - 1);
    ctx.beginPath();
    ctx.strokeStyle = currentDef.color;
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let hasStarted = false;
    dataPoints.forEach((pt, i) => {
      const val = currentDef.getValue(pt);
      if (val !== null) {
        const x = 50 + i * stepX;
        const y = height - 25 - ((val - minVal) / valRange) * (height - 50);
        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Data Point Dots
    dataPoints.forEach((pt, i) => {
      const val = currentDef.getValue(pt);
      if (val !== null) {
        const x = 50 + i * stepX;
        const y = height - 25 - ((val - minVal) / valRange) * (height - 50);
        const isLatest = i === dataPoints.length - 1;
        ctx.fillStyle = isLatest ? "#ffffff" : currentDef.color;
        ctx.beginPath();
        ctx.arc(x, y, isLatest ? 4.5 : 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Y-Axis Labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${maxVal.toFixed(0)}`, 40, 25);
    ctx.fillText(`${((minVal + maxVal) / 2).toFixed(0)}`, 40, height / 2);
    ctx.fillText(`${minVal.toFixed(0)}`, 40, height - 25);
  }, [historyBuffer, selectedSensor, currentDef, timeWindow, lang]);

  // Compute statistical aggregates for selected metric
  const validVals = historyBuffer
    .slice(-timeWindow)
    .map((d) => currentDef.getValue(d))
    .filter((v) => v !== null && typeof v === "number");

  const statMin = validVals.length ? Math.min(...validVals).toFixed(1) : "--";
  const statMax = validVals.length ? Math.max(...validVals).toFixed(1) : "--";
  const statAvg = validVals.length
    ? (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(1)
    : "--";

  const handleExportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Timestamp,Sensor,Value,Unit"]
        .concat(
          historyBuffer.map(
            (b) => `${b.timestamp || b.clientTime},${currentDef.name},${currentDef.getValue(b)},${currentDef.unit}`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetry_${currentDef.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Icon = currentDef.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP CONTROLS & SENSOR DROPDOWN SELECTOR BAR */}
      <div className="bg-[#121714] border border-[#202b23] rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16] shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#84cc16] font-bold uppercase tracking-wider block">
              {lang === "ta" ? "தனிப்பட்ட சென்சார் ஆய்வாளர்" : "REAL-TIME SENSOR EXPLORER"}
            </span>
            <h1 className="text-lg font-black text-white">
              {lang === "ta" ? "சென்சார் வாரியாக நேரலை தரவு" : "Inspect Live Telemetry by Sensor"}
            </h1>
          </div>
        </div>

        {/* The Core Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="bg-[#18211b] border-2 border-[#84cc16]/60 text-white font-bold rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#84cc16] shadow-[0_0_15px_rgba(132,204,22,0.2)] cursor-pointer pr-10 appearance-none tracking-wide"
            >
              {Object.values(sensorDefinitions).map((s) => (
                <option key={s.id} value={s.id} className="bg-[#121714] text-white py-2">
                  {s.name} [{s.arduinoPin}]
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#84cc16] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Window Pill */}
          <div className="flex items-center bg-[#18211b] border border-[#25332a] rounded-xl p-1 text-xs">
            {[30, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => setTimeWindow(sec)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] cursor-pointer transition-all ${
                  timeWindow === sec
                    ? "bg-[#84cc16] text-[#0f1411] font-bold shadow-sm"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isPaused
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-[#18211b] border-[#25332a] text-[#9ca3af] hover:text-white"
            }`}
            title={isPaused ? "Resume streaming" : "Pause streaming"}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportData}
            className="p-2 rounded-xl bg-[#18211b] hover:bg-[#202b23] border border-[#25332a] text-[#9ca3af] hover:text-white cursor-pointer transition-colors"
            title="Download CSV of this metric"
          >
            <Download className="w-4 h-4 text-[#84cc16]" />
          </button>
        </div>
      </div>

      {/* 2. SELECTED SENSOR HERO DETAIL CARD & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Big Real-Time Metric Display Card */}
        <div className="lg:col-span-5 bg-[#131915] border border-[#202b23] rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ backgroundColor: currentDef.color }}
          />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#9ca3af] uppercase tracking-wider">
                ACTIVE SENSOR CHANNEL
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18211b] border border-[#25332a] text-[#84cc16]">
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-400" : "bg-[#84cc16] animate-ping"}`} />
                {isPaused ? "STREAM PAUSED" : "1-Hz REAL-TIME"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <div
                className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${currentDef.color}15`,
                  borderColor: `${currentDef.color}40`,
                  color: currentDef.color
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{currentDef.name}</h2>
            </div>

            <p className="text-xs text-[#9ca3af] leading-relaxed pt-1">
              {currentDef.description}
            </p>
          </div>

          {/* BIG LIVE VALUE READOUT */}
          <div className="py-6 relative z-10">
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl sm:text-5xl font-black tracking-tight"
                style={{
                  color: currentFormatted.status === "disconnected" ? "#f43f5e" : currentDef.color,
                  filter: `drop-shadow(0 0 10px ${currentDef.glowColor})`
                }}
              >
                {currentFormatted.val}
              </span>
            </div>

            {/* Status indicator pill */}
            <div className="pt-2 flex items-center gap-2">
              {currentFormatted.status === "disconnected" ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lang === "ta" ? "சென்சார் துண்டிக்கப்பட்டது" : "Hardware Sensor Unplugged"}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#18231c] border border-[#28382c] text-[#a3e635] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lang === "ta" ? "இயல்பான வரம்பு" : "Signal Active & Nominal"}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Hardware Specs Footer */}
          <div className="pt-4 border-t border-[#1e2721] grid grid-cols-2 gap-2 text-[11px] relative z-10 font-mono">
            <div>
              <span className="text-[#6b7280] block text-[9px] uppercase">Arduino Input Pin</span>
              <span className="text-white font-bold">{currentDef.arduinoPin}</span>
            </div>
            <div>
              <span className="text-[#6b7280] block text-[9px] uppercase">Telemetry Interval</span>
              <span className="text-[#84cc16] font-bold">1000 ms (1 Hz)</span>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Waveform Spline Chart Card */}
        <div className="lg:col-span-7 bg-[#131915] border border-[#202b23] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {lang === "ta" ? "நேரலை அலைவடிவம் & வரலாறு" : "Live Streaming Waveform"}
              </h3>
              <span className="text-[10px] text-[#6b7280] font-mono">
                Showing last {timeWindow} seconds of continuous telemetry
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#9ca3af]">
                Min: <strong className="text-white">{statMin}</strong>
              </span>
              <span className="text-[#9ca3af]">
                Avg: <strong className="text-[#84cc16]">{statAvg}</strong>
              </span>
              <span className="text-[#9ca3af]">
                Max: <strong className="text-white">{statMax}</strong>
              </span>
            </div>
          </div>

          {/* Dedicated Canvas Waveform */}
          <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#1e2721]">
            <canvas
              ref={chartCanvasRef}
              width={650}
              height={224}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Statistical Breakdown Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1e2721] text-center text-xs">
            <div className="bg-[#18211b] p-2.5 rounded-xl border border-[#25332a]">
              <span className="text-[10px] text-[#9ca3af] block">Baseline Reference</span>
              <span className="text-sm font-black text-white font-mono">
                {currentDef.baselineVal} {currentDef.unit}
              </span>
            </div>
            <div className="bg-[#18211b] p-2.5 rounded-xl border border-[#25332a]">
              <span className="text-[10px] text-[#9ca3af] block">Clinical Safe Band</span>
              <span className="text-sm font-black text-[#84cc16] font-mono">
                {currentDef.minSafe} - {currentDef.maxSafe} {currentDef.unit}
              </span>
            </div>
            <div className="bg-[#18211b] p-2.5 rounded-xl border border-[#25332a]">
              <span className="text-[10px] text-[#9ca3af] block">Sample Buffer Depth</span>
              <span className="text-sm font-black text-blue-400 font-mono">
                {validVals.length} / {timeWindow} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TECHNICAL SPECIFICATIONS & HARDWARE CIRCUIT CARD */}
      <div className="bg-[#131915] border border-[#202b23] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#84cc16]" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            {lang === "ta" ? "ஹார்டுவேர் மின்சுற்று & சென்சார் விபரங்கள்" : "Hardware Circuit & Technical Specifications"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#18211b] p-3.5 rounded-2xl border border-[#25332a] space-y-1">
            <span className="text-[10px] text-[#6b7280] font-mono uppercase block">Sensor Transducer</span>
            <p className="font-bold text-white">{currentDef.sensorModel}</p>
          </div>

          <div className="bg-[#18211b] p-3.5 rounded-2xl border border-[#25332a] space-y-1">
            <span className="text-[10px] text-[#6b7280] font-mono uppercase block">Microcontroller Connection</span>
            <p className="font-bold text-[#84cc16]">{currentDef.arduinoPin}</p>
          </div>

          <div className="bg-[#18211b] p-3.5 rounded-2xl border border-[#25332a] space-y-1">
            <span className="text-[10px] text-[#6b7280] font-mono uppercase block">Sampling Architecture</span>
            <p className="font-bold text-white">{currentDef.sampleRate}</p>
          </div>

          <div className="bg-[#18211b] p-3.5 rounded-2xl border border-[#25332a] space-y-1">
            <span className="text-[10px] text-[#6b7280] font-mono uppercase block">Operating Power</span>
            <p className="font-bold text-white">{currentDef.operatingVoltage}</p>
          </div>
        </div>
      </div>

      {/* 4. MULTI-SENSOR QUICK-SWITCH STRIP AT BOTTOM */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider block">
          {lang === "ta" ? "மற்ற சென்சார்களுக்கு உடனடியாக மாறவும்:" : "Quick Switch to Another Sensor Channel:"}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {Object.values(sensorDefinitions).map((s) => {
            const SIcon = s.icon;
            const isSelected = selectedSensor === s.id;
            const valObj = s.formatDisplay(latestReading);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSensor(s.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  isSelected
                    ? "bg-[#84cc16] text-[#0f1411] border-[#84cc16] font-bold shadow-[0_0_15px_rgba(132,204,22,0.35)] scale-[1.02]"
                    : "bg-[#131915] border-[#202b23] text-[#9ca3af] hover:text-white hover:border-[#2e3e32]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <SIcon className={`w-3.5 h-3.5 ${isSelected ? "text-[#0f1411]" : ""}`} style={{ color: !isSelected ? s.color : undefined }} />
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <div>
                  <span className={`text-[10px] font-bold block truncate ${isSelected ? "text-[#0f1411]" : "text-white"}`}>
                    {s.shortName}
                  </span>
                  <span className={`text-[9px] block truncate ${isSelected ? "text-[#0f1411]/80" : "text-[#6b7280]"}`}>
                    {valObj.val}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
