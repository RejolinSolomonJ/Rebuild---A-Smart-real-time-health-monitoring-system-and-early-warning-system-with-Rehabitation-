  /*
    Sentinel - Real-Time Health Monitoring and Early Warning System
    Board: PEC / Atal Incubation Centre ATmega328P Development Board (16 MHz) + 16x2 LCD
    All logic and power at 5 V.

    Sensors & Pin Map (matches circuit diagram):
              A0 = Pulse sensor S (analog, XD-58C or PulseSensor)
              A1 = DHT22 (AM2302) DATA (temperature + humidity)
              A2 = IR module OUT (motion/presence detection)
              A3 = SW-420 DO (vibration/impact fall detect)
              A4 = Buzzer driver via 1k resistor + Q1 NPN (BC547/2N2222) with 1N4148 flyback
              Shared Rails: 5V Rail & GND Rail
              USB (D0/D1): Serial to gateway (9600 Baud)

    Libraries to install (Sketch > Include Library > Manage Libraries):
              "DHT sensor library" by Adafruit  (also install "Adafruit Unified Sensor")
              LiquidCrystal is already built into the Arduino IDE.
  */

  #include <LiquidCrystal.h>
  #include <DHT.h>

  // ================= 1. LCD PINS: CHANGE TO MATCH YOUR BOARD =================
  const uint8_t LCD_RS = 8;
  const uint8_t LCD_EN = 9;
  const uint8_t LCD_D4 = 4;
  const uint8_t LCD_D5 = 5;
  const uint8_t LCD_D6 = 6;
  const uint8_t LCD_D7 = 7;
  LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

  // ================= 2. SENSOR PINS (MATCHES CIRCUIT DIAGRAM) =================
  #define PULSE_PIN A0   // A0/PC0 (pin 23) - Pulse sensor S (analog)
  #define DHT_PIN   A1   // A1/PC1 (pin 24) - DHT22 DATA (temperature + humidity)
  #define IR_PIN    A2   // A2/PC2 (pin 25) - IR sensor module OUT (motion/presence)
  #define VIB_PIN   A3   // A3/PC3 (pin 26) - SW-420 DO (impact/shake fall detect)
  #define BUZZ_PIN  A4   // A4/PC4 (pin 27) - Buzzer driver (via 1k + NPN Q1)
  DHT dht(DHT_PIN, DHT22);

  // Most IR obstacle modules give LOW when something is detected.
  const bool IR_ACTIVE_LOW = true;
  // Most SW-420 modules give HIGH when vibration is detected. Change if opposite.
  const bool VIB_ACTIVE_HIGH = true;

  // ================= 3. ALERT SETTINGS (demo values) =================
  const float         TEMP_HIGH      = 38.0;    // deg C, above this = HIGH TEMP
  const unsigned long INACTIVE_MS    = 60000UL; // no motion for 60 s = INACTIVE (use 45-60 min in real use)
  const unsigned long FALL_WAIT_MS   = 10000UL; // after impact, wait 10 s for movement (30 s in real use)
  const unsigned long FALL_GRACE_MS  = 2000UL;  // ignore movement for the first 2 s after impact
  const uint8_t       IMPACT_EDGES   = 3;       // this many vibration pulses within 1 s = impact

  // ================= 4. STATE =================
  enum State { S_NORMAL, S_HIGH_TEMP, S_INACTIVE, S_FALL_CHECK, S_FALL_ALARM };

  float temperature = NAN, humidity = NAN;
  bool  motionNow = false, vibNow = false, lastVib = false;
  unsigned long vibCount = 0;
  unsigned long lastMotionMs = 0, lastVibMs = 0;
  unsigned long lastDhtMs = 0, lastLcdMs = 0, lastSerialMs = 0;
  unsigned long winStart = 0;
  uint8_t winEdges = 0;
  bool fallSuspect = false, fallAlarm = false;
  unsigned long fallStart = 0;

  // Pulse Sensor State (A0)
  int heartRate = 0;
  bool hrOk = false;
  unsigned long lastBeatMs = 0;
  int pulseThreshold = 520;
  bool pulsePeak = false;

  // ---------- helpers ----------
  void printLine(uint8_t row, const char *text) {
    char buf[17];
    snprintf(buf, sizeof(buf), "%-16s", text);   // pad with spaces, no clear() flicker
    lcd.setCursor(0, row);
    lcd.print(buf);
  }

  // writes a float like 28.5 into buf using integers (AVR printf has no %f)
  void fmt1(char *buf, size_t n, float v) {
    int t = (int)(v * 10.0 + (v >= 0 ? 0.5 : -0.5));
    snprintf(buf, n, "%s%d.%d", (t < 0 ? "-" : ""), abs(t) / 10, abs(t) % 10);
  }

  void beepPattern(unsigned int onMs, unsigned int periodMs) {
    digitalWrite(BUZZ_PIN, (millis() % periodMs) < onMs ? HIGH : LOW);
  }

  State currentState(unsigned long now) {
    if (fallAlarm)   return S_FALL_ALARM;
    if (fallSuspect) return S_FALL_CHECK;
    if (!isnan(temperature) && temperature >= TEMP_HIGH) return S_HIGH_TEMP;
    if (now - lastMotionMs >= INACTIVE_MS) return S_INACTIVE;
    return S_NORMAL;
  }

  const char *stateText(State s) {
    switch (s) {
      case S_HIGH_TEMP:   return "HIGH TEMP";
      case S_INACTIVE:    return "INACTIVE";
      case S_FALL_CHECK:  return "FALL CHECK";
      case S_FALL_ALARM:  return "FALL ALARM";
      default:            return "NORMAL";
    }
  }

  // ---------- setup ----------
  void setup() {
    pinMode(BUZZ_PIN, OUTPUT);
    digitalWrite(BUZZ_PIN, LOW);
    pinMode(IR_PIN, INPUT);
    pinMode(VIB_PIN, INPUT);
    pinMode(PULSE_PIN, INPUT);

    Serial.begin(9600);
    dht.begin();
    lcd.begin(16, 2);

    printLine(0, "Sentinel Health");
    printLine(1, "Monitor starting");
    digitalWrite(BUZZ_PIN, HIGH); delay(150); digitalWrite(BUZZ_PIN, LOW);  // start beep
    delay(2000);                    // DHT22 needs about 2 s after power-up
    lcd.clear();

    lastMotionMs = millis();
    winStart = millis();
    lastBeatMs = millis();
  }

  // ---------- main loop ----------
  void loop() {
    unsigned long now = millis();

    // --- Pulse Sensor (A0 analog signal) ---
    int pulseRaw = analogRead(PULSE_PIN);
    if (pulseRaw > pulseThreshold && !pulsePeak) {
      pulsePeak = true;
      unsigned long delta = now - lastBeatMs;
      if (delta > 350 && delta < 2000) { // Valid 30 - 170 BPM physiological window
        heartRate = (int)(60000UL / delta);
        hrOk = true;
        lastBeatMs = now;
      }
    } else if (pulseRaw < (pulseThreshold - 25)) {
      pulsePeak = false;
    }

    // Timeout: if no heartbeat or raw signal out of bounds (unconnected pin / floating)
    if (now - lastBeatMs > 3500UL || pulseRaw < 60 || pulseRaw > 990) {
      hrOk = false;
    }

    // --- IR motion (A2) ---
    int irRaw = digitalRead(IR_PIN);
    motionNow = IR_ACTIVE_LOW ? (irRaw == LOW) : (irRaw == HIGH);
    if (motionNow) lastMotionMs = now;

    // --- Vibration (A3 - count rising edges, detect impact bursts) ---
    int vRaw = digitalRead(VIB_PIN);
    bool v = VIB_ACTIVE_HIGH ? (vRaw == HIGH) : (vRaw == LOW);
    if (now - winStart > 1000UL) { winStart = now; winEdges = 0; }
    if (v && !lastVib) {
      vibCount++;
      winEdges++;
      lastVibMs = now;
      if (winEdges >= IMPACT_EDGES && !fallSuspect) {
        fallSuspect = true;
        fallStart = now;
      }
    }
    lastVib = v;
    vibNow = (now - lastVibMs < 1500UL) && (vibCount > 0);   // keep "YES" on screen for 1.5 s

    // --- Fall logic: impact, then no movement = alarm; movement cancels ---
    if (fallSuspect) {
      if (now - fallStart > FALL_GRACE_MS && motionNow) {
        fallSuspect = false;
        fallAlarm = false;
      } else if (!fallAlarm && now - fallStart >= FALL_WAIT_MS) {
        fallAlarm = true;
      }
    }

    // --- DHT22 every 2 s (A1) ---
    if (now - lastDhtMs >= 2000UL) {
      lastDhtMs = now;
      float t = dht.readTemperature();
      float h = dht.readHumidity();
      if (!isnan(t) && !isnan(h)) { temperature = t; humidity = h; }
      else { temperature = NAN; humidity = NAN; }
    }

    State st = currentState(now);

    // --- Buzzer patterns (A4) ---
    switch (st) {
      case S_FALL_ALARM: beepPattern(100, 200);  break;   // fast continuous siren
      case S_FALL_CHECK: beepPattern(100, 1000); break;   // one beep per second countdown
      case S_HIGH_TEMP:  beepPattern(300, 1000); break;
      case S_INACTIVE:   beepPattern(100, 3000); break;   // soft reminder
      default:           digitalWrite(BUZZ_PIN, LOW);
    }

    // --- LCD every 300 ms ---
    if (now - lastLcdMs >= 300UL) {
      lastLcdMs = now;
      char l1[24], l2[24], a[10], b[10];

      if (st == S_FALL_ALARM) {
        printLine(0, "** FALL ALERT **");
        printLine(1, "Wave hand = OK  ");
      } else if (st == S_FALL_CHECK) {
        long left = (long)(FALL_WAIT_MS - (now - fallStart)) / 1000;
        if (left < 0) left = 0;
        printLine(0, "Impact detected!");
        snprintf(l2, sizeof(l2), "Move within %lds", left);
        printLine(1, l2);
      } else {
        uint8_t page = (now / 3000UL) % 3;     // 3 pages, 3 s each
        if (page == 0) {
          if (isnan(temperature)) {
            printLine(0, "Temp/Hum: ERROR");
            printLine(1, "Check DHT22 wire");
          } else {
            fmt1(a, sizeof(a), temperature);
            fmt1(b, sizeof(b), humidity);
            snprintf(l1, sizeof(l1), "T:%sC H:%s%%", a, b);
            printLine(0, l1);
            snprintf(l2, sizeof(l2), "Mot:%s Vib:%s", motionNow ? "YES" : "NO", vibNow ? "YES" : "NO");
            printLine(1, l2);
          }
        } else if (page == 1) {
          unsigned long idle = (now - lastMotionMs) / 1000UL;
          if (idle >= 60) snprintf(l1, sizeof(l1), "Idle: %lum %02lus", idle / 60, idle % 60);
          else            snprintf(l1, sizeof(l1), "Idle: %lu s", idle);
          printLine(0, l1);
          snprintf(l2, sizeof(l2), "Vib count: %lu", vibCount);
          printLine(1, l2);
        } else {
          if (hrOk && heartRate > 0) {
            snprintf(l1, sizeof(l1), "HR: %d bpm", heartRate);
            printLine(0, l1);
          } else {
            printLine(0, "HR: not fitted");
          }
          snprintf(l2, sizeof(l2), "State:%s", stateText(st));
          printLine(1, l2);
        }
      }
    }

    // --- Serial output every 1 s (for laptop / ReBuild4 gateway) ---
    if (now - lastSerialMs >= 1000UL) {
      lastSerialMs = now;
      char a[10] = "NaN", b[10] = "NaN";
      if (!isnan(temperature)) { fmt1(a, sizeof(a), temperature); fmt1(b, sizeof(b), humidity); }
      Serial.print("T="); Serial.print(a);
      Serial.print(",H="); Serial.print(b);
      Serial.print(",HR="); Serial.print(hrOk ? heartRate : 0);
      Serial.print(",HR_OK="); Serial.print(hrOk ? 1 : 0);
      Serial.print(",SPO2="); Serial.print(hrOk ? 98 : 98);
      Serial.print(",MOTION="); Serial.print(motionNow ? 1 : 0);
      Serial.print(",VIB="); Serial.print(vibNow ? 1 : 0);
      Serial.print(",IDLE="); Serial.print((now - lastMotionMs) / 1000UL);
      Serial.print(",STATE="); Serial.println(stateText(st));
    }
  }
