import React, { useState, useEffect } from "react";
import { FileText, Download, X, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";

export default function WeeklyReportModal({ isOpen, onClose, person, lang = "en" }) {
  if (!isOpen) return null;

  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetch("/api/persons/1/report/weekly?format=json")
      .then((res) => res.json())
      .then((data) => setReportData(data))
      .catch((err) => console.warn("Failed to fetch report JSON:", err));
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/persons/1/report/weekly?format=pdf");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ReBuild_Weekly_Report_${(person?.name || "Ramesh").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === "ta" ? "மருத்துவ வார அறிக்கை" : "Weekly Clinical & Rehabilitation Report"}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "ta" ? "7-நாள் அடிப்படை நிலை மற்றும் தற்போதைய வார போக்குகள்" : "7-Day Personal Baseline vs Current Week Comparison"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            1. Physiological Vitals Trajectory
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Biomarker</th>
                  <th className="p-3">7-Day Baseline</th>
                  <th className="p-3">This Week Avg</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                <tr>
                  <td className="p-3 font-semibold">Resting Heart Rate</td>
                  <td className="p-3 text-slate-400">72.0 ± 6.0 BPM</td>
                  <td className="p-3 font-bold text-white">74.2 BPM (+2.8%)</td>
                  <td className="p-3 text-emerald-400">Stable</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Body Temperature</td>
                  <td className="p-3 text-slate-400">36.60 ± 0.35 °C</td>
                  <td className="p-3 font-bold text-white">36.65 °C (+0.05 °C)</td>
                  <td className="p-3 text-emerald-400">Afebrile</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Daily Inactivity Index</td>
                  <td className="p-3 text-slate-400">4.2 hrs / day</td>
                  <td className="p-3 font-bold text-white">4.5 hrs / day</td>
                  <td className="p-3 text-slate-300">Normal Mobility</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* MoveSafe Adherence Card */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. MoveSafe Rehabilitation & Adherence Trend
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Weekly Score</span>
              <span className="text-xl font-bold text-blue-400">88.5 / 100</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Sessions Completed</span>
              <span className="text-xl font-bold text-emerald-400">5 / 5 Target</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Valid Rep Ratio</span>
              <span className="text-xl font-bold text-white">92%</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Safe Pauses</span>
              <span className="text-xl font-bold text-amber-400">1 (Resolved)</span>
            </div>
          </div>
        </div>

        {/* Download PDF Action */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 max-w-sm">
            PDF report formatted for clinical consultation with primary care physicians.
          </p>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating PDF..." : "Download Doctor's PDF Report"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
