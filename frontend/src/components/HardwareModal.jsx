import React, { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  Usb,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Square,
  Zap,
  Terminal,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function HardwareModal({ isOpen, onClose, lang = "en" }) {
  const [status, setStatus] = useState({
    mode: "simulator",
    connected: false,
    port: "AUTO",
    baud: 9600,
    last_packet_time: null,
    last_raw_line: null,
    last_error: null,
    available_ports: []
  });
  const [selectedPort, setSelectedPort] = useState("AUTO");
  const [selectedBaud, setSelectedBaud] = useState(9600);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/hardware/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.port && data.port !== "AUTO") {
          setSelectedPort(data.port);
        } else if (data.available_ports && data.available_ports.length > 0 && selectedPort === "AUTO") {
          setSelectedPort(data.available_ports[0].port);
        }
        if (data.baud) {
          setSelectedBaud(data.baud);
        }
      }
    } catch (err) {
      console.warn("Failed fetching hardware status:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleConnect = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/hardware/connect?port=${encodeURIComponent(selectedPort)}&baud=${selectedBaud}`, {
        method: "POST"
      });
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        setMsg(lang === "ta" ? `ஹார்டுவேர் வெற்றிகரமாக இணைக்கப்பட்டது: ${data.port}` : `Connected successfully to ${data.port} at ${selectedBaud} baud!`);
      } else if (data.last_error) {
        setMsg(data.last_error);
      } else {
        setMsg(lang === "ta" ? "ஹார்டுவேர் போர்ட் தேடப்படுகிறது... Arduino USB கேபிளை செருகவும்." : "Connecting to port... Ensure Arduino Serial Monitor is closed.");
      }
    } catch (err) {
      setMsg("Connection failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/hardware/disconnect", { method: "POST" });
      const data = await res.json();
      setStatus(data);
      setMsg(lang === "ta" ? "ஹார்டுவேர் துண்டிக்கப்பட்டு சிமுலேட்டர் முறைக்கு மாற்றப்பட்டது." : "Switched to Simulator mode.");
    } catch (err) {
      setMsg("Disconnect failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === "ta" ? "நேரடி ஹார்டுவேர் இணைப்பு மேலாளர்" : "Live Hardware Connection Manager"}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  status.connected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {status.connected ? "HARDWARE ONLINE" : "SIMULATOR ACTIVE"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "ta" ? "Arduino Uno / Nano சாதனத்திலிருந்து நேரடி சென்சார் தரவு பெற" : "Stream telemetry directly from your physical Arduino Uno/Nano"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Connection Controller Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  {lang === "ta" ? "சீரியல் போர்ட் தேர்வு" : "Select Serial COM Port"}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="AUTO">AUTO (Scan & Pick Connected Device)</option>
                    {status.available_ports && status.available_ports.map((p) => (
                      <option key={p.port} value={p.port}>
                        {p.port} - {p.description}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={fetchStatus}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors shrink-0"
                    title="Refresh available COM ports"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  {lang === "ta" ? "பாட் ரேட் (Baud Rate)" : "Baud Rate"}
                </label>
                <select
                  value={selectedBaud}
                  onChange={(e) => setSelectedBaud(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={9600}>9600 (Sentinel LCD - Recommended)</option>
                  <option value={115200}>115200 (ReBuild Standard Firmware)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-end">
              {!status.connected ? (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full sm:w-auto py-2 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? "Connecting..." : (lang === "ta" ? "ஹார்டுவேர் இணை" : "Connect to Hardware")}</span>
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="w-full sm:w-auto py-2 px-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>{loading ? "Disconnecting..." : (lang === "ta" ? "சிமுலேட்டருக்கு மாறு" : "Switch to Simulator")}</span>
                </button>
              )}
            </div>

            {/* Port Busy or Access Notice */}
            {status.last_error && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">
                    {lang === "ta" ? "போர்ட் அணுகல் எச்சரிக்கை (Serial Busy)" : "COM Port Busy / Locked"}
                  </div>
                  <div className="text-[11px] leading-relaxed text-amber-100">{status.last_error}</div>
                </div>
              </div>
            )}

            {/* Notification message */}
            {msg && !status.last_error && (
              <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-200 text-[11px] font-semibold animate-fade-in flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            {/* Detected Ports List */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                {lang === "ta" ? "கணினியில் கண்டறியப்பட்ட போர்ட்டுகள்:" : "Detected USB/COM Ports on this PC:"}
              </span>
              {status.available_ports && status.available_ports.length > 0 ? (
                <div className="space-y-1">
                  {status.available_ports.map((p) => (
                    <div key={p.port} className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">{p.port}</span>
                      <span className="text-slate-300">{p.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-950/30 border border-amber-500/20 p-2.5 rounded text-amber-300 text-[11px]">
                  {lang === "ta"
                    ? "COM போர்ட் எதுவும் கண்டறியப்படவில்லை. தயவுசெய்து Arduino USB கேபிளை செருகவும்."
                    : "No COM ports currently detected. Plug your Arduino Uno or Nano into a USB port on this computer."}
                </div>
              )}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>{lang === "ta" ? "ஹார்டுவேர் தொடங்குவதற்கான 4 எளிய வழிமுறைகள்:" : "Quick 4-Step Hardware Connection Guide:"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-400">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center text-[10px] text-blue-300">1</span>
                  <span>{lang === "ta" ? "USB கேபிளை செருகவும்" : "1. Plug Arduino USB Cable"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Connect your Arduino Uno or Nano board (Silicon Labs CP210x on COM3) to your PC.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-400">
                  <span className="w-4 h-4 rounded-full bg-purple-600/30 border border-purple-500 flex items-center justify-center text-[10px] text-purple-300">2</span>
                  <span>{lang === "ta" ? "Firmware பதிவேற்றவும்" : "2. Flash sentinel_lcdac.ino"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open <code className="text-purple-300 font-mono">sentinel_lcdac.ino</code> in Arduino IDE and click <strong>Upload</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-4 h-4 rounded-full bg-amber-600/30 border border-amber-500 flex items-center justify-center text-[10px] text-amber-300">3</span>
                  <span>{lang === "ta" ? "Serial Monitor ஐ மூடவும்" : "3. Close Arduino Serial Monitor"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-amber-300">CRITICAL:</strong> Close the Arduino IDE Serial Monitor tab. Windows gives <em>Access Denied</em> if two apps open COM3 at the same time.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-4 h-4 rounded-full bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-300">4</span>
                  <span>{lang === "ta" ? "இணைக்கவும்" : "4. Click Connect"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select <strong>9600 Baud</strong> and click <strong>"Connect to Hardware"</strong>. Live sensor readings will stream directly to the dashboard!
                </p>
              </div>
            </div>
          </div>

          {/* Live Packet Raw Stream Preview */}
          {status.connected && (
            <div className="bg-black border border-slate-800 rounded-xl p-3 font-mono space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE HARDWARE DATA PACKET:
                </span>
                <span>Port: {status.port} @ {status.baud || 9600} Baud</span>
              </div>
              <div className="text-slate-200 text-[11px] break-all bg-slate-950 p-2 rounded border border-slate-900">
                {status.last_raw_line || "Waiting for next 1-Hz packet from Arduino..."}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Active Baud Rate: {status.baud || selectedBaud} Baud (8-N-1)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {lang === "ta" ? "மூடு" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
