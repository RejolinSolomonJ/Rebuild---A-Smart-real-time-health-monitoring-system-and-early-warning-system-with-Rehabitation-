import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import DisclaimerBanner from "./components/DisclaimerBanner";
import FallCountdownModal from "./components/FallCountdownModal";
import PatientView from "./views/PatientView";
import CaregiverView from "./views/CaregiverView";
import PhysioView from "./views/PhysioView";
import HealthWorkerView from "./views/HealthWorkerView";
import MoveSafeSession from "./views/MoveSafeSession";
import WeeklyReportModal from "./views/WeeklyReportModal";
import ConsentModal from "./views/ConsentModal";
import LiveSimulatorBar from "./components/LiveSimulatorBar";
import ScreeningTestsModal from "./components/ScreeningTestsModal";
import HardwareModal from "./components/HardwareModal";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import RealTimeDataView from "./views/RealTimeDataView";
import AIAssistantView from "./views/AIAssistantView";
import ActivityView from "./views/ActivityView";
import WorkoutsView from "./views/WorkoutsView";
import VitalsHealthView from "./views/VitalsHealthView";
import SleepRestView from "./views/SleepRestView";
import SentinelNodeView from "./views/SentinelNodeView";
import ProgressView from "./views/ProgressView";
import SettingsView from "./views/SettingsView";
import LoginModal from "./views/LoginModal";
import MobileBottomNav from "./components/MobileBottomNav";
import { Zap, X, ChevronRight, AlertOctagon, AlertTriangle, CheckCircle } from "lucide-react";
import { audioAlerts } from "./rehab/vitalRehabEngine";

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    username: "ramesh",
    role: "patient"
  });
  const [currentRole, setCurrentRole] = useState("patient");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile defaults closed; desktop handles cleanly
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [lang, setLang] = useState("en");
  const [wsConnected, setWsConnected] = useState(false);

  // Modals & Sub-views
  const [showLogin, setShowLogin] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showScreening, setShowScreening] = useState(false);
  const [showHardware, setShowHardware] = useState(false);
  const [activeSession, setActiveSession] = useState(false);

  // Application Data States
  const [person, setPerson] = useState({
    id: 1,
    name: "Ramesh Kumar",
    age: 68,
    conditions: "Hypertension, Mild knee osteoarthritis",
    profile_type: "elderly",
    caregiver_name: "Anita (Daughter)",
    caregiver_phone: "+919876543210"
  });

  const [latestReading, setLatestReading] = useState({
    hr: 72,
    hr_ok: true,
    temp: 36.6,
    humidity: 52.0,
    motion: 1,
    idle_s: 0,
    vib: 2,
    impact: 0,
    arm: 0,
    system_state: "S_NORMAL",
    raw_serial_line: "T=36.6,H=52.0,HR=72,HR_OK=1,MOT=1,IDLE=0,VIB=2,IMP=0,STATE=S_NORMAL",
    low_signal: false,
    risk_score: 18,
    risk_band: "green",
    risk_reason: "Vitals are resting stably within your personal 7-day baseline."
  });

  const [readingHistory, setReadingHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [fallState, setFallState] = useState({
    state: "IDLE",
    countdown_active: false,
    remaining_seconds: 0,
    log: ""
  });

  // WebSocket Reference
  const wsRef = useRef(null);

  // Autonomous Adaptation State
  const [autoNotification, setAutoNotification] = useState(null);
  const autoDismissTimerRef = useRef(null);

  const triggerAutoNotification = (data) => {
    if (!data) return;
    const cat = data.category || data.overall_category || "GREEN";
    try {
      audioAlerts.play(cat);
    } catch (_) {}

    setAutoNotification({
      id: Date.now(),
      category: cat,
      tier_name: data.tier_name || "Autonomous Adaptive Routine",
      trigger_parameter: data.trigger_parameter || "vitals",
      advice: data.advice || "",
      prescribed_exercises: data.prescribed_exercises || [],
      notifications: data.notifications || [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    });

    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    autoDismissTimerRef.current = setTimeout(() => {
      setAutoNotification(null);
    }, 12000);
  };

  const fetchPlan = () => {
    fetch("/api/persons/1/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data) setPlan(data);
      })
      .catch((e) => console.warn("Failed fetching plan:", e));
  };

  // --- Initial Data Load ---
  useEffect(() => {
    // 1. Fetch Person Details
    fetch("/api/persons")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) setPerson(data[0]);
      })
      .catch((e) => console.warn("Failed fetching person:", e));

    // 2. Check Consent Status
    fetch("/api/persons/1/consent")
      .then((r) => r.json())
      .then((data) => {
        if (!data) setShowConsent(true);
      })
      .catch(() => setShowConsent(false));

    // 3. Fetch Plan
    fetchPlan();

    // 4. Fetch Initial Readings & Alerts
    fetch("/api/readings/history?minutes=10")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setReadingHistory(data);
          setLatestReading(data[data.length - 1]);
        }
      })
      .catch((e) => console.warn("Failed fetching history:", e));

    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(data || []))
      .catch((e) => console.warn("Failed fetching alerts:", e));
  }, []);

  // --- WebSocket Connection with Auto-Reconnect ---
  useEffect(() => {
    let reconnectTimer = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "telemetry" && payload.reading) {
            setLatestReading(payload.reading);
            setReadingHistory((prev) => [...prev.slice(-100), payload.reading]);

            if (payload.fall_state) {
              setFallState(payload.fall_state);
            }

            if (payload.auto_plan) {
              if (payload.auto_plan.updated) {
                fetchPlan();
                triggerAutoNotification(payload.auto_plan);
              }
            }
          } else if (payload.type === "auto_plan_notification") {
            fetchPlan();
            triggerAutoNotification(payload);
          } else if (payload.type === "fall_cancelled") {
            setFallState(payload.fall_state);
          }
        } catch (err) {
          console.warn("WS Parse error:", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // --- Role & Tab Switch Handlers ---
  const handleSwitchRole = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === "caregiver") {
      setCurrentUser({ id: 2, username: "anita", role: "caregiver" });
      setActiveTab("caregivers");
      setActiveSession(false);
    } else if (newRole === "physio") {
      setCurrentUser({ id: 3, username: "dr_kavitha", role: "physio" });
      setActiveTab("physio");
      setActiveSession(false);
    } else {
      setCurrentUser({ id: 1, username: "ramesh", role: "patient" });
      setActiveTab("dashboard");
      setActiveSession(false);
    }
  };

  const handleLoginSuccess = (userData, role) => {
    const assignedRole = role || userData.role || "patient";
    setCurrentUser(userData);
    setCurrentRole(assignedRole);
    setShowLogin(false);
    if (assignedRole === "caregiver") {
      setActiveTab("caregivers");
    } else if (assignedRole === "physio") {
      setActiveTab("physio");
    } else {
      setActiveTab("dashboard");
    }
    setActiveSession(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "caregivers") {
      setCurrentRole("caregiver");
      setActiveSession(false);
    } else if (tab === "physio") {
      setCurrentRole("physio");
      setActiveSession(false);
    } else if (tab === "workouts") {
      setActiveSession(false);
    } else if (tab === "settings") {
      setShowHardware(true);
    } else if (tab === "dashboard" || tab === "telemetry" || tab === "ai_assistant" || tab === "activity" || tab === "nutrition" || tab === "sleep" || tab === "health" || tab === "progress") {
      setActiveSession(false);
    }
  };

  // --- Actions ---
  const handleReportOk = async () => {
    try {
      await fetch("/api/persons/1/ok", { method: "POST" });
      setFallState({
        state: "CANCELLED",
        countdown_active: false,
        remaining_seconds: 0,
        log: "User tapped I am OK."
      });
    } catch (e) {
      console.error("Failed to cancel alarm:", e);
    }
  };

  const handleTriggerPrompt = async () => {
    try {
      await fetch("/api/persons/1/prompt", { method: "POST" });
    } catch (e) {
      console.error("Failed to dispatch movement prompt:", e);
    }
  };

  const handleAckAlert = async (id) => {
    try {
      await fetch(`/api/alerts/${id}/ack`, { method: "POST" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
    } catch (e) {
      console.error("Failed ack alert:", e);
    }
  };

  const handleSavePlan = async (updatedPlan) => {
    try {
      const res = await fetch("/api/persons/1/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlan),
      });
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      console.error("Failed save plan:", e);
    }
  };

  const handleConsentAgree = async (consentPayload) => {
    try {
      await fetch("/api/consent?person_id=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consentPayload),
      });
      setShowConsent(false);
    } catch (e) {
      setShowConsent(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0c100d] text-slate-100 overflow-x-hidden relative">
      {/* 1. Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Mobile Drawer Sidebar (Shown on mobile when sidebarOpen is true) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentRole={currentRole}
          onRoleChange={handleSwitchRole}
          currentUser={currentUser}
          onOpenLogin={() => {
            setShowLogin(true);
            setSidebarOpen(false);
          }}
          onCloseSidebar={() => setSidebarOpen(false)}
          streakDays={12}
          lang={lang}
        />
      </div>

      {/* 3. Desktop Static Sidebar */}
      {desktopSidebarOpen && (
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            currentRole={currentRole}
            onRoleChange={handleSwitchRole}
            currentUser={currentUser}
            onOpenLogin={() => setShowLogin(true)}
            streakDays={12}
            lang={lang}
          />
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          person={person}
          currentUser={currentUser}
          currentRole={currentRole}
          latestReading={latestReading}
          onOpenLogin={() => setShowLogin(true)}
          onSwitchRole={handleSwitchRole}
          onOpenHardware={() => setShowHardware(true)}
          onOpenReport={() => setShowReport(true)}
          onOpenScreening={() => setShowScreening(true)}
          onOpenTelemetry={() => {
            setActiveTab("telemetry");
            setActiveSession(false);
          }}
          lang={lang}
          onLangToggle={() => setLang((prev) => (prev === "en" ? "ta" : "en"))}
          hardwareConnected={wsConnected}
          onToggleSidebar={() => {
            // If on mobile, toggle mobile drawer; if on desktop, toggle desktop sidebar
            if (window.innerWidth < 1024) {
              setSidebarOpen((prev) => !prev);
            } else {
              setDesktopSidebarOpen((prev) => !prev);
            }
          }}
          sidebarOpen={desktopSidebarOpen}
        />

        {/* In-App Live Simulator Control Bar */}
        <LiveSimulatorBar lang={lang} />

        {/* Mandatory Medical Disclaimer Banner */}
        <DisclaimerBanner lang={lang} />

        {/* Urgent Fall Countdown Alarm Banner Modal */}
        <FallCountdownModal
          fallState={fallState}
          onCancelOk={handleReportOk}
          lang={lang}
        />

        {/* Floating Autonomous Vital Adaptation Notification Banner */}
        {autoNotification && (
          <div className="px-3 sm:px-5 lg:px-7 pt-3">
            <div
              className={`rounded-2xl p-4 border transition-all duration-300 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in ${
                autoNotification.category === "RED"
                  ? "bg-[#200d0d] border-red-500/70 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                  : autoNotification.category === "YELLOW"
                  ? "bg-[#20180d] border-amber-500/70 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                  : "bg-[#0d1d13] border-emerald-500/70 text-emerald-200 shadow-[0_0_30px_rgba(34,197,94,0.25)]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    autoNotification.category === "RED"
                      ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                      : autoNotification.category === "YELLOW"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {autoNotification.category === "RED" ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : autoNotification.category === "YELLOW" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded tracking-wide bg-black/40 border border-white/10">
                      ⚡ Complete Automation
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                        autoNotification.category === "RED"
                          ? "bg-red-500 text-black font-extrabold"
                          : autoNotification.category === "YELLOW"
                          ? "bg-amber-400 text-black font-extrabold"
                          : "bg-emerald-400 text-black font-extrabold"
                      }`}
                    >
                      {autoNotification.category} Category
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {autoNotification.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white">
                    {autoNotification.tier_name}
                  </h3>

                  <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
                    {autoNotification.advice}
                  </p>

                  {autoNotification.prescribed_exercises?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-stone-400">
                      <span className="text-white font-semibold">Auto-Assigned Session:</span>
                      {autoNotification.prescribed_exercises.map((ex, i) => (
                        <span
                          key={ex.id || i}
                          className="bg-black/30 border border-white/10 px-2 py-0.5 rounded text-[11px] text-stone-200"
                        >
                          {i + 1}. {ex.name} ({ex.default_sets || 2} sets × {ex.default_reps || 8} reps)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    setActiveTab("workouts");
                    setActiveSession(false);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Prescribed Routine</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setAutoNotification(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body Content Based on Active Tab / Role */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
          {activeSession ? (
            <MoveSafeSession
              person={person}
              plan={plan}
              latestReading={latestReading}
              onFinishSession={() => {
                setActiveSession(false);
                fetchPlan();
              }}
              onCancel={() => setActiveSession(false)}
              lang={lang}
            />
          ) : activeTab === "telemetry" ? (
            <RealTimeDataView
              latestReading={latestReading}
              readingHistory={readingHistory}
              person={person}
              onReportOk={handleReportOk}
              lang={lang}
            />
          ) : activeTab === "ai_assistant" ? (
            <AIAssistantView
              person={person}
              latestReading={latestReading}
              plan={plan}
              lang={lang}
            />
          ) : activeTab === "activity" ? (
            <ActivityView
              latestReading={latestReading}
              lang={lang}
            />
          ) : activeTab === "workouts" ? (
            <WorkoutsView
              plan={plan}
              onStartSession={() => setActiveSession(true)}
              latestReading={latestReading}
              readingHistory={readingHistory}
              lang={lang}
            />
          ) : activeTab === "nutrition" ? (
            <VitalsHealthView
              latestReading={latestReading}
              lang={lang}
            />
          ) : activeTab === "sleep" ? (
            <SleepRestView
              lang={lang}
            />
          ) : activeTab === "health" ? (
            <SentinelNodeView
              latestReading={latestReading}
              onOpenHardware={() => setShowHardware(true)}
              lang={lang}
            />
          ) : activeTab === "progress" ? (
            <ProgressView
              person={person}
              onOpenReport={() => setShowReport(true)}
              onOpenScreening={() => setShowScreening(true)}
              lang={lang}
            />
          ) : activeTab === "caregivers" ? (
            <CaregiverView
              person={person}
              latestReading={latestReading}
              alerts={alerts}
              onAckAlert={handleAckAlert}
              lang={lang}
            />
          ) : activeTab === "physio" ? (
            <PhysioView
              plan={plan}
              onSavePlan={handleSavePlan}
              lang={lang}
            />
          ) : activeTab === "settings" ? (
            <SettingsView
              person={person}
              lang={lang}
              onLangToggle={() => setLang((prev) => (prev === "en" ? "ta" : "en"))}
              onOpenHardware={() => setShowHardware(true)}
            />
          ) : (
            <PatientView
              person={person}
              latestReading={latestReading}
              readingHistory={readingHistory}
              plan={plan}
              alerts={alerts}
              onStartSession={() => setActiveSession(true)}
              onReportOk={handleReportOk}
              onTriggerPrompt={handleTriggerPrompt}
              onRefreshPlan={fetchPlan}
              onOpenTelemetry={() => {
                setActiveTab("telemetry");
                setActiveSession(false);
              }}
              lang={lang}
            />
          )}
        </main>

        {/* 4. Mobile Bottom Navigation Bar (Visible only on mobile screens < lg) */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentRole={currentRole}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          lang={lang}
        />

        {/* 5. Dedicated Multi-Role Login Modal */}
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          currentUser={currentUser}
          lang={lang}
        />

        {/* 6. Weekly Clinical Report Modal */}
        <WeeklyReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          person={person}
          lang={lang}
        />

        {/* 7. Consent Dialog (Privacy Shield) */}
        <ConsentModal
          isOpen={showConsent}
          onAgree={handleConsentAgree}
          lang={lang}
        />

        {/* 8. Clinical Screening Tests (CDC STEADI: 30s Chair Stand & TUG) */}
        <ScreeningTestsModal
          isOpen={showScreening}
          onClose={() => setShowScreening(false)}
          person={person}
          lang={lang}
        />

        {/* 9. Live Hardware Serial Link Manager */}
        <HardwareModal
          isOpen={showHardware}
          onClose={() => setShowHardware(false)}
          lang={lang}
        />

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-[#4b5563] border-t border-[#18201a] mb-14 lg:mb-0">
          ReBuild4 Unified Platform • Team Preva
        </footer>
      </div>
    </div>
  );
}
