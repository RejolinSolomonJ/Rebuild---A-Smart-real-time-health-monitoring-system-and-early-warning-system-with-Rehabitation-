# ReBuild Hardware Wiring & Connection Guide
**Team Preva**

## Hardware Architecture: Sentinel Embedded Node

The Sentinel sensor node is built exclusively on the Arduino Uno or Nano architecture. It contains **no display, no accelerometer, and no onboard WiFi**, maintaining an ultra-low bill of materials (< \$15) suitable for scalable community and rural deployment.

```
                  +--------------------------------+
                  |          ARDUINO UNO           |
                  |                                |
  [Pulse Sensor]  | A0 (Analog)                    |
  [Temp DS18B20]  | D2 (Digital / 4.7k Pull-up)    |
  [Temp LM35]     | A1 (Optional Alt)              |
  [PIR Motion]    | D3 (Digital Interrupt/Input)   |
  [Vibration]     | D4 (Digital Interrupt Pin)     |
  [Piezo Buzzer]  | D5 (PWM Safety Alarm)          |
  [HC-05 BT Opt]  | D10 (RX) / D11 (TX)            |
  [Power/Serial]  | USB Type-B / 115200 Baud       |
                  +--------------------------------+
```

---

## Detailed Pinout Mapping

| Component | Arduino Pin | Operating Voltage | Function / Notes |
| :--- | :--- | :--- | :--- |
| **Pulse Sensor** | `A0` | 5.0V / 3.3V | Optical photoplethysmogram (PPG) sampled at 500 Hz. Computes BPM and IBI. |
| **DS18B20 Temp** | `D2` | 3.3V - 5.0V | Digital OneWire temperature sensor (Default). Requires a 4.7kΩ pull-up resistor between Signal and 5V. |
| **LM35 Temp** | `A1` | 4.0V - 20.0V | Alternative analog sensor (10 mV/°C). Activated by setting `#define USE_DS18B20 0` in firmware. |
| **HC-SR501 PIR** | `D3` | 5.0V | Passive Infrared Motion sensor. Placed facing room/chair. Detects presence/activity (not skeletal posture). |
| **SW-420 Vibration** | `D4` | 3.3V - 5.0V | Worn on patient's wrist band. Measures pulse counts/sec to flag impact bursts (>35 cps) and arm motion (>8 cps). |
| **Piezo Buzzer** | `D5` | 5.0V | Non-blocking PWM audio emitter. Plays safety chime patterns (0 to 5). |
| **HC-05 BT (Optional)**| `D10 (RX), D11 (TX)` | 3.3V / 5.0V | SoftwareSerial wireless bridge at 9600 baud. Pair with Bluetooth PIN `1234`. |
| **USB Serial** | USB Port | 5.0V | Primary connection link at 115200 baud streaming 1 JSON line per second. |

---

## Non-Blocking Buzzer Patterns

| Pattern ID | Tone / Rhythm | System Meaning | Trigger Source |
| :--- | :--- | :--- | :--- |
| **0** | Off | Silence / Normal | System mute or nominal state |
| **1** | 1 Short Beep (100ms) | Information / Boot sync | Node boot or successful sync |
| **2** | 2 Beeps (120ms on/off) | Inactivity Movement Prompt | Daytime stillness > 45 mins (30s in demo) |
| **3** | 3 Beeps (150ms cadence) | Drift / Caution Warning | Sustained resting HR drift or mild fever |
| **4** | Rapid Continuous Beeping | Urgent / Fall Countdown | Impact detected + no subsequent motion |
| **5** | 1 Long Beep (700ms) | Exercise Paused for Safety | Vitals limit crossed during MoveSafe rehab |

---

## Safety & Electrical Considerations
1. **No High Voltages**: All circuits operate under safe low voltage DC (3.3V - 5.0V).
2. **Wristband Isolation**: The vibration sensor and optical pulse sensor are skin-contact components. Ensure insulated plastic backing with no exposed leads.
3. **PIR Field of View**: The HC-SR501 PIR sensor has a 110° cone. Position it toward the patient's primary resting chair.
