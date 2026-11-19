"""
MoveSafe Engine: Pose Angle Evaluator & Rep Counting State Machine
Provides pure mathematical joint angle calculations, landmark smoothing,
and the rep detection state machine with hysteresis.
"""

import math
from enum import Enum
from typing import Dict, Any, Tuple, Optional, List

class RepState(Enum):
    START = "START"           # Resting at initial posture
    INFLECTION = "INFLECTION" # Crossing towards target
    PEAK = "PEAK"             # Reached full range of motion
    RETURN = "RETURN"         # Moving back to start
    COMPLETED = "COMPLETED"

def calculate_angle_3p(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    p3: Tuple[float, float]
) -> float:
    """
    Computes angle at vertex p2 formed by (p1 - p2) and (p3 - p2) in degrees [0, 180].
    p1, p2, p3 are (x, y) coordinates.
    """
    v1 = (p1[0] - p2[0], p1[1] - p2[1])
    v2 = (p3[0] - p2[0], p3[1] - p2[1])

    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.hypot(v1[0], v1[1])
    mag2 = math.hypot(v2[0], v2[1])

    if mag1 == 0 or mag2 == 0:
        return 0.0

    cosine = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    angle_rad = math.acos(cosine)
    return math.degrees(angle_rad)

class RepCounterStateMachine:
    def __init__(
        self,
        start_angle: float,
        target_angle: float,
        angle_tolerance: float = 12.0,
        min_duration_s: float = 1.8,
        max_duration_s: float = 8.0,
        hysteresis_margin: float = 8.0
    ):
        self.start_angle = start_angle
        self.target_angle = target_angle
        self.angle_tolerance = angle_tolerance
        self.min_duration_s = min_duration_s
        self.max_duration_s = max_duration_s
        self.hysteresis_margin = hysteresis_margin

        # Direction of movement: increasing (e.g. 90 -> 170) or decreasing
        self.is_increasing = target_angle > start_angle

        self.state = RepState.START
        self.rep_start_time: Optional[float] = None
        self.peak_angle = start_angle
        self.reps_attempted = 0
        self.reps_valid = 0
        self.fault_free_reps = 0
        self.tempo_controlled_reps = 0
        self.current_rep_faults: List[str] = []

    def process_frame(
        self,
        angle: float,
        timestamp_s: float,
        detected_faults: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Processes one time step / frame with the measured joint angle.
        Returns rep transition status, current state, and correction messages.
        """
        if detected_faults is None:
            detected_faults = []

        rep_event = None
        correction = None

        # Track any faults that occurred during the repetition
        for fault in detected_faults:
            if fault not in self.current_rep_faults:
                self.current_rep_faults.append(fault)

        # Update peak angle reached
        if self.is_increasing:
            if angle > self.peak_angle:
                self.peak_angle = angle
        else:
            if angle < self.peak_angle:
                self.peak_angle = angle

        # State Transitions
        if self.state == RepState.START:
            # Check if user began moving towards target beyond hysteresis threshold
            threshold = (self.start_angle + self.hysteresis_margin) if self.is_increasing else (self.start_angle - self.hysteresis_margin)
            has_started = (angle >= threshold) if self.is_increasing else (angle <= threshold)

            if has_started:
                self.state = RepState.INFLECTION
                self.rep_start_time = timestamp_s
                self.peak_angle = angle
                self.current_rep_faults = list(detected_faults)

        elif self.state == RepState.INFLECTION:
            # Check if reached target range of motion
            target_boundary = (self.target_angle - self.angle_tolerance) if self.is_increasing else (self.target_angle + self.angle_tolerance)
            reached_target = (angle >= target_boundary) if self.is_increasing else (angle <= target_boundary)

            if reached_target:
                self.state = RepState.PEAK
            else:
                # Check for premature return before reaching target
                return_threshold = (self.start_angle + 5.0) if self.is_increasing else (self.start_angle - 5.0)
                abandoned = (angle <= return_threshold) if self.is_increasing else (angle >= return_threshold)
                if abandoned:
                    # Incomplete rep!
                    self.reps_attempted += 1
                    rep_event = "incomplete"
                    correction = "Incomplete range of motion. Extend fully before returning."
                    self.state = RepState.START
                    self.rep_start_time = None

        elif self.state == RepState.PEAK:
            # Check if moving back towards starting posture
            inflection_return = (self.target_angle - self.hysteresis_margin) if self.is_increasing else (self.target_angle + self.hysteresis_margin)
            returning = (angle <= inflection_return) if self.is_increasing else (angle >= inflection_return)

            if returning:
                self.state = RepState.RETURN

        elif self.state == RepState.RETURN:
            # Check if returned to starting posture
            finish_boundary = (self.start_angle + self.hysteresis_margin) if self.is_increasing else (self.start_angle - self.hysteresis_margin)
            returned_to_start = (angle <= finish_boundary) if self.is_increasing else (angle >= finish_boundary)

            if returned_to_start:
                duration = timestamp_s - (self.rep_start_time or timestamp_s)
                self.reps_attempted += 1

                # Validate rep
                is_valid = True
                if duration < self.min_duration_s:
                    self.current_rep_faults.append("too_fast")
                    correction = "Move with controlled tempo; avoid rushing."
                elif duration > self.max_duration_s:
                    self.current_rep_faults.append("too_slow")

                tempo_ok = (self.min_duration_s <= duration <= self.max_duration_s)
                if tempo_ok:
                    self.tempo_controlled_reps += 1

                if is_valid:
                    self.reps_valid += 1
                    rep_event = "valid_rep"
                    if not self.current_rep_faults:
                        self.fault_free_reps += 1
                else:
                    rep_event = "invalid_rep"

                # Reset for next rep
                self.state = RepState.START
                self.rep_start_time = None
                self.peak_angle = self.start_angle

        return {
            "state": self.state.value,
            "rep_event": rep_event,
            "angle": round(angle, 1),
            "reps_valid": self.reps_valid,
            "reps_attempted": self.reps_attempted,
            "faults": list(self.current_rep_faults),
            "correction": correction
        }
