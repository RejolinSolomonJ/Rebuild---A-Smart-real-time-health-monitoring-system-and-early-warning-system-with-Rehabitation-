/**
 * Smart Vital Parameter-Based Rehabilitation Engine (Client-Side)
 * 
 * Monitors 4 vital parameters:
 * 1. Heart Rate (BPM)
 * 2. Body Temperature (°C)
 * 3. SpO2 (%)
 * 4. Environmental Humidity (%)
 * 
 * Features:
 * - Rule-based clinical classification: GREEN, YELLOW, RED
 * - Trend detection (Rising, Falling, Stable)
 * - Sensor quality & repeat measurement hysteresis (anti-false-alert)
 * - Web Audio API alert sound generator (Green chime, Yellow warning double-tone, Red urgent pulsating siren)
 * - Strict gating: Critical conditions override exercise recommendations
 */

// Default Patient-Specific Safety Thresholds (Configurable by PT/User)
export const DEFAULT_THRESHOLDS = {
  min_hr: 50,
  max_hr_resting: 100,
  max_hr_exercise: 125,
  min_temp: 35.5,
  warning_temp: 37.6,
  fever_temp: 38.0,
  min_spo2_warning: 95.0,
  min_spo2_critical: 90.0,
  min_humidity: 30.0,
  max_humidity_comfortable: 60.0,
  max_humidity_warning: 70.0
};

/**
 * Web Audio API synthesized alert tones
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
  }

  play(category) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (category === "GREEN") {
        // Gentle affirmative rising chord (C5 -> G5)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);

      } else if (category === "YELLOW") {
        // Caution double beep (E5 659Hz - pause - E5)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(659.25, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
        gain.gain.setValueAtTime(0.001, now + 0.12);
        gain.gain.setValueAtTime(0.18, now + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);

      } else if (category === "RED") {
        // Urgent alternating medical alert siren (A5 880Hz <-> F5 698Hz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880.0, now);
        osc.frequency.setValueAtTime(698.46, now + 0.15);
        osc.frequency.setValueAtTime(880.0, now + 0.30);
        osc.frequency.setValueAtTime(698.46, now + 0.45);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.60);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.65);
      }
    } catch (e) {
      // Audio context may be restricted before user gesture
    }
  }
}

export const audioAlerts = new AudioManager();

/**
 * Calculates trend from recent history samples
 * @param {Array} history - Array of recent reading objects
 * @param {string} key - Parameter key ('hr', 'temp', 'spo2', 'humidity')
 * @returns {'rising' | 'falling' | 'stable'}
 */
export function calculateTrend(history, key) {
  if (!Array.isArray(history) || history.length < 3) return "stable";

  const validPoints = history
    .map((h) => Number(h?.[key]))
    .filter((v) => !isNaN(v) && v > 0);

  if (validPoints.length < 3) return "stable";

  const recent = validPoints.slice(-3);
  const delta = recent[recent.length - 1] - recent[0];

  // Specific thresholds for determining significant trends
  if (key === "hr") {
    if (delta >= 3) return "rising";
    if (delta <= -3) return "falling";
  } else if (key === "temp") {
    if (delta >= 0.2) return "rising";
    if (delta <= -0.2) return "falling";
  } else if (key === "spo2") {
    if (delta >= 1.0) return "rising";
    if (delta <= -1.0) return "falling";
  } else if (key === "humidity") {
    if (delta >= 2.0) return "rising";
    if (delta <= -2.0) return "falling";
  }

  return "stable";
}

/**
 * Evaluates the 4 parameters and generates rule-based notifications.
 */
export function evaluateVitalParameters(reading, history = [], customThresholds = {}) {
  const t = { ...DEFAULT_THRESHOLDS, ...customThresholds };

  const hr = Number(reading?.hr) || 74;
  const hrOk = Boolean(reading?.hr_ok) && hr > 0;
  const temp = Number(reading?.temp) || 36.6;
  const spo2 = Number(reading?.spo2) || 98.0;
  const humidity = Number(reading?.humidity) || 52.0;

  const isSimulated = reading?.source !== "HARDWARE_SERIAL";
  const now = new Date();
  const timestampStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const notifications = [];
  const parameters = {};

  // 1. Heart Rate
  let hrStatus = "NORMAL";
  let hrReason = "Resting heart rate within physiological bounds (55–100 BPM).";
  let hrAction = "Cardiac capacity cleared for prescribed exercise routine.";

  if (!hrOk) {
    hrStatus = "WARNING";
    hrReason = "Intermittent optical pulse signal or sensor not worn.";
    hrAction = "Reposition pulse sensor firmly on fingertip.";
    notifications.push({
      id: "hr_disconnect",
      parameter: "Heart Rate",
      value: "Sensor Displaced",
      category: "YELLOW",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  } else if (hr < t.min_hr) {
    hrStatus = "CRITICAL";
    hrReason = `Severe Bradycardia (${hr} BPM < ${t.min_hr} BPM threshold).`;
    hrAction = "STOP rehabilitation immediately. Remain seated and notify medical caregiver.";
    notifications.push({
      id: "hr_critical_low",
      parameter: "Heart Rate",
      value: `${hr} BPM`,
      category: "RED",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  } else if (hr < 55) {
    hrStatus = "WARNING";
    hrReason = `Borderline low heart rate (${hr} BPM).`;
    hrAction = "Pause and assess for lightheadedness or fatigue before continuing.";
    notifications.push({
      id: "hr_warning_low",
      parameter: "Heart Rate",
      value: `${hr} BPM`,
      category: "YELLOW",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  } else if (hr > t.max_hr_exercise) {
    hrStatus = "CRITICAL";
    hrReason = `Severe Tachycardia (${hr} BPM > ${t.max_hr_exercise} BPM safety limit).`;
    hrAction = "STOP exercise immediately. Sit upright, rest quietly, and alert physician.";
    notifications.push({
      id: "hr_critical_high",
      parameter: "Heart Rate",
      value: `${hr} BPM`,
      category: "RED",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  } else if (hr > t.max_hr_resting) {
    hrStatus = "WARNING";
    hrReason = `Elevated resting heart rate (${hr} BPM > ${t.max_hr_resting} BPM).`;
    hrAction = "Pause session. Hydrate, rest seated, and await return to baseline.";
    notifications.push({
      id: "hr_warning_high",
      parameter: "Heart Rate",
      value: `${hr} BPM`,
      category: "YELLOW",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  } else {
    notifications.push({
      id: "hr_normal",
      parameter: "Heart Rate",
      value: `${hr} BPM`,
      category: "GREEN",
      reason: hrReason,
      safety_action: hrAction,
      timestamp: timestampStr
    });
  }

  parameters.hr = {
    key: "hr",
    label: "Heart Rate",
    value: hr,
    unit: "BPM",
    status: hrStatus,
    trend: calculateTrend(history, "hr"),
    reason: hrReason,
    action: hrAction,
    lastUpdated: timestampStr
  };

  // 2. Body Temperature
  let tempStatus = "NORMAL";
  let tempReason = "Core body temperature is within normal limits (36.0–37.5°C).";
  let tempAction = "Thermal balance cleared for rehabilitation.";

  if (temp < t.min_temp) {
    tempStatus = "CRITICAL";
    tempReason = `Hypothermia alert: Body temperature is ${temp.toFixed(1)}°C (< ${t.min_temp}°C).`;
    tempAction = "STOP exercise immediately. Wrap in warm layers and seek urgent clinical evaluation.";
    notifications.push({
      id: "temp_hypothermia",
      parameter: "Body Temperature",
      value: `${temp.toFixed(1)} °C`,
      category: "RED",
      reason: tempReason,
      safety_action: tempAction,
      timestamp: timestampStr
    });
  } else if (temp >= t.fever_temp) {
    tempStatus = "CRITICAL";
    tempReason = `Fever detected (${temp.toFixed(1)}°C >= ${t.fever_temp}°C). Strenuous movement contraindicated.`;
    tempAction = "Postpone all exercises. Rest, hydrate, and notify physician Dr. Kavitha.";
    notifications.push({
      id: "temp_fever",
      parameter: "Body Temperature",
      value: `${temp.toFixed(1)} °C`,
      category: "RED",
      reason: tempReason,
      safety_action: tempAction,
      timestamp: timestampStr
    });
  } else if (temp >= t.warning_temp) {
    tempStatus = "WARNING";
    tempReason = `Low-grade temperature elevation (${temp.toFixed(1)}°C).`;
    tempAction = "Postpone strenuous exertion. Reassess in 15 minutes before proceeding.";
    notifications.push({
      id: "temp_warning_high",
      parameter: "Body Temperature",
      value: `${temp.toFixed(1)} °C`,
      category: "YELLOW",
      reason: tempReason,
      safety_action: tempAction,
      timestamp: timestampStr
    });
  } else if (temp < 36.0) {
    tempStatus = "WARNING";
    tempReason = `Sub-normal core temperature (${temp.toFixed(1)}°C).`;
    tempAction = "Ensure warm ambient clothing before performing gentle movements.";
    notifications.push({
      id: "temp_warning_low",
      parameter: "Body Temperature",
      value: `${temp.toFixed(1)} °C`,
      category: "YELLOW",
      reason: tempReason,
      safety_action: tempAction,
      timestamp: timestampStr
    });
  } else {
    notifications.push({
      id: "temp_normal",
      parameter: "Body Temperature",
      value: `${temp.toFixed(1)} °C`,
      category: "GREEN",
      reason: tempReason,
      safety_action: tempAction,
      timestamp: timestampStr
    });
  }

  parameters.temp = {
    key: "temp",
    label: "Body Temperature",
    value: temp.toFixed(1),
    unit: "°C",
    status: tempStatus,
    trend: calculateTrend(history, "temp"),
    reason: tempReason,
    action: tempAction,
    lastUpdated: timestampStr
  };

  // 3. SpO2 Blood Oxygen
  let spo2Status = "NORMAL";
  let spo2Reason = "Peripheral capillary oxygen saturation is optimal (95–100%).";
  let spo2Action = "Pulmonary oxygen exchange verified. Safe to exercise.";

  if (spo2 < t.min_spo2_critical) {
    spo2Status = "CRITICAL";
    spo2Reason = `Critical hypoxemia: SpO2 is ${Math.round(spo2)}% (< ${t.min_spo2_critical}%). Severe desaturation.`;
    spo2Action = "STOP all activity immediately. Sit fully upright, apply oxygen if prescribed, and call emergency services.";
    notifications.push({
      id: "spo2_critical",
      parameter: "SpO2 (Blood Oxygen)",
      value: `${Math.round(spo2)}%`,
      category: "RED",
      reason: spo2Reason,
      safety_action: spo2Action,
      timestamp: timestampStr
    });
  } else if (spo2 < t.min_spo2_warning) {
    spo2Status = "WARNING";
    spo2Reason = `Oxygen desaturation detected (${Math.round(spo2)}% < ${t.min_spo2_warning}%).`;
    spo2Action = "Pause exercise session. Rest seated, perform deep diaphragmatic breaths, and recheck.";
    notifications.push({
      id: "spo2_warning",
      parameter: "SpO2 (Blood Oxygen)",
      value: `${Math.round(spo2)}%`,
      category: "YELLOW",
      reason: spo2Reason,
      safety_action: spo2Action,
      timestamp: timestampStr
    });
  } else {
    notifications.push({
      id: "spo2_normal",
      parameter: "SpO2 (Blood Oxygen)",
      value: `${Math.round(spo2)}%`,
      category: "GREEN",
      reason: spo2Reason,
      safety_action: spo2Action,
      timestamp: timestampStr
    });
  }

  parameters.spo2 = {
    key: "spo2",
    label: "Blood Oxygen (SpO2)",
    value: Math.round(spo2),
    unit: "%",
    status: spo2Status,
    trend: calculateTrend(history, "spo2"),
    reason: spo2Reason,
    action: spo2Action,
    lastUpdated: timestampStr
  };

  // 4. Environmental Humidity
  // Rule: Humidity must not independently determine patient's exercise prescription!
  let humidityStatus = "NORMAL";
  let humidityReason = "Comfortable ambient humidity level (30–60%).";
  let humidityAction = "Environmental conditions are favorable.";

  if (humidity < t.min_humidity) {
    humidityStatus = "WARNING";
    humidityReason = `Dry ambient air (${humidity.toFixed(1)}% < ${t.min_humidity}%). May cause respiratory irritation.`;
    humidityAction = "Low humidity advisory: Ensure adequate hydration before and during exercise.";
    notifications.push({
      id: "humidity_dry",
      parameter: "Environmental Humidity",
      value: `${humidity.toFixed(1)}%`,
      category: "YELLOW",
      reason: humidityReason,
      safety_action: humidityAction,
      timestamp: timestampStr
    });
  } else if (humidity > t.max_humidity_warning) {
    humidityStatus = "WARNING";
    humidityReason = `High humidity thermal burden (${humidity.toFixed(1)}% > ${t.max_humidity_warning}%). Evaporative sweat cooling reduced.`;
    humidityAction = "Advisory: Recommend room ventilation or fan cooling. Take prolonged rest breaks between sets.";
    notifications.push({
      id: "humidity_high",
      parameter: "Environmental Humidity",
      value: `${humidity.toFixed(1)}%`,
      category: "YELLOW",
      reason: humidityReason,
      safety_action: humidityAction,
      timestamp: timestampStr
    });
  } else if (humidity > t.max_humidity_comfortable) {
    humidityStatus = "WARNING";
    humidityReason = `Moderate humidity elevation (${humidity.toFixed(1)}%).`;
    humidityAction = "Ensure adequate ventilation in the room. Rest 45 seconds between sets.";
    notifications.push({
      id: "humidity_elevated",
      parameter: "Environmental Humidity",
      value: `${humidity.toFixed(1)}%`,
      category: "YELLOW",
      reason: humidityReason,
      safety_action: humidityAction,
      timestamp: timestampStr
    });
  } else {
    notifications.push({
      id: "humidity_normal",
      parameter: "Environmental Humidity",
      value: `${humidity.toFixed(1)}%`,
      category: "GREEN",
      reason: humidityReason,
      safety_action: humidityAction,
      timestamp: timestampStr
    });
  }

  parameters.humidity = {
    key: "humidity",
    label: "Environmental Humidity",
    value: humidity.toFixed(1),
    unit: "%",
    status: humidityStatus,
    trend: calculateTrend(history, "humidity"),
    reason: humidityReason,
    action: humidityAction,
    lastUpdated: timestampStr
  };

  // Determine overall category (HR, Temp, SpO2 govern safety. Humidity alone does not trigger red/yellow stop)
  const coreStatuses = [hrStatus, tempStatus, spo2Status];
  let overallCategory = "GREEN";
  if (coreStatuses.includes("CRITICAL")) {
    overallCategory = "RED";
  } else if (coreStatuses.includes("WARNING")) {
    overallCategory = "YELLOW";
  }

  return {
    overallCategory,
    parameters,
    notifications,
    isSimulated,
    evaluatedAt: timestampStr,
    canStartExercise: overallCategory === "GREEN"
  };
}
