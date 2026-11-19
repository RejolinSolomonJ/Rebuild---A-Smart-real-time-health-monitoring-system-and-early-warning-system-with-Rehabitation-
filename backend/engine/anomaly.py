"""
Sentinel Engine: Secondary Anomaly Signal
Uses scikit-learn IsolationForest over recent physiological & motion features
as a secondary contextual validator.
CRITICAL DESIGN RULE: Used strictly to annotate alerts with secondary insight,
NEVER as the standalone trigger for health alarms.
"""

from typing import List, Dict, Any, Optional
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class SecondaryAnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model: Optional[Any] = None
        self.trained = False

    def train_baseline(self, historical_readings: List[Dict[str, Any]]):
        """
        Fit IsolationForest on multidimensional normal baseline features:
        [heart_rate, temperature, motion_rate, vibration_level].
        """
        if not SKLEARN_AVAILABLE or len(historical_readings) < 30:
            return

        features = []
        for r in historical_readings:
            if r.get("hr_ok", False):
                features.append([
                    float(r.get("hr", 72)),
                    float(r.get("temp", 36.6)),
                    float(r.get("motion", 0)),
                    float(r.get("vib", 0))
                ])

        if len(features) >= 30:
            X = np.array(features)
            self.model = IsolationForest(
                contamination=self.contamination,
                random_state=42,
                n_estimators=50
            )
            self.model.fit(X)
            self.trained = True

    def check_anomaly(self, current_reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns anomaly score and context line if the observation is an outlier.
        """
        result = {
            "is_secondary_anomaly": False,
            "anomaly_score": 0.0,
            "secondary_note": None
        }

        if not self.trained or self.model is None or not current_reading.get("hr_ok", False):
            return result

        feat = np.array([[
            float(current_reading.get("hr", 72)),
            float(current_reading.get("temp", 36.6)),
            float(current_reading.get("motion", 0)),
            float(current_reading.get("vib", 0))
        ]])

        pred = self.model.predict(feat)[0]  # -1 = anomaly, 1 = normal
        score = float(self.model.decision_function(feat)[0])
        result["anomaly_score"] = round(score, 3)

        if pred == -1:
            result["is_secondary_anomaly"] = True
            result["secondary_note"] = (
                f"Multi-feature correlation check (Isolation Forest score {result['anomaly_score']}) "
                f"confirms physiological-activity divergence."
            )

        return result
