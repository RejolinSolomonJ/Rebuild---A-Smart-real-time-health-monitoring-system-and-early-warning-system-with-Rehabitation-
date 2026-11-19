# ReBuild System Architecture
**Team Preva**

## Closed-Loop Vision: "Monitor, Plan, Guide, Protect, Connect"

Recovery does not stop when a patient exits the clinic door. ReBuild bridges the critical gap between hospital and home through an integrated assistive ecosystem:

```
    +-----------------------------------------------------------------+
    |                           REBUILD                               |
    |                                                                 |
    |  +---------------------------+     +--------------------------+ |
    |  |          SENTINEL         |     |         MOVESAFE         | |
    |  |    (Monitor & Warn)       |     |     (Guide & Protect)    | |
    |  |                           |     |                          | |
    |  | - Hardware Sensor Node    |     | - In-Browser MediaPipe   | |
    |  | - Personal Baseline EWMA  |     | - Zero-Cloud Video PWA   | |
    |  | - Sustained Drift Check   | <-> | - Joint Form Checker     | |
    |  | - Sensor-Fusion Fall FSM  |     | - Rep State Machine      | |
    |  | - Smart Inactivity Prompt |     | - Recovery Intel Score   | |
    |  | - Clinician Limits Shield |     | - Safe Pause Watchdog    | |
    |  +---------------------------+     +--------------------------+ |
    |                                                                 |
    |              Shared Data Model & Real-Time Engine               |
    |      (Patient, Baseline, Plan, Session, Alerts, Telemetry)      |
    +-----------------------------------------------------------------+
```

---

## 5 Core Closed-Loop Pillars

1. **Monitor (Sentinel)**: Continuous 1-Hz telemetry captures physiological vitals (resting heart rate, core temperature) and physical activity metrics (PIR ambient room motion, wrist vibration counts).
2. **Plan (Physiotherapist-Approved)**: Certified physiotherapists configure personalized exercise programs, specifying movement library items, sets, target reps, rest periods, and safe ceiling parameters (maximum heart rate, maximum Borg RPE exertion).
3. **Guide (MoveSafe)**: Computer vision executed 100% locally on the device (MediaPipe Pose in the browser) analyzes joint angles in real time. Provides multilingual visual text and synthesized voice feedback (Tamil and English) to coach patient form.
4. **Protect (Unified Safeguards)**: Real-time sensor fusion and physiological telemetry trigger automatic safe pauses. If cardiac effort, temperature, or reported symptoms exceed prescribed limits, MoveSafe halts immediately and sounds buzzer pattern 5.
5. **Connect (Caregiver & Community)**: Automated alerts, SMS escalations (via Twilio), risk-stratified triage dashboards for community health workers, and downloadable clinical PDF reports keep the care circle informed.

---

## Privacy Architecture: Zero-Video Cloud Upload

MoveSafe runs Google MediaPipe Pose Tasks Vision **strictly client-side within the web browser**:
- Camera video frames **never leave the local device**.
- No video or raw image pixels are uploaded, streamed, or persisted to any cloud server or database.
- The browser extracts 2D/3D joint landmark coordinates locally, evaluates the rep state machine in memory, and submits only mathematical metrics (valid rep count, timestamp, duration, and detected form fault tags) to the backend.

---

## Multi-User Role Matrix

| User Role | Primary Needs | Accessible Views & Privileges |
| :--- | :--- | :--- |
| **Patient / Wearer** | Simplicity, clarity, motivation | Big status badge (Green/Amber/Red), guided exercise player, "I am OK" fall dismiss, language toggle. |
| **Caregiver (Family)**| Peace of mind, early warning | Real-time status cards, SMS notifications, fall countdown tracker, visit-to-visit progress. |
| **Physiotherapist** | Clinical oversight, safe limits | Exercise plan builder & approval, maximum HR/Borg limits, form fault trends, Recovery Intelligence breakdowns. |
| **Health Worker** | Population triage, prioritization | Community roster ranked by composite risk score, last-seen timestamps, vital sign red flags. |
