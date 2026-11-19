"""
Sentinel Engine: Drift Detection
Detects sustained physiological drift (e.g. resting heart rate elevated by >10-12%
or core temperature elevated over days or demo-time equivalent).
One-off spikes are explicitly rejected and do NOT raise drift alerts.
"""

from typing import List, Dict, Any, Optional
import statistics

class DriftDetector:
    def __init__(
        self,
        hr_pct_threshold: float = 0.12,    # 12% sustained elevation
        hr_zscore_threshold: float = 2.0,  # 2.0 standard deviations
        temp_abs_threshold: float = 0.6,   # +0.6 C sustained elevation
        min_sustained_samples: int = 10,   # Consecutive window size (e.g. 10 readings in demo)
    ):
        self.hr_pct_threshold = hr_pct_threshold
        self.hr_zscore_threshold = hr_zscore_threshold
        self.temp_abs_threshold = temp_abs_threshold
        self.min_sustained_samples = min_sustained_samples

    def check_drift(
        self,
        recent_resting_readings: List[Dict[str, Any]],
        baseline: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates rolling median from resting readings and checks if deviation
        is sustained across the window.
        """
        result = {
            "drift_detected": False,
            "drift_type": None,  # "hr_drift", "temp_drift", "combined_drift"
            "hr_deviation_pct": 0.0,
            "hr_zscore": 0.0,
            "temp_delta": 0.0,
            "reason": None,
            "sample_count": len(recent_resting_readings)
        }

        if len(recent_resting_readings) < self.min_sustained_samples:
            return result

        # Extract values
        hr_values = [r["hr"] for r in recent_resting_readings]
        temp_values = [r["temp"] for r in recent_resting_readings]

        # Use rolling MEDIAN to resist one-off spikes
        median_hr = statistics.median(hr_values)
        median_temp = statistics.median(temp_values)

        base_hr_mean = baseline.get("hr_mean", 72.0)
        base_hr_std = max(baseline.get("hr_std", 6.0), 1.0)
        base_temp_mean = baseline.get("temp_mean", 36.6)

        hr_pct_elev = (median_hr - base_hr_mean) / base_hr_mean
        hr_zscore = (median_hr - base_hr_mean) / base_hr_std
        temp_delta = median_temp - base_temp_mean

        result["hr_deviation_pct"] = round(hr_pct_elev * 100, 1)
        result["hr_zscore"] = round(hr_zscore, 2)
        result["temp_delta"] = round(temp_delta, 2)

        # Check sustained condition: at least 80% of individual resting readings must exceed threshold
        hr_violations = sum(1 for hr in hr_values if (hr - base_hr_mean) / base_hr_mean >= self.hr_pct_threshold)
        temp_violations = sum(1 for t in temp_values if (t - base_temp_mean) >= self.temp_abs_threshold)

        is_sustained_hr = (hr_violations / len(hr_values)) >= 0.8 and hr_pct_elev >= self.hr_pct_threshold
        is_sustained_temp = (temp_violations / len(temp_values)) >= 0.8 and temp_delta >= self.temp_abs_threshold

        if is_sustained_hr and is_sustained_temp:
            result["drift_detected"] = True
            result["drift_type"] = "combined_drift"
            result["reason"] = (
                f"Sustained elevation: resting heart rate is {result['hr_deviation_pct']}% above your "
                f"normal baseline (Z={result['hr_zscore']}), and body temperature is elevated by "
                f"+{result['temp_delta']} °C."
            )
        elif is_sustained_hr:
            result["drift_detected"] = True
            result["drift_type"] = "hr_drift"
            result["reason"] = (
                f"Resting heart rate has drifted {result['hr_deviation_pct']}% above your 7-day normal "
                f"baseline (Z={result['hr_zscore']}) over a sustained period."
            )
        elif is_sustained_temp:
            result["drift_detected"] = True
            result["drift_type"] = "temp_drift"
            result["reason"] = (
                f"Body temperature shows a sustained elevation of +{result['temp_delta']} °C "
                f"above typical resting baseline."
            )

        return result
