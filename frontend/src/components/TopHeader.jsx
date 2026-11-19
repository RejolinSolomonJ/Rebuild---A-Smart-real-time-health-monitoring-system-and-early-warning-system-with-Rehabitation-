import React from "react";
import {
  Search,
  Bell,
  Sun,
  Globe,
  Usb,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Timer,
  ChevronDown,
  Radio
} from "lucide-react";

export default function TopHeader({
  person,
  onOpenHardware,
  onOpenReport,
  onOpenScreening,
  onOpenTelemetry,
  lang,
  onLangToggle,
  hardwareConnected,
  onToggleSidebar,
  sidebarOpen = true
}) {
  return (
    <header className="h-16 bg-[#111613] border-b border-[#1e2721] px-6 flex items-center justify-between shrink-0 select-none sticky top-0 z-30">
      {/* Left: Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-[#9ca3af] hover:text-white transition-colors cursor-pointer border border-[#232f27]"
          title="Toggle Sidebar"
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={lang === "ta" ? "தேடுக..." : "Search anything..."}
            className="w-full bg-[#161d18] border border-[#232f27] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Hardware Link, Language, Notifications, Avatar */}
      <div className="flex items-center gap-3">
        {/* Real-Time Telemetry Explorer Quick Button */}
        <button
          onClick={onOpenTelemetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#84cc16]/10 hover:bg-[#84cc16]/20 text-xs font-semibold text-[#a3e635] border border-[#84cc16]/30 transition-colors cursor-pointer"
          title="Open Real-Time Data by Dropdown"
        >
          <Radio className="w-3.5 h-3.5 text-[#84cc16]" />
          <span className="hidden sm:inline">{lang === "ta" ? "நேரலை தரவு" : "Live Telemetry"}</span>
        </button>

        {/* Hardware Serial Link Pill */}
        <button
          onClick={onOpenHardware}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            hardwareConnected
              ? "bg-[#84cc16]/15 border-[#84cc16]/40 text-[#a3e635] shadow-[0_0_12px_rgba(132,204,22,0.25)]"
              : "bg-[#18201a] border-[#27352b] text-[#9ca3af] hover:text-white"
          }`}
          title="Connect Physical Arduino Hardware"
        >
          <Usb className={`w-3.5 h-3.5 ${hardwareConnected ? "text-[#84cc16] animate-pulse" : "text-[#6b7280]"}`} />
          <span className="hidden sm:inline">
            {hardwareConnected ? (lang === "ta" ? "ஹார்டுவேர் இணைக்கப்பட்டது" : "Hardware: Live") : (lang === "ta" ? "ஹார்டுவேர் இணைப்பு" : "Hardware Link")}
          </span>
        </button>

        {/* Screening Tests */}
        <button
          onClick={onOpenScreening}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
        >
          <Timer className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === "ta" ? "சோதனைகள்" : "Screening"}</span>
        </button>

        {/* Weekly Report */}
        <button
          onClick={onOpenReport}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>{lang === "ta" ? "அறிக்கை" : "Report"}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={onLangToggle}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>{lang === "en" ? "EN" : "TA"}</span>
        </button>

        {/* Dark/Theme Toggle Icon */}
        <button
          className="p-2 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
          title="Light/Dark theme"
        >
          <Sun className="w-4 h-4 text-amber-400" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="w-2 h-2 rounded-full bg-[#84cc16] absolute top-1.5 right-1.5 shadow-[0_0_6px_#84cc16]" />
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1e2721]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#84cc16] to-emerald-400 flex items-center justify-center text-[#0f1411] font-extrabold text-xs shadow-md">
            {person?.name?.charAt(0) || "R"}
          </div>
          <div className="hidden lg:block leading-tight">
            <span className="text-xs font-bold text-white block">{person?.name || "Ramesh Kumar"}</span>
            <span className="text-[10px] text-[#6b7280] block">{person?.age || 68} yrs • Patient</span>
          </div>
        </div>
      </div>
    </header>
  );
}
