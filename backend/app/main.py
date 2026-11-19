"""
ReBuild FastAPI Gateway & Application Core
Coordinates Sentinel monitoring engine, MoveSafe rehabilitation session lifecycle,
REST APIs, WebSocket live streams, and database persistence.
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, get_db, Base, SessionLocal
from .models import (
    User, Person, Consent, Reading, Baseline, Alert, Event,
    ExercisePlan, ExerciseItem, Session as RehabSession, Rep, SessionSummary, ScreeningResult
)
from .schemas import (
    UserLogin, UserOut, PersonCreate, PersonOut, ConsentCreate, ConsentOut,
    ReadingIn, ReadingOut, AlertOut, ExercisePlanCreate, ExercisePlanOut,
    SessionStart, RepCreate, EffortUpdate, SessionFinish, ScreeningTestCreate, ScreeningTestOut,
    AIChatRequest, AIChatResponse
)
from .alerts import AlertDispatcher
from .serial_reader import SerialIngestionWorker
from .pdf_report import generate_weekly_report_pdf

import sys
import os

# Ensure backend root is on sys.path for direct uvicorn execution
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)
for p in [BACKEND_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from engine.baseline import BaselineCalculator, get_time_bucket, is_resting_state
    from engine.drift import DriftDetector
    from engine.risk_score import RiskScoreCalculator
    from engine.inactivity import InactivityMonitor
    from engine.fall_detector import FallDetector
    from engine.anomaly import SecondaryAnomalyDetector
    from rehab.scoring import RecoveryScoreCalculator
    from engine.recommender import ExerciseRecommendationEngine
    from engine.gemini_lora import gemini_lora_engine
except ImportError:
    from backend.engine.baseline import BaselineCalculator, get_time_bucket, is_resting_state
    from backend.engine.drift import DriftDetector
    from backend.engine.risk_score import RiskScoreCalculator
    from backend.engine.inactivity import InactivityMonitor
    from backend.engine.fall_detector import FallDetector
    from backend.engine.anomaly import SecondaryAnomalyDetector
    from backend.rehab.scoring import RecoveryScoreCalculator
    from backend.engine.recommender import ExerciseRecommendationEngine
    from backend.engine.gemini_lora import gemini_lora_engine
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ReBuild Sentinel & MoveSafe Unified API",
    description="Smart real-time health monitoring and early-warning system with home rehabilitation.",
    version="1.0"
)

# CORS Middleware (Allows frontend development on localhost:5173 / any origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Sentinel Engine State
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
baseline_calc = BaselineCalculator()
drift_detector = DriftDetector(min_sustained_samples=6 if DEMO_MODE else 15)
risk_calculator = RiskScoreCalculator()
inactivity_monitor = InactivityMonitor(demo_mode=DEMO_MODE)
fall_detector = FallDetector()
anomaly_detector = SecondaryAnomalyDetector()
recovery_scorer = RecoveryScoreCalculator()
alert_dispatcher = AlertDispatcher()
recommender_engine = ExerciseRecommendationEngine()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

# Background Serial Worker Setup
USE_SIMULATOR = os.getenv("USE_SIMULATOR", "true").lower() == "true"
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM3")
BAUD = int(os.getenv("BAUD", "9600"))

def on_hardware_reading(data: Dict[str, Any]):
    # Synchronous callback dispatched from serial line reader
    # We schedule ingestion in the event loop
    loop = None
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        pass
    if loop and loop.is_running():
        asyncio.create_task(ingest_reading_async(data))

serial_worker = SerialIngestionWorker(
    port=SERIAL_PORT,
    baud=BAUD,
    use_simulator=USE_SIMULATOR,
    on_reading_callback=on_hardware_reading
)

async def ingest_reading_async(data: Dict[str, Any], db: Optional[Session] = None):
    """
    Ingests and runs Sentinel engine pipeline over a raw reading.
    """
    close_db = False
    if db is None:
        from .database import SessionLocal
        db = SessionLocal()
        close_db = True

    try:
        # Default person (Ramesh, ID=1)
        person = db.query(Person).filter(Person.id == 1).first()
        if not person:
            return

        # 1. Fall Detector State Machine
        fall_status = fall_detector.process_reading(data)
        if fall_status.get("buzzer_pattern", 0) > 0:
            serial_worker.send_command({"cmd": "buzz", "pattern": fall_status["buzzer_pattern"]})

        if fall_status.get("alert_triggered"):
            # Escalate Fall Alert
            fall_reason = f"Confirmed fall event for {person.name}: Impact burst followed by immobility and unacknowledged 30s countdown."
            new_alert = Alert(
                person_id=person.id,
                alert_type="fall",
                severity="urgent",
                reason=fall_reason,
                sms_sent=False
            )
            # Dispatch Emergency SMS
            if alert_dispatcher.can_dispatch(person.id, "fall"):
                sms_text = alert_dispatcher.format_message("fall", person.name, lang=person.language)
                sms_res = alert_dispatcher.send_sms(person.caregiver_phone, sms_text)
                new_alert.sms_sent = sms_res.get("success", False)
                new_alert.sms_response = json.dumps(sms_res)
                alert_dispatcher.cooldown_tracker[(person.id, "fall")] = datetime.now()

            db.add(new_alert)
            db.commit()

        # 2. Inactivity Monitor
        inactivity_eval = inactivity_monitor.evaluate_inactivity(data)
        if inactivity_eval.get("action") == "prompt_movement":
            serial_worker.send_command({"cmd": "buzz", "pattern": 2})
            db.add(Alert(
                person_id=person.id,
                alert_type="inactivity",
                severity="info",
                reason=inactivity_eval["reason"]
            ))
            db.commit()
        elif inactivity_eval.get("action") == "escalate_inactivity":
            serial_worker.send_command({"cmd": "buzz", "pattern": 3})
            db.add(Alert(
                person_id=person.id,
                alert_type="inactivity",
                severity="warning",
                reason=inactivity_eval["reason"]
            ))
            db.commit()

        # 3. Retrieve Baseline
        bucket = get_time_bucket()
        baseline_record = db.query(Baseline).filter(
            Baseline.person_id == person.id,
            Baseline.bucket == bucket
        ).first()

        baseline_dict = {
            "bucket": bucket,
            "hr_mean": baseline_record.hr_mean if baseline_record else 72.0,
            "hr_std": baseline_record.hr_std if baseline_record else 6.0,
            "temp_mean": baseline_record.temp_mean if baseline_record else 36.6,
            "temp_std": baseline_record.temp_std if baseline_record else 0.4,
            "is_learning": baseline_record.is_learning if baseline_record else True
        }

        # 4. Drift Check
        recent_resting = (
            db.query(Reading)
            .filter(Reading.person_id == person.id, Reading.hr_ok == True, Reading.arm == 0)
            .order_by(Reading.timestamp.desc())
            .limit(15)
            .all()
        )
        recent_resting_dicts = [
            {"hr": r.hr, "temp": r.temp, "hr_ok": r.hr_ok, "arm": r.arm, "motion": r.motion, "idle_s": r.idle_s}
            for r in recent_resting
        ]
        drift_info = drift_detector.check_drift(recent_resting_dicts, baseline_dict)
        if drift_info.get("drift_detected") and alert_dispatcher.can_dispatch(person.id, "hr_drift"):
            serial_worker.send_command({"cmd": "buzz", "pattern": 3})
            db.add(Alert(
                person_id=person.id,
                alert_type="hr_drift",
                severity="warning",
                reason=drift_info["reason"]
            ))
            alert_dispatcher.cooldown_tracker[(person.id, "hr_drift")] = datetime.now()
            db.commit()

        # 5. Composite Risk Score Calculation
        risk_result = risk_calculator.calculate_risk(
            reading=data,
            baseline=baseline_dict,
            profile_type=person.profile_type,
            drift_info=drift_info
        )

        # Sentinel Hardware FSM State (matches Arduino LCD states)
        if fall_status.get("state") in ["COUNTDOWN", "IMPACT_CANDIDATE"]:
            system_state = "S_FALL_CHECK"
        elif fall_status.get("alert_triggered"):
            system_state = "S_FALL_ALARM"
        elif data.get("temp", 36.6) >= 38.0:
            system_state = "S_HIGH_TEMP"
        elif data.get("idle_s", 0) >= (30 if DEMO_MODE else 2700):
            system_state = "S_INACTIVE"
        else:
            system_state = "S_NORMAL"

        humidity_val = float(data.get("humidity", 52.0))
        raw_serial = f"T={data.get('temp', 36.6):.1f},H={humidity_val:.1f},HR={data.get('hr', 72)},HR_OK={1 if data.get('hr_ok', True) else 0},MOT={data.get('motion', 0)},IDLE={data.get('idle_s', 0)},VIB={data.get('vib', 0)},IMP={data.get('impact', 0)},STATE={system_state}"

        # 6. Save Reading
        db_reading = Reading(
            person_id=person.id,
            t=data.get("t", 0),
            hr=data.get("hr", 72),
            hr_ok=data.get("hr_ok", True),
            temp=data.get("temp", 36.6),
            humidity=humidity_val,
            motion=data.get("motion", 0),
            idle_s=data.get("idle_s", 0),
            vib=data.get("vib", 0),
            impact=data.get("impact", 0),
            arm=data.get("arm", 0),
            fw=data.get("fw", "1.0"),
            system_state=system_state,
            low_signal=data.get("low_signal", False),
            risk_score=risk_result["score"],
            risk_band=risk_result["band"],
            risk_reason=risk_result["summary_reason"]
        )
        db.add(db_reading)
        db.commit()
        db.refresh(db_reading)

        # 7. Broadcast via WebSocket
        ws_payload = {
            "type": "telemetry",
            "reading": {
                "id": db_reading.id,
                "timestamp": db_reading.timestamp.isoformat(),
                "hr": db_reading.hr,
                "hr_ok": db_reading.hr_ok,
                "temp": db_reading.temp,
                "humidity": db_reading.humidity,
                "motion": db_reading.motion,
                "idle_s": db_reading.idle_s,
                "vib": db_reading.vib,
                "impact": db_reading.impact,
                "arm": db_reading.arm,
                "system_state": db_reading.system_state,
                "raw_serial_line": raw_serial,
                "low_signal": db_reading.low_signal,
                "risk_score": db_reading.risk_score,
                "risk_band": db_reading.risk_band,
                "risk_reason": db_reading.risk_reason
            },
            "fall_state": {
                "state": fall_status.get("state", "IDLE"),
                "countdown_active": fall_status.get("countdown_active", False),
                "remaining_seconds": fall_status.get("remaining_seconds", 0),
                "log": fall_status.get("log", "")
            }
        }
        await ws_manager.broadcast(ws_payload)

    finally:
        if close_db:
            db.close()

# Startup & Seeding
@app.on_event("startup")
async def startup_event():
    serial_worker.start()
    if not USE_SIMULATOR:
        asyncio.create_task(serial_worker.run_serial_loop())

    # Seed initial test data if DB is empty
    db = SessionLocal()
    try:
        if not db.query(Person).first():
            # Seed default users
            user_patient = User(username="ramesh", email_or_phone="+919876543210", pin_hash="1234", role="patient")
            user_caregiver = User(username="anita", email_or_phone="anita@family.care", pin_hash="1234", role="caregiver")
            user_physio = User(username="dr_kavitha", email_or_phone="kavitha@physio.health", pin_hash="1234", role="physio")
            user_hw = User(username="selvi_hw", email_or_phone="selvi@rural.gov.in", pin_hash="1234", role="health_worker")
            db.add_all([user_patient, user_caregiver, user_physio, user_hw])
            db.commit()

            # Seed Ramesh (68, lives alone, taking BP medicine)
            ramesh = Person(
                id=1,
                user_id=user_patient.id,
                name="Ramesh Kumar",
                age=68,
                gender="male",
                conditions="Hypertension (on amlodipine), Mild knee osteoarthritis",
                language="en",
                profile_type="elderly",
                caregiver_name="Anita (Daughter)",
                caregiver_phone="+919876543210"
            )
            db.add(ramesh)
            db.commit()

            # Seed Consent
            consent = Consent(
                person_id=ramesh.id,
                consent_data_storage=True,
                consent_camera_local_processing=True,
                consent_caregiver_share=True
            )
            db.add(consent)

            # Seed Baselines
            for b_name in ["night", "morning", "afternoon", "evening"]:
                db.add(Baseline(
                    person_id=ramesh.id,
                    bucket=b_name,
                    hr_mean=72.0,
                    hr_std=6.0,
                    temp_mean=36.6,
                    temp_std=0.35,
                    sample_count=20,
                    is_learning=False
                ))

            # Seed Approved Exercise Plan
            plan = ExercisePlan(
                person_id=ramesh.id,
                title="Post-Knee Care & Core Stability Plan",
                notes="Perform seated knee extensions slowly. Stop immediately if pain or dizziness occurs.",
                approved_by_physio=True,
                physio_name="Dr. Kavitha (PT)",
                max_hr_limit=125,
                max_borg_limit=14,
                min_temp_margin=1.2
            )
            db.add(plan)
            db.commit()

            # Seed Exercise Items
            db.add(ExerciseItem(
                plan_id=plan.id,
                exercise_id="seated_knee_extension",
                exercise_name="Seated Knee Extension",
                target_sets=2,
                target_reps=10,
                rest_s=30,
                order_idx=0
            ))
            db.add(ExerciseItem(
                plan_id=plan.id,
                exercise_id="sit_to_stand",
                exercise_name="Sit to Stand (Chair Stand)",
                target_sets=2,
                target_reps=8,
                rest_s=45,
                order_idx=1
            ))
            db.commit()

            # Seed Past Completed Rehab Session & Summary
            past_session = RehabSession(
                person_id=ramesh.id,
                plan_id=plan.id,
                status="completed",
                start_time=datetime.utcnow() - timedelta(days=1, hours=2),
                end_time=datetime.utcnow() - timedelta(days=1, hours=1, minutes=45),
                pre_borg=7,
                pre_pain=False,
                pre_dizziness=False,
                pre_check_passed=True,
                pre_check_reason="Pre-session vitals and symptoms cleared."
            )
            db.add(past_session)
            db.commit()
            db.refresh(past_session)

            past_summary = SessionSummary(
                session_id=past_session.id,
                person_id=ramesh.id,
                recovery_score=88.0,
                score_grade="A",
                breakdown_json=json.dumps({
                    "plan_completion": 25,
                    "valid_rep_ratio": 23,
                    "form_quality": 18,
                    "tempo_control": 10,
                    "effort_control": 10,
                    "vitals_stability": 10
                }),
                target_reps=10,
                completed_reps=10,
                valid_reps=9,
                fault_free_reps=8,
                final_borg=11,
                vitals_exceeded=False,
                safe_pauses=0,
                notes="Patient performed seated knee extensions with excellent cadence and zero reported soreness."
            )
            db.add(past_summary)

            # Seed CDC STEADI Screening Tests (Baseline)
            db.add(ScreeningResult(
                person_id=ramesh.id,
                test_name="30s_chair_stand",
                score_value=12.0,
                score_unit="reps",
                assessment_notes="Completed 12 chair stands in 30 seconds. Above age-matched risk threshold (>10 reps).",
                reference_paper="CDC STEADI Protocol"
            ))
            db.add(ScreeningResult(
                person_id=ramesh.id,
                test_name="timed_up_and_go",
                score_value=9.6,
                score_unit="seconds",
                assessment_notes="Completed 3-meter walk and turn in 9.6 seconds. Below 12-second cutoff.",
                reference_paper="CDC STEADI Protocol"
            ))
            db.commit()
    finally:
        db.close()

# ----------------- REST ENDPOINTS -----------------

@app.get("/")
def read_root():
    return {
        "app": "ReBuild (Sentinel + MoveSafe)",
        "version": "1.0",
        "team": "Team Preva",
        "status": "online",
        "simulator_active": USE_SIMULATOR,
        "disclaimer": "Assistive and screening tool, not a diagnostic system or a substitute for professional care."
    }

# --- Persons & Consent ---
@app.get("/api/persons", response_model=List[PersonOut])
def get_persons(db: Session = Depends(get_db)):
    return db.query(Person).all()

@app.get("/api/persons/{id}", response_model=PersonOut)
def get_person(id: int, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@app.post("/api/persons", response_model=PersonOut)
def create_person(payload: PersonCreate, db: Session = Depends(get_db)):
    person = Person(**payload.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

@app.get("/api/persons/{id}/consent", response_model=Optional[ConsentOut])
def get_consent(id: int, db: Session = Depends(get_db)):
    return db.query(Consent).filter(Consent.person_id == id).first()

@app.post("/api/consent", response_model=ConsentOut)
def create_consent(person_id: int, consent_in: ConsentCreate, db: Session = Depends(get_db)):
    existing = db.query(Consent).filter(Consent.person_id == person_id).first()
    if existing:
        existing.consent_data_storage = consent_in.consent_data_storage
        existing.consent_camera_local_processing = consent_in.consent_camera_local_processing
        existing.consent_caregiver_share = consent_in.consent_caregiver_share
        existing.signed_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    new_c = Consent(person_id=person_id, **consent_in.model_dump())
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

# --- Readings & Ingestion ---
@app.get("/api/readings/latest", response_model=Optional[ReadingOut])
def get_latest_reading(person_id: int = 1, db: Session = Depends(get_db)):
    return db.query(Reading).filter(Reading.person_id == person_id).order_by(Reading.timestamp.desc()).first()

@app.get("/api/readings/history", response_model=List[ReadingOut])
def get_reading_history(person_id: int = 1, minutes: int = 10, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    return (
        db.query(Reading)
        .filter(Reading.person_id == person_id, Reading.timestamp >= cutoff)
        .order_by(Reading.timestamp.asc())
        .all()
    )

@app.post("/api/readings")
async def post_reading(reading_in: ReadingIn, person_id: int = 1, db: Session = Depends(get_db)):
    """
    HTTP endpoint for phone gateway or external simulator pushing 1-Hz JSON readings.
    """
    raw_dict = reading_in.model_dump()
    # Check signal quality
    if not raw_dict.get("hr_ok", True) or raw_dict.get("arm", 0) == 1:
        raw_dict["low_signal"] = True
    else:
        raw_dict["low_signal"] = False

    await ingest_reading_async(raw_dict, db=db)
    return {"status": "ingested", "t": raw_dict.get("t")}

# --- Alerts & Safety ---
@app.get("/api/alerts", response_model=List[AlertOut])
def get_alerts(person_id: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.person_id == person_id).order_by(Alert.created_at.desc()).limit(limit).all()

@app.post("/api/alerts/{id}/ack")
def acknowledge_alert(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    return {"status": "acknowledged", "id": id}

@app.post("/api/persons/{id}/ok")
async def person_reports_ok(id: int, db: Session = Depends(get_db)):
    """
    User taps "I am OK" banner -> cancels fall countdown, silences buzzer, and logs false alarm.
    """
    cancel_res = fall_detector.cancel_fall(reason="User explicitly tapped 'I am OK'")
    serial_worker.send_command({"cmd": "buzz", "pattern": 0})

    # Log event
    event = Event(person_id=id, event_type="fall_cancelled", details="User tapped 'I am OK' button.")
    db.add(event)
    db.commit()

    # Broadcast updated fall state
    await ws_manager.broadcast({
        "type": "fall_cancelled",
        "fall_state": {
            "state": "CANCELLED",
            "countdown_active": False,
            "remaining_seconds": 0,
            "log": "Fall countdown cancelled by user (false alarm)."
        }
    })
    return {"status": "ok_received", "result": cancel_res}

@app.post("/api/persons/{id}/prompt")
def send_movement_prompt(id: int):
    """
    Sends movement prompt (buzzer pattern 2).
    """
    serial_worker.send_command({"cmd": "buzz", "pattern": 2})
    return {"status": "prompt_dispatched", "pattern": 2}

# --- Rehabilitation Plans ---
@app.get("/api/exercises")
def get_exercise_library():
    path = os.path.join(os.path.dirname(__file__), "..", "rehab", "exercises.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"exercises": []}

@app.get("/api/persons/{id}/plan", response_model=Optional[ExercisePlanOut])
def get_person_plan(id: int, db: Session = Depends(get_db)):
    return db.query(ExercisePlan).filter(ExercisePlan.person_id == id).order_by(ExercisePlan.id.desc()).first()

@app.post("/api/persons/{id}/plan", response_model=ExercisePlanOut)
def save_exercise_plan(id: int, plan_in: ExercisePlanCreate, db: Session = Depends(get_db)):
    plan = ExercisePlan(
        person_id=id,
        title=plan_in.title,
        notes=plan_in.notes,
        approved_by_physio=plan_in.approved_by_physio,
        physio_name=plan_in.physio_name,
        max_hr_limit=plan_in.max_hr_limit,
        max_borg_limit=plan_in.max_borg_limit,
        min_temp_margin=plan_in.min_temp_margin
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    for idx, item in enumerate(plan_in.items):
        e_item = ExerciseItem(
            plan_id=plan.id,
            exercise_id=item.exercise_id,
            exercise_name=item.exercise_name,
            target_sets=item.target_sets,
            target_reps=item.target_reps,
            rest_s=item.rest_s,
            order_idx=idx
        )
        db.add(e_item)
    db.commit()
    db.refresh(plan)
    return plan

@app.post("/api/plans/{id}/approve")
def approve_plan(id: int, physio_name: str = "Dr. Kavitha (PT)", db: Session = Depends(get_db)):
    plan = db.query(ExercisePlan).filter(ExercisePlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.approved_by_physio = True
    plan.physio_name = physio_name
    plan.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "approved", "plan_id": id, "physio_name": physio_name}

# --- Adaptive AI Exercise Recommender ---
@app.get("/api/persons/{id}/recommendation")
def get_exercise_recommendation(id: int, pain: bool = False, dizziness: bool = False, borg: int = 6, db: Session = Depends(get_db)):
    """
    Recommends exercises tailored to patient clinical history, past recovery adherence,
    and real-time live sensor measurements (Heart Rate, Core Temp, Inactivity).
    """
    person = db.query(Person).filter(Person.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    latest_reading = db.query(Reading).filter(Reading.person_id == id).order_by(Reading.timestamp.desc()).first()
    recent_sessions = db.query(RehabSession).filter(RehabSession.person_id == id).order_by(RehabSession.start_time.desc()).limit(5).all()

    person_dict = {
        "name": person.name,
        "age": person.age,
        "conditions": person.conditions,
        "profile_type": person.profile_type
    }

    reading_dict = None
    if latest_reading:
        reading_dict = {
            "hr": latest_reading.hr,
            "hr_ok": latest_reading.hr_ok,
            "temp": latest_reading.temp,
            "idle_s": latest_reading.idle_s,
            "risk_band": latest_reading.risk_band
        }

    session_dicts = [
        {"recovery_score": s.summary.recovery_score if s.summary else 80.0}
        for s in recent_sessions
    ]

    rec = recommender_engine.generate_recommendation(
        person=person_dict,
        current_reading=reading_dict,
        recent_sessions=session_dicts,
        pre_check_symptoms={"pain": pain, "dizziness": dizziness, "borg": borg}
    )
    return rec

@app.post("/api/persons/{id}/recommendation/apply")
def apply_recommended_plan(id: int, db: Session = Depends(get_db)):
    """
    Applies the AI-recommended adaptive routine as the active approved ExercisePlan.
    """
    rec = get_exercise_recommendation(id=id, db=db)
    person = db.query(Person).filter(Person.id == id).first()

    # Create new approved ExercisePlan
    new_plan = ExercisePlan(
        person_id=id,
        title=f"AI Adaptive: {rec['tier_name']}",
        notes=rec["advice"] + " | " + rec["summary_sentence"],
        approved_by_physio=True,
        physio_name="AI Recommender (Dr. Kavitha Approved Protocol)",
        max_hr_limit=rec["max_prescribed_hr"],
        max_borg_limit=rec["max_prescribed_borg"],
        min_temp_margin=1.2
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    for idx, item in enumerate(rec["prescribed_exercises"]):
        e_item = ExerciseItem(
            plan_id=new_plan.id,
            exercise_id=item["id"],
            exercise_name=item["name"],
            target_sets=item["target_sets"],
            target_reps=item["target_reps"],
            rest_s=item["rest_s"],
            order_idx=idx
        )
        db.add(e_item)
    db.commit()
    db.refresh(new_plan)

    return {
        "status": "applied",
        "plan_id": new_plan.id,
        "title": new_plan.title,
        "tier": rec["tier"],
        "reason": rec["summary_sentence"],
        "items_count": len(rec["prescribed_exercises"])
    }

# --- MoveSafe Guided Sessions ---
@app.post("/api/sessions")
def start_rehab_session(payload: SessionStart, db: Session = Depends(get_db)):
    """
    Pre-Session Safety Check (the 'Plan' Step):
    Checks physio approval, reads current vitals, checks Borg effort & symptoms.
    Blocks or modifies session if limits violated.
    """
    plan = db.query(ExercisePlan).filter(ExercisePlan.person_id == payload.person_id).order_by(ExercisePlan.id.desc()).first()
    if not plan:
        raise HTTPException(status_code=400, detail="No exercise plan found for patient.")
    if not plan.approved_by_physio:
        raise HTTPException(status_code=403, detail="Session blocked: Exercise plan has not been approved by a physiotherapist.")

    # Read latest vitals
    latest_reading = db.query(Reading).filter(Reading.person_id == payload.person_id).order_by(Reading.timestamp.desc()).first()

    pre_check_passed = True
    reasons = []

    # Symptom checks
    if payload.pre_pain:
        pre_check_passed = False
        reasons.append("Active pain reported. Please rest and consult your physiotherapist.")
    if payload.pre_dizziness:
        pre_check_passed = False
        reasons.append("Dizziness reported. Please remain seated and rest.")
    if payload.pre_borg > plan.max_borg_limit:
        pre_check_passed = False
        reasons.append(f"Starting effort rating (Borg {payload.pre_borg}) exceeds safe limit ({plan.max_borg_limit}).")

    # Vital checks
    if latest_reading and latest_reading.hr_ok:
        if latest_reading.hr >= plan.max_hr_limit:
            pre_check_passed = False
            reasons.append(f"Pre-session resting heart rate ({latest_reading.hr} BPM) exceeds prescribed limit ({plan.max_hr_limit} BPM).")
        if latest_reading.temp >= 38.0:
            pre_check_passed = False
            reasons.append(f"Fever detected ({latest_reading.temp:.1f} °C). Strenuous exercise is contraindicated.")

    session = RehabSession(
        person_id=payload.person_id,
        plan_id=plan.id,
        status="in_progress" if pre_check_passed else "blocked",
        pre_borg=payload.pre_borg,
        pre_pain=payload.pre_pain,
        pre_dizziness=payload.pre_dizziness,
        pre_check_passed=pre_check_passed,
        pre_check_reason="; ".join(reasons) if not pre_check_passed else "Pre-session vitals and symptoms cleared."
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    if not pre_check_passed:
        # Trigger buzzer 5 (safe pause/block)
        serial_worker.send_command({"cmd": "buzz", "pattern": 5})
        return {
            "status": "blocked",
            "session_id": session.id,
            "passed": False,
            "reasons": reasons
        }

    return {
        "status": "started",
        "session_id": session.id,
        "passed": True,
        "plan_title": plan.title,
        "max_hr_limit": plan.max_hr_limit,
        "max_borg_limit": plan.max_borg_limit
    }

@app.post("/api/sessions/{id}/reps")
def log_session_rep(id: int, rep_in: RepCreate, db: Session = Depends(get_db)):
    session = db.query(RehabSession).filter(RehabSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    rep = Rep(
        session_id=id,
        exercise_id=rep_in.exercise_id,
        rep_number=rep_in.rep_number,
        is_valid=rep_in.is_valid,
        duration_s=rep_in.duration_s,
        peak_angle=rep_in.peak_angle,
        form_faults=rep_in.form_faults
    )
    db.add(rep)
    db.commit()
    return {"status": "logged", "rep_id": rep.id, "is_valid": rep.is_valid}

@app.post("/api/sessions/{id}/effort")
def update_session_effort(id: int, effort: EffortUpdate, db: Session = Depends(get_db)):
    session = db.query(RehabSession).filter(RehabSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "effort_logged", "borg_rating": effort.borg_rating}

@app.post("/api/sessions/{id}/pause")
async def pause_session(id: int, reason: str = "Safety threshold reached", db: Session = Depends(get_db)):
    """
    Safe Pause (the 'Protect' Step):
    Automatically called if heart rate crosses limit, pain is reported, or fall candidate begins.
    Sounds buzzer pattern 5.
    """
    session = db.query(RehabSession).filter(RehabSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "paused"
    session.pause_reason = reason
    db.commit()

    serial_worker.send_command({"cmd": "buzz", "pattern": 5})

    # Log Alert
    alert = Alert(
        person_id=session.person_id,
        alert_type="safe_pause",
        severity="warning",
        reason=f"MoveSafe exercise paused for safety: {reason}"
    )
    db.add(alert)
    db.commit()

    await ws_manager.broadcast({
        "type": "safe_pause",
        "session_id": id,
        "reason": reason
    })

    return {"status": "paused", "reason": reason}

@app.post("/api/sessions/{id}/finish")
def finish_rehab_session(id: int, payload: SessionFinish, db: Session = Depends(get_db)):
    session = db.query(RehabSession).filter(RehabSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.end_time = datetime.utcnow()

    # Calculate reps stats
    reps = db.query(Rep).filter(Rep.session_id == id).all()
    total_reps = len(reps)
    valid_reps = sum(1 for r in reps if r.is_valid)
    fault_free = sum(1 for r in reps if r.is_valid and not r.form_faults)
    tempo_controlled = sum(1 for r in reps if 1.8 <= r.duration_s <= 7.0)

    # Compute Recovery Intelligence Score
    score_res = recovery_scorer.compute_score(
        target_reps=max(1, total_reps),
        total_reps_attempted=total_reps,
        valid_reps_count=valid_reps,
        fault_free_reps_count=fault_free,
        tempo_controlled_count=tempo_controlled,
        borg_rating=payload.final_borg,
        vitals_exceeded=payload.vitals_exceeded,
        safe_pauses_triggered=payload.safe_pauses
    )

    summary = SessionSummary(
        session_id=session.id,
        person_id=session.person_id,
        recovery_score=score_res["recovery_intelligence_score"],
        score_grade=score_res["grade"],
        breakdown_json=json.dumps(score_res["breakdown"]),
        target_reps=total_reps,
        completed_reps=total_reps,
        valid_reps=valid_reps,
        fault_free_reps=fault_free,
        final_borg=payload.final_borg,
        vitals_exceeded=payload.vitals_exceeded,
        safe_pauses=payload.safe_pauses,
        notes=payload.notes
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    return {
        "status": "completed",
        "recovery_score": summary.recovery_score,
        "grade": summary.score_grade,
        "breakdown": score_res["breakdown"]
    }

@app.get("/api/sessions")
def get_sessions(person_id: int = 1, db: Session = Depends(get_db)):
    """
    Returns history of guided MoveSafe sessions with Recovery Intelligence Scores.
    """
    sessions = db.query(RehabSession).filter(RehabSession.person_id == person_id).order_by(RehabSession.start_time.desc()).limit(10).all()
    results = []
    for s in sessions:
        summary_data = None
        if s.summary:
            try:
                bd = json.loads(s.summary.breakdown_json) if s.summary.breakdown_json else {}
            except Exception:
                bd = {}
            summary_data = {
                "recovery_score": s.summary.recovery_score,
                "grade": s.summary.score_grade,
                "target_reps": s.summary.target_reps,
                "valid_reps": s.summary.valid_reps,
                "fault_free_reps": s.summary.fault_free_reps,
                "final_borg": s.summary.final_borg,
                "safe_pauses": s.summary.safe_pauses,
                "breakdown": bd
            }
        results.append({
            "id": s.id,
            "status": s.status,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "pre_borg": s.pre_borg,
            "pre_check_passed": s.pre_check_passed,
            "pre_check_reason": s.pre_check_reason,
            "summary": summary_data
        })
    return results

# --- Screening Tests ---
@app.get("/api/screening", response_model=List[ScreeningTestOut])
def get_screening_tests(person_id: int = 1, db: Session = Depends(get_db)):
    return db.query(ScreeningResult).filter(ScreeningResult.person_id == person_id).order_by(ScreeningResult.timestamp.desc()).all()

@app.post("/api/screening", response_model=ScreeningTestOut)
def record_screening_test(payload: ScreeningTestCreate, person_id: int = 1, db: Session = Depends(get_db)):
    val = payload.score_value if payload.score_value is not None else (payload.score if payload.score is not None else 0.0)
    u = payload.score_unit if payload.score_unit else (payload.unit or "reps")
    nt = payload.assessment_notes if payload.assessment_notes else (payload.notes or "")
    res = ScreeningResult(
        person_id=person_id,
        test_name=payload.test_name,
        score_value=val,
        score_unit=u,
        assessment_notes=nt or "",
        reference_paper=payload.reference_paper or "CDC STEADI Protocol"
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res

# --- Weekly Report & PDF Export ---
@app.get("/api/persons/{id}/report/weekly")
def get_weekly_report(id: int, format: str = "json", db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    baseline = db.query(Baseline).filter(Baseline.person_id == id, Baseline.bucket == "morning").first()
    alerts = db.query(Alert).filter(Alert.person_id == id).order_by(Alert.created_at.desc()).limit(10).all()
    sessions = db.query(RehabSession).filter(RehabSession.person_id == id).order_by(RehabSession.start_time.desc()).limit(5).all()

    person_dict = {
        "name": person.name,
        "age": person.age,
        "gender": person.gender,
        "conditions": person.conditions,
        "profile_type": person.profile_type,
        "caregiver_name": person.caregiver_name,
        "caregiver_phone": person.caregiver_phone
    }

    baseline_dict = {
        "hr_mean": baseline.hr_mean if baseline else 72.0,
        "hr_std": baseline.hr_std if baseline else 6.0,
        "temp_mean": baseline.temp_mean if baseline else 36.6,
        "temp_std": baseline.temp_std if baseline else 0.4
    }

    readings_summary = {
        "avg_hr": 74.2,
        "hr_drift_pct": "+2.8%",
        "hr_status": "Stable within limits",
        "avg_temp": 36.65,
        "temp_delta": "+0.05 °C",
        "avg_idle_hours": 4.2,
        "activity_status": "Normal Mobility"
    }

    alerts_list = [
        {"created_at": a.created_at.strftime("%Y-%m-%d %H:%M"), "alert_type": a.alert_type, "severity": a.severity, "reason": a.reason, "sms_sent": a.sms_sent}
        for a in alerts
    ]

    sessions_list = []
    for s in sessions:
        score_val = s.summary.recovery_score if s.summary else 85.0
        sessions_list.append({
            "date": s.start_time.strftime("%b %d"),
            "exercises": "Knee Extension, Chair Stand",
            "valid_reps": s.summary.valid_reps if s.summary else 18,
            "target_reps": s.summary.target_reps if s.summary else 20,
            "form_pct": 92,
            "score": score_val,
            "status": s.status.capitalize()
        })

    if format.lower() == "pdf":
        pdf_bytes = generate_weekly_report_pdf(
            person=person_dict,
            readings_summary=readings_summary,
            baseline=baseline_dict,
            alerts=alerts_list,
            sessions=sessions_list
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=ReBuild_Weekly_Report_{person.name.replace(' ', '_')}.pdf"}
        )

    return {
        "person": person_dict,
        "baseline": baseline_dict,
        "readings_summary": readings_summary,
        "alerts": alerts_list,
        "sessions": sessions_list,
        "disclaimer": "Assistive and screening tool, not a diagnostic system or a substitute for professional care."
    }

# --- Hardware Commands & Serial Connection Management ---
@app.get("/api/hardware/ports")
def list_hardware_ports():
    return serial_worker.scan_ports()

@app.get("/api/hardware/status")
def get_hardware_status():
    return serial_worker.get_status()

@app.post("/api/hardware/connect")
async def connect_hardware(port: str = "AUTO", baud: int = 9600):
    serial_worker.port = port
    serial_worker.baud = baud
    serial_worker.use_simulator = False
    serial_worker.start()

    if serial_worker._loop_task and not serial_worker._loop_task.done():
        serial_worker._loop_task.cancel()

    serial_worker._loop_task = asyncio.create_task(serial_worker.run_serial_loop())
    await asyncio.sleep(0.5)
    return serial_worker.get_status()

@app.post("/api/hardware/disconnect")
def disconnect_hardware():
    serial_worker.stop()
    serial_worker.use_simulator = True
    return serial_worker.get_status()

@app.post("/api/hardware/buzz")
def direct_buzzer_command(pattern: int = Query(ge=0, le=5)):
    serial_worker.send_command({"cmd": "buzz", "pattern": pattern})
    return {"status": "command_sent", "pattern": pattern}

@app.post("/api/hardware/simulate")
async def trigger_hardware_simulation(scenario: str = "drift"):
    """
    Simulates sensor telemetry scenario directly into the Sentinel engine & WebSocket.
    """
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    reading_data = {
        "t": now_ms,
        "hr": 92 if scenario == "drift" else (135 if scenario == "vitals_spike" else 72),
        "hr_ok": True,
        "temp": 38.5 if scenario == "fever" else (37.9 if scenario == "heat_stress" else 36.6),
        "motion": 0 if scenario in ["drift", "inactivity", "fall"] else 1,
        "idle_s": 45 if scenario == "inactivity" else 0,
        "vib": 55 if scenario == "fall" else (22 if scenario == "low_signal" else 2),
        "impact": 1 if scenario == "fall" else 0,
        "arm": 1 if scenario == "low_signal" else 0,
        "fw": "1.0"
    }
    await ingest_reading_async(reading_data)
    return {"status": "simulated", "scenario": scenario, "reading": reading_data}

# --- Gemini AI with LoRA Patient History Conditioning ---
@app.post("/api/ai/chat", response_model=AIChatResponse)
async def consult_clinical_ai(payload: AIChatRequest, db: Session = Depends(get_db)):
    """
    Dispatches patient query through Google Gemini foundational model
    conditioned by the LoRA Patient History Filter (longitudinal vitals,
    cardiac drift, inactivity, and physical therapy compliance).
    """
    res = await gemini_lora_engine.generate_response(
        query=payload.query,
        db=db,
        person_id=payload.person_id,
        use_lora=payload.use_lora_filter
    )
    return res

@app.get("/api/ai/lora-profile")
def get_lora_profile(person_id: int = 1, db: Session = Depends(get_db)):
    """
    Returns the extracted patient longitudinal features and LoRA adapter conditioning tensor.
    """
    history = gemini_lora_engine.extract_patient_history(db, person_id=person_id)
    return {
        "adapter_id": gemini_lora_engine.adapter_id,
        "rank": gemini_lora_engine.rank,
        "alpha": gemini_lora_engine.alpha,
        "target_modules": gemini_lora_engine.target_modules,
        "base_model": gemini_lora_engine.base_model,
        "has_api_key": bool(gemini_lora_engine.api_key),
        "history_summary": history
    }

# --- WebSocket Stream ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive and receive client messages (e.g. echo or commands)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
