"""
ReBuild Hardware & Patient Scenario Simulator
Generates identical JSON telemetry lines as the Arduino node (1 Hz default)
and provides scripted rehab sessions for end-to-end testing without hardware.

Usage:
    python simulator.py --scenario normal
    python simulator.py --scenario fall --target-url http://localhost:8000/api/readings
    python simulator.py --scenario drift --speed 5.0
"""

import sys
import time
import json
import random
import argparse
from typing import Dict, Any, Generator

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

SCENARIOS = [
    "normal",
    "drift",
    "fever",
    "heat_stress",
    "inactivity",
    "fall",
    "fall_cancelled",
    "noisy_motion",
    "low_signal",
    "reconnect",
    "rehab_session_good",
    "rehab_session_poor_form",
    "rehab_session_vitals_spike"
]

class TelemetrySimulator:
    def __init__(self, scenario: str = "normal", speed: float = 1.0, target_url: str = None):
        self.scenario = scenario
        self.speed = max(0.1, speed)
        self.target_url = target_url
        self.interval = 1.0 / self.speed
        self.step_count = 0
        self.start_time_ms = int(time.time() * 1000)

        # Baseline state
        self.hr = 72
        self.temp = 36.6
        self.idle_s = 0

    def get_reading(self) -> Dict[str, Any]:
        self.step_count += 1
        elapsed_s = self.step_count
        now_t = self.start_time_ms + (self.step_count * 1000)

        # Default normal parameters
        hr = int(self.hr + random.choice([-2, -1, 0, 1, 2]))
        temp = round(self.temp + random.choice([-0.05, 0.0, 0.05]), 1)
        hr_ok = True
        motion = 1 if (self.step_count % 8 == 0) else 0
        if motion == 1:
            self.idle_s = 0
        else:
            self.idle_s += 1
        vib = random.randint(1, 4)
        impact = 0
        arm = 0

        # Scenario Logic
        if self.scenario == "normal":
            pass

        elif self.scenario == "drift":
            # Sustained upward drift (+14% to 18% over time) while remaining at rest
            motion = 0
            self.idle_s = elapsed_s
            arm = 0
            # Drift HR up to 86-92 BPM
            hr = min(92, int(72 + (elapsed_s * 1.5)))

        elif self.scenario == "fever":
            # Temperature climbs to 38.6 C
            temp = min(38.8, round(36.6 + (elapsed_s * 0.15), 1))
            hr = int(72 + (temp - 36.6) * 10)

        elif self.scenario == "heat_stress":
            # Outdoor worker profile: high temp, elevated HR, active motion
            temp = min(38.4, round(37.2 + (elapsed_s * 0.1), 1))
            hr = min(120, int(98 + (elapsed_s * 1.2)))
            motion = 1
            self.idle_s = 0
            vib = 15

        elif self.scenario == "inactivity":
            # No motion at all, idle_s climbs past 30s (demo threshold)
            motion = 0
            self.idle_s = elapsed_s

        elif self.scenario == "fall":
            # At step 5, strong impact burst occurs, then complete stillness
            if elapsed_s == 5:
                vib = 55
                impact = 1
                motion = 0
                self.idle_s = 0
            elif elapsed_s > 5:
                vib = 0
                impact = 0
                motion = 0
                self.idle_s = elapsed_s - 5

        elif self.scenario == "fall_cancelled":
            # Impact at step 5, stillness until step 15, then motion resumes (auto cancel)
            if elapsed_s == 5:
                vib = 50
                impact = 1
                motion = 0
                self.idle_s = 0
            elif 5 < elapsed_s < 16:
                vib = 0
                impact = 0
                motion = 0
                self.idle_s = elapsed_s - 5
            elif elapsed_s >= 16:
                # User moves / recovers
                motion = 1
                self.idle_s = 0
                vib = 12

        elif self.scenario == "noisy_motion":
            motion = 1
            vib = random.randint(18, 28)
            arm = 1

        elif self.scenario == "low_signal":
            # Test signal quality discard logic: hr_ok=false or arm=1
            hr_ok = False
            arm = 1
            vib = 22

        elif self.scenario == "reconnect":
            if 8 <= elapsed_s <= 12:
                # Simulates disconnected gap
                return None

        elif self.scenario == "rehab_session_good":
            # Steady moderate exertion (HR ~ 88-94 BPM, calm temp)
            hr = 90 + random.choice([-2, 0, 2])
            motion = 1
            self.idle_s = 0

        elif self.scenario == "rehab_session_poor_form":
            hr = 85
            motion = 1

        elif self.scenario == "rehab_session_vitals_spike":
            # HR climbs above safe limit (> 125 BPM)
            hr = min(140, int(90 + (elapsed_s * 4)))
            motion = 1

        reading = {
            "t": now_t,
            "hr": hr,
            "hr_ok": hr_ok,
            "temp": temp,
            "motion": motion,
            "idle_s": self.idle_s,
            "vib": vib,
            "impact": impact,
            "arm": arm,
            "fw": "1.0"
        }
        return reading

    def run(self, max_steps: int = 120):
        print(f"=== ReBuild Telemetry Simulator Started ===")
        print(f"Scenario:    {self.scenario}")
        print(f"Speed:       {self.speed}x (Interval: {self.interval:.2f}s)")
        print(f"Target URL:  {self.target_url or 'stdout (Serial Format)'}")
        print("===========================================\n")

        client = httpx.Client(timeout=3.0) if (self.target_url and HTTPX_AVAILABLE) else None

        try:
            while self.step_count < max_steps:
                reading = self.get_reading()
                if reading is not None:
                    json_line = json.dumps(reading)
                    if client and self.target_url:
                        try:
                            resp = client.post(self.target_url, json=reading)
                            print(f"[HTTP POST {resp.status_code}] {json_line}")
                        except Exception as e:
                            print(f"[HTTP ERR] {e}: {json_line}")
                    else:
                        print(json_line, flush=True)

                time.sleep(self.interval)
        except KeyboardInterrupt:
            print("\nSimulator stopped by user.")
        finally:
            if client:
                client.close()

def main():
    parser = argparse.ArgumentParser(description="ReBuild Hardware & Vital Simulator")
    parser.add_argument("--scenario", choices=SCENARIOS, default="normal", help="Simulation scenario")
    parser.add_argument("--speed", type=float, default=1.0, help="Simulation speed multiplier")
    parser.add_argument("--target-url", type=str, default=None, help="HTTP POST endpoint (e.g. http://localhost:8000/api/readings)")
    parser.add_argument("--steps", type=int, default=300, help="Maximum simulation steps")
    args = parser.parse_args()

    sim = TelemetrySimulator(
        scenario=args.scenario,
        speed=args.speed,
        target_url=args.target_url
    )
    sim.run(max_steps=args.steps)

if __name__ == "__main__":
    main()
