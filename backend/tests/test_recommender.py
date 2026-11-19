"""
Unit Tests: Adaptive Exercise Recommendation Engine
Verifies that:
- Optimal vitals & stable history recommend active functional routines.
- Elevated resting HR / prolonged stillness recommend gentle seated mobilization.
- Pain, fever, or acute tachycardia recommend restorative breathing and rest.
"""

import pytest
from backend.engine.recommender import ExerciseRecommendationEngine

def test_recommendation_optimal_vitals():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Mild osteoarthritis", "profile_type": "elderly"}
    current_reading = {"hr": 70, "hr_ok": True, "temp": 36.6, "idle_s": 120, "risk_band": "green"}
    recent_sessions = [{"recovery_score": 88.0}]

    rec = engine.generate_recommendation(person, current_reading, recent_sessions)
    assert rec["tier"] == "standard_active"
    assert "Active Functional" in rec["tier_name"]
    # Check that sit-to-stand and knee extensions are included
    ex_ids = [e["id"] for e in rec["prescribed_exercises"]]
    assert "seated_knee_extension" in ex_ids
    assert "sit_to_stand" in ex_ids
    assert rec["max_prescribed_hr"] >= 120

def test_recommendation_elevated_hr_and_inactivity():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Hypertension, Knee osteoarthritis", "profile_type": "elderly"}
    # Elevated resting HR (92 BPM) and prolonged sitting (40 mins = 2400s)
    current_reading = {"hr": 92, "hr_ok": True, "temp": 36.7, "idle_s": 2400, "risk_band": "amber"}
    recent_sessions = [{"recovery_score": 60.0}]

    rec = engine.generate_recommendation(person, current_reading, recent_sessions)
    assert rec["tier"] == "gentle_restorative"
    assert "Gentle Seated" in rec["tier_name"]
    # Avoid bodyweight squat/stand; prescribe gentle seated items
    ex_ids = [e["id"] for e in rec["prescribed_exercises"]]
    assert "seated_knee_extension" in ex_ids
    assert "sit_to_stand" not in ex_ids
    assert rec["max_prescribed_hr"] <= 115

def test_recommendation_fever_or_pain_contraindication():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Hypertension", "profile_type": "elderly"}
    # Fever detected (38.4 C)
    current_reading = {"hr": 105, "hr_ok": True, "temp": 38.4, "idle_s": 300, "risk_band": "red"}
    symptoms = {"pain": True, "dizziness": False, "borg": 14}

    rec = engine.generate_recommendation(person, current_reading, pre_check_symptoms=symptoms)
    assert rec["tier"] == "contraindicated_rest"
    assert any("Fever" in r for r in rec["clinical_reasoning"])
    assert any("pain" in r.lower() for r in rec["clinical_reasoning"])
    ex_ids = [e["id"] for e in rec["prescribed_exercises"]]
    assert ex_ids == ["deep_breathing_mobility"]
    assert rec["max_prescribed_hr"] <= 95
