"""
Unit Tests: MoveSafe Rep Counter State Machine & Recovery Score
Tests joint angle computations, seated knee extension rep cycle,
incomplete rep rejection, and the Recovery Intelligence Score breakdown.
"""

import pytest
from backend.rehab.evaluator import calculate_angle_3p, RepCounterStateMachine, RepState
from backend.rehab.scoring import RecoveryScoreCalculator

def test_joint_angle_calculation():
    # 90 degree angle: (0, 1) -> (0, 0) -> (1, 0)
    p1 = (0.0, 1.0)
    p2 = (0.0, 0.0)
    p3 = (1.0, 0.0)
    angle = calculate_angle_3p(p1, p2, p3)
    assert 89.9 <= angle <= 90.1

    # 180 degree straight line
    p_straight1 = (0.0, 1.0)
    p_vertex = (0.0, 0.0)
    p_straight2 = (0.0, -1.0)
    angle_180 = calculate_angle_3p(p_straight1, p_vertex, p_straight2)
    assert 179.9 <= angle_180 <= 180.0

def test_seated_knee_extension_clean_rep():
    # Seated Knee Extension: start 90 deg, target 170 deg
    sm = RepCounterStateMachine(
        start_angle=90.0,
        target_angle=170.0,
        angle_tolerance=12.0,
        min_duration_s=1.8,
        max_duration_s=7.0
    )

    t = 0.0
    # 1. Starting posture
    res = sm.process_frame(angle=90.0, timestamp_s=t)
    assert res["reps_valid"] == 0

    # 2. Moving upward: crosses start + hysteresis (90 + 8 = 98) -> INFLECTION
    t += 0.5
    res = sm.process_frame(angle=105.0, timestamp_s=t)
    assert sm.state == RepState.INFLECTION

    # 3. Peak extension: reaches 168 deg (target - tolerance = 158) -> PEAK
    t += 1.0
    res = sm.process_frame(angle=168.0, timestamp_s=t)
    assert sm.state == RepState.PEAK

    # 4. Moving down: crosses target - hysteresis (170 - 8 = 162) -> RETURN
    t += 0.5
    res = sm.process_frame(angle=140.0, timestamp_s=t)
    assert sm.state == RepState.RETURN

    # 5. Returned to start: 92 deg (within start + hysteresis = 98) -> COMPLETED
    t += 0.5 # Total duration = 2.5s (within 1.8 - 7.0s)
    res = sm.process_frame(angle=91.0, timestamp_s=t)
    assert res["rep_event"] == "valid_rep"
    assert sm.reps_valid == 1
    assert sm.reps_attempted == 1

def test_incomplete_range_of_motion_rejected():
    sm = RepCounterStateMachine(
        start_angle=90.0,
        target_angle=170.0,
        angle_tolerance=12.0,
        min_duration_s=1.8,
        max_duration_s=7.0
    )

    # Begin movement
    sm.process_frame(angle=90.0, timestamp_s=0.0)
    sm.process_frame(angle=110.0, timestamp_s=0.5)
    # Stalls at only 140 deg (fails to reach target boundary 158 deg)
    sm.process_frame(angle=140.0, timestamp_s=1.0)
    # Drops back to 90 deg
    res = sm.process_frame(angle=92.0, timestamp_s=1.5)

    assert res["rep_event"] == "incomplete"
    assert sm.reps_valid == 0
    assert sm.reps_attempted == 1
    assert "Incomplete range of motion" in res["correction"]

def test_recovery_intelligence_score_breakdown():
    scorer = RecoveryScoreCalculator()

    # Good session: 10/10 target completed, 10 valid reps, 9 fault free, 9 steady tempo, Borg 11, vitals stable
    score = scorer.compute_score(
        target_reps=10,
        total_reps_attempted=10,
        valid_reps_count=10,
        fault_free_reps_count=9,
        tempo_controlled_count=9,
        borg_rating=11,
        max_borg_allowed=15,
        vitals_exceeded=False,
        safe_pauses_triggered=0
    )

    assert score["recovery_intelligence_score"] >= 90.0
    assert score["grade"] == "Excellent Adherence"
    assert "plan_completion" in score["breakdown"]
    assert "vitals_stability" in score["breakdown"]
    assert "not a certified clinical assessment" in score["disclaimer"].lower()
