import React from "react";
import {
  LayoutDashboard,
  Bot,
  Activity,
  Dumbbell,
  Apple,
  Moon,
  HeartPulse,
  TrendingUp,
  Users,
  Settings,
  Flame,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Radio
} from "lucide-react";

export default function Sidebar({
  activeTab,
  onTabChange,
  currentRole,
  onRoleChange,
  streakDays = 12,
  lang = "en"
}) {
  const navItems = [
    { id: "dashboard", label: lang === "ta" ? "டாஷ்போர்டு" : "Dashboard", icon: LayoutDashboard },
    { id: "telemetry", label: lang === "ta" ? "நேரலை சென்சார் தரவு" : "Real-Time Telemetry", icon: Radio },
    { id: "ai_assistant", label: lang === "ta" ? "AI உதவியாளர்" : "AI Assistant", icon: Bot },
    { id: "activity", label: lang === "ta" ? "செயல்பாடு" : "Activity", icon: Activity },
    { id: "workouts", label: lang === "ta" ? "பயிற்சிகள்" : "Workouts", icon: Dumbbell },
    { id: "nutrition", label: lang === "ta" ? "உடல்நிலைகள்" : "Vitals & Health", icon: Apple },
    { id: "sleep", label: lang === "ta" ? "அமைதி நிலை" : "Sleep & Rest", icon: Moon },
    { id: "health", label: lang === "ta" ? "சென்டினல்" : "Sentinel Node", icon: HeartPulse },
    { id: "progress", label: lang === "ta" ? "முன்னேற்றம்" : "Progress", icon: TrendingUp },
    { id: "caregivers", label: lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver", icon: ShieldCheck },
    { id: "physio", label: lang === "ta" ? "பிசியோ கிளினிக்" : "Physio Clinic", icon: Stethoscope },
    { id: "settings", label: lang === "ta" ? "அமைப்புகள்" : "Settings", icon: Settings },
  ];

  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <aside className="w-64 bg-[#111613] border-r border-[#1e2721] flex flex-col justify-between shrink-0 select-none min-h-screen">
      {/* Brand Logo Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#84cc16] flex items-center justify-center text-black font-black shadow-[0_0_15px_rgba(132,204,22,0.4)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-widest text-white uppercase">ReBuild4</span>
              <span className="text-[9px] font-mono font-bold bg-[#84cc16]/20 text-[#a3e635] px-1.5 py-0.5 rounded border border-[#84cc16]/30">
                PRO
              </span>
            </div>
            <p className="text-[9px] text-[#6b7280] font-medium tracking-wide">HEALTH INTELLIGENCE</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="px-3 flex-1 overflow-y-auto space-y-1 scrollbar-none py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                  ? "bg-[#84cc16] text-[#0f1411] shadow-[0_0_20px_rgba(132,204,22,0.35)] font-bold scale-[1.02]"
                  : "text-[#9ca3af] hover:text-white hover:bg-[#18201a]"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#0f1411]" : "text-[#9ca3af]"}`} />
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Section: Streak Card & Logout */}
      <div className="p-4 space-y-3 border-t border-[#1e2721] bg-[#0d120f]">
        {/* Current Streak Card */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-3.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9ca3af] text-[11px] font-medium">
              {lang === "ta" ? "தற்போதைய தொடர்ச்சி" : "Current Streak"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/20 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xl font-black text-white">{streakDays}</span>
              <span className="text-xs text-[#9ca3af] ml-1">{lang === "ta" ? "நாட்கள்" : "Days"}</span>
            </div>
          </div>

          {/* Mini 7-Day Dots */}
          <div className="flex items-center justify-between pt-1">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-[#6b7280] font-mono">{d}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? "bg-[#84cc16] shadow-[0_0_6px_#84cc16]" : "bg-[#27352b]"
                    }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Role Quick Toggle */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-[#9ca3af]">
          <span className="capitalize">{currentRole}</span>
          <span className="text-[10px] bg-[#1d2620] px-2 py-0.5 rounded text-[#a3e635] border border-[#27352b]">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
}
