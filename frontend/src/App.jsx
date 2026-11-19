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
