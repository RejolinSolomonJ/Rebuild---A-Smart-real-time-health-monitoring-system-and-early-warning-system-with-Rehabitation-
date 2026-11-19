"""
Unit Tests: Gemini API with LoRA Patient History Conditioning & Safety Filter
Verifies:
1. Extraction of patient longitudinal history (readings, baselines, sessions, alerts).
2. Construction of LoRA rank conditioning system instruction.
3. LoRA safety guardrail filter enforcing clinical contraindications.
4. Deterministic fallback inference producing clinically compliant advice.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Person, Reading, Alert, Baseline, ExercisePlan
from backend.engine.gemini_lora import GeminiLoraFilterEngine

@pytest.fixture
def mock_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Seed Person
    person = Person(
        id=1,
        name="Ramesh Kumar",
        age=68,
        gender="male",
        conditions="Hypertension (Amlodipine 5mg), Mild knee osteoarthritis",
        profile_type="elderly",
        caregiver_name="Anita (Daughter)",
        caregiver_phone="+919876543210"
    )
    db.add(person)

    # Seed Exercise Plan
    plan = ExercisePlan(
        person_id=1,
        title="Post-Knee Care & Core Stability Plan",
        notes="Seated knee extension exercises",
        approved_by_physio=True,
        physio_name="Dr. Kavitha (PT)",
        max_hr_limit=125,
        max_borg_limit=14
    )
    db.add(plan)

    # Seed Baseline
    baseline = Baseline(
        person_id=1,
        bucket="morning",
        hr_mean=72.0,
        hr_std=6.0,
        temp_mean=36.6,
        temp_std=0.4
    )
    db.add(baseline)

    # Seed Readings
    reading = Reading(
        person_id=1,
        temp=36.6,
        humidity=52.0,
        hr=0,
        hr_ok=False,
        motion=1,
        idle_s=5,
        risk_score=8,
        system_state="S_NORMAL"
    )
    db.add(reading)
    db.commit()

    yield db
    db.close()

def test_extract_patient_history(mock_db):
    engine = GeminiLoraFilterEngine()
    history = engine.extract_patient_history(mock_db, person_id=1)

    assert history["person"]["name"] == "Ramesh Kumar"
    assert history["person"]["age"] == 68
    assert "Hypertension" in history["person"]["conditions"]
    assert history["plan"]["max_hr_limit"] == 125
    assert history["plan"]["max_borg_limit"] == 14
    assert history["latest_reading"]["hr_ok"] is False

def test_lora_system_prompt_builder(mock_db):
    engine = GeminiLoraFilterEngine()
    history = engine.extract_patient_history(mock_db, person_id=1)
    prompt = engine.build_lora_system_prompt(history)

    assert "LoRA-Geriatric-Knee-Autonomic" in prompt
    assert "Rank=8" in prompt
    assert "Ramesh Kumar" in prompt
    assert "KNEE OSTEOARTHRITIS ADAPTATION" in prompt
    assert "HYPERTENSION & AMLODIPINE ADAPTATION" in prompt

def test_lora_safety_guardrails(mock_db):
    engine = GeminiLoraFilterEngine()
    history = engine.extract_patient_history(mock_db, person_id=1)

    # Output with unsafe knee exercise
    unsafe_text = "You should perform deep squats and heavy running today to build knee strength."
    res = engine.apply_safety_guardrails(unsafe_text, history)
    assert res["safety_passed"] is False
    assert len(res["warnings"]) > 0

    # Output with safe advice
    safe_text = "Perform gentle seated knee extensions within a 30 to 90 degree arc. Rest as needed."
    res_safe = engine.apply_safety_guardrails(safe_text, history)
    assert res_safe["safety_passed"] is True
    assert "Clinical Screening & Assistive Guidance" in res_safe["filtered_text"]

def test_full_lora_inference_pipeline(mock_db):
    import asyncio
    engine = GeminiLoraFilterEngine()
    result = asyncio.run(engine.generate_response(
        query="Is it safe for me to exercise right now?",
        db=mock_db,
        person_id=1
    ))

    assert result["query"] == "Is it safe for me to exercise right now?"
    assert "Ramesh" in result["response"]
    assert "safe" in result["response"].lower()
    assert result["lora_filter"]["rank"] == 8
    assert result["lora_filter"]["alpha"] == 16
    assert result["lora_filter"]["adapter_id"] == "LoRA-Geriatric-Knee-Autonomic-v1.4"
    assert result["lora_filter"]["safety_guardrails_passed"] is True
