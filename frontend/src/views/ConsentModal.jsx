import React, { useState } from "react";
import { ShieldCheck, Lock, EyeOff, Check, X } from "lucide-react";

export default function ConsentModal({ onAgree, isOpen, lang = "en" }) {
  if (!isOpen) return null;

  const [dataStore, setDataStore] = useState(true);
  const [cameraLocal, setCameraLocal] = useState(true);
  const [shareCaregiver, setShareCaregiver] = useState(true);

  const handleSave = () => {
    onAgree({
      consent_data_storage: dataStore,
      consent_camera_local_processing: cameraLocal,
      consent_caregiver_share: shareCaregiver,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {lang === "ta" ? "தனியுரிமை & தரவு ஒப்புதல்" : "Informed Consent & Privacy Shield"}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "ta" ? "உங்கள் அனுமதியின்றி எந்த தரவும் சேமிக்கப்படாது." : "You have complete control over your health telemetry and camera data."}
            </p>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-800">
            <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-white block">
                {lang === "ta" ? "உள்ளூர் கேமரா செயலாக்கம் (வீடியோ பதிவேற்றம் இல்லை)" : "Local In-Browser Vision (Zero-Cloud Video)"}
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "ta"
                  ? "கேமரா வீடியோ உங்கள் தொலைபேசியை விட்டு வெளியேறாது. மூட்டு கோணங்கள் மட்டுமே உள்நாட்டில் கணக்கிடப்படும்."
                  : "MoveSafe processes body pose entirely inside your browser. No video frames or images are ever uploaded or stored."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={cameraLocal}
              onChange={(e) => setCameraLocal(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-800">
            <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-white block">
                {lang === "ta" ? "உடல்நல தரவு சேமிப்பு (சென்டினல்)" : "Resting Vitals & Baseline Storage"}
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "ta"
                  ? "இதயத் துடிப்பு மற்றும் வெப்பநிலை போக்குகளை அறிய தரவு பாதுகாப்பாக சேமிக்கப்படும்."
                  : "Store 1-Hz vitals to learn your personal baseline and detect gradual health drift."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={dataStore}
              onChange={(e) => setDataStore(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-white block">
                {lang === "ta" ? "குடும்ப தாதா அவசர பகிர்வு" : "Caregiver & Clinician Connection"}
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "ta"
                  ? "விழுதல் அல்லது அசாதாரண நிலையின் போது நியமிக்கப்பட்ட தாதாவுக்கு SMS எச்சரிக்கை அனுப்ப ஒப்புதல்."
                  : "Dispatch SMS alerts to designated family caregiver (Anita) during confirmed falls or acute risks."}
              </p>
            </div>
            <input
              type="checkbox"
              checked={shareCaregiver}
              onChange={(e) => setShareCaregiver(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{lang === "ta" ? "ஒப்புக்கொண்டு தொடரவும்" : "Accept Consent & Continue"}</span>
        </button>
      </div>
    </div>
  );
}
