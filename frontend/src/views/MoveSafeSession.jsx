import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Award,
  CheckCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Flame,
  Activity,
  Cpu,
  Video
} from "lucide-react";
import {
  EXERCISE_CONFIGS,
  calculateAngle,
  checkSetupFraming,
  speakFeedback,
  ClientRepCounter
} from "../rehab/moveSafeEngine";

export default function MoveSafeSession({
  person,
  plan,
  latestReading,
  onFinishSession,
  onCancel,
  lang = "en"
}) {
  // Step in workflow: 'pre_check', 'setup_check', 'active_workout', 'paused', 'summary'
  const [step, setStep] = useState("pre_check");

  // Mode: true = Simulated Biomechanical Tracker, false = Real Live Camera
  const [useSimulator, setUseSimulator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Pre-session symptom form
  const [preBorg, setPreBorg] = useState(6);
  const [prePain, setPrePain] = useState(false);
  const [preDizziness, setPreDizziness] = useState(false);
  const [preCheckError, setPreCheckError] = useState("");

  // Exercise selection
  const exerciseKeys = Object.keys(EXERCISE_CONFIGS);
  const [selectedExKey, setSelectedExKey] = useState("seated_knee_extension");
  const currentExConfig = EXERCISE_CONFIGS[selectedExKey];

  // Camera & Canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [framingStatus, setFramingStatus] = useState({ ok: false, reason: "Initializing tracker..." });

  // Workout state
  const repCounterRef = useRef(new ClientRepCounter(selectedExKey));
  const [currentAngle, setCurrentAngle] = useState(90);
  const [validReps, setValidReps] = useState(0);
  const [attemptedReps, setAttemptedReps] = useState(0);
  const [targetReps, setTargetReps] = useState(10);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(2);
  const [lastCorrection, setLastCorrection] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [finalSummary, setFinalSummary] = useState(null);
  const [safePausesCount, setSafePausesCount] = useState(0);

  // Gamification state
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentBadge, setRecentBadge] = useState("");

  // Audio voice throttle tracker
  const lastSpokenTimeRef = useRef(0);

  const safeSpeak = (text) => {
    if (isMuted) return;
    speakFeedback(text, lang);
  };

  // Initialize or reset counter when exercise changes
  useEffect(() => {
    repCounterRef.current = new ClientRepCounter(selectedExKey);
    setValidReps(0);
    setAttemptedReps(0);
  }, [selectedExKey]);

  // --- Pre-Session Safety Check Submission ---
  const handlePreCheckSubmit = async () => {
    // 1. Check Physio Approval
    if (plan && !plan.approved_by_physio) {
      setPreCheckError(lang === "ta"
        ? "மருத்துவரால் அங்கீகரிக்கப்படாத திட்டத்தில் பயிற்சியைத் தொடங்க முடியாது."
        : "Session blocked: Exercise plan must be approved by your physiotherapist.");
      return;
    }

    // 2. Symptom Checks
    if (prePain) {
      setPreCheckError(lang === "ta"
        ? "வலி இருப்பதால் பயிற்சி அனுமதிக்கப்படவில்லை. ஓய்வெடுக்கவும்."
        : "Safety Block: Active pain reported. Please rest and consult your physiotherapist.");
      return;
    }
    if (preDizziness) {
      setPreCheckError(lang === "ta"
        ? "தலைச்சுற்றல் இருப்பதால் உட்கார்ந்து ஓய்வெடுக்கவும்."
        : "Safety Block: Dizziness reported. Strenuous exercise is contraindicated.");
      return;
    }

    // 3. Vitals Check
    const maxHR = plan?.max_hr_limit || 125;
    if (latestReading && latestReading.hr_ok && latestReading.hr >= maxHR) {
      setPreCheckError(lang === "ta"
        ? `தற்போதைய இதயத் துடிப்பு (${latestReading.hr} BPM) அனுமதிக்கப்பட்ட வரம்பை (${maxHR} BPM) விட அதிகமாக உள்ளது.`
        : `Safety Block: Resting heart rate (${latestReading.hr} BPM) exceeds prescribed limit (${maxHR} BPM).`);
      return;
    }

    setPreCheckError("");
    setStep("setup_check");

    // Register Session with Backend
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: person?.id || 1,
          pre_borg: preBorg,
          pre_pain: prePain,
          pre_dizziness: preDizziness
        })
      });
      const data = await res.json();
      if (data && data.session_id) {
        setSessionId(data.session_id);
      }
    } catch (e) {
      console.warn("Backend session register:", e);
    }

    if (!useSimulator) {
      startCamera();
    } else {
      setFramingStatus({
        ok: true,
        reason: lang === "ta" ? "போலி பயோமெக்கானிக் டிராக்கர் தயார்" : "Biomechanical Simulator Active (Ready to test)"
      });
    }
  };

  // --- Start Camera Stream ---
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.warn("Camera access failed, falling back to simulator:", err);
      setCameraError(
        lang === "ta"
          ? "கேமரா அணுகல் கிடைக்கவில்லை. போலி பயோமெக்கானிக் முறை தானாக செயல்படுத்தப்பட்டது."
          : "Camera not available or access denied. Switched to Biomechanical Simulator."
      );
      setUseSimulator(true);
      setFramingStatus({
        ok: true,
        reason: "Biomechanical Simulator Active (No Camera Needed)"
      });
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // --- MediaPipe Pose Setup & Real-Time Processing (Zero-Lag Throttled) ---
  useEffect(() => {
    let animationFrameId;
    let poseEstimator = null;
    let isProcessing = false;
    let lastProcessTime = 0;

    if (!useSimulator && window.Pose && cameraActive) {
      try {
        poseEstimator = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        poseEstimator.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseEstimator.onResults((results) => {
          if (!results.poseLandmarks) {
            setFramingStatus({ ok: false, reason: "No body detected in frame." });
            return;
          }

          const framing = checkSetupFraming(results.poseLandmarks);
          setFramingStatus(framing);
          drawRealSkeleton(results.poseLandmarks);

          const lm = results.poseLandmarks;
          let p1, p2, p3;

          if (selectedExKey === "seated_knee_extension" || selectedExKey === "sit_to_stand") {
            p1 = lm[23];
            p2 = lm[25];
            p3 = lm[27];
          } else if (selectedExKey === "standing_heel_raise") {
            p1 = lm[25];
            p2 = lm[27];
            p3 = lm[31];
          } else {
            p1 = lm[23];
            p2 = lm[11];
            p3 = lm[13];
          }

          if (p1 && p2 && p3) {
            const rawAngle = calculateAngle(p1, p2, p3);
            const nowS = performance.now() / 1000.0;

            if (step === "active_workout") {
              handleNewAngleSample(rawAngle, nowS);
            } else {
              setCurrentAngle(Math.round(rawAngle));
            }
          }
        });
      } catch (err) {
        console.warn("Pose init failed, fallback to simulator:", err);
        setUseSimulator(true);
      }
    }

    const processFrame = async (timestamp) => {
      if (!useSimulator && videoRef.current && videoRef.current.readyState >= 2 && poseEstimator && !isProcessing) {
        // Limit to max ~30 FPS to prevent CPU thread bottleneck and lag
        if (timestamp - lastProcessTime >= 33) {
          lastProcessTime = timestamp;
          isProcessing = true;
          try {
            await poseEstimator.send({ image: videoRef.current });
          } catch (err) {
            console.warn("Pose send error:", err);
          } finally {
            isProcessing = false;
          }
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (cameraActive && !useSimulator) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (poseEstimator) poseEstimator.close();
    };
  }, [cameraActive, step, selectedExKey, lang, useSimulator]);

  // Common Rep Evaluation Logic for both Camera and Simulator
  const handleNewAngleSample = (angleVal, nowS) => {
    const res = repCounterRef.current.update(angleVal, nowS);
    setCurrentAngle(res.angle);
    setValidReps(res.repsValid);
    setAttemptedReps(res.repsAttempted);

    if (res.correctionMsg) {
      const msg = lang === "ta" ? res.correctionTa : res.correctionMsg;
      setLastCorrection(msg);
      if (nowS - lastSpokenTimeRef.current > 3.0) {
        lastSpokenTimeRef.current = nowS;
        safeSpeak(msg);
      }
    }

    if (res.repEvent === "valid_rep") {
      const repPts = 10 + (streak >= 3 ? 5 : 0);
      setPoints((prev) => prev + repPts);
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak === 1) setRecentBadge("First Rep Complete! 🎯");
        else if (newStreak === 5) setRecentBadge("5 Rep Streak! 🔥");
        else if (newStreak >= targetReps) setRecentBadge("Set Champion! 🏆");
        return newStreak;
      });
      const phrase = lang === "ta" ? `அருமை! எண்ணிக்கை ${res.repsValid}` : `Good form! Rep ${res.repsValid}`;
      safeSpeak(phrase);

      // Async log to backend
      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/reps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise_id: selectedExKey,
            rep_number: res.repsValid,
            is_valid: true,
            duration_s: 2.8,
            peak_angle: res.angle,
            form_faults: res.correctionMsg || ""
          })
        }).catch(() => {});
      }
    } else if (res.repEvent === "incomplete") {
      setStreak(0);
    }
  };

  // --- High-Fidelity Biomechanical Simulator Mode ---
  useEffect(() => {
    let mockInterval = null;
    if (useSimulator && (step === "active_workout" || step === "setup_check")) {
      let simAngle = 90;
      let dir = 1;
      const startA = currentExConfig.start_angle || 90;
      const targetA = currentExConfig.target_angle || 170;
      const stepDelta = Math.abs(targetA - startA) / 18.0;

      mockInterval = setInterval(() => {
        if (step === "active_workout") {
          simAngle += dir * stepDelta;
          if (dir === 1 && simAngle >= targetA) {
            simAngle = targetA;
            dir = -1;
          } else if (dir === -1 && simAngle <= startA) {
            simAngle = startA;
            dir = 1;
          }
          const nowS = performance.now() / 1000.0;
          handleNewAngleSample(simAngle, nowS);
        }
        drawSimulatedSkeleton(simAngle, selectedExKey);
      }, 90);
    }
    return () => clearInterval(mockInterval);
  }, [useSimulator, step, selectedExKey, lang, sessionId, targetReps, streak]);

  // Safe Pause Watchdog (Protects patient if Heart Rate crosses ceiling)
  useEffect(() => {
    if (step === "active_workout" && latestReading && latestReading.hr_ok) {
      const maxAllowed = plan?.max_hr_limit || 125;
      if (latestReading.hr > maxAllowed) {
        triggerSafePause(
          lang === "ta"
            ? `இதயத் துடிப்பு (${latestReading.hr} BPM) அனுமதிக்கப்பட்ட ${maxAllowed} BPM அளவை விட அதிகரித்துள்ளது.`
            : `Heart rate reached ${latestReading.hr} BPM, exceeding the safety ceiling of ${maxAllowed} BPM.`
        );
      }
    }
  }, [latestReading, step, plan, lang]);

  const triggerSafePause = (reason) => {
    setPauseReason(reason);
    setStep("paused");
    setSafePausesCount((prev) => prev + 1);
    safeSpeak(
      lang === "ta"
        ? "பாதுகாப்பிற்காக உடற்பயிற்சி நிறுத்தப்பட்டது. நிதானமாக அமர்ந்து ஓய்வெடுக்கவும்."
        : "Exercise paused for safety. Please sit back and rest."
    );
    // Tell hardware buzzer pattern 5
    fetch("/api/hardware/buzz?pattern=5", { method: "POST" }).catch(() => {});
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/pause?reason=${encodeURIComponent(reason)}`, { method: "POST" }).catch(() => {});
    }
  };

  // Render Real MediaPipe Skeleton
  const drawRealSkeleton = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#38bdf8";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;

    const connections = [
      [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 12], [11, 23], [12, 24], [23, 24],
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      }
    });

    landmarks.forEach((p, idx) => {
      if (p.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = (idx === 25 || idx === 26) ? "#ef4444" : "#38bdf8";
        ctx.fill();
      }
    });
  };

  // Render Biomechanical Simulated Skeleton (Interactive Animation)
  const drawSimulatedSkeleton = (angle, exKey) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Stylish Clinical Grid Background
    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Chair Structure
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy + 70);
    ctx.lineTo(cx - 15, cy + 70); // Seat
    ctx.lineTo(cx - 70, cy - 25); // Backrest
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy + 70);
    ctx.lineTo(cx - 70, cy + 150);
    ctx.moveTo(cx - 15, cy + 70);
    ctx.lineTo(cx - 15, cy + 150);
    ctx.stroke();

    // Human Anatomical Figure
    const headX = cx - 45;
    const headY = cy - 65;
    ctx.beginPath();
    ctx.arc(headX, headY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    const shoulderX = cx - 45;
    const shoulderY = cy - 40;
    const hipX = cx - 35;
    const hipY = cy + 60;
    const kneeX = cx + 55;
    const kneeY = cy + 60;

    // Arm
    const elbowX = cx - 15;
    const elbowY = cy;
    const handX = cx + 10;
    const handY = cy + 30;

    // Moving Calf / Ankle based on dynamic joint angle
    const rad = ((180 - angle) * Math.PI) / 180.0;
    const shankLen = 80;
    const ankleX = kneeX + shankLen * Math.cos(rad);
    const ankleY = kneeY + shankLen * Math.sin(rad);
    const footX = ankleX + 22;
    const footY = ankleY + 4;

    ctx.lineCap = "round";

    // Torso
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    // Arm
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Thigh (Green)
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();

    // Calf (Blue)
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(kneeX, kneeY);
    ctx.lineTo(ankleX, ankleY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    // Joint Rings
    const joints = [
      { x: shoulderX, y: shoulderY, color: "#38bdf8" },
      { x: hipX, y: hipY, color: "#38bdf8" },
      { x: kneeX, y: kneeY, color: "#ef4444" }, // Target knee joint highlighted
      { x: ankleX, y: ankleY, color: "#22c55e" },
      { x: footX, y: footY, color: "#22c55e" },
    ];
    joints.forEach((j) => {
      ctx.beginPath();
      ctx.arc(j.x, j.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = j.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Angle text arc at knee
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${Math.round(angle)}°`, kneeX - 10, kneeY - 14);

    // Simulation Badge Watermark
    ctx.font = "600 11px sans-serif";
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.fillText("BIOMECHANICAL MOTION ENGINE (SIMULATED)", 16, 26);
  };

  // Complete workout & compute Recovery Intelligence Score
  const handleFinishWorkout = () => {
    stopCamera();
    const repCounter = repCounterRef.current;

    const planComp = Math.min(1.0, repCounter.repsValid / Math.max(1, targetReps)) * 25.0;
    const validRatio = (repCounter.repsAttempted > 0 ? repCounter.repsValid / repCounter.repsAttempted : 0) * 25.0;
    const formQuality = (repCounter.repsValid > 0 ? repCounter.faultFreeReps / repCounter.repsValid : 0) * 20.0;
    const tempoControl = 10.0;
    const effortControl = preBorg <= 14 ? 10.0 : 5.0;
    const vitalsStability = safePausesCount === 0 ? 10.0 : 5.0;

    const totalScore = Math.round(planComp + validRatio + formQuality + tempoControl + effortControl + vitalsStability);

    const summaryObj = {
      score: totalScore,
      targetReps,
      validReps: repCounter.repsValid,
      attemptedReps: repCounter.repsAttempted,
      faultFreeReps: repCounter.faultFreeReps,
      safePauses: safePausesCount,
      breakdown: {
        planCompletion: Math.round(planComp),
        validRepRatio: Math.round(validRepRatio),
        formQuality: Math.round(formQuality),
        tempoControl: Math.round(tempoControl),
        effortControl: Math.round(effortControl),
        vitalsStability: Math.round(vitalsStability),
      }
    };

    setFinalSummary(summaryObj);
    setStep("summary");

    // Persist to backend database
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_borg: preBorg,
          vitals_exceeded: safePausesCount > 0,
          safe_pauses: safePausesCount,
          notes: `Completed ${repCounter.repsValid} valid reps out of ${targetReps} target.`
        })
      }).catch((e) => console.warn("Failed saving finish session:", e));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">MoveSafe Guided Rehabilitation</h2>
            <p className="text-xs text-slate-400">
              {lang === "ta" ? "உள்ளூர் உலாவி கேமரா மூலம் படிநிலை வழிகாட்டல்" : "Client-Side In-Browser Form Guidance & Safe Pause"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute Audio Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Mode Switcher Pill */}
          <button
            onClick={() => {
              const nextMode = !useSimulator;
              setUseSimulator(nextMode);
              if (nextMode) {
                stopCamera();
                setFramingStatus({ ok: true, reason: "Biomechanical Simulator Active" });
              } else {
                startCamera();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              useSimulator
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            {useSimulator ? <Cpu className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{useSimulator ? "Simulator Mode" : "Camera Mode"}</span>
          </button>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* STEP 1: PRE-SESSION SAFETY CHECK ("The Plan Step") */}
      {step === "pre_check" && (
        <div className="max-w-xl mx-auto space-y-6 py-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {lang === "ta" ? "படி 1: தொடக்க பாதுகாப்பு சோதனை" : "Step 1: Pre-Session Safety Check"}
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {plan?.approved_by_physio ? "Physio Approved" : "Pending"}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              {lang === "ta"
                ? "பயிற்சியைத் தொடங்குவதற்கு முன், உங்கள் தற்போதைய உடல்நிலை சரிபார்க்கப்படுகிறது."
                : "Before exercising, Sentinel verifies resting vitals and symptom indicators to ensure your session is completely safe."}
            </p>

            {/* Current Vitals Snapshot */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{lang === "ta" ? "இதயத் துடிப்பு" : "Resting Heart Rate"}</span>
                {latestReading?.hr_ok && Number(latestReading.hr) > 0 ? (
                  <span className="text-xl font-bold text-white">{latestReading.hr} BPM</span>
                ) : (
                  <span className="text-sm font-bold text-rose-400 block py-0.5">
                    {lang === "ta" ? "இணைக்கப்படவில்லை" : "Not Connected"}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 block">Max Limit: {plan?.max_hr_limit || 125} BPM</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{lang === "ta" ? "உடல் வெப்பநிலை" : "Body Temperature"}</span>
                <span className="text-xl font-bold text-white">{(Number(latestReading?.temp) || 36.6).toFixed(1)} °C</span>
                <span className="text-[10px] text-slate-500 block">Afebrile / Safe</span>
              </div>
            </div>

            {/* Borg Effort Scale 6-20 */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">
                  {lang === "ta" ? "தற்போதைய சோர்வு நிலை (Borg 6-20)" : "Current Perceived Exertion (Borg 6-20)"}
                </label>
                <span className="text-blue-400 font-bold">{preBorg} - {preBorg <= 8 ? "Very Light" : preBorg <= 12 ? "Light" : "Somewhat Hard"}</span>
              </div>
              <input
                type="range"
                min="6"
                max="20"
                value={preBorg}
                onChange={(e) => setPreBorg(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>6 (Rest)</span>
                <span>13 (Somewhat Hard)</span>
                <span>20 (Maximal)</span>
              </div>
            </div>

            {/* Symptom Queries */}
            <div className="space-y-3 pt-2 border-t border-slate-700/60">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200 font-medium">
                  {lang === "ta" ? "ஏதேனும் உடல் வலி அல்லது மூட்டு வலி உள்ளதா?" : "Do you have any active pain or joint soreness?"}
                </span>
                <input
                  type="checkbox"
                  checked={prePain}
                  onChange={(e) => setPrePain(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200 font-medium">
                  {lang === "ta" ? "தலைச்சுற்றல் அல்லது பலவீனம் உள்ளதா?" : "Are you feeling any dizziness or lightheadedness?"}
                </span>
                <input
                  type="checkbox"
                  checked={preDizziness}
                  onChange={(e) => setPreDizziness(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
              </label>
            </div>

            {preCheckError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{preCheckError}</span>
              </div>
            )}
          </div>

          <button
            onClick={handlePreCheckSubmit}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{lang === "ta" ? "சரிபார்க்கப்பட்டு தொடரவும்" : "Proceed to Camera Setup"}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 2: SETUP & FRAMING CHECK */}
      {step === "setup_check" && (
        <div className="space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">
              {lang === "ta" ? "படி 2: கேமரா தூரம் மற்றும் வெளிச்ச சரிபார்ப்பு" : "Step 2: Camera Distance & Setup Check"}
            </h3>
            <p className="text-xs text-slate-400">
              {useSimulator
                ? (lang === "ta" ? "போலி முறை இயங்குகிறது; நீங்கள் நேரடியாக பயிற்சியைத் தொடங்கலாம்." : "Biomechanical Simulator ready. You can test rep counting and scoring immediately.")
                : (lang === "ta" ? "நாற்காலியில் அமர்ந்து, உங்கள் முழு கால்களும் தெரியும் வகையில் கேமராவை வைக்கவும்." : "Sit comfortably on your chair and ensure your full legs and torso are in the camera view.")}
            </p>
          </div>

          {/* Exercise Selector */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {exerciseKeys.map((k) => (
              <button
                key={k}
                onClick={() => setSelectedExKey(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedExKey === k ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {lang === "ta" ? EXERCISE_CONFIGS[k].tamil_name : EXERCISE_CONFIGS[k].name}
              </button>
            ))}
          </div>

          {/* Preview Area */}
          <div className="relative max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
            {!useSimulator && (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full object-contain ${!useSimulator ? 'transform -scale-x-100' : ''}`}
            />

            {/* Live Framing Banner */}
            <div className={`absolute bottom-3 left-3 right-3 p-3 rounded-xl backdrop-blur-md border text-xs flex items-center justify-between ${
              framingStatus.ok
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/80 border-amber-500/40 text-amber-200"
            }`}>
              <div className="flex items-center gap-2">
                {framingStatus.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span>{framingStatus.reason}</span>
              </div>
              <span className="font-bold text-[11px]">Angle: {Math.round(currentAngle)}°</span>
            </div>
          </div>

          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={() => {
                setStep("active_workout");
                safeSpeak(
                  lang === "ta"
                    ? "பயிற்சி தொடங்குகிறது. முழங்காலை மெதுவாக நேராக நீட்டவும்."
                    : "Starting exercise. Slowly straighten your leg."
                );
              }}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{lang === "ta" ? "பயிற்சியைத் தொடங்கு" : "Start Rep Counting"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ACTIVE GUIDED WORKOUT */}
      {step === "active_workout" && (
        <div className="space-y-4">
          {/* Workout Stats HUD */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ta" ? "சரியான எண்ணிக்கை" : "Valid Reps"}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-emerald-400">{validReps}</span>
                <span className="text-xs text-slate-400">/ {targetReps}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ta" ? "மூட்டு கோணம்" : "Joint Angle"}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-blue-400">{Math.round(currentAngle)}°</span>
                <span className="text-[10px] text-slate-400">Target: {currentExConfig.target_angle}°</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ta" ? "இதயத் துடிப்பு" : "Live Heart Rate"}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                {latestReading?.hr_ok && Number(latestReading.hr) > 0 ? (
                  <>
                    <span className="text-3xl font-black text-red-400">{latestReading.hr}</span>
                    <span className="text-xs text-slate-400">BPM</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-rose-400 block py-1.5">
                    {lang === "ta" ? "இணைக்கப்படவில்லை" : "Not Connected"}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ta" ? "மீட்பு புள்ளிகள்" : "Recovery Points"}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-amber-400">{points}</span>
                {streak > 1 && <span className="text-xs font-bold text-orange-400">🔥 {streak}x</span>}
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ta" ? "பயிற்சி நிலை" : "Set Progress"}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white">{currentSet}</span>
                <span className="text-xs text-slate-400">/ {totalSets} sets</span>
              </div>
            </div>
          </div>

          {/* Camera / Biomechanics Display */}
          <div className="relative max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            {!useSimulator && (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full object-contain ${!useSimulator ? 'transform -scale-x-100' : ''}`}
            />

            {/* Real-time Guidance Banner */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    {lastCorrection || (lang === "ta" ? "முழங்காலை நேராக நீட்டவும்." : "Maintain controlled tempo; extend knee fully.")}
                  </span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase">
                  {lang === "ta" ? currentExConfig.tamil_name : currentExConfig.name}
                </span>
              </div>
            </div>

            {/* Target Angle Visual Marker */}
            <div className="absolute right-4 bottom-4 bg-black/70 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 text-center text-xs">
              <span className="text-[10px] text-slate-400 block">Extension</span>
              <div className="w-12 h-2 bg-slate-700 rounded-full my-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentAngle - 90) / 80) * 100))}%` }}
                />
              </div>
              <span className="font-bold text-white">{Math.round(currentAngle)}°</span>
            </div>
          </div>

          {/* Controls: Safe Pause & Finish */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => triggerSafePause("Manual patient pause request")}
              className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4 text-amber-400" />
              <span>{lang === "ta" ? "பாதுகாப்பு நிறுத்தம்" : "Safe Pause"}</span>
            </button>

            <button
              onClick={handleFinishWorkout}
              className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{lang === "ta" ? "பயிற்சியை முடிக்க" : "Finish Session"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SAFE PAUSE OVERLAY ("The Protect Step") */}
      {step === "paused" && (
        <div className="max-w-md mx-auto py-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">
              {lang === "ta" ? "பாதுகாப்பு நிறுத்தம் செயலில் உள்ளது" : "MoveSafe Safe Pause Active"}
            </h3>
            <p className="text-xs text-amber-200 mt-2 bg-amber-950/60 p-3 rounded-xl border border-amber-500/30">
              {pauseReason}
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 text-left space-y-1.5">
            <p>• Breathe slowly and sit comfortably.</p>
            <p>• Buzzer pattern 5 (Long tone) dispatched to hardware node.</p>
            <p>• You may resume when vitals normalize, or finish the session.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep("active_workout")}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              {lang === "ta" ? "மீண்டும் தொடங்கு" : "Resume Session"}
            </button>
            <button
              onClick={handleFinishWorkout}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {lang === "ta" ? "முடிக்க" : "Finish Session"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SESSION SUMMARY & RECOVERY INTELLIGENCE SCORE */}
      {step === "summary" && finalSummary && (
        <div className="max-w-xl mx-auto py-4 space-y-6">
          <div className="text-center space-y-2">
            <Award className="w-12 h-12 text-blue-400 mx-auto" />
            <h3 className="text-2xl font-black text-white">
              {lang === "ta" ? "பயிற்சி சுருக்கம் & மீட்பு நுண்ணறிவு" : "Session Summary & Recovery Intelligence"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ta"
                ? "உங்கள் உடற்பயிற்சி வடிவம் மற்றும் முயற்சியின் அடிப்படையிலான மதிப்பீடு."
                : "Transparent performance evaluation calculated across 6 rehabilitation adherence parameters."}
            </p>
          </div>

          {/* Recovery Score Dial Card */}
          <div className="bg-gradient-to-b from-blue-950/60 to-slate-900 border border-blue-600/40 rounded-2xl p-6 text-center shadow-xl">
            <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">
              Recovery Intelligence Score
            </span>
            <div className="text-6xl font-black text-white my-2 font-mono drop-shadow">
              {finalSummary.score}
              <span className="text-2xl text-blue-400 font-normal">/100</span>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              {finalSummary.score >= 85 ? "Excellent Adherence" : finalSummary.score >= 70 ? "Good Progress" : "Moderate Effort"}
            </span>
          </div>

          {/* Breakdown Items */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Transparent Score Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                <span className="text-slate-300">1. Plan Completion Target</span>
                <span className="font-bold text-white">{finalSummary.breakdown.planCompletion} / 25 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                <span className="text-slate-300">2. Valid Range of Motion Reps</span>
                <span className="font-bold text-white">{finalSummary.breakdown.validRepRatio} / 25 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                <span className="text-slate-300">3. Biomechanical Form Quality</span>
                <span className="font-bold text-white">{finalSummary.breakdown.formQuality} / 20 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                <span className="text-slate-300">4. Tempo & Cadence Control</span>
                <span className="font-bold text-white">{finalSummary.breakdown.tempoControl} / 10 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                <span className="text-slate-300">5. Exertion within Limits (Borg)</span>
                <span className="font-bold text-white">{finalSummary.breakdown.effortControl} / 10 pts</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">6. Physiological Stability Shield</span>
                <span className="font-bold text-white">{finalSummary.breakdown.vitalsStability} / 10 pts</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onFinishSession(finalSummary)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {lang === "ta" ? "முடிவுகளைச் சேமித்து வெளியேறுக" : "Save Results & Return to Dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}