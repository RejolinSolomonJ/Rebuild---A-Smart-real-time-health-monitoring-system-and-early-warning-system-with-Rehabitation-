import React from "react";
import { Users, AlertTriangle, CheckCircle, Clock, Heart, Thermometer, ShieldAlert, ArrowUpDown } from "lucide-react";

export default function HealthWorkerView({ lang = "en" }) {
  // Simulated community cohort for rural screening
  const patients = [
    {
      id: 1,
      name: "Ramesh Kumar",
      age: 68,
      village: "Kallakurichi Block",
      risk_score: 22,
      risk_band: "green",
      status_reason: "Vitals stable, personal baseline nominal",
      last_seen: "Just now",
      hr: 74,
      temp: 36.6,
      adherence: "92%"
    },
    {
      id: 2,
      name: "Meenakshi Ammal",
      age: 72,
      village: "Kallakurichi Block",
      risk_score: 78,
      risk_band: "red",
      status_reason: "Resting HR elevated +24% above baseline; zero daytime movement for 3.5 hrs",
      last_seen: "4 mins ago",
      hr: 96,
      temp: 37.9,
      adherence: "45%"
    },
    {
      id: 3,
      name: "Murugan P.",
      age: 48,
      village: "Sankarapuram Sector",
      risk_score: 55,
      risk_band: "amber",
      status_reason: "Heat-stress condition flagged: elevated cardiac load during midday field work",
      last_seen: "12 mins ago",
      hr: 104,
      temp: 37.7,
      adherence: "80%"
    },
    {
      id: 4,
      name: "Lakshmi Narayanan",
      age: 65,
      village: "Chinnasalem Sub-center",
      risk_score: 15,
      risk_band: "green",
      status_reason: "Recovering post-knee arthroplasty, MoveSafe plan completed today",
      last_seen: "25 mins ago",
      hr: 68,
      temp: 36.5,
      adherence: "95%"
    }
  ];

  // Sort by risk_score descending (Highest risk first)
  const sortedPatients = [...patients].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              {lang === "ta" ? "சமூக சுகாதார பணியாளர் பார்வை" : "Community & Rural Health Worker View"}
            </span>
            <h1 className="text-xl font-bold text-white">Selvi (ASHA / Village Health Nurse)</h1>
            <p className="text-xs text-slate-400">
              Patients prioritized by Composite Health Risk Score (Sentinel Early Warning).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sorted: Highest Risk First</span>
        </div>
      </div>

      {/* Community Patient Cards */}
      <div className="space-y-3">
        {sortedPatients.map((p) => {
          const isRed = p.risk_band === "red";
          const isAmber = p.risk_band === "amber";

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
                isRed
                  ? "bg-red-950/40 border-red-500/50 shadow-red-950/20"
                  : isAmber
                  ? "bg-amber-950/30 border-amber-500/40"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    isRed
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isAmber
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    Risk Score: {p.risk_score} / 100
                  </span>
                  <span className="text-xs text-slate-400">• {p.village}</span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  {p.name}
                  <span className="text-xs text-slate-400 font-normal ml-2">({p.age} yrs)</span>
                </h3>

                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {p.status_reason}
                </p>
              </div>

              {/* Vitals & Triage Action */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">HR</span>
                    <span className="font-bold text-white">{p.hr} BPM</span>
                  </div>

                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <span className="font-bold text-white">{p.temp} °C</span>
                  </div>

                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Last Seen</span>
                    <span className="font-bold text-white">{p.last_seen}</span>
                  </div>
                </div>

                <button
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isRed
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  {isRed ? "Physical Visit Priority" : "Review Chart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
