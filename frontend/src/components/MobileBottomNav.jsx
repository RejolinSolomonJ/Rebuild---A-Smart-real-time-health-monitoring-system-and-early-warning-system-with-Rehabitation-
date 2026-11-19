import React from "react";
import {
  LayoutDashboard,
  Radio,
  Dumbbell,
  Bot,
  ShieldCheck,
  Stethoscope,
  Menu,
  HeartPulse
} from "lucide-react";

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  currentRole,
  onToggleSidebar,
  lang = "en"
}) {
  // Determine dynamic role portal tab
  let roleItem = {
    id: "health",
    label: lang === "ta" ? "சென்டினல்" : "Sentinel",
    icon: HeartPulse
  };

  if (currentRole === "caregiver") {
    roleItem = {
      id: "caregivers",
      label: lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver",
      icon: ShieldCheck
    };
  } else if (currentRole === "physio") {
    roleItem = {
      id: "physio",
      label: lang === "ta" ? "கிளினிக்" : "Clinic",
      icon: Stethoscope
    };
  }

  const items = [
    {
      id: "dashboard",
      label: lang === "ta" ? "முகப்பு" : "Home",
      icon: LayoutDashboard
    },
    {
      id: "telemetry",
      label: lang === "ta" ? "தரவு" : "Live Data",
      icon: Radio
    },
    {
      id: "workouts",
      label: lang === "ta" ? "பயிற்சி" : "Workouts",
      icon: Dumbbell
    },
    {
      id: "ai_assistant",
      label: lang === "ta" ? "AI" : "AI Clinical",
      icon: Bot
    },
    roleItem
  ];

  return (
    <nav className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111613]/95 backdrop-blur-lg border-t border-[#1e2721] px-2 py-1 safe-area-pb shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
                isActive
                  ? "text-[#84cc16]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? "bg-[#84cc16]/15 shadow-[0_0_10px_rgba(132,204,22,0.3)]" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#84cc16]" : "text-[#9ca3af]"}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? "font-bold text-[#84cc16]" : "text-[#9ca3af]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Sidebar Drawer Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[#9ca3af] hover:text-white transition-all cursor-pointer min-w-[56px] min-h-[48px]"
          title="All Navigation Tabs"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5 text-[#9ca3af]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium text-[#9ca3af]">
            {lang === "ta" ? "பட்டி" : "Menu"}
          </span>
        </button>
      </div>
    </nav>
  );
}
