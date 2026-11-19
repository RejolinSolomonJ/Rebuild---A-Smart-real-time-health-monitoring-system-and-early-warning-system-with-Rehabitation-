import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Heart,
  Thermometer,
  ShieldCheck,
  Activity,
  Flame,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from "lucide-react";

export default function AIAssistantView({ person, latestReading, plan, lang = "en" }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      time: "Just now",
      text: lang === "ta"
        ? `வணக்கம் ${person?.name || "ரமேஷ்"}! நான் உங்களின் ReBuild4 AI மறுவாழ்வு உதவியாளர். உங்கள் உடல்நிலைகள் மற்றும் பயிற்சிகள் குறித்த கேள்விகளை கேட்கலாம்.`
        : `Hello ${person?.name || "Ramesh"}! I'm your ReBuild4 Health & Rehabilitation AI Assistant. How can I assist with your recovery, vitals, or exercises today?`
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const quickPrompts = [
    {
      title: lang === "ta" ? "இன்றைய மீட்பு நிலை என்ன?" : "How is my recovery score today?",
      query: "How is my recovery and readiness score today?"
    },
    {
      title: lang === "ta" ? "பயிற்சி செய்யலாமா?" : "Is it safe to exercise right now?",
      query: "Are my current vitals safe to start my rehabilitation exercise?"
    },
    {
      title: lang === "ta" ? "முழங்கால் வலி குறிப்புகள்" : "Tips for knee discomfort relief",
      query: "What gentle precautions should I take for mild knee stiffness?"
    },
    {
      title: lang === "ta" ? "தூக்கத்தின் தாக்கம்" : "How does my sleep affect recovery?",
      query: "How does my 7h 24m sleep duration impact my cardiac recovery?"
    }
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      let replyText = "";
      const q = query.toLowerCase();

      if (q.includes("safe") || q.includes("exercise") || q.includes("start")) {
        const temp = latestReading?.temp || 36.6;
        replyText = `Based on your real-time telemetry, your body temperature is normal at ${temp.toFixed(1)}°C and motion sensor is active. Since pulse sensor is not fitted, ensure you follow your prescribed Borg effort limit (max ${plan?.max_borg_limit || 14}/20). Always perform movements seated and pause if you experience any sharp pain.`;
      } else if (q.includes("recovery") || q.includes("score") || q.includes("readiness")) {
        replyText = `Your estimated Recovery Score is 91% (Optimal). Your average sleep duration (7h 24m) and resting baseline stability indicate great physiological readiness for low-impact physical therapy today.`;
      } else if (q.includes("knee") || q.includes("pain") || q.includes("stiff")) {
        replyText = `For mild knee osteoarthritis, gentle seated knee extensions within a pain-free 30° to 90° arc are recommended by Dr. Kavitha. Apply warm compression if stiff, maintain 3-second hold times, and never force joint extension beyond comfort.`;
      } else if (q.includes("sleep")) {
        replyText = `You achieved 7h 24m of restorative sleep last night with a quality score of 82/100. Consistent circadian rest promotes collagen synthesis and reduces morning autonomic cardiovascular strain.`;
      } else {
        replyText = `I have logged your query against your ReBuild4 clinical record. Your current status is stable with low overall risk score (${latestReading?.risk_score || 8}/100). Please remember to complete your scheduled Seated Knee Extension session when ready!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: replyText
        }
      ]);
      setTyping(false);
    }, 800);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#84cc16]/20 border border-[#84cc16]/40 flex items-center justify-center text-[#84cc16]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === "ta" ? "ReBuild4 AI மருத்துவ உதவியாளர்" : "ReBuild4 AI Health & Rehab Assistant"}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/30">
                ACTIVE
              </span>
            </h1>
            <p className="text-xs text-[#9ca3af]">
              {lang === "ta" ? "உங்களின் நிகழ்நேர உடல்நிலைகள் மற்றும் பிசியோ திட்டத்துடன் இணைக்கப்பட்டது" : "Context-aware conversational intelligence synced with your live vitals"}
            </p>
          </div>
        </div>

        {/* Live Vitals Context Pill */}
        <div className="flex items-center gap-2 bg-[#0e1410] px-3 py-1.5 rounded-xl border border-[#1e2721] text-xs">
          <div className="flex items-center gap-1.5 text-[#a3e635] font-semibold">
            <Thermometer className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>{latestReading?.temp ? `${latestReading.temp.toFixed(1)}°C` : "36.6°C"}</span>
          </div>
          <span className="text-[#374151]">•</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Risk: {latestReading?.risk_score || 8}/100</span>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-[#151c17] border border-[#222e26] rounded-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  m.sender === "user"
                    ? "bg-blue-600/30 border border-blue-500/40 text-blue-300"
                    : "bg-[#84cc16]/20 border border-[#84cc16]/40 text-[#a3e635]"
                }`}
              >
                {m.sender === "user" ? "YOU" : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                    : "bg-[#0e1410] border border-[#222e26] text-[#e5e7eb] rounded-tl-none"
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[10px] ${
                    m.sender === "user" ? "text-blue-200 text-right" : "text-[#6b7280]"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-2 text-xs text-[#a3e635] italic">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>ReBuild4 AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 bg-[#0d120f] border-t border-[#1e2721] overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[10px] text-[#6b7280] font-bold uppercase shrink-0">Suggestions:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="px-2.5 py-1 rounded-lg bg-[#18201a] hover:bg-[#222e25] border border-[#27352b] hover:border-[#84cc16]/40 text-[11px] text-[#9ca3af] hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#111613] border-t border-[#1e2721] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "ta" ? "உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்..." : "Ask AI about recovery, vitals, knee exercises, or safety..."}
            className="flex-1 bg-[#18201a] border border-[#27352b] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16]"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#84cc16] hover:bg-[#9ee838] text-black font-bold transition-all cursor-pointer shadow-md shadow-[#84cc16]/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="p-3 rounded-xl bg-[#111613] border border-[#1e2721] text-[11px] text-[#6b7280] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#84cc16] shrink-0" />
        <span>Clinical Safety Notice: ReBuild4 AI Assistant provides assistive rehabilitation guidance and screening support, not medical diagnosis. Consult Dr. Kavitha for clinical modifications.</span>
      </div>
    </div>
  );
}
