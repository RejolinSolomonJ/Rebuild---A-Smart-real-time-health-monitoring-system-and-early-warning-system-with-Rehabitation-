# ReBuild: Smart Real-Time Health Monitoring and Early-Warning System with Home Rehabilitation

**Team Preva**  
**Problem Statement**: Real-Time Health Monitoring and Early Warning System

> [!IMPORTANT]
> **ASSISTIVE & MEDICAL DISCLAIMER**:  
> ReBuild is an assistive monitoring and screening tool. It is **NOT** a diagnostic system, a medical device, or a substitute for professional clinical care. No clinical validity or diagnostic equivalency is claimed. All clinical limits and exercise thresholds are configurable placeholders that must be customized by a licensed healthcare professional.

---

## 1. Overview & Architecture

ReBuild is **one unified application** uniting two specialized engines sharing one underlying data model:

- **Sentinel (Monitor and Warn)**: An ultra-low-cost Arduino Uno/Nano node (< \$15 BOM) coupled with an intelligent backend that continuously learns each individual's 7-day physiological baseline, detects sustained cardiac and temperature drift, classifies physical inactivity, detects potential falls via sensor fusion, and alerts designated family caregivers.
- **MoveSafe (Guide and Protect)**: An in-browser computer-vision exercise coach powered by MediaPipe Pose running 100% locally on the user's phone or laptop. Checks biomechanical form from joint angles, counts only valid repetitions meeting prescribed range of motion, provides multilingual spoken feedback in Tamil (`ta-IN`) and English (`en-IN`), and triggers an immediate **Safe Pause** if vital signs, effort, or symptoms cross safety thresholds.

Together they establish the complete closed loop: **Monitor, Plan, Guide, Protect, Connect**.

```
                           +-------------------------------------+
                           |               REBUILD               |
                           +-------------------------------------+
                                      /               \
                                     /                 \
                                    v                   v
                     +--------------------+       +--------------------+
                     |      SENTINEL      |       |      MOVESAFE      |
                     |  (Monitor & Warn)  |       |  (Guide & Protect) |
                     +--------------------+       +--------------------+
                     | - Arduino Sensors  |  <->  | - In-Browser Pose  |
                     | - 7-Day Baseline   |       | - Rep State Machine|
                     | - Sustained Drift  |       | - Form Corrections |
                     | - Fall Fusion FSM  |       | - Safe Pause Watch |
                     | - SMS / Buzzer 1-5 |       | - Recovery Score   |
                     +--------------------+       +--------------------+
                                     \                 /
                                      \               /
                                       v             v
                               +-----------------------------+
                               |     SHARED DATA MODEL       |
                               |  FastAPI + SQLite Backend   |
                               +-----------------------------+
```

---

## 2. Hardware Specification (Sentinel Node)

The hardware node contains **no display, no accelerometer, and no WiFi** on the board, keeping power consumption and component costs ultra-low:

| Sensor / Component | Arduino Pin | Notes |
| :--- | :--- | :--- |
| **Pulse Sensor (Analog)** | `A0` | Sampled at 500 Hz using `micros()` scheduler. Computes BPM and IBI. |
| **DS18B20 Temp Sensor** | `D2` | Digital OneWire (Default, 4.7kΩ pull-up). Switchable to LM35 on `A1` via `#define USE_DS18B20 0`. |
| **PIR Motion (HC-SR501)** | `D3` | Faces user's chair or room. Measures room presence and stillness (not posture). |
| **Vibration (SW-420/Piezo)** | `D4` | Worn on wristband. Detects impact bursts (`impact=1`) and arm motion (`arm=1`). |
| **Piezo Buzzer** | `D5` | Plays safety chime patterns 0 to 5 via non-blocking `millis()`. |
| **HC-05 Bluetooth (Opt.)** | `D10 / D11` | SoftwareSerial alternative. Default link is USB Serial at 115200 baud. |

### Buzzer Safety Patterns
- **0**: Off / Silence
- **1**: One short beep (System boot / sync)
- **2**: Two beeps (Inactivity movement prompt)
- **3**: Three beeps (Drift / physiological caution warning)
- **4**: Continuous fast beeping (Urgent / 30-second fall countdown)
- **5**: One long beep (MoveSafe exercise safely paused for protection)

---

## 3. Repository Layout

```
rebuild/
  firmware/
    rebuild/
      rebuild.ino            # Arduino C++ sketch (Uno/Nano, RAM < 75%)
  backend/
    app/                     # FastAPI core, database, schemas, serial worker, PDF generator
    engine/                  # Pure Python Sentinel modules (baseline, drift, fall FSM, risk score)
    rehab/                   # MoveSafe exercises.json, evaluator, Recovery Intelligence Score
    tests/                   # Pytest unit test suite (15/15 passing)
    requirements.txt         # Python dependencies
    .env.example             # Configuration template
  frontend/                  # React + Vite + Tailwind PWA with MoveSafe Pose Coach
  simulator/
    simulator.py             # Telemetry & scenario simulator (normal, drift, fever, fall, etc.)
  tools/
    replay_pose.py           # Offline video and pose analysis harness
  docs/
    wiring.md                # Pinouts, schematic, and electrical notes
    architecture.md          # 5 closed-loop pillars and privacy architecture
    score.md                 # Recovery Intelligence Score formulation (0-100)
    validation-plan.md       # Benchmarking protocol against reference standards
    demo-script.md           # 3-minute live presentation guide
  README.md
```

---

## 4. Quick Start & Execution Guide

### Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed
- Arduino IDE (if compiling for physical hardware)

---

### Step 1: Run the Backend & Sentinel Engine

#### On Windows (PowerShell or Command Prompt):
```cmd
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### On Linux / macOS:
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend automatically initializes `rebuild.db` with Ramesh Kumar (Patient, 68), an approved rehabilitation plan, baseline records, and caregiver links.*

---

### Step 2: Run the Frontend (React + Vite PWA)

#### On Windows / Linux / macOS:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Step 3: Run the Telemetry Simulator (No Hardware Required)

The simulator sends identical 1-Hz telemetry to the backend, enabling full testing without an Arduino:

```bash
# In a new terminal:
cd simulator

# 1. Normal baseline telemetry
python simulator.py --scenario normal --target-url http://localhost:8000/api/readings

# 2. Cardiac drift scenario (sustained HR elevation at rest)
python simulator.py --scenario drift --target-url http://localhost:8000/api/readings --speed 2.0

# 3. Fall candidate scenario (impact followed by stillness)
python simulator.py --scenario fall --target-url http://localhost:8000/api/readings

# 4. Low signal test (arm movement artifact discard)
python simulator.py --scenario low_signal --target-url http://localhost:8000/api/readings
```

---

## 5. Verification & Unit Testing

Execute the comprehensive unit test suite:
```bash
python -m pytest backend/tests -v
```

### Verified Test Modules:
- `test_engine.py`: Resting state criteria, 7-day personal baseline exponential moving average (EWMA), drift detection with spike rejection, inactivity evaluation, and outdoor worker heat-stress rule.
- `test_fall_detector.py`: Sensor fusion finite state machine (`IDLE` $\rightarrow$ `IMPACT_CANDIDATE` $\rightarrow$ `COUNTDOWN` $\rightarrow$ `CONFIRMED_FALL`), false alarm suppression via motion, and manual "I am OK" cancellation.
- `test_rep_counter.py`: Joint angle vector geometry, seated knee extension clean repetition, incomplete range-of-motion rejection, and transparent Recovery Intelligence Score calculation.
- `test_serial_parser.py`: Low-signal filtering (`arm=1` or `hr_ok=false`), malformed packet protection, and hardware command execution.

---

## 6. MoveSafe Privacy & Security Architecture

1. **Zero-Cloud Video**: Video frames are processed entirely client-side via MediaPipe in the web browser. No images or video feeds ever touch network sockets or backend servers.
2. **Signal Quality Guard**: Cardiac readings captured during wrist motion (`arm == 1`) are flagged as `low_signal` and automatically suppressed from triggering false tachycardia alerts.
3. **Informed Consent**: Built-in consent gateway ensures user agreement before telemetry persistence or caregiver data sharing.
4. **Resilient Hardware Serial**: Ingestion engine automatically reconnects if the USB cable is unplugged without crashing the server.

---

## 7. Platform Walkthrough & Demonstration

For the step-by-step walkthrough, follow the guide in [`docs/demo-script.md`](file:///docs/demo-script.md).
