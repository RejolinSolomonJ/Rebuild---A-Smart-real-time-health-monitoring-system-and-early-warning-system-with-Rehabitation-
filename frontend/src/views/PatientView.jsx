import React from "react";
import {
  Heart,
  Thermometer,
  Footprints,
  Clock,
  CheckCircle,
  Volume2,
  Droplets,
  Radio,
  Shield,
  Activity
} from "lucide-react";
import KinoraHeroOverview from "../components/KinoraHeroOverview";
import KinoraActivityRings from "../components/KinoraActivityRings";
import KinoraDonutCard from "../components/KinoraDonutCard";
import KinoraSleepChart from "../components/KinoraSleepChart";
import KinoraHeartRateChart from "../components/KinoraHeartRateChart";
import KinoraUpcomingWorkouts from "../components/KinoraUpcomingWorkouts";
import SentinelLcdDisplay from "../components/SentinelLcdDisplay";
import RecommendationCard from "../components/RecommendationCard";
import VitalChart from "../components/VitalChart";

export default function PatientView({
  person,
  latestReading,
  readingHistory,
  plan,
  alerts,
  onStartSession,
  onReportOk,
  onTriggerPrompt,
  onRefreshPlan,
  onOpenTelemetry,
  lang = "en"
}) {
  const hrOk = Boolean(latestReading && latestReading.hr_ok && Number(latestReading.hr) > 0);
  const hr = hrOk ? latestReading.hr : null;
  const temp = typeof latestReading?.temp === "number" ? latestReading.temp.toFixed(1) : (Number(latestReading?.temp) || 36.6).toFixed(1);
  const humidity = typeof latestReading?.humidity === "number" ? latestReading.humidity.toFixed(1) : (Number(latestReading?.humidity) || 52.0).toFixed(1);
  const idleMins = latestReading ? Math.floor((latestReading.idle_s || 0) / 60) : 0;
  const idleSecs = latestReading ? (latestReading.idle_s || 0) % 60 : 0;
  const motion = latestReading ? latestReading.motion === 1 : false;
  const isLowSignal = latestReading ? Boolean(latestReading.low_signal) : false;

  return (
    <div className="space-y-6">
      {/* 1. Heartbeat Disconnected Warning Banner */}
      {!hrOk && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-3.5 flex items-center justify-between text-rose-200 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">
              {lang === "ta"
                ? "இதயத் துடிப்பு உணரி இணைக்கப்படவில்லை: துடிப்பு உணரியை விரலில் சரியாக பொருத்தவும்."
                : "Heartbeat sensor is not connected. Please attach the pulse sensor to your finger."}
            </span>
          </div>
          <span className="text-[10px] bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-lg text-rose-300 font-bold shrink-0">
            {lang === "ta" ? "துடிப்பு உணரி இல்லை" : "Sensor Disconnected"}
          </span>
        </div>
      )}

      {/* 2. Low Signal / Movement Artifact Banner */}
      {isLowSignal && hrOk && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between text-amber-200 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="font-semibold">
              {lang === "ta"
                ? "குறைந்த சமிக்ஞை / கை அசைவு கண்டறியப்பட்டது; துடிப்பு உணரியை சரிசெய்யவும்."
                : "Low signal or arm movement artifact detected; adjust the pulse sensor on your finger."}
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
            Cardiac alerts paused
          </span>
        </div>
      )}

      {/* 3. ROW 1: Kinora Hero Overview, Concentric Activity Rings, Calories Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Fitness / Health Overview Hero (spans 5 cols) */}
        <div className="lg:col-span-5 min-h-[300px]">
          <KinoraHeroOverview
            person={person}
            latestReading={latestReading}
            lang={lang}
          />
        </div>

        {/* Activity Progress Multi-Rings (spans 4 cols) */}
        <div className="lg:col-span-4 min-h-[300px]">
          <KinoraActivityRings lang={lang} />
        </div>

        {/* Calories & Macros / Recovery Donut (spans 3 cols) */}
        <div className="lg:col-span-3 min-h-[300px]">
          <KinoraDonutCard lang={lang} />
        </div>
      </div>

      {/* 4. ROW 2: Sleep/Stillness Tracking, Weekly Heart Rate Curve, Upcoming Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Sleep / Stillness Tracking (Cylindrical Neon Bars) */}
        <KinoraSleepChart lang={lang} />

        {/* Heart Rate Weekly Spline Graph */}
        <KinoraHeartRateChart
          latestReading={latestReading}
          readings={readingHistory}
          lang={lang}
        />

        {/* Upcoming Workouts / Rehabilitation Exercises */}
        <KinoraUpcomingWorkouts
          plan={plan}
          onStartSession={onStartSession}
          lang={lang}
        />
      </div>

      {/* 5. Live Telemetry Quick Pills Bar & Safety Actions */}
      <div className="bg-[#131915] border border-[#202b23] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Mini 5-Vital Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Temperature */}
          <div className="flex items-center gap-2 bg-[#18211b] border border-[#25332a] px-3 py-1.5 rounded-xl">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-[#9ca3af]">Temp:</span>
            <span className="text-xs font-bold text-white">{temp}°C</span>
          </div>

          {/* Humidity (DHT22) */}
          <div className="flex items-center gap-2 bg-[#18211b] border border-[#25332a] px-3 py-1.5 rounded-xl">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-[#9ca3af]">Humidity:</span>
            <span className="text-xs font-bold text-white">{humidity}%</span>
          </div>

          {/* Room Motion */}
          <div className="flex items-center gap-2 bg-[#18211b] border border-[#25332a] px-3 py-1.5 rounded-xl">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-[#9ca3af]">Motion:</span>
            <span className={`text-xs font-bold ${motion ? "text-[#84cc16]" : "text-[#9ca3af]"}`}>
              {motion ? "Active" : "Still"}
            </span>
          </div>

          {/* Stillness / Idle Time */}
          <div className="flex items-center gap-2 bg-[#18211b] border border-[#25332a] px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-[#9ca3af]">Stillness:</span>
            <span className="text-xs font-bold text-white">{idleMins}m {idleSecs}s</span>
          </div>
        </div>

        {/* Safety Buttons: I AM OK & Buzzer Test */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTelemetry}
            className="flex items-center gap-1.5 bg-[#84cc16]/10 hover:bg-[#84cc16]/20 border border-[#84cc16]/30 px-3 py-2 rounded-xl text-xs font-bold text-[#a3e635] transition-colors cursor-pointer"
            title="Inspect real-time data separately by dropdown"
          >
            <Radio className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>{lang === "ta" ? "சென்சார் வாரியாக பார்" : "Inspect by Sensor"}</span>
          </button>

          <button
            onClick={onReportOk}
            className="py-2 px-4 bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1411] font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle className="w-4 h-4 fill-current" />
            <span>{lang === "ta" ? "நான் நலமாக உள்ளேன்" : "I AM OK"}</span>
          </button>

          <button
            onClick={onTriggerPrompt}
            title="Trigger gentle movement buzzer test"
            className="p-2 bg-[#18211b] hover:bg-[#202b23] text-[#9ca3af] hover:text-white rounded-xl border border-[#25332a] transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#84cc16]" />
          </button>
        </div>
      </div>

      {/* 6. ROW 3: Authentic Sentinel 16x2 LCD Display Emulator & Serial Monitor */}
      <SentinelLcdDisplay latestReading={latestReading} lang={lang} />

      {/* 7. AI Rehabilitation Recommendation Card */}
      <RecommendationCard
        person={person}
        latestReading={latestReading}
        onPlanApplied={onRefreshPlan}
        lang={lang}
      />

      {/* 8. 10-Minute Real-Time Trajectory Chart */}
      <VitalChart readings={readingHistory} lang={lang} />
    </div>
  );
}
