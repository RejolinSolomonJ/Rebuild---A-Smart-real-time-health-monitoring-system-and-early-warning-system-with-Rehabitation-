import React from "react";
import { AlertCircle } from "lucide-react";

export default function DisclaimerBanner({ lang = "en" }) {
  return (
    <div className="bg-amber-950/80 border-b border-amber-600/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2 text-center backdrop-blur-sm">
      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        {lang === "ta"
          ? "⚠️ மருத்துவ மறுப்பு: இது ஒரு உதவிக் கருவி மட்டுமே. மருத்துவ நோயறிதல் அல்லது தொழில்முறை மருத்துவ பராமரிப்புக்கு மாற்றாகாது."
          : "⚠️ Assistive and screening tool, not a diagnostic system or a substitute for professional clinical care."}
      </span>
    </div>
  );
}
