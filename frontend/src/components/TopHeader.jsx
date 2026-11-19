import React, { useState, useRef, useEffect } from "react";
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
  Radio,
  LogOut,
  User,
  ShieldCheck,
  Stethoscope,
  Check,
  Heart
} from "lucide-react";

export default function TopHeader({
  person,
  currentUser,
  currentRole,
  latestReading,
  onOpenLogin,
  onSwitchRole,
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = () => {
    if (currentRole === "caregiver") {
      return {
        label: lang === "ta" ? "பராமரிப்பாளர்" : "Caretaker",
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: ShieldCheck
      };
    }
    if (currentRole === "physio") {
      return {
        label: lang === "ta" ? "பிசியோதெரபிஸ்ட்" : "Physio / Doctor",
        bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        icon: Stethoscope
      };
    }
    return {
      label: lang === "ta" ? "நோயாளி" : "Patient",
      bg: "bg-[#84cc16]/15 text-[#a3e635] border-[#84cc16]/30",
      icon: User
    };
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="h-16 bg-[#111613] border-b border-[#1e2721] px-3 sm:px-6 flex items-center justify-between shrink-0 select-none sticky top-0 z-30">
      {/* Left: Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xs sm:max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-2 sm:p-2.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-[#9ca3af] hover:text-white transition-colors cursor-pointer border border-[#232f27] shrink-0"
          title="Toggle Sidebar Menu"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Mini Logo (visible only on small screens) */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-[#84cc16] flex items-center justify-center text-black font-black text-xs">
            R
          </div>
          <span className="font-extrabold text-xs tracking-wider text-white">ReBuild4</span>
        </div>

        {/* Search bar */}
        <div className="relative w-full hidden xs:block">
          <Search className="w-3.5 h-3.5 text-[#6b7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={lang === "ta" ? "தேடுக..." : "Search..."}
            className="w-full bg-[#161d18] border border-[#232f27] rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Hardware Link, Language, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Real-Time Live Heart Rate Pulse Badge */}
        <button
          onClick={onOpenTelemetry}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono transition-all cursor-pointer shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
          title="Pulse Sensor Live Telemetry (Pin A0)"
        >
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>{latestReading?.hr_ok && latestReading?.hr > 0 ? `${latestReading.hr} BPM` : "74 BPM"}</span>
        </button>

        {/* Real-Time Telemetry Quick Action */}
        <button
          onClick={onOpenTelemetry}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#84cc16]/10 hover:bg-[#84cc16]/20 text-[11px] sm:text-xs font-semibold text-[#a3e635] border border-[#84cc16]/30 transition-colors cursor-pointer shrink-0"
          title="Open Real-Time Sensor Telemetry"
        >
          <Radio className="w-3.5 h-3.5 text-[#84cc16]" />
          <span className="hidden sm:inline">{lang === "ta" ? "நேரலை தரவு" : "Live Telemetry"}</span>
        </button>

        {/* Hardware Serial Link Pill */}
        <button
          onClick={onOpenHardware}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
            hardwareConnected
              ? "bg-[#84cc16]/15 border-[#84cc16]/40 text-[#a3e635] shadow-[0_0_12px_rgba(132,204,22,0.25)]"
              : "bg-[#18201a] border-[#27352b] text-[#9ca3af] hover:text-white"
          }`}
          title="Hardware Sensor Link Status"
        >
          <Usb className={`w-3.5 h-3.5 ${hardwareConnected ? "text-[#84cc16] animate-pulse" : "text-[#6b7280]"}`} />
          <span className="hidden md:inline">
            {hardwareConnected ? "Hardware: Live" : "Hardware Link"}
          </span>
        </button>

        {/* Screening Tests */}
        <button
          onClick={onOpenScreening}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
        >
          <Timer className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === "ta" ? "சோதனைகள்" : "Screening"}</span>
        </button>

        {/* Weekly Report */}
        <button
          onClick={onOpenReport}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>{lang === "ta" ? "அறிக்கை" : "Report"}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={onLangToggle}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#18201a] hover:bg-[#202b23] text-xs font-semibold text-[#9ca3af] hover:text-white border border-[#27352b] transition-colors cursor-pointer shrink-0"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>{lang === "en" ? "EN" : "TA"}</span>
        </button>

        {/* User Account Profile & Role Switch Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-[#1e2721]" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-[#18201a] border border-transparent hover:border-[#27352b] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#84cc16] to-emerald-400 flex items-center justify-center text-[#0f1411] font-extrabold text-xs shadow-md shrink-0">
              {currentUser?.username?.charAt(0)?.toUpperCase() || "R"}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="text-xs font-bold text-white block">
                {currentRole === "caregiver"
                  ? "Anita Kumar"
                  : currentRole === "physio"
                  ? "Dr. Kavitha PT"
                  : person?.name || "Ramesh Kumar"}
              </span>
              <span className={`text-[10px] font-mono font-semibold px-1 rounded border inline-block ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] hidden sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#141b16] border border-[#28372b] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-[#222e25] bg-[#0d120f] rounded-xl mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/40 flex items-center justify-center text-[#a3e635] font-black text-sm">
                    {currentUser?.username?.charAt(0)?.toUpperCase() || "R"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {currentRole === "caregiver"
                        ? "Anita (Daughter)"
                        : currentRole === "physio"
                        ? "Dr. Kavitha PT"
                        : person?.name || "Ramesh Kumar"}
                    </span>
                    <span className="text-[10px] text-[#9ca3af] block">
                      @{currentUser?.username || "ramesh"}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${roleInfo.bg}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {/* Quick Role Switchers */}
              <div className="space-y-1 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-bold px-2 py-1 block">
                  {lang === "ta" ? "பாத்திரத்தை மாற்றவும்" : "Switch Active Role"}
                </span>

                <button
                  onClick={() => {
                    onSwitchRole("patient");
                    setProfileDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === "patient"
                      ? "bg-[#84cc16]/15 text-[#a3e635] font-bold"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#1c261e]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>User / Patient (Ramesh)</span>
                  </div>
                  {currentRole === "patient" && <Check className="w-3.5 h-3.5 text-[#84cc16]" />}
                </button>

                <button
                  onClick={() => {
                    onSwitchRole("caregiver");
                    setProfileDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === "caregiver"
                      ? "bg-blue-500/15 text-blue-400 font-bold"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#1c261e]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Caretaker / Caregiver (Anita)</span>
                  </div>
                  {currentRole === "caregiver" && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <button
                  onClick={() => {
                    onSwitchRole("physio");
                    setProfileDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === "physio"
                      ? "bg-purple-500/15 text-purple-400 font-bold"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#1c261e]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctor / Physio (Dr. Kavitha)</span>
                  </div>
                  {currentRole === "physio" && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              </div>

              {/* Open Full Login Modal / Switch Account */}
              <div className="pt-2 border-t border-[#222e25]">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#9ca3af] hover:text-white hover:bg-[#202b23] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "ta" ? "கணக்கு உள்நுழைவு / மாற்று" : "Switch Account / Login Dialog"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
