"""
Unit Tests: Sentinel Engine Core
Tests baseline learner, drift detection (with spike rejection),
inactivity evaluator, and composite risk scoring.
"""

import pytest
from datetime import datetime
from backend.engine.baseline import BaselineCalculator, is_resting_state
from backend.engine.drift import DriftDetector
from backend.engine.inactivity import InactivityMonitor
from backend.engine.risk_score import RiskScoreCalculator

def test_resting_state_criteria():
    # Valid resting reading
    resting_reading = {"hr": 72, "hr_ok": True, "arm": 0, "motion": 0, "idle_s": 150}
    assert is_resting_state(resting_reading) is True

    # Movement artifact: arm == 1
    arm_moving = {"hr": 72, "hr_ok": True, "arm": 1, "motion": 0, "idle_s": 150}
    assert is_resting_state(arm_moving) is False

    # Low signal: hr_ok == False
    low_sig = {"hr": 72, "hr_ok": False, "arm": 0, "motion": 0, "idle_s": 150}
    assert is_resting_state(low_sig) is False

def test_baseline_learning():
    calc = BaselineCalculator(alpha=0.1, min_samples_for_baseline=5)
    readings = [{"hr": 70, "temp": 36.6, "hr_ok": True, "arm": 0, "motion": 0, "idle_s": 120} for _ in range(6)]
    baseline = calc.update_baseline(None, readings, "morning")

    assert baseline["bucket"] == "morning"
    assert baseline["is_learning"] is False
    assert baseline["status"] == "baseline established"
    assert 68.0 <= baseline["hr_mean"] <= 72.0

def test_drift_detection_sustained_vs_spike():
    detector = DriftDetector(hr_pct_threshold=0.12, min_sustained_samples=5)
    baseline = {"hr_mean": 70.0, "hr_std": 5.0, "temp_mean": 36.5}

    # Sustained elevation (82 BPM is ~17% above 70 BPM)
    sustained_elev = [{"hr": 82, "temp": 36.5} for _ in range(6)]
    res = detector.check_drift(sustained_elev, baseline)
    assert res["drift_detected"] is True
    assert "hr_drift" in res["drift_type"]
    assert res["hr_deviation_pct"] > 12.0

    # ONE-OFF SPIKE: 4 normal readings + 1 spike of 110 BPM -> MUST NOT RAISE DRIFT ALERT!
    spike_data = [{"hr": 70, "temp": 36.5} for _ in range(4)] + [{"hr": 110, "temp": 36.5}]
    res_spike = detector.check_drift(spike_data, baseline)
    assert res_spike["drift_detected"] is False

def test_inactivity_and_sleeping_context():
    monitor = InactivityMonitor(demo_mode=True, demo_inactivity_seconds=30)
    baseline = {"hr_mean": 70.0, "temp_mean": 36.5}

    # Inactivity during daytime with normal vitals -> Prompt movement (buzzer pattern 2)
    dt_day = datetime(2026, 11, 19, 14, 0, 0)
    reading_day = {"idle_s": 35, "motion": 0, "hr": 71, "hr_ok": True, "temp": 36.5}
    res_day = monitor.evaluate_inactivity(reading_day, baseline, now_dt=dt_day)
    assert res_day["action"] == "prompt_movement"
    assert res_day["buzzer_pattern"] == 2

    # Inactivity during night hours (03:00) with calm vitals -> Recognized as sleeping, no prompt
    dt_night = datetime(2026, 11, 19, 3, 0, 0)
    reading_night = {"idle_s": 35, "motion": 0, "hr": 70, "hr_ok": True, "temp": 36.5}
    res_night = monitor.evaluate_inactivity(reading_night, baseline, now_dt=dt_night)
    assert res_night["status"] == "night_sleep"
    assert res_night["action"] is None

def test_risk_score_and_heat_stress():
    calc = RiskScoreCalculator()
    baseline = {"hr_mean": 72.0, "temp_mean": 36.6}

    # Normal calm reading -> Green band
    reading_normal = {"hr": 72, "hr_ok": True, "temp": 36.6, "motion": 1, "idle_s": 0, "arm": 0}
    res_normal = calc.calculate_risk(reading_normal, baseline)
    assert res_normal["band"] == "green"
    assert res_normal["score"] < 30

    # Outdoor worker heat stress rule -> Rising temp + high HR + active work
    reading_heat = {"hr": 105, "hr_ok": True, "temp": 37.8, "motion": 1, "idle_s": 0, "arm": 0}
    res_heat = calc.calculate_risk(
        reading_heat,
        baseline,
        profile_type="outdoor_worker",
        recent_activity_minutes=50
    )
    assert any("Heat-stress" in r for r in res_heat["reasons"])
    assert res_heat["band"] in ["amber", "red"]
