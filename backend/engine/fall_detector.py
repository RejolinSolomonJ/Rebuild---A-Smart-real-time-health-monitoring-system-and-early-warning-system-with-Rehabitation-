"""
Sentinel Engine: Fall Detection Sensor Fusion State Machine
Fuses vibration sensor impact bursts (SW-420/piezo on wrist) with PIR ambient motion.

STATE MACHINE ARCHITECTURE:
- State 0: IDLE
- State 1: IMPACT_CANDIDATE (Impact burst detected; monitor next 10s for absence of motion)
- State 2: COUNTDOWN (No motion post-impact; 30s cancellation countdown with continuous buzzer)
- State 3: CANCELLED (User pressed "I am OK" or motion resumed; logged as false alarm)
- State 4: CONFIRMED_FALL (Countdown expired without response; triggers RED alert & SMS)

IMPORTANT LIMITATION & CLINICAL NOTE:
The PIR sensor measures infrared motion in its field of view, NOT skeletal posture
or vertical orientation. A conscious person standing still or an unconscious person
lying down both produce PIR motion = 0. Hence the 30-second countdown and prompt cancellation.
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class FallState(Enum):
    IDLE = "IDLE"
    IMPACT_CANDIDATE = "IMPACT_CANDIDATE"
    COUNTDOWN = "COUNTDOWN"
    CANCELLED = "CANCELLED"
    CONFIRMED_FALL = "CONFIRMED_FALL"

class FallDetector:
    def __init__(
        self,
        post_impact_quiet_seconds: int = 10,
        countdown_seconds: int = 30
    ):
        self.post_impact_quiet_seconds = post_impact_quiet_seconds
        self.countdown_seconds = countdown_seconds

        self.state = FallState.IDLE
        self.impact_time: Optional[datetime] = None
        self.countdown_start_time: Optional[datetime] = None
        self.remaining_seconds = 0
        self.last_event_log = ""

    def process_reading(
        self,
        reading: Dict[str, Any],
        now_dt: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Processes 1-second telemetry readings and transitions states.
        """
        if now_dt is None:
            now_dt = datetime.now()

        impact = reading.get("impact", 0) == 1
        motion = reading.get("motion", 0) == 1
        buzzer_pattern = 0
        alert_triggered = False

        if self.state == FallState.IDLE:
            if impact:
                self.state = FallState.IMPACT_CANDIDATE
                self.impact_time = now_dt
                self.last_event_log = f"High-impact burst detected at {now_dt.strftime('%H:%M:%S')}. Monitoring for post-impact immobility."

        elif self.state == FallState.IMPACT_CANDIDATE:
            elapsed_post_impact = (now_dt - self.impact_time).total_seconds()

            if motion:
                # Normal motion resumed shortly after impact -> dismiss candidate
                self.state = FallState.IDLE
                self.impact_time = None
                self.last_event_log = "Motion resumed after impact burst. Candidate dismissed as benign activity."
            elif elapsed_post_impact >= self.post_impact_quiet_seconds:
                # Continued immobility for 10 seconds post-impact! Initiate countdown
                self.state = FallState.COUNTDOWN
                self.countdown_start_time = now_dt
                self.remaining_seconds = self.countdown_seconds
                buzzer_pattern = 4 # Fast urgent beeping
                self.last_event_log = f"No motion detected for {self.post_impact_quiet_seconds}s after impact. Initiating {self.countdown_seconds}s fall countdown."

        elif self.state == FallState.COUNTDOWN:
            elapsed_countdown = (now_dt - self.countdown_start_time).total_seconds()
            self.remaining_seconds = max(0, int(self.countdown_seconds - elapsed_countdown))
            buzzer_pattern = 4 # Keep buzzer 4 active

            if motion:
                # Spontaneous motion resumed -> auto-cancel fall alarm
                self.cancel_fall(reason="Motion detected by PIR during countdown (false alarm)")
                buzzer_pattern = 0
            elif self.remaining_seconds <= 0:
                # Countdown expired without response! Escalate to CONFIRMED_FALL
                self.state = FallState.CONFIRMED_FALL
                buzzer_pattern = 4
                alert_triggered = True
                self.last_event_log = f"Fall countdown expired with no user response at {now_dt.strftime('%H:%M:%S')}. Emergency alert dispatched."

        elif self.state in (FallState.CANCELLED, FallState.CONFIRMED_FALL):
            # Latch state until reset or new normal reading
            if motion and self.state == FallState.CONFIRMED_FALL:
                # Keep confirmed state until acknowledged or cleared via endpoint
                pass

        return {
            "state": self.state.value,
            "buzzer_pattern": buzzer_pattern,
            "countdown_active": (self.state == FallState.COUNTDOWN),
            "remaining_seconds": self.remaining_seconds,
            "alert_triggered": alert_triggered,
            "log": self.last_event_log
        }

    def cancel_fall(self, reason: str = "User tapped 'I am OK'") -> Dict[str, Any]:
        """
        Explicit cancellation (e.g. from POST /api/persons/{id}/ok or motion recovery).
        """
        previous_state = self.state
        self.state = FallState.CANCELLED
        self.remaining_seconds = 0
        self.last_event_log = f"Fall alarm cancelled: {reason}."
        return {
            "status": "cancelled",
            "previous_state": previous_state.value,
            "reason": reason
        }

    def reset(self):
        """Reset state machine back to IDLE."""
        self.state = FallState.IDLE
        self.impact_time = None
        self.countdown_start_time = None
        self.remaining_seconds = 0
        self.last_event_log = "Fall detector reset to IDLE."
