import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  User,
  Phone,
  Globe,
  Usb,
  Lock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Save
} from "lucide-react";

export default function SettingsView({
  person,
  lang = "en",
  onLangToggle,
  onOpenHardware
}) {
  const [consentCamera, setConsentCamera] = useState(true);
  const [consentVitals, setConsentVitals] = useState(true);
  const [consentShare, setConsentShare] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  const handleSave = () => {
    setSavedMsg("Settings and privacy permissions updated successfully!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#84cc16]" />
            <span>{lang === "ta" ? "கணினி அமைப்புகள் & தரவு பாதுகாப்பு" : "System Settings & Data Governance"}</span>
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {lang === "ta" ? "நோயாளி சுயவிவரம் மற்றும் ஒப்புதல் மேலாண்மை" : "Patient identity, informed consent permissions, and peripheral hardware preferences"}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 bg-[#84cc16] hover:bg-[#9ee838] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#84cc16]/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-[#0e1410] border border-[#84cc16]/50 rounded-xl text-[#a3e635] text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#84cc16]" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* 1. Patient Profile Card */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-[#84cc16]" />
          <span>Patient Identity & Clinical Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#0e1410] border border-[#1e2721] p-3.5 rounded-xl space-y-1">
            <span className="text-[#9ca3af] block">Full Name:</span>
            <span className="text-white font-bold">{person?.name || "Ramesh Kumar"}</span>
          </div>

          <div className="bg-[#0e1410] border border-[#1e2721] p-3.5 rounded-xl space-y-1">
            <span className="text-[#9ca3af] block">Demographics:</span>
            <span className="text-white font-bold">68 Years Old • Male • Elderly Living Alone</span>
          </div>

          <div className="bg-[#0e1410] border border-[#1e2721] p-3.5 rounded-xl space-y-1">
            <span className="text-[#9ca3af] block">Chronic Conditions:</span>
            <span className="text-white font-bold">Hypertension (Amlodipine 5mg), Mild Knee Osteoarthritis</span>
          </div>

          <div className="bg-[#0e1410] border border-[#1e2721] p-3.5 rounded-xl space-y-1">
            <span className="text-[#9ca3af] block">Emergency Caregiver Contact:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Anita (Daughter) — +919876543210</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Privacy & Informed Consent Framework */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#84cc16]" />
            <span>Informed Consent Governance & Privacy Shield</span>
          </h2>
          <span className="text-[10px] text-[#84cc16] font-mono">Zero-Cloud Video</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-[#0e1410] border border-[#1e2721] rounded-xl">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-bold text-white">Local On-Device Camera Processing</div>
              <div className="text-[11px] text-[#9ca3af]">
                Pose landmarks are computed exclusively inside your local browser via WebAssembly. No video frames are ever recorded or transmitted.
              </div>
            </div>
            <input
              type="checkbox"
              checked={consentCamera}
              onChange={(e) => setConsentCamera(e.target.checked)}
              className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#0e1410] border border-[#1e2721] rounded-xl">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-bold text-white">Sensor Telemetry & Baseline Storage</div>
              <div className="text-[11px] text-[#9ca3af]">
                Store vital readings (heart rate, temp, humidity, motion) locally for longitudinal trend and cardiac drift analysis.
              </div>
            </div>
            <input
              type="checkbox"
              checked={consentVitals}
              onChange={(e) => setConsentVitals(e.target.checked)}
              className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#0e1410] border border-[#1e2721] rounded-xl">
            <div className="space-y-0.5 pr-4">
              <div className="text-xs font-bold text-white">Emergency Caregiver & Clinician Sharing</div>
              <div className="text-[11px] text-[#9ca3af]">
                Allow safety notifications (confirmed falls or prolonged inactivity) to dispatch SMS alerts to Anita (+919876543210).
              </div>
            </div>
            <input
              type="checkbox"
              checked={consentShare}
              onChange={(e) => setConsentShare(e.target.checked)}
              className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Peripherals & Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Language */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#84cc16]" />
            <span>Language Preference</span>
          </h3>
          <p className="text-xs text-[#9ca3af]">Select your preferred interface language:</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLangToggle && onLangToggle()}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-[#84cc16] text-black border-[#84cc16]"
                  : "bg-[#18201a] text-white border-[#27352b]"
              }`}
            >
              English (EN)
            </button>
            <button
              onClick={() => onLangToggle && onLangToggle()}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                lang === "ta"
                  ? "bg-[#84cc16] text-black border-[#84cc16]"
                  : "bg-[#18201a] text-white border-[#27352b]"
              }`}
            >
              தமிழ் (TA)
            </button>
          </div>
        </div>

        {/* Hardware Port */}
        <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Usb className="w-4 h-4 text-[#84cc16]" />
              <span>Sentinel Hardware Port</span>
            </h3>
            <p className="text-xs text-[#9ca3af] mt-1">Configured for COM3 @ 9600 Baud (sentinel_lcdac.ino)</p>
          </div>
          <button
            onClick={onOpenHardware}
            className="w-full py-2 bg-[#18201a] hover:bg-[#202b23] text-white rounded-xl border border-[#27352b] text-xs font-bold transition-colors cursor-pointer"
          >
            Configure Serial Port Link
          </button>
        </div>
      </div>
    </div>
  );
}
