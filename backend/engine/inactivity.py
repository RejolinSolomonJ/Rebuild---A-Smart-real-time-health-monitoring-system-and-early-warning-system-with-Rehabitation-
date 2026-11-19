"""
Sentinel Engine: Inactivity & Movement Prompt Evaluator
Monitors prolonged stillness using PIR sensor state and idle time.
Includes context awareness (sleeping periods at night) and vital sign correlation.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from .baseline import get_time_bucket

class InactivityMonitor:
    def __init__(
        self,
        default_inactivity_seconds: int = 2700, # 45 minutes
        demo_inactivity_seconds: int = 30,      # 30 seconds for quick testing
        demo_mode: bool = False
    ):
        self.inactivity_limit = demo_inactivity_seconds if demo_mode else default_inactivity_seconds
        self.active_prompt_sent = False
        self.prompt_timestamp: Optional[datetime] = None

    def evaluate_inactivity(
        self,
        reading: Dict[str, Any],
        baseline: Optional[Dict[str, Any]] = None,
        now_dt: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Evaluates inactivity.
        Returns actions: None, "prompt_movement" (buzzer pattern 2), or "escalate_inactivity"
        """
        if now_dt is None:
            now_dt = datetime.now()

        idle_s = reading.get("idle_s", 0)
        motion = reading.get("motion", 0)
        bucket = get_time_bucket(now_dt)

        result = {
            "status": "normal",
            "idle_s": idle_s,
            "action": None,
            "buzzer_pattern": 0,
            "reason": None,
            "prompt_cleared": False
        }

        # If motion returned after prompt was sent, mark prompt as completed
        if motion == 1 or idle_s < 5:
            if self.active_prompt_sent:
                self.active_prompt_sent = False
                result["prompt_cleared"] = True
                result["reason"] = "Movement detected: inactivity prompt successfully cleared."
            return result

        # Check if idle time exceeds limit
        if idle_s >= self.inactivity_limit:
            # Context Check: Is person likely sleeping during night hours?
            hr_ok = reading.get("hr_ok", False)
            hr = reading.get("hr", 72)
            base_hr = baseline.get("hr_mean", 72.0) if baseline else 72.0
            temp = reading.get("temp", 36.6)
            base_temp = baseline.get("temp_mean", 36.6) if baseline else 36.6

            # If it's night and vitals are calm and normal, don't harass the user
            is_night = (bucket == "night")
            is_calm_hr = hr_ok and (hr <= base_hr + 5)
            is_calm_temp = abs(temp - base_temp) < 0.5

            if is_night and is_calm_hr and is_calm_temp:
                result["status"] = "night_sleep"
                result["reason"] = f"Stillness detected during night hours ({idle_s}s) with resting vitals (likely sleeping)."
                return result

            # Vitals abnormality check: if HR or Temp is significantly abnormal while still -> ESCALATE!
            vitals_abnormal = False
            abnormal_notes = []
            if hr_ok and (hr > base_hr * 1.25 or hr < 48):
                vitals_abnormal = True
                abnormal_notes.append(f"heart rate abnormal ({hr} BPM)")
            if temp > 38.0 or temp < 35.2:
                vitals_abnormal = True
                abnormal_notes.append(f"temperature abnormal ({temp} °C)")

            if vitals_abnormal:
                result["status"] = "abnormal_inactivity"
                result["action"] = "escalate_inactivity"
                result["buzzer_pattern"] = 3 # Warning buzzer
                result["reason"] = (
                    f"Warning: No movement for {idle_s}s combined with " +
                    " and ".join(abnormal_notes) + ". Immediate check recommended."
                )
            else:
                # Regular daytime movement nudge
                if not self.active_prompt_sent:
                    self.active_prompt_sent = True
                    self.prompt_timestamp = now_dt
                    result["status"] = "prompt_movement"
                    result["action"] = "prompt_movement"
                    result["buzzer_pattern"] = 2 # 2 beeps
                    result["reason"] = (
                        f"Gentle movement nudge: No activity recorded for {int(idle_s // 60)} minutes "
                        f"({idle_s}s). Time for a light stretch or posture change."
                    )
                else:
                    result["status"] = "awaiting_movement"
                    result["reason"] = f"Awaiting movement response ({idle_s}s still)."

        return result
