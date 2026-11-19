"""
Unit Tests: Smart Vital Parameter-Based Rehabilitation Recommendation Engine
Verifies that:
- 4 canonical exercises are strictly used (Seated Knee Extension, Sit to Stand, Standing Heel Raise, Shoulder Front Raise)
- Rule-based notification system accurately assigns GREEN, YELLOW, and RED tiers
- Critical vital signs (fever, hypoxemia, tachycardia, pain) halt exercises and override recommendations
- SpO2 desaturation and humidity warnings are properly categorized
"""

import pytest
from backend.engine.recommender import ExerciseRecommendationEngine, FOUR_CANONICAL_EXERCISES

def test_recommendation_optimal_vitals():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Mild osteoarthritis", "profile_type": "elderly"}
    current_reading = {"hr": 70, "hr_ok": True, "temp": 36.6, "spo2": 98.0, "humidity": 52.0, "idle_s": 120, "risk_band": "green"}
    recent_sessions = [{"recovery_score": 88.0}]

    rec = engine.generate_recommendation(person, current_reading, recent_sessions)
    assert rec["overall_category"] == "GREEN"
    assert rec["can_exercise"] is True
    assert "Active Functional" in rec["tier_name"]

    # All prescribed exercises must come strictly from the 4 canonical exercises
    ex_ids = [e["id"] for e in rec["prescribed_exercises"]]
    assert "seated_knee_extension" in ex_ids
    assert "sit_to_stand" in ex_ids
    assert "standing_heel_raise" in ex_ids
    assert "shoulder_raise" in ex_ids
    for ex_id in ex_ids:
        assert ex_id in FOUR_CANONICAL_EXERCISES
    assert rec["max_prescribed_hr"] >= 120

def test_recommendation_elevated_hr_and_inactivity():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Hypertension, Knee osteoarthritis", "profile_type": "elderly"}
    # Elevated resting HR (92 BPM) and prolonged sitting (40 mins = 2400s)
    current_reading = {"hr": 92, "hr_ok": True, "temp": 36.7, "spo2": 97.5, "humidity": 52.0, "idle_s": 2400, "risk_band": "amber"}
    recent_sessions = [{"recovery_score": 60.0}]

    rec = engine.generate_recommendation(person, current_reading, recent_sessions)
    assert rec["tier"] == "gentle_restorative"
    # Avoid bodyweight stand; prescribe gentle seated items
    ex_ids = [e["id"] for e in rec["prescribed_exercises"]]
    assert "seated_knee_extension" in ex_ids
    assert "sit_to_stand" not in ex_ids
    assert rec["max_prescribed_hr"] <= 115

def test_recommendation_fever_or_pain_contraindication():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Hypertension", "profile_type": "elderly"}
    # Fever detected (38.4 C)
    current_reading = {"hr": 105, "hr_ok": True, "temp": 38.4, "spo2": 97.0, "humidity": 55.0, "idle_s": 300, "risk_band": "red"}
    symptoms = {"pain": True, "dizziness": False, "borg": 14}

    rec = engine.generate_recommendation(person, current_reading, pre_check_symptoms=symptoms)
    assert rec["overall_category"] == "RED"
    assert rec["can_exercise"] is False
    assert any("Fever" in r for r in rec["clinical_reasoning"])
    assert any("pain" in r.lower() for r in rec["clinical_reasoning"])
    # Crucial rule: Do not recommend an exercise as a treatment for an abnormal vital sign!
    assert len(rec["prescribed_exercises"]) == 0
    assert rec["max_prescribed_hr"] <= 95

def test_spo2_desaturation_safety_rules():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Mild osteoarthritis", "profile_type": "elderly"}

    # Mild desaturation (93%) -> YELLOW
    yellow_reading = {"hr": 74, "hr_ok": True, "temp": 36.6, "spo2": 93.0, "humidity": 52.0}
    rec_yellow = engine.generate_recommendation(person, yellow_reading)
    assert rec_yellow["overall_category"] == "YELLOW"
    assert any(n["parameter"] == "SpO2 (Blood Oxygen)" and n["category"] == "YELLOW" for n in rec_yellow["notifications"])

    # Severe hypoxemia (88%) -> RED
    red_reading = {"hr": 74, "hr_ok": True, "temp": 36.6, "spo2": 88.0, "humidity": 52.0}
    rec_red = engine.generate_recommendation(person, red_reading)
    assert rec_red["overall_category"] == "RED"
    assert rec_red["can_exercise"] is False
    assert len(rec_red["prescribed_exercises"]) == 0
    assert any(n["parameter"] == "SpO2 (Blood Oxygen)" and n["category"] == "RED" for n in rec_red["notifications"])

def test_humidity_does_not_independently_stop_exercise():
    engine = ExerciseRecommendationEngine()
    person = {"name": "Ramesh Kumar", "age": 68, "conditions": "Mild osteoarthritis", "profile_type": "elderly"}

    # High humidity (76%) with otherwise normal vitals
    humid_reading = {"hr": 72, "hr_ok": True, "temp": 36.6, "spo2": 98.0, "humidity": 76.0}
    rec = engine.generate_recommendation(person, humid_reading)
    # Humidity generates a warning advisory but does not force RED or stop exercise independently
    assert rec["overall_category"] == "GREEN"
    assert rec["can_exercise"] is True
    assert any("Humidity" in n["parameter"] and "ventilation" in n["safety_action"].lower() for n in rec["notifications"])
