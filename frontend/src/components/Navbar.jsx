import React from "react";
import { Activity, ShieldCheck, HeartPulse, Stethoscope, Users, Globe, FileText, Wifi, Timer, Usb } from "lucide-react";

export default function Navbar({
  currentRole,
  onRoleChange,
  lang,
  onLangToggle,
  onOpenReport,
  onOpenScreening,
  onOpenHardware,
  connected
}) {
  const roles = [
    { id: "patient", label: "Patient (Ramesh)", icon: HeartPulse },
    { id: "caregiver", label: "Caregiver (Anita)", icon: ShieldCheck },
    { id: "physio", label: "Physio (Dr. Kavitha)", icon: Stethoscope },
    { id: "health_worker", label: "Health Worker (Selvi)", icon: Users },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Logo & Connection State */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black tracking-wider">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">ReBuild</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Sentinel & MoveSafe Closed Loop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onLangToggle}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "TA" : "EN"}</span>
            </button>
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Controls & Status */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenHardware}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-xs font-semibold text-blue-300 border border-blue-500/40 transition-colors cursor-pointer"
            title="Connect Live Arduino Hardware"
          >
            <Usb className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === "ta" ? "ஹார்டுவேர்" : "Hardware Link"}</span>
          </button>

          <button
            onClick={onOpenScreening}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === "ta" ? "சோதனைகள்" : "Screening Tests"}</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === "ta" ? "வார அறிக்கை" : "Weekly Report"}</span>
          </button>

          <button
            onClick={onLangToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === "en" ? "தமிழ் (TA)" : "English (EN)"}</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-400">
            <Wifi className={`w-3.5 h-3.5 ${connected ? "text-emerald-400" : "text-rose-400"}`} />
            <span>{connected ? "Live Stream" : "Connecting..."}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
