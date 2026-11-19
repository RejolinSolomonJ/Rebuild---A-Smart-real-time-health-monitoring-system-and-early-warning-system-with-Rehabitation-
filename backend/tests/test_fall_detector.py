"""
Unit Tests: Sentinel Fall Detection Sensor Fusion State Machine
Verifies all states: IDLE -> IMPACT_CANDIDATE -> COUNTDOWN -> CONFIRMED_FALL
and all cancellation paths (PIR motion recovery and user OK tap).
"""

import pytest
from datetime import datetime, timedelta
from backend.engine.fall_detector import FallDetector, FallState

def test_fall_full_cycle_to_confirmed():
    detector = FallDetector(post_impact_quiet_seconds=10, countdown_seconds=30)
    t0 = datetime(2026, 11, 19, 12, 0, 0)

    # 1. Normal step -> IDLE
    res1 = detector.process_reading({"impact": 0, "motion": 1}, now_dt=t0)
    assert detector.state == FallState.IDLE

    # 2. Impact burst -> IMPACT_CANDIDATE
    res2 = detector.process_reading({"impact": 1, "motion": 0}, now_dt=t0)
    assert detector.state == FallState.IMPACT_CANDIDATE

    # 3. 5 seconds later, still no motion -> remains candidate
    t1 = t0 + timedelta(seconds=5)
    detector.process_reading({"impact": 0, "motion": 0}, now_dt=t1)
    assert detector.state == FallState.IMPACT_CANDIDATE

    # 4. 11 seconds post impact with no motion -> Transition to COUNTDOWN
    t2 = t0 + timedelta(seconds=11)
    res3 = detector.process_reading({"impact": 0, "motion": 0}, now_dt=t2)
    assert detector.state == FallState.COUNTDOWN
    assert res3["buzzer_pattern"] == 4
    assert res3["countdown_active"] is True

    # 5. Countdown expires after 31s -> CONFIRMED_FALL
    t3 = t2 + timedelta(seconds=31)
    res4 = detector.process_reading({"impact": 0, "motion": 0}, now_dt=t3)
    assert detector.state == FallState.CONFIRMED_FALL
    assert res4["alert_triggered"] is True

def test_fall_cancelled_by_motion_during_countdown():
    detector = FallDetector(post_impact_quiet_seconds=10, countdown_seconds=30)
    t0 = datetime(2026, 11, 19, 12, 0, 0)

    # Impact burst
    detector.process_reading({"impact": 1, "motion": 0}, now_dt=t0)
    # Transition to countdown
    t1 = t0 + timedelta(seconds=11)
    detector.process_reading({"impact": 0, "motion": 0}, now_dt=t1)
    assert detector.state == FallState.COUNTDOWN

    # Motion returns during countdown (e.g. at 5s into countdown)
    t2 = t1 + timedelta(seconds=5)
    res = detector.process_reading({"impact": 0, "motion": 1}, now_dt=t2)
    assert detector.state == FallState.CANCELLED
    assert res["buzzer_pattern"] == 0
    assert "false alarm" in detector.last_event_log.lower()

def test_fall_cancelled_explicitly_by_user_ok():
    detector = FallDetector(post_impact_quiet_seconds=10, countdown_seconds=30)
    t0 = datetime(2026, 11, 19, 12, 0, 0)

    detector.process_reading({"impact": 1, "motion": 0}, now_dt=t0)
    t1 = t0 + timedelta(seconds=11)
    detector.process_reading({"impact": 0, "motion": 0}, now_dt=t1)
    assert detector.state == FallState.COUNTDOWN

    # User taps "I am OK"
    cancel_res = detector.cancel_fall(reason="User pressed 'I am OK'")
    assert detector.state == FallState.CANCELLED
    assert cancel_res["status"] == "cancelled"

def test_impact_followed_by_immediate_motion_dismissed():
    # If person bumps arm against desk while walking, motion is continuous
    detector = FallDetector(post_impact_quiet_seconds=10, countdown_seconds=30)
    t0 = datetime(2026, 11, 19, 12, 0, 0)

    detector.process_reading({"impact": 1, "motion": 0}, now_dt=t0)
    # 2 seconds later motion is active
    t1 = t0 + timedelta(seconds=2)
    detector.process_reading({"impact": 0, "motion": 1}, now_dt=t1)
    # Must immediately dismiss back to IDLE
    assert detector.state == FallState.IDLE
