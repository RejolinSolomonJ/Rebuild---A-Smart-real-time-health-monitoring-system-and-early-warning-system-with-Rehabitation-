import React from "react";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  FileText,
  Timer,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Calendar
} from "lucide-react";

export default function ProgressView({
  person,
  onOpenReport,
  onOpenScreening,
  lang = "en"
}) {
  const breakdown = [
    { title: "Kinematic Form Accuracy", score: 95, color: "#84cc16", desc: "Smooth joint angles without compensatory lean" },
    { title: "Tempo & Hold Control", score: 88, color: "#a3e635", desc: "Maintained > 2s extension hold during knee arcs" },
    { title: "Exertion Tolerance Margin", score: 92, color: "#4ade80", desc: "Borg rating stayed within safe limits (11/20)" },
    { title: "Vitals Stability & Reserve", score: 100, color: "#38bdf8", desc: "0 unsafe heart rate spikes or fever events" }
  ];

  const screeningHistory = [
    {
      test: "30-Second Chair Stand Test (CDC STEADI)",
      score: "12 reps",
      unit: "reps",
      date: "Nov 15, 2026",
      interpretation: "Normal lower-body strength (65-69 yr reference: 11-16 reps)",
      status: "Passed"
    },
    {
      test: "Timed Up & Go (TUG) Test",
      score: "9.8s",
      unit: "seconds",
      date: "Nov 12, 2026",
      interpretation: "Low Fall Risk (< 12 seconds indicates independent mobility)",
      status: "Optimal"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase bg-[#84cc16]/20 text-[#a3e635] px-2 py-0.5 rounded border border-[#84cc16]/30">
              CLINICAL REHABILITATION INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "மறுவாழ்வு முன்னேற்றம் & மருத்துவ மதிப்பீடு" : "Rehabilitation Progress & Functional Screening"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "செயல்திறன் மீட்பு மதிப்பெண் மற்றும் சிடிசி நிலையான சோதனைகள்" : "Longitudinal recovery index, motor control grading, and validated mobility assessments"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScreening}
            className="py-2.5 px-4 rounded-xl bg-[#1e2820] hover:bg-[#28352b] text-white border border-[#2b3a2f] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Timer className="w-4 h-4 text-[#84cc16]" />
            <span>Perform Screening Test</span>
          </button>

          <button
            onClick={onOpenReport}
            className="py-2.5 px-4 rounded-xl bg-[#84cc16] hover:bg-[#9ee838] text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#84cc16]/20"
          >
            <FileText className="w-4 h-4 fill-current" />
            <span>Export Weekly PDF</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs text-[#9ca3af] font-semibold uppercase tracking-wider">Overall Clinical Index</span>
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-5xl font-black text-white">88</span>
            <span className="text-sm text-[#9ca3af]">/ 100</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#84cc16]/20 text-[#a3e635] text-xs font-bold border border-[#84cc16]/40">
            <Award className="w-4 h-4" />
            <span>Grade A — Optimal Motor Control</span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="md:col-span-2 space-y-3.5 border-t md:border-t-0 md:border-l border-[#1e2721] pt-4 md:pt-0 md:pl-6">
          {breakdown.map((b, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">{b.title}</span>
                <span className="font-bold font-mono" style={{ color: b.color }}>{b.score}%</span>
              </div>
              <div className="w-full bg-[#1e2721] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${b.score}%`, backgroundColor: b.color }}
                />
              </div>
              <p className="text-[10px] text-[#6b7280]">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CDC STEADI Screening Tests Card */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#84cc16]" />
            <span>CDC STEADI Validated Fall-Risk Assessments</span>
          </h2>
          <span className="text-xs text-[#84cc16] font-semibold">Evidence-Based Protocols</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {screeningHistory.map((s, idx) => (
            <div
              key={idx}
              className="bg-[#0e1410] border border-[#1e2721] rounded-xl p-4 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#9ca3af] flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-[#84cc16]" />
                    {s.date}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/30">
                    {s.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{s.test}</h3>
                <div className="text-2xl font-black text-[#a3e635] pt-1">{s.score}</div>
                <p className="text-xs text-[#9ca3af]">{s.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
