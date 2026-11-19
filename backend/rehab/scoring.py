"""
MoveSafe Engine: Recovery Intelligence Score Calculator
Computes a transparent composite metric (0 to 100) reflecting rehabilitation
quality, effort, form adherence, and physiological safety during an active session.

DISCLAIMER:
The Recovery Intelligence Score is a progress and adherence metric designed
for motivational feedback and physiotherapist review. It is NOT a clinical,
diagnostic, or physiological validation score.
"""

from typing import Dict, Any, List

class RecoveryScoreCalculator:
    def __init__(self):
        # Weights for the 6 core components (sum = 100)
        self.weights = {
            "plan_completion": 25.0,  # Target reps vs completed reps
            "valid_rep_ratio": 25.0,  # Valid reps vs total attempts
            "form_quality": 20.0,     # Percentage of reps without detected form faults
            "tempo_control": 10.0,    # Reps performed within safe min/max duration
            "effort_within_bounds": 10.0, # Borg rating within prescribed zone
            "vitals_stability": 10.0  # Vitals remained within safety limits during session
        }

    def compute_score(
        self,
        target_reps: int,
        total_reps_attempted: int,
        valid_reps_count: int,
        fault_free_reps_count: int,
        tempo_controlled_count: int,
        borg_rating: int,
        max_borg_allowed: int = 15,
        vitals_exceeded: bool = False,
        safe_pauses_triggered: int = 0
    ) -> Dict[str, Any]:
        """
        Calculates the score and provides an itemized breakdown.
        """
        # 1. Plan completion (0 - 100%)
        if target_reps > 0:
            plan_comp_ratio = min(1.0, valid_reps_count / float(target_reps))
        else:
            plan_comp_ratio = 1.0
        plan_comp_pts = plan_comp_ratio * self.weights["plan_completion"]

        # 2. Valid rep ratio (0 - 100%)
        if total_reps_attempted > 0:
            valid_ratio = valid_reps_count / float(total_reps_attempted)
        else:
            valid_ratio = 0.0
        valid_rep_pts = valid_ratio * self.weights["valid_rep_ratio"]

        # 3. Form quality (0 - 100%)
        if valid_reps_count > 0:
            form_ratio = fault_free_reps_count / float(valid_reps_count)
        else:
            form_ratio = 0.0
        form_quality_pts = form_ratio * self.weights["form_quality"]

        # 4. Tempo control (0 - 100%)
        if valid_reps_count > 0:
            tempo_ratio = tempo_controlled_count / float(valid_reps_count)
        else:
            tempo_ratio = 0.0
        tempo_pts = tempo_ratio * self.weights["tempo_control"]

        # 5. Effort within bounds (Borg rating)
        # Borg scale is 6 to 20. Optimal rehabilitation window typically 9-13 (light to somewhat hard)
        if borg_rating <= max_borg_allowed:
            effort_pts = self.weights["effort_within_bounds"]
            effort_status = "Optimal effort"
        elif borg_rating <= max_borg_allowed + 2:
            effort_pts = self.weights["effort_within_bounds"] * 0.5
            effort_status = "Slightly above prescribed exertion"
        else:
            effort_pts = 0.0
            effort_status = "Excessive exertion reported"

        # 6. Vitals stability
        if not vitals_exceeded and safe_pauses_triggered == 0:
            vitals_pts = self.weights["vitals_stability"]
            vitals_status = "Stable throughout session"
        elif safe_pauses_triggered == 1:
            vitals_pts = self.weights["vitals_stability"] * 0.5
            vitals_status = "One safe pause triggered"
        else:
            vitals_pts = 0.0
            vitals_status = "Multiple pauses or safety thresholds reached"

        # Composite total
        total_score = round(
            plan_comp_pts + valid_rep_pts + form_quality_pts + tempo_pts + effort_pts + vitals_pts,
            1
        )
        total_score = max(0.0, min(100.0, total_score))

        # Qualitative band
        if total_score >= 85:
            grade = "Excellent Adherence"
        elif total_score >= 70:
            grade = "Good Progress"
        elif total_score >= 50:
            grade = "Moderate / Needs Guidance"
        else:
            grade = "Incomplete / High Fault Rate"

        return {
            "recovery_intelligence_score": total_score,
            "grade": grade,
            "breakdown": {
                "plan_completion": {
                    "points": round(plan_comp_pts, 1),
                    "max_points": self.weights["plan_completion"],
                    "detail": f"{valid_reps_count}/{target_reps} target reps completed"
                },
                "valid_rep_ratio": {
                    "points": round(valid_rep_pts, 1),
                    "max_points": self.weights["valid_rep_ratio"],
                    "detail": f"{int(valid_ratio * 100)}% reps met full range of motion ({valid_reps_count}/{total_reps_attempted})"
                },
                "form_quality": {
                    "points": round(form_quality_pts, 1),
                    "max_points": self.weights["form_quality"],
                    "detail": f"{int(form_ratio * 100)}% reps completed with zero form faults"
                },
                "tempo_control": {
                    "points": round(tempo_pts, 1),
                    "max_points": self.weights["tempo_control"],
                    "detail": f"{int(tempo_ratio * 100)}% reps executed at steady tempo"
                },
                "effort_control": {
                    "points": round(effort_pts, 1),
                    "max_points": self.weights["effort_within_bounds"],
                    "detail": f"Borg RPE {borg_rating} ({effort_status})"
                },
                "vitals_stability": {
                    "points": round(vitals_pts, 1),
                    "max_points": self.weights["vitals_stability"],
                    "detail": vitals_status
                }
            },
            "disclaimer": "Assistive rehabilitation metric; not a certified clinical assessment."
        }
