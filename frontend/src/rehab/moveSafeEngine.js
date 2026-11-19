/**
 * MoveSafe Client-Side Biomechanical Engine
 * Runs 100% locally in the browser via MediaPipe Pose landmarks.
 * Video never leaves the phone / laptop!
 */

export const EXERCISE_CONFIGS = {
  seated_knee_extension: {
    id: "seated_knee_extension",
    name: "Seated Knee Extension",
    tamil_name: "நாற்காலியில் முழங்கால் நீட்டுதல்",
    start_angle: 90,
    target_angle: 170,
    angle_tolerance: 14,
    min_duration_s: 1.8,
    max_duration_s: 7.0,
    hysteresis: 8.0,
    landmarks: { hip: 23, knee: 25, ankle: 27 }, // Left side (or 24, 26, 28 right)
    faults: {
      incomplete_extension: {
        threshold: 152,
        msg_en: "Straighten the knee more to reach full extension.",
        msg_ta: "முழங்காலை இன்னும் நேராக நீட்டவும்."
      },
      too_fast: {
        msg_en: "Move slower with control.",
        msg_ta: "காலை மெதுவாக கட்டுப்பாட்டுடன் இறக்கவும்."
      }
    }
  },
  sit_to_stand: {
    id: "sit_to_stand",
    name: "Sit to Stand (Chair Stand)",
    tamil_name: "நாற்காலியிலிருந்து எழுந்து அமருதல்",
    start_angle: 90,
    target_angle: 170,
    angle_tolerance: 15,
    min_duration_s: 2.0,
    max_duration_s: 8.0,
    hysteresis: 10.0,
    landmarks: { hip: 23, knee: 25, ankle: 27 },
    faults: {
      incomplete_stand: {
        threshold: 155,
        msg_en: "Stand tall and fully extend your hips.",
        msg_ta: "முழுமையாக நிமிர்ந்து நிற்கவும்."
      },
      too_fast: {
        msg_en: "Lower yourself gently using leg strength.",
        msg_ta: "மெதுவாக உட்காரவும்."
      }
    }
  },
  standing_heel_raise: {
    id: "standing_heel_raise",
    name: "Standing Heel Raise",
    tamil_name: "குதிங்கால் உயர்த்துதல்",
    start_angle: 90,
    target_angle: 125,
    angle_tolerance: 10,
    min_duration_s: 1.6,
    max_duration_s: 6.0,
    hysteresis: 6.0,
    landmarks: { knee: 25, ankle: 27, foot: 31 },
    faults: {
      partial_lift: {
        threshold: 112,
        msg_en: "Push up higher through your toes.",
        msg_ta: "குதிங்கால்களை இன்னும் மேலே உயர்த்தவும்."
      }
    }
  },
  shoulder_raise: {
    id: "shoulder_raise",
    name: "Shoulder Front Raise",
    tamil_name: "தோள்பட்டை முன்பக்க உயர்த்துதல்",
    start_angle: 25,
    target_angle: 90,
    angle_tolerance: 15,
    min_duration_s: 1.8,
    max_duration_s: 6.5,
    hysteresis: 8.0,
    landmarks: { hip: 23, shoulder: 11, elbow: 13 },
    faults: {
      over_elevation: {
        threshold: 115,
        msg_en: "Stop at shoulder height; do not raise above your ears.",
        msg_ta: "தோள்பட்டை உயரத்திற்கு மேல் உயர்த்த வேண்டாம்."
      }
    }
  }
};

/**
 * Calculates 2D angle at vertex p2 in degrees [0, 180]
 */
export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0;
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Checks framing, lighting & distance from pose landmarks
 */
export function checkSetupFraming(landmarks) {
  if (!landmarks || landmarks.length < 33) {
    return { ok: false, reason: "No body detected. Stand back where your full body is visible." };
  }

  const nose = landmarks[0];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // Visibility confidence check
  const avgVis = (nose.visibility + leftHip.visibility + rightHip.visibility) / 3;
  if (avgVis < 0.6) {
    return { ok: false, reason: "Low lighting or partial view. Please increase room lighting." };
  }

  // Distance check: ensure body is within framing (not too close or too far)
  const verticalSpan = Math.abs((leftAnkle.y + rightAnkle.y) / 2 - nose.y);
  if (verticalSpan < 0.35) {
    return { ok: false, reason: "You are too far from the camera. Please step a little closer." };
  }
  if (verticalSpan > 0.95) {
    return { ok: false, reason: "You are too close. Step back so your joints are inside the frame." };
  }

  return { ok: true, reason: "Framing and distance optimal. Ready to begin!" };
}

/**
 * Text-to-Speech Audio Feedback in Tamil or English using Web Speech API
 */
export function speakFeedback(text, lang = "en") {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // cancel pending utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (lang === "ta") {
      const taVoice = voices.find(v => v.lang.includes("ta") || v.lang.includes("Tamil"));
      if (taVoice) utterance.voice = taVoice;
      utterance.lang = "ta-IN";
    } else {
      const enVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-GB") || v.lang.includes("en"));
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = "en-IN";
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis unavailable:", e);
  }
}

/**
 * Browser Rep Counter State Machine
 */
export class ClientRepCounter {
  constructor(exerciseKey = "seated_knee_extension") {
    this.config = EXERCISE_CONFIGS[exerciseKey] || EXERCISE_CONFIGS.seated_knee_extension;
    this.reset();
  }

  reset() {
    this.state = "START"; // START, INFLECTION, PEAK, RETURN
    this.repStartTime = null;
    this.smoothedAngle = this.config.start_angle;
    this.alpha = 0.35; // Smoothing factor
    this.peakAngleReached = this.config.start_angle;
    this.repsValid = 0;
    this.repsAttempted = 0;
    this.faultFreeReps = 0;
    this.currentRepFaults = [];
  }

  update(rawAngle, timestampS) {
    // 1. Exponential Smoothing Filter
    this.smoothedAngle = this.alpha * rawAngle + (1 - this.alpha) * this.smoothedAngle;
    const angle = this.smoothedAngle;

    const isIncreasing = this.config.target_angle > this.config.start_angle;
    let repEvent = null;
    let correctionMsg = null;
    let correctionTa = null;

    // Track peak angle reached during current repetition
    if (isIncreasing) {
      if (angle > this.peakAngleReached) this.peakAngleReached = angle;
    } else {
      if (angle < this.peakAngleReached) this.peakAngleReached = angle;
    }

    // State Transitions
    if (this.state === "START") {
      const thresh = isIncreasing ? (this.config.start_angle + this.config.hysteresis) : (this.config.start_angle - this.config.hysteresis);
      const moving = isIncreasing ? (angle >= thresh) : (angle <= thresh);

      if (moving) {
        this.state = "INFLECTION";
        this.repStartTime = timestampS;
        this.peakAngleReached = angle;
        this.currentRepFaults = [];
      }
    } else if (this.state === "INFLECTION") {
      const targetBoundary = isIncreasing ? (this.config.target_angle - this.config.angle_tolerance) : (this.config.target_angle + this.config.angle_tolerance);
      const reachedTarget = isIncreasing ? (angle >= targetBoundary) : (angle <= targetBoundary);

      if (reachedTarget) {
        this.state = "PEAK";
      } else {
        // Did the user quit halfway and return without reaching target?
        const returnEarly = isIncreasing ? (angle <= this.config.start_angle + 6) : (angle >= this.config.start_angle - 6);
        if (returnEarly) {
          this.repsAttempted++;
          repEvent = "incomplete";
          const faultDef = this.config.faults.incomplete_extension || this.config.faults.incomplete_stand;
          correctionMsg = faultDef ? faultDef.msg_en : "Incomplete extension. Straighten more!";
          correctionTa = faultDef ? faultDef.msg_ta : "முழுமையாக நீட்டவும்!";
          this.state = "START";
          this.repStartTime = null;
        }
      }
    } else if (this.state === "PEAK") {
      const inflectionReturn = isIncreasing ? (this.config.target_angle - this.config.hysteresis) : (this.config.target_angle + this.config.hysteresis);
      const returning = isIncreasing ? (angle <= inflectionReturn) : (angle >= inflectionReturn);

      if (returning) {
        this.state = "RETURN";
      }
    } else if (this.state === "RETURN") {
      const finishBoundary = isIncreasing ? (this.config.start_angle + this.config.hysteresis) : (this.config.start_angle - this.config.hysteresis);
      const returned = isIncreasing ? (angle <= finishBoundary) : (angle >= finishBoundary);

      if (returned) {
        const duration = timestampS - (this.repStartTime || timestampS);
        this.repsAttempted++;

        if (duration < this.config.min_duration_s) {
          this.currentRepFaults.push("too_fast");
          correctionMsg = "Rushing! Move slower with steady control.";
          correctionTa = "மெதுவாக கட்டுப்பாட்டுடன் செய்யவும்.";
        }

        // Count as valid
        this.repsValid++;
        repEvent = "valid_rep";
        if (this.currentRepFaults.length === 0) {
          this.faultFreeReps++;
        }

        this.state = "START";
        this.repStartTime = null;
        this.peakAngleReached = this.config.start_angle;
      }
    }

    return {
      state: this.state,
      angle: Math.round(angle),
      repEvent,
      repsValid: this.repsValid,
      repsAttempted: this.repsAttempted,
      correctionMsg,
      correctionTa,
      faults: [...this.currentRepFaults]
    };
  }
}
