"""
Sentinel Engine: Risk Score & Early Warning System
Calculates a continuous Composite Health Risk Score (0 - 100) and maps it into
Green (Low Risk), Amber (Moderate Risk), and Red (High Risk / Urgent) bands.

DESIGN SPECIFICATIONS:
- Non-clinical assistive score loosely inspired by early warning scores (NEWS2).
- Context aware: High HR while completely still is weighted heavier than high HR right after movement.
- Outdoor worker profile: Heat stress rule (rising temp + high HR + active work -> prompt rest & hydration).
- Transparent plain-language sentence explaining every score change.
"""

from typing import Dict, Any, Optional, List

class RiskScoreCalculator:
    def __init__(
        self,
        green_limit: int = 30,
        amber_limit: int = 70
    ):
        self.green_limit = green_limit
        self.amber_limit = amber_limit

    def calculate_risk(
        self,
        reading: Dict[str, Any],
        baseline: Optional[Dict[str, Any]] = None,
        profile_type: str = "elderly",  # "elderly", "chronic", "recovering", "outdoor_worker"
        drift_info: Optional[Dict[str, Any]] = None,
        recent_activity_minutes: int = 0
    ) -> Dict[str, Any]:
        """
        Computes the composite risk score (0-100), band ('green', 'amber', 'red'),
        and explanatory sentences.
        """
        score = 0
        reasons: List[str] = []
        recommendations: List[str] = []

        hr_ok = reading.get("hr_ok", False)
        hr = float(reading.get("hr", 72))
        temp = float(reading.get("temp", 36.6))
        motion = reading.get("motion", 0)
        idle_s = reading.get("idle_s", 0)
        arm = reading.get("arm", 0)

        base_hr = baseline.get("hr_mean", 72.0) if baseline else 72.0
        base_temp = baseline.get("temp_mean", 36.6) if baseline else 36.6

        # -------------------------------------------------------------
        # 1. Heart Rate Component (Context-Weighted)
        # -------------------------------------------------------------
        if hr_ok and arm == 0:  # Valid reading without arm motion artifact
            hr_delta = hr - base_hr
            pct_delta = (hr_delta / base_hr) * 100

            # If user is completely still (idle_s > 120), elevated HR is much more alarming
            is_still = (idle_s >= 120) or (motion == 0)

            if pct_delta > 35 or hr > 120:
                points = 35 if is_still else 25
                score += points
                reasons.append(f"Heart rate is critically elevated ({int(hr)} BPM, +{int(pct_delta)}% vs resting baseline {'while still' if is_still else ''})")
            elif pct_delta > 20 or hr > 100:
                points = 25 if is_still else 15
                score += points
                reasons.append(f"Heart rate is moderately elevated ({int(hr)} BPM, +{int(pct_delta)}% vs baseline)")
            elif pct_delta > 10:
                score += 10
                reasons.append(f"Heart rate is slightly above personal baseline (+{int(pct_delta)}%)")
            elif hr < 48:
                score += 25
                reasons.append(f"Heart rate is unusually low ({int(hr)} BPM)")

        # -------------------------------------------------------------
        # 2. Temperature Component
        # -------------------------------------------------------------
        temp_delta = temp - base_temp
        if temp >= 38.5:
            score += 35
            reasons.append(f"High fever detected ({temp:.1f} °C, +{temp_delta:.1f} °C over baseline)")
        elif temp >= 37.8 or temp_delta >= 1.0:
            score += 20
            reasons.append(f"Mild fever/elevated core temperature ({temp:.1f} °C)")
        elif temp <= 35.0:
            score += 30
            reasons.append(f"Hypothermia warning: core temperature low ({temp:.1f} °C)")

        # -------------------------------------------------------------
        # 3. Inactivity Component
        # -------------------------------------------------------------
        if idle_s >= 2700: # 45 minutes
            score += 20
            reasons.append(f"Prolonged physical inactivity ({idle_s // 60} minutes continuous stillness)")
        elif idle_s >= 1800: # 30 minutes
            score += 10
            reasons.append("Extended sitting period without posture change")

        # -------------------------------------------------------------
        # 4. Profile Specific Rule: Heat Stress (Outdoor Worker)
        # -------------------------------------------------------------
        if profile_type == "outdoor_worker":
            if temp >= 37.4 and hr_ok and hr > 95 and recent_activity_minutes > 45:
                score += 30
                reasons.append("Heat-stress condition: Rising body temperature coupled with sustained high cardiac effort in active work")
                recommendations.append("Mandatory rest period in shade and hydration (drink 250-500ml water immediately)")

        # -------------------------------------------------------------
        # 5. Sustained Physiological Drift (if detected by DriftDetector)
        # -------------------------------------------------------------
        if drift_info and drift_info.get("drift_detected", False):
            score += 15
            reasons.append(drift_info["reason"])

        # Clamp composite score between 0 and 100
        score = min(100, max(0, score))

        # Band classification
        if score >= self.amber_limit:
            band = "red"
            band_label = "High Risk / Urgent Warning"
            recommendations.append("Immediate caregiver contact and resting assessment. If chest pain or severe distress is present, call emergency services immediately.")
        elif score >= self.green_limit:
            band = "amber"
            band_label = "Moderate Risk / Early Caution"
            recommendations.append("Rest comfortably, hydrate, and monitor vitals over the next 15-30 minutes.")
        else:
            band = "green"
            band_label = "Normal / Stable Baseline"
            if not reasons:
                reasons.append("Vitals are stable and within personal baseline bounds.")

        summary_reason = "; ".join(reasons)

        return {
            "score": score,
            "band": band,
            "band_label": band_label,
            "summary_reason": summary_reason,
            "reasons": reasons,
            "recommendations": recommendations,
            "profile_type": profile_type
        }
