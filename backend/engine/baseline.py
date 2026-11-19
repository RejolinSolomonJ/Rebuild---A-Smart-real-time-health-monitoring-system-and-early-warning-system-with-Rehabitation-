"""
Sentinel Engine: Personal Baseline Learner
Computes exponentially weighted mean and standard deviation of resting heart rate
and temperature grouped by time-of-day buckets (night, morning, afternoon, evening)
over a rolling window.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import math

TIME_BUCKETS = {
    "night": (0, 6),       # 00:00 - 05:59
    "morning": (6, 12),    # 06:00 - 11:59
    "afternoon": (12, 18), # 12:00 - 17:59
    "evening": (18, 24),   # 18:00 - 23:59
}

# Placeholder clinician fallback bounds (non-diagnostic defaults)
PLACEHOLDER_DEFAULTS = {
    "resting_hr_mean": 72.0,
    "resting_hr_std": 6.0,
    "resting_temp_mean": 36.6,
    "resting_temp_std": 0.4,
}

def get_time_bucket(dt: Optional[datetime] = None) -> str:
    """Return the time of day bucket for a given datetime."""
    if dt is None:
        dt = datetime.now()
    hour = dt.hour
    for bucket, (start, end) in TIME_BUCKETS.items():
        if start <= hour < end:
            return bucket
    return "morning"

def is_resting_state(reading: Dict[str, Any]) -> bool:
    """
    Determines if a reading represents a resting physiological state:
    No arm movement (arm == 0) and stillness (idle_s >= 120 or PIR motion == 0).
    Also requires hr_ok == True.
    """
    if not reading.get("hr_ok", False):
        return False
    if reading.get("arm", 0) != 0:
        return False
    if reading.get("motion", 0) == 1 and reading.get("idle_s", 0) < 60:
        return False
    return True

class BaselineCalculator:
    def __init__(self, alpha: float = 0.05, min_samples_for_baseline: int = 15):
        """
        alpha: Exponential smoothing factor (0 < alpha <= 1).
        min_samples_for_baseline: minimum resting samples needed to exit 'learning' status.
        """
        self.alpha = alpha
        self.min_samples_for_baseline = min_samples_for_baseline

    def update_baseline(
        self,
        current_baseline: Optional[Dict[str, Any]],
        resting_readings: List[Dict[str, Any]],
        bucket: str
    ) -> Dict[str, Any]:
        """
        Update the personal baseline for a specific time-of-day bucket.
        """
        if not current_baseline:
            current_baseline = {
                "bucket": bucket,
                "hr_mean": PLACEHOLDER_DEFAULTS["resting_hr_mean"],
                "hr_std": PLACEHOLDER_DEFAULTS["resting_hr_std"],
                "temp_mean": PLACEHOLDER_DEFAULTS["resting_temp_mean"],
                "temp_std": PLACEHOLDER_DEFAULTS["resting_temp_std"],
                "sample_count": 0,
                "is_learning": True,
                "status": "learning baseline"
            }

        valid_readings = [r for r in resting_readings if is_resting_state(r)]
        if not valid_readings:
            return current_baseline

        hr_mean = current_baseline["hr_mean"]
        hr_var = current_baseline["hr_std"] ** 2
        temp_mean = current_baseline["temp_mean"]
        temp_var = current_baseline["temp_std"] ** 2
        count = current_baseline.get("sample_count", 0)

        for r in valid_readings:
            hr = float(r["hr"])
            temp = float(r["temp"])

            if count == 0:
                hr_mean = hr
                hr_var = 16.0  # reasonable initial variance
                temp_mean = temp
                temp_var = 0.25
            else:
                # Exponentially Weighted Moving Average & Variance
                diff_hr = hr - hr_mean
                hr_mean += self.alpha * diff_hr
                hr_var = (1 - self.alpha) * (hr_var + self.alpha * (diff_hr ** 2))

                diff_temp = temp - temp_mean
                temp_mean += self.alpha * diff_temp
                temp_var = (1 - self.alpha) * (temp_var + self.alpha * (diff_temp ** 2))

            count += 1

        is_learning = count < self.min_samples_for_baseline
        return {
            "bucket": bucket,
            "hr_mean": round(hr_mean, 1),
            "hr_std": round(max(math.sqrt(max(hr_var, 1.0)), 2.0), 1),
            "temp_mean": round(temp_mean, 2),
            "temp_std": round(max(math.sqrt(max(temp_var, 0.04)), 0.2), 2),
            "sample_count": count,
            "is_learning": is_learning,
            "status": "learning baseline" if is_learning else "baseline established"
        }
