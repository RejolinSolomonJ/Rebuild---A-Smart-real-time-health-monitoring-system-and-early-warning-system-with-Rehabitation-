import React from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

export default function FallCountdownModal({ fallState, onCancelOk, lang = "en" }) {
  if (!fallState || !fallState.countdown_active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="max-w-md w-full bg-red-950 border-2 border-red-500 rounded-2xl p-6 text-center shadow-2xl shadow-red-900/50 animate-urgent-banner">
        <div className="flex justify-center mb-3">
          <ShieldAlert className="w-16 h-16 text-white animate-bounce" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide uppercase">
          {lang === "ta" ? "விழும் எச்சரிக்கை கணக்கீடு!" : "POTENTIAL FALL DETECTED!"}
        </h2>

        <p className="text-sm text-red-100 mt-2">
          {lang === "ta"
            ? "அதிர்வுக்குப் பின் இயக்கம் கண்டறியப்படவில்லை. நீங்கள் நலமா? கீழே உள்ள பொத்தானை அழுத்தவும்."
            : "High impact detected followed by stillness. Are you OK? Tap below to cancel the caregiver alert."}
        </p>

        <div className="my-6">
          <div className="text-6xl font-black text-white font-mono drop-shadow">
            00:{fallState.remaining_seconds < 10 ? `0${fallState.remaining_seconds}` : fallState.remaining_seconds}
          </div>
          <span className="text-xs text-red-200 uppercase tracking-widest mt-1 block">
            {lang === "ta" ? "தானியங்கி அவசர SMS அனுப்ப மீதமுள்ள நேரம்" : "Seconds until emergency caregiver SMS"}
          </span>
        </div>

        <button
          onClick={onCancelOk}
          className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-red-700 font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <span>{lang === "ta" ? "நான் நலமாக உள்ளேன் (ரத்து செய்க)" : "I AM OK (Cancel Alarm)"}</span>
        </button>

        <p className="text-[11px] text-red-300 mt-3 italic">
          {lang === "ta"
            ? "அமைதியாக இருந்தால், தாதா மற்றும் அவசர உதவிக்கு எச்சரிக்கை அனுப்பப்படும்."
            : "If unanswered, SMS alert with GPS/home coordinates will be dispatched to your family caregiver."}
        </p>
      </div>
    </div>
  );
}
