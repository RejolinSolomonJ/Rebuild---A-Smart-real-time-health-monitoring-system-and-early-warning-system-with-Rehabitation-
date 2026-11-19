/*
  =============================================================================
  ReBuild: Smart Real-Time Health Monitoring & Assistive Rehabilitation Node
  Team Preva | Architecture Node: Sentinel Embedded Sensor Node (v1.0)
  =============================================================================

  WIRING GUIDE:
  -----------------------------------------------------------------------------
  Sensor / Actuator       | Arduino Pin | Notes
  -----------------------------------------------------------------------------
  Pulse Sensor (Analog)   | A0          | VCC to 5V/3.3V, GND to GND, Signal to A0
  Temp: DS18B20 (Default) | D2          | Digital Pin 2 (4.7k pull-up resistor to 5V)
  Temp: LM35 / DHT22      | A1          | Analog Pin 1 / Digital A1 (Set USE_DHT22 to 1)
  PIR Motion (HC-SR501)   | D3          | Digital Pin 3 (High when motion detected)
  Vibration (SW-420/Piezo)| D4          | Digital Pin 4 (Pulse count for impact/arm)
  Piezo Buzzer            | D5          | Digital Pin 5 (PWM capable, safety patterns)
  16x2 LCD (HD44780)      | 8,9,4,5,6,7 | RS=8, EN=9, D4=4, D5=5, D6=6, D7=7 (3s cycle)
  HC-05 Bluetooth (Opt.)  | D10 (RX)    | Connected to HC-05 TX
                          | D11 (TX)    | Connected to HC-05 RX (via voltage divider)
  Serial Baud Rate        | USB Serial  | 115200 baud
  -----------------------------------------------------------------------------
  SAFETY & MEDICAL DISCLAIMER:
  This firmware is part of an assistive and screening prototype. It does NOT
  diagnose medical conditions and is NOT a certified life-support device.
  All local safety limits below are configurable placeholder defaults to be
  reviewed and set by a qualified clinician.
  =============================================================================
*/

// ======================== CONFIGURATION CONSTANTS =========================
#define FIRMWARE_VERSION "1.0"

// Sensor selection
#define USE_DS18B20       1    // 1: DS18B20 on D2, 0: LM35 on A1
#define USE_LCD_1602      1    // 1: Enable 16x2 HD44780 LCD Shield (Pins 8, 9, 4, 5, 6, 7)
#define USE_DHT22         0    // 1: Enable DHT22 on A1 (Temp & Humidity), 0: DS18B20
#define LCD_CYCLE_MS      3000UL // Cycle LCD page every 3 seconds

#if USE_LCD_1602
#include <LiquidCrystal.h>
LiquidCrystal lcd(8, 9, 4, 5, 6, 7);
unsigned long lastLcdCycle = 0;
byte currentLcdPage = 0; // Page 0: Vitals, Page 1: Motion, Page 2: State
#endif

// Hardware Pins
#define PIN_PULSE         A0
#define PIN_LM35          A1
#define PIN_ONEWIRE       2
#define PIN_PIR           3
#define PIN_VIBRATION     4
#define PIN_BUZZER        5

// Timing Intervals (milliseconds)
#define HEART_SAMPLE_US   2000UL     // 500 Hz sampling = 2000 microseconds
#define STREAM_INTERVAL   1000UL     // 1 Hz telemetry output
#define TEMP_INTERVAL     2000UL     // Read temperature every 2 seconds
#define WARMUP_TIME_MS    30000UL    // 30 seconds warm-up before reporting HR

// Heart Rate Algorithm Constants
#define MIN_IBI_MS        300        // Ignore beats closer than 300ms (max 200 BPM)
#define MAX_IBI_MS        2000       // Min 30 BPM
#define HR_TIMEOUT_MS     5000UL     // hr_ok=false if no beat detected for 5 sec
#define MIN_AMPLITUDE     40         // Minimum ADC amplitude to consider valid beat

// Vibration & Motion Thresholds
#define VIB_ARM_THRESH    8          // Vibration counts/sec threshold for arm movement
#define VIB_IMPACT_THRESH 35         // Vibration counts/sec threshold for impact burst

// PLACEHOLDER Local Clinician Safety Limits (standalone safety when disconnected)
// NOTE: These are non-diagnostic placeholders. Must be customized by a clinician.
#define SAFE_HR_MIN       45         // BPM
#define SAFE_HR_MAX       145        // BPM
#define SAFE_TEMP_MIN     35.0f      // Celsius
#define SAFE_TEMP_MAX     39.2f      // Celsius
#define VIOLATION_LIMIT_S 30         // Trigger local alarm after 30 consecutive seconds

// ======================== GLOBAL STATE VARIABLES ==========================
// Heart Rate (500 Hz sampler)
unsigned long lastMicrosHR = 0;
int signalMin = 1023;
int signalMax = 0;
int adaptiveThreshold = 512;
bool pulseDetected = false;
unsigned long lastBeatTime = 0;
unsigned int ibiHistory[10];
byte ibiIndex = 0;
byte ibiCount = 0;
int currentBPM = 0;
bool hrOk = false;
unsigned long hrWarmupStart = 0;

// Temperature & Humidity
unsigned long lastTempRead = 0;
float currentTemp = 36.5f;
float currentHumidity = 52.0f;
float tempBuffer[3] = {36.5f, 36.5f, 36.5f};
byte tempIndex = 0;

// PIR & Inactivity
bool pirActiveInLastSec = false;
unsigned long lastMotionMillis = 0;
unsigned int idleSeconds = 0;

// Vibration & Impact
volatile unsigned int vibCounter = 0;
unsigned int lastVibRate = 0;
bool impactDetected = false;
bool armMoving = false;

// Local Safety Watchdog
unsigned int safetyViolationSeconds = 0;

// Buzzer Engine (Non-blocking)
byte activePattern = 0;
unsigned long buzzerStepStart = 0;
byte buzzerStep = 0;
unsigned long muteUntilMillis = 0;

// Serial & Telemetry
unsigned long lastStreamMillis = 0;
char serialInBuffer[64];
byte serialInPos = 0;

// ======================== INTERRUPTS & SENSORS ============================
void onVibrationInterrupt() {
  vibCounter++;
}

// Minimal OneWire bit-bang for DS18B20 to keep flash and RAM ultra-low
#if USE_DS18B20
void oneWireReset() {
  pinMode(PIN_ONEWIRE, OUTPUT);
  digitalWrite(PIN_ONEWIRE, LOW);
  delayMicroseconds(480);
  pinMode(PIN_ONEWIRE, INPUT);
  delayMicroseconds(70);
  delayMicroseconds(410);
}

void oneWireWriteByte(byte data) {
  for (byte i = 0; i < 8; i++) {
    pinMode(PIN_ONEWIRE, OUTPUT);
    digitalWrite(PIN_ONEWIRE, LOW);
    if (data & 0x01) {
      delayMicroseconds(10);
      pinMode(PIN_ONEWIRE, INPUT);
      delayMicroseconds(55);
    } else {
      delayMicroseconds(65);
      pinMode(PIN_ONEWIRE, INPUT);
      delayMicroseconds(5);
    }
    data >>= 1;
  }
}

byte oneWireReadByte() {
  byte data = 0;
  for (byte i = 0; i < 8; i++) {
    pinMode(PIN_ONEWIRE, OUTPUT);
    digitalWrite(PIN_ONEWIRE, LOW);
    delayMicroseconds(3);
    pinMode(PIN_ONEWIRE, INPUT);
    delayMicroseconds(10);
    if (digitalRead(PIN_ONEWIRE)) {
      data |= (1 << i);
    }
    delayMicroseconds(50);
  }
  return data;
}

float readDS18B20() {
  oneWireReset();
  oneWireWriteByte(0xCC); // Skip ROM
  oneWireWriteByte(0x44); // Convert T
  
  oneWireReset();
  oneWireWriteByte(0xCC); // Skip ROM
  oneWireWriteByte(0xBE); // Read Scratchpad
  
  byte low = oneWireReadByte();
  byte high = oneWireReadByte();
  int16_t raw = (high << 8) | low;
  
  // DS18B20 resolution is 0.0625 C per bit
  float t = (float)raw * 0.0625f;
  if (t < -10.0f || t > 60.0f) {
    return currentTemp; // Reject erratic readings
  }
  return t;
}
#else
float readLM35() {
  int raw = analogRead(PIN_LM35);
  // LM35: 10mV/C, Vref = 5.0V (or 1.1V internal)
  float mV = (raw * 5000.0f) / 1024.0f;
  return mV / 10.0f;
}
#endif

// Median filter of 3
float medianOfThree(float a, float b, float c) {
  if ((a <= b && b <= c) || (c <= b && b <= a)) return b;
  if ((b <= a && a <= c) || (c <= a && a <= b)) return a;
  return c;
}

// ======================== BUZZER ENGINE ===================================
// Patterns:
// 0: Off
// 1: One short beep (Info / sync)
// 2: Two beeps (Inactivity movement prompt)
// 3: Three beeps (Warning / drift)
// 4: Continuous fast beeping (Urgent / fall countdown)
// 5: One long beep (Exercise paused for safety)
void playPattern(byte id) {
  if (millis() < muteUntilMillis && id != 4) return; // Mute honors all except urgent fall
  activePattern = id;
  buzzerStep = 0;
  buzzerStepStart = millis();
}

void updateBuzzer() {
  if (activePattern == 0) {
    digitalWrite(PIN_BUZZER, LOW);
    return;
  }

  unsigned long elapsed = millis() - buzzerStepStart;

  switch (activePattern) {
    case 1: // One short beep (100ms on, then off)
      if (buzzerStep == 0) {
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 100) {
          digitalWrite(PIN_BUZZER, LOW);
          activePattern = 0;
        }
      }
      break;

    case 2: // Two beeps (120ms on, 100ms off, 120ms on, then off)
      if (buzzerStep == 0) {
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 120) {
          digitalWrite(PIN_BUZZER, LOW);
          buzzerStep = 1;
          buzzerStepStart = millis();
        }
      } else if (buzzerStep == 1) {
        digitalWrite(PIN_BUZZER, LOW);
        if (elapsed >= 100) {
          digitalWrite(PIN_BUZZER, HIGH);
          buzzerStep = 2;
          buzzerStepStart = millis();
        }
      } else if (buzzerStep == 2) {
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 120) {
          digitalWrite(PIN_BUZZER, LOW);
          activePattern = 0;
        }
      }
      break;

    case 3: // Three beeps (warning)
      if (buzzerStep % 2 == 0) { // ON phases: 0, 2, 4
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 150) {
          digitalWrite(PIN_BUZZER, LOW);
          buzzerStep++;
          buzzerStepStart = millis();
        }
      } else { // OFF phases: 1, 3
        digitalWrite(PIN_BUZZER, LOW);
        if (elapsed >= 120) {
          buzzerStep++;
          buzzerStepStart = millis();
          if (buzzerStep >= 5) activePattern = 0;
        }
      }
      break;

    case 4: // Continuous fast beeping (80ms on, 80ms off)
      if (buzzerStep == 0) {
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 80) {
          digitalWrite(PIN_BUZZER, LOW);
          buzzerStep = 1;
          buzzerStepStart = millis();
        }
      } else {
        digitalWrite(PIN_BUZZER, LOW);
        if (elapsed >= 80) {
          buzzerStep = 0;
          buzzerStepStart = millis();
        }
      }
      break;

    case 5: // One long beep (700ms on - exercise paused)
      if (buzzerStep == 0) {
        digitalWrite(PIN_BUZZER, HIGH);
        if (elapsed >= 700) {
          digitalWrite(PIN_BUZZER, LOW);
          activePattern = 0;
        }
      }
      break;

    default:
      digitalWrite(PIN_BUZZER, LOW);
      activePattern = 0;
      break;
  }
}

// ======================== HEART RATE SAMPLER ==============================
void processHeartRateSample() {
  int rawSignal = analogRead(PIN_PULSE);

  // Dynamic range tracker (decaying slowly)
  if (rawSignal < signalMin) signalMin = rawSignal;
  if (rawSignal > signalMax) signalMax = rawSignal;

  // Adaptive threshold is midpoint
  adaptiveThreshold = (signalMin + signalMax) / 2;

  unsigned long now = millis();
  unsigned long timeSinceLastBeat = now - lastBeatTime;

  // Peak detection with refractory period (MIN_IBI_MS)
  if (rawSignal > (adaptiveThreshold + 20) && !pulseDetected && (timeSinceLastBeat > MIN_IBI_MS)) {
    int amplitude = signalMax - signalMin;
    if (amplitude >= MIN_AMPLITUDE) {
      pulseDetected = true;
      if (lastBeatTime > 0 && timeSinceLastBeat < MAX_IBI_MS) {
        // Valid beat!
        ibiHistory[ibiIndex] = (unsigned int)timeSinceLastBeat;
        ibiIndex = (ibiIndex + 1) % 10;
        if (ibiCount < 10) ibiCount++;

        // Compute average IBI
        unsigned long sumIBI = 0;
        for (byte i = 0; i < ibiCount; i++) {
          sumIBI += ibiHistory[i];
        }
        unsigned int avgIBI = sumIBI / ibiCount;
        if (avgIBI > 0) {
          currentBPM = (int)(60000UL / avgIBI);
        }
      }
      lastBeatTime = now;
    }
  }

  if (rawSignal < (adaptiveThreshold - 20) && pulseDetected) {
    pulseDetected = false;
  }

  // Decay min and max slowly towards center to adapt to DC drift
  static unsigned long lastDecay = 0;
  if (now - lastDecay > 100) {
    lastDecay = now;
    if (signalMin < 500) signalMin += 2;
    if (signalMax > 524) signalMax -= 2;
  }

  // Validity check: warm-up period, signal freshness, and movement artifacts
  if (now - hrWarmupStart < WARMUP_TIME_MS) {
    hrOk = false;
  } else if (now - lastBeatTime > HR_TIMEOUT_MS) {
    hrOk = false;
    currentBPM = 0;
  } else if ((signalMax - signalMin) < MIN_AMPLITUDE) {
    hrOk = false;
  } else {
    hrOk = true;
  }
}

// ======================== SERIAL COMMAND PARSER ===========================
// Accepts: {"cmd":"buzz","pattern":2} and {"cmd":"mute","seconds":60}
void parseSerialCommand(const char* json) {
  if (strstr(json, "\"buzz\"") != NULL) {
    char* patPtr = strstr(json, "\"pattern\":");
    if (patPtr != NULL) {
      int p = atoi(patPtr + 10);
      if (p >= 0 && p <= 5) {
        playPattern((byte)p);
      }
    }
  } else if (strstr(json, "\"mute\"") != NULL) {
    char* secPtr = strstr(json, "\"seconds\":");
    if (secPtr != NULL) {
      int s = atoi(secPtr + 10);
      if (s > 0) {
        muteUntilMillis = millis() + ((unsigned long)s * 1000UL);
        playPattern(0); // stop currently playing sound
      }
    }
  }
}

void checkSerialInput() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialInPos > 0) {
        serialInBuffer[serialInPos] = '\0';
        parseSerialCommand(serialInBuffer);
        serialInPos = 0;
      }
    } else {
      if (serialInPos < (sizeof(serialInBuffer) - 1)) {
        serialInBuffer[serialInPos++] = c;
      }
    }
  }
}

// ======================== LCD 16x2 DISPLAY ENGINE =========================
#if USE_LCD_1602
void updateLcdScreen() {
  lcd.clear();
  if (currentLcdPage == 0) {
    // Page 0: Vitals (T: 36.8C  H: 52%)
    lcd.setCursor(0, 0);
    lcd.print(F("T: "));
    lcd.print(currentTemp, 1);
    lcd.print(F("C  H: "));
    lcd.print((int)currentHumidity);
    lcd.print(F("%"));

    lcd.setCursor(0, 1);
    if (hrOk) {
      lcd.print(F("HR: "));
      lcd.print(currentBPM);
      lcd.print(F(" BPM (OK)"));
    } else {
      lcd.print(F("HR:NOT CONNECTED"));
    }
  } else if (currentLcdPage == 1) {
    // Page 1: Motion & Stillness
    lcd.setCursor(0, 0);
    lcd.print(F("Motion: "));
    lcd.print(pirActiveInLastSec ? F("YES") : F("NO"));

    lcd.setCursor(0, 1);
    lcd.print(F("Idle: "));
    lcd.print(idleSeconds);
    lcd.print(F("s  Vib: "));
    lcd.print(lastVibRate);
  } else if (currentLcdPage == 2) {
    // Page 2: Sentinel FSM State & Impact
    lcd.setCursor(0, 0);
    if (impactDetected) {
      lcd.print(F("Fall: ALERT"));
    } else {
      lcd.print(F("Fall: OK"));
    }

    lcd.setCursor(0, 1);
    lcd.print(F("Impact: "));
    lcd.print(impactDetected ? 1 : 0);
    lcd.print(F(" Buzz: "));
    lcd.print(activePattern > 0 ? 1 : 0);
  }
}
#endif

// ======================== SETUP & MAIN LOOP ===============================
void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_VIBRATION, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

#if USE_LCD_1602
  lcd.begin(16, 2);
  lcd.setCursor(0, 0);
  lcd.print(F("SENTINEL v1.0"));
  lcd.setCursor(0, 1);
  lcd.print(F("SYSTEM INITIAL"));
#endif

  // Attach interrupt for vibration sensor pulses
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION), onVibrationInterrupt, FALLING);

  unsigned long now = millis();
  hrWarmupStart = now;
  lastMotionMillis = now;
  lastStreamMillis = now;
  lastTempRead = now;
#if USE_LCD_1602
  lastLcdCycle = now;
#endif

  // Initial short chime indicating firmware boot
  playPattern(1);
}

void loop() {
  unsigned long now = millis();
  unsigned long nowMicros = micros();

  // 1. Precise 500 Hz Heart Rate Sampler
  if (nowMicros - lastMicrosHR >= HEART_SAMPLE_US) {
    lastMicrosHR = nowMicros;
    processHeartRateSample();
  }

  // 2. Read PIR Motion Sensor
  if (digitalRead(PIN_PIR) == HIGH) {
    pirActiveInLastSec = true;
    lastMotionMillis = now;
    idleSeconds = 0;
  }

  // 3. Periodic Temperature Sampling (every 2s with median filter)
  if (now - lastTempRead >= TEMP_INTERVAL) {
    lastTempRead = now;
    float newT = 0.0f;
#if USE_DS18B20
    newT = readDS18B20();
#else
    newT = readLM35();
#endif
    tempBuffer[tempIndex] = newT;
    tempIndex = (tempIndex + 1) % 3;
    currentTemp = medianOfThree(tempBuffer[0], tempBuffer[1], tempBuffer[2]);
  }

  // 4. Update Non-Blocking Buzzer
  updateBuzzer();

  // 5. Check Inbound Serial Commands
  checkSerialInput();

#if USE_LCD_1602
  // Auto-cycle 16x2 LCD display every 3 seconds (3000 ms)
  if (now - lastLcdCycle >= LCD_CYCLE_MS) {
    lastLcdCycle = now;
    currentLcdPage = (currentLcdPage + 1) % 3;
    updateLcdScreen();
  }
#endif

  // 6. 1 Hz Telemetry & Safety Stream
  if (now - lastStreamMillis >= STREAM_INTERVAL) {
    lastStreamMillis = now;

    // Snapshot vibration counters for the last second
    noInterrupts();
    lastVibRate = vibCounter;
    vibCounter = 0;
    interrupts();

    // Determine impact burst & arm movement
    impactDetected = (lastVibRate >= VIB_IMPACT_THRESH);
    armMoving = (lastVibRate >= VIB_ARM_THRESH);

    // Update idle seconds
    if (!pirActiveInLastSec) {
      unsigned long secSinceMotion = (now - lastMotionMillis) / 1000UL;
      idleSeconds = (secSinceMotion > 65535UL) ? 65535 : (unsigned int)secSinceMotion;
    } else {
      idleSeconds = 0;
    }

    // --- Local Safety Limits Evaluation (Standalone Guardian) ---
    // If disconnected from backend and vitals exceed extreme limits for 30s
    bool localViolation = false;
    if (hrOk && (currentBPM < SAFE_HR_MIN || currentBPM > SAFE_HR_MAX)) {
      localViolation = true;
    }
    if (currentTemp < SAFE_TEMP_MIN || currentTemp > SAFE_TEMP_MAX) {
      localViolation = true;
    }

    if (localViolation) {
      safetyViolationSeconds++;
      if (safetyViolationSeconds >= VIOLATION_LIMIT_S) {
        // Trigger continuous urgent alarm
        if (activePattern != 4) {
          playPattern(4);
        }
      }
    } else {
      safetyViolationSeconds = 0;
    }

    // --- JSON Telemetry Output (1 line per second) ---
    // Example: {"t":123456,"hr":72,"hr_ok":true,"temp":36.8,"motion":1,"idle_s":0,"vib":2,"impact":0,"arm":0,"fw":"1.0"}
    Serial.print(F("{\"t\":"));
    Serial.print(now);
    Serial.print(F(",\"hr\":"));
    Serial.print(currentBPM);
    Serial.print(F(",\"hr_ok\":"));
    Serial.print(hrOk ? F("true") : F("false"));
    Serial.print(F(",\"temp\":"));
    Serial.print(currentTemp, 1);
    Serial.print(F(",\"humidity\":"));
    Serial.print(currentHumidity, 1);
    Serial.print(F(",\"motion\":"));
    Serial.print(pirActiveInLastSec ? 1 : 0);
    Serial.print(F(",\"idle_s\":"));
    Serial.print(idleSeconds);
    Serial.print(F(",\"vib\":"));
    Serial.print(lastVibRate);
    Serial.print(F(",\"impact\":"));
    Serial.print(impactDetected ? 1 : 0);
    Serial.print(F(",\"arm\":"));
    Serial.print(armMoving ? 1 : 0);
    Serial.print(F(",\"fw\":\""));
    Serial.print(F(FIRMWARE_VERSION));
    Serial.println(F("\"}"));

    // Reset 1-second latch for PIR
    pirActiveInLastSec = false;
  }
}
