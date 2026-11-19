import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Stethoscope,
  KeyRound,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
  ArrowRight,
  X
} from "lucide-react";

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  lang = "en"
}) {
  const [selectedRole, setSelectedRole] = useState("patient");
  const [username, setUsername] = useState("ramesh");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const roles = [
    {
      id: "patient",
      title: lang === "ta" ? "பயனாளி / நோயாளி" : "User / Patient",
      subtitle: lang === "ta" ? "ரமேஷ் குமார் (68 வயது)" : "Ramesh Kumar (Age 68)",
      defaultUsername: "ramesh",
      defaultPin: "1234",
      icon: User,
      color: "from-lime-500/20 to-emerald-500/10 border-[#84cc16]/40 text-[#a3e635]",
      badge: "Patient Portal",
      accent: "#84cc16",
      description: lang === "ta"
        ? "தினசரி உடல்நிலைகள், AI உதவியாளர், மறுவாழ்வு பயிற்சிகள் & முன்னேற்றம்."
        : "Daily vitals, AI assistant, rehabilitation exercises & personal recovery tracking."
    },
    {
      id: "caregiver",
      title: lang === "ta" ? "பராமரிப்பாளர்" : "Caretaker / Caregiver",
      subtitle: lang === "ta" ? "அனிதா (மகள்)" : "Anita (Daughter)",
      defaultUsername: "anita",
      defaultPin: "1234",
      icon: ShieldCheck,
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400",
      badge: "Caregiver Hub",
      accent: "#60a5fa",
      description: lang === "ta"
        ? "நேரலை பாதுகாப்பு விழிப்பூட்டல்கள், வீழ்ச்சி எச்சரிக்கை & அவசர உதவி."
        : "Real-time safety alerts, fall notifications, remote status & emergency escalations."
    },
    {
      id: "physio",
      title: lang === "ta" ? "மருத்துவர் / பிசியோதெரபிஸ்ட்" : "Doctor / Physiotherapist",
      subtitle: lang === "ta" ? "டாக்டர் கவிதா PT" : "Dr. Kavitha PT",
      defaultUsername: "dr_kavitha",
      defaultPin: "1234",
      icon: Stethoscope,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400",
      badge: "Clinical Practice",
      accent: "#c084fc",
      description: lang === "ta"
        ? "பயிற்சிகள் பரிந்துரை, கோண வரம்புகள் சரிபார்த்தல் & மருத்துவ அறிக்கைகள்."
        : "Prescribe exercises, adjust target angles/reps, review biomechanics & clinical reports."
    }
  ];

  const handleSelectRole = (r) => {
    setSelectedRole(r.id);
    setUsername(r.defaultUsername);
    setPin(r.defaultPin);
    setError(null);
  };

  const handleQuickLogin = async (roleId) => {
    const roleConfig = roles.find((r) => r.id === roleId);
    if (!roleConfig) return;
    executeLogin(roleConfig.defaultUsername, roleConfig.defaultPin, roleConfig.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(username, pin, selectedRole);
  };

  const executeLogin = async (u, p, expectedRole) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_phone: u.trim(),
          pin: p.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Authentication failed. Check username and PIN.");
      }

      const userData = await res.json();
      onLoginSuccess(userData, userData.role || expectedRole);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const activeRoleObj = roles.find((r) => r.id === selectedRole) || roles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111613] border border-[#232f27] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-8">
        {/* Close Button if user is already logged in */}
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#18201a] text-[#9ca3af] hover:text-white hover:bg-[#202b23] border border-[#27352b] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84cc16]/10 border border-[#84cc16]/30 text-[#a3e635] text-xs font-mono font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>SECURE MULTI-ROLE ACCESS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            ReBuild4 <span className="text-[#84cc16]">Portal Login</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1 max-w-md mx-auto">
            {lang === "ta"
              ? "உங்கள் அணுகல் உரிமத்திற்குரிய கணக்கைத் தேர்ந்தெடுக்கவும் அல்லது நேரடி உள்நுழைவை பயன்படுத்தவும்."
              : "Select your role to view specialized clinical monitoring, safety telemetry, or rehab tools."}
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? `bg-[#16211a] border-[#84cc16] shadow-[0_0_20px_rgba(132,204,22,0.25)] ring-1 ring-[#84cc16]`
                    : "bg-[#141b16] border-[#222e25] hover:border-[#2f3f33] hover:bg-[#18201a]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: isSelected ? `${r.accent}20` : "#1a241d",
                        borderColor: isSelected ? r.accent : "#28372b",
                        color: r.accent
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#84cc16]" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white mb-0.5">{r.title}</h3>
                  <p className="text-[11px] text-[#9ca3af] font-medium">{r.subtitle}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1f2b21]">
                  <span className="text-[10px] font-mono text-[#6b7280] block">
                    PIN: {r.defaultPin}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(r.id);
                    }}
                    className="w-full mt-2 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#1d2720] hover:bg-[#84cc16] text-[#a3e635] hover:text-[#0c100d] border border-[#27352b] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>1-Click Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Brief Description */}
        <div className="mb-6 p-3.5 rounded-2xl bg-[#141b16] border border-[#222e25] flex items-start gap-3 text-xs text-[#9ca3af]">
          <Sparkles className="w-4 h-4 text-[#84cc16] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">{activeRoleObj.title}:</span>
            <span>{activeRoleObj.description}</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">
                {lang === "ta" ? "பயனர்பெயர் / தொலைபேசி" : "Username or Phone"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ramesh or +91..."
                  className="w-full bg-[#161d18] border border-[#27352b] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">
                {lang === "ta" ? "4 இலக்க பின் (PIN)" : "4-Digit PIN Code"}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-[#161d18] border border-[#27352b] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white tracking-widest placeholder-[#6b7280] focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#84cc16] hover:bg-[#99e71c] text-[#0c100d] shadow-[0_0_20px_rgba(132,204,22,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-[#0c100d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>
                  {lang === "ta" ? "கணக்கில் நுழையவும்" : `Sign In as ${activeRoleObj.title}`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Security & Non-diagnostic disclaimer footer */}
        <p className="mt-4 text-[10px] text-center text-[#6b7280] leading-relaxed">
          ReBuild4 Clinical Platform • All patient telemetry is securely conditioned on-device with zero biometric video transmission.
        </p>
      </div>
    </div>
  );
}
