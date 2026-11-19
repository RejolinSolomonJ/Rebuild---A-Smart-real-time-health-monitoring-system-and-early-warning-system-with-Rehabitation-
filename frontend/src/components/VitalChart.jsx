import React, { useEffect, useRef } from "react";

export default function VitalChart({ readings = [], lang = "en" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    if (!readings || readings.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lang === "ta" ? "நேரலை தரவுக்காக காத்திருக்கிறது..." : "Waiting for incoming telemetry stream...", width / 2, height / 2);
      return;
    }

    // Slice recent 60 readings
    const data = readings.slice(-60);
    const stepX = (width - 60) / Math.max(1, data.length - 1);

    // 1. Draw Temperature Line (scale: 35.0 to 40.0 C)
    ctx.beginPath();
    ctx.strokeStyle = "#f59e0b"; // Amber/Yellow
    ctx.lineWidth = 2;
    data.forEach((r, idx) => {
      const x = 45 + idx * stepX;
      const tempClamped = Math.max(35.0, Math.min(40.0, r.temp || 36.6));
      const y = height - 25 - ((tempClamped - 35.0) / 5.0) * (height - 50);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Draw Heart Rate Line (scale: 40 to 160 BPM)
    ctx.beginPath();
    ctx.strokeStyle = "#ef4444"; // Red/Crimson
    ctx.lineWidth = 2.5;
    data.forEach((r, idx) => {
      const x = 45 + idx * stepX;
      const hr = r.hr_ok ? r.hr : 70;
      const hrClamped = Math.max(40, Math.min(160, hr));
      const y = height - 25 - ((hrClamped - 40) / 120) * (height - 50);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw motion events as blue ticks along the bottom
    ctx.fillStyle = "#38bdf8";
    data.forEach((r, idx) => {
      if (r.motion === 1) {
        const x = 45 + idx * stepX;
        ctx.fillRect(x - 2, height - 12, 4, 8);
      }
    });

    // Y-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("160", 35, 30);
    ctx.fillText("100", 35, height / 2);
    ctx.fillText("40", 35, height - 30);
  }, [readings, lang]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-200">
          {lang === "ta" ? "10-நிமிட நேரலை உடல்நல வரைபடம்" : "10-Minute Real-Time Vitals Trajectory"}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            {lang === "ta" ? "இதயத் துடிப்பு (BPM)" : "Heart Rate (BPM)"}
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            {lang === "ta" ? "வெப்பநிலை (°C)" : "Temp (°C)"}
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-2 bg-sky-400 inline-block"></span>
            {lang === "ta" ? "இயக்கம்" : "PIR Motion"}
          </span>
        </div>
      </div>
      <div className="relative w-full aspect-[21/9] min-h-[160px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={260}
          className="w-full h-full rounded-lg bg-slate-950 block"
        />
      </div>
    </div>
  );
}
