# ReBuild: Live Platform Demo Script
**Team Preva**

## Target Narrative
Demonstrate a complete, seamless closed loop across hardware, Sentinel AI monitoring, MoveSafe guided rehabilitation, and emergency caregiver connection for **Ramesh, 68**, who lives alone.

---

## Act 1: The Patient & Sentinel Baseline (0:00 - 0:45)
1. **Open Patient Dashboard**: Point out the clear **Green Status Badge** ("Resting vitals normal within 7-day baseline").
2. **Hardware/Simulator Connection**: Show the 1-Hz live stream on the 10-minute historical chart (Heart Rate ~72 BPM, Temperature 36.6 °C, PIR Motion active).
3. **Low-Signal Filter**: Shake the wristband (or toggle `--scenario low_signal`): Notice how the dashboard displays *"Low signal, adjust sensor"* rather than generating a false heart rate spike alarm.

---

## Act 2: MoveSafe Guided Rehabilitation & Form Guidance (0:45 - 1:45)
1. **Start Exercise Session**: Click **"Start Session"**. Show the pre-session safety screen:
   - "Vitals checked: Normal."
   - "Plan approved by Dr. Kavitha (PT)."
2. **MoveSafe Camera Coach**: Camera launches client-side (no video leaves the device).
3. **Form Coaching**:
   - Perform a clean seated knee extension: Voice announces *"Rep 1, good form"*, counter increments.
   - Perform an incomplete extension (stopping midway): Counter does NOT increment. Visual banner and spoken feedback: *"Straighten the knee more to reach full extension"* (or Tamil: *"முழங்காலை இன்னும் நேராக நீட்டவும்"*).
4. **Trigger Safe Pause**:
   - Simulator or heart rate climbs above 125 BPM (or trigger `--scenario rehab_session_vitals_spike`).
   - Buzzer emits Pattern 5 (one long beep). MoveSafe instantly halts: *"Exercise paused for safety: Heart rate exceeded prescribed 125 BPM limit."*

---

## Act 3: Fall Detection & Emergency Escalation (1:45 - 2:30)
1. **Trigger Fall**: Simulate impact followed by immobility (`--scenario fall` or tap impact sensor).
2. **Countdown Banner**: The dashboard shows a prominent flashing 30-second countdown banner with urgent buzzer Pattern 4.
3. **Cancellation Demo**:
   - Tap **"I am OK"** (or move in front of PIR): Countdown cancels immediately, buzzer silences, and "False alarm" is logged.
4. **Caregiver Escalation**: Run countdown to zero: SMS alert is instantly dispatched to caregiver Anita via Twilio / mock log with direct emergency instructions (*"Call 112 / 911"*).

---

## Act 4: Multi-User Views & Doctor's Weekly Report (2:30 - 3:00)
1. **Switch to Physiotherapist Dashboard**: Show plan builder, limits configuration, and session Recovery Intelligence Score breakdown (e.g., 88.5/100).
2. **Switch to Health Worker View**: Show rural community list sorted by composite risk score.
3. **Generate Weekly Report**: Click **"Download Doctor's PDF Report"** — show professional clinical summary contrasting 7-day baseline against this week's trends.
