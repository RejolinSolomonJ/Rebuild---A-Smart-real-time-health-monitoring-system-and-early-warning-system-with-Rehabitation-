# Clinical & Technical Validation Plan
**ReBuild (Sentinel + MoveSafe) | Team Preva**

## 1. Scope & Objective
This validation protocol specifies the experimental methodology to assess the measurement accuracy, reliability, and edge-case resilience of ReBuild without claiming uncertified clinical equivalency.

---

## 2. Physiological Measurement Benchmarking

### 2.1 Heart Rate (Pulse Sensor on A0)
- **Reference Standard**: ISO 80601-2-61 certified medical fingertip pulse oximeter (e.g. Nonin Onyx Vantage 9590).
- **Cohort**: 15 healthy volunteers across resting, sitting, and mild post-exercise recovery states.
- **Protocol**: Simultaneous recording of 5-minute epochs at 1 Hz.
- **Statistical Evaluation**:
  - Pearson correlation coefficient ($r \ge 0.92$ target).
  - Bland-Altman 95% limits of agreement (target: bias $< \pm 3.5$ BPM).
  - Verification that motion artifacts (`arm == 1`) trigger `low_signal` and suppress false tachycardia alerts.

### 2.2 Core Temperature (DS18B20 vs LM35)
- **Reference Standard**: Calibrated clinical contact digital thermometer (ISO 80601-2-56).
- **Protocol**: Skin-surface temperature compared over ambient variations (20 °C to 38 °C).
- **Statistical Evaluation**: Mean absolute error (MAE target $< 0.35$ °C).

---

## 3. MoveSafe Computer Vision & Biomechanical Benchmarking

### 3.1 Joint Angle Validation
- **Reference Standard**: Physical clinical goniometer and 2D kinematics analysis (Vicon / Dartfish reference).
- **Key Angles Evaluated**:
  - Knee flexion/extension ($90^\circ$ to $180^\circ$).
  - Hip angle during chair stand ($80^\circ$ to $175^\circ$).
  - Shoulder abduction/flexion ($0^\circ$ to $120^\circ$).
- **Success Criteria**: Mean Angular Error $\le 4.5^\circ$ across angles with confidence $> 0.65$.

### 3.2 Rep Counting State Machine Precision & Recall
- **Protocol**: 100 scripted repetitions per exercise, including intentional incomplete reps (e.g., knee stopped at $140^\circ$) and rapid cadence ($< 1.0\text{s}$).
- **Target Metrics**:
  - True Rep Detection Sensitivity: $\ge 96\%$.
  - Incomplete Rep Rejection Specificity: $\ge 98\%$.

---

## 4. Fall Detection & False Alarm Suppression Protocol
- **Simulated Test Battery**:
  - 30 deliberate soft-mat falls (simulated forward, backward, lateral drops).
  - 50 Activities of Daily Living (ADL) control tests: sitting down quickly, clapping, opening doors, dropping keys, typing.
- **Evaluation Criteria**:
  - Impact burst detection rate $\ge 95\%$ on falls.
  - Zero false alarms resulting in caregiver SMS when user recovers motion within the 30-second cancellation window.
