"""
SQLAlchemy Data Models for ReBuild
Entities: User, Person, Consent, Reading, Baseline, Alert, Event,
          ExercisePlan, ExerciseItem, Session, Rep, SessionSummary, ScreeningResult.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email_or_phone = Column(String(128), unique=True, index=True, nullable=False)
    pin_hash = Column(String(128), nullable=False)
    role = Column(String(32), default="patient") # patient, caregiver, physio, health_worker
    created_at = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="user", uselist=False)

class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(16), default="other")
    conditions = Column(String(256), default="None")
    language = Column(String(8), default="en") # "en" or "ta"
    profile_type = Column(String(32), default="elderly") # elderly, chronic, recovering, outdoor_worker
    caregiver_name = Column(String(128), default="Family Caregiver")
    caregiver_phone = Column(String(32), default="+919876543210")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="person")
    consent = relationship("Consent", back_populates="person", uselist=False)
    readings = relationship("Reading", back_populates="person", order_by="desc(Reading.timestamp)")
    baselines = relationship("Baseline", back_populates="person")
    alerts = relationship("Alert", back_populates="person", order_by="desc(Alert.created_at)")
    plans = relationship("ExercisePlan", back_populates="person")
    sessions = relationship("Session", back_populates="person")
    screening_results = relationship("ScreeningResult", back_populates="person")

class Consent(Base):
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), unique=True, nullable=False)
    consent_data_storage = Column(Boolean, default=True)
    consent_camera_local_processing = Column(Boolean, default=True)
    consent_caregiver_share = Column(Boolean, default=True)
    signed_at = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="consent")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    t = Column(Integer)             # Arduino milliseconds
    hr = Column(Integer)            # Heart rate BPM
    hr_ok = Column(Boolean)         # Valid beat flag
    temp = Column(Float)            # Body temperature Celsius
    humidity = Column(Float, default=52.0) # Relative humidity percentage (DHT22)
    motion = Column(Integer)        # PIR motion in last sec (1 or 0)
    idle_s = Column(Integer)        # Inactivity duration in seconds
    vib = Column(Integer)           # Vibration pulses per sec
    impact = Column(Integer)        # Impact burst (1 or 0)
    arm = Column(Integer)           # Arm movement indicator (1 or 0)
    fw = Column(String(16), default="1.0")
    system_state = Column(String(32), default="S_NORMAL")

    # Evaluated flags
    low_signal = Column(Boolean, default=False)
    risk_score = Column(Integer, default=0)
    risk_band = Column(String(16), default="green") # green, amber, red
    risk_reason = Column(Text, default="")

    person = relationship("Person", back_populates="readings")

class Baseline(Base):
    __tablename__ = "baselines"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    bucket = Column(String(16), nullable=False) # night, morning, afternoon, evening
    hr_mean = Column(Float, default=72.0)
    hr_std = Column(Float, default=6.0)
    temp_mean = Column(Float, default=36.6)
    temp_std = Column(Float, default=0.4)
    sample_count = Column(Integer, default=0)
    is_learning = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="baselines")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    alert_type = Column(String(32), nullable=False) # fall, fall_candidate, hr_drift, fever, inactivity, heat_stress, safe_pause
    severity = Column(String(16), default="warning") # info, warning, urgent
    reason = Column(Text, nullable=False)
    sms_sent = Column(Boolean, default=False)
    sms_response = Column(Text, nullable=True)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    person = relationship("Person", back_populates="alerts")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ExercisePlan(Base):
    __tablename__ = "exercise_plans"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    title = Column(String(128), default="Home Rehabilitation Plan")
    notes = Column(Text, default="")
    approved_by_physio = Column(Boolean, default=False)
    physio_name = Column(String(128), default="Physiotherapist")
    max_hr_limit = Column(Integer, default=125)     # Placeholder safe ceiling
    max_borg_limit = Column(Integer, default=15)    # RPE 15 = "Hard"
    min_temp_margin = Column(Float, default=1.5)    # Celsius margin before stop
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="plans")
    items = relationship("ExerciseItem", back_populates="plan", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="plan")

class ExerciseItem(Base):
    __tablename__ = "exercise_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("exercise_plans.id"), index=True, nullable=False)
    exercise_id = Column(String(64), nullable=False)
    exercise_name = Column(String(128), nullable=False)
    target_sets = Column(Integer, default=2)
    target_reps = Column(Integer, default=10)
    rest_s = Column(Integer, default=30)
    order_idx = Column(Integer, default=0)

    plan = relationship("ExercisePlan", back_populates="items")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    plan_id = Column(Integer, ForeignKey("exercise_plans.id"), nullable=True)
    status = Column(String(32), default="in_progress") # in_progress, completed, paused, aborted
    pre_borg = Column(Integer, default=6)
    pre_pain = Column(Boolean, default=False)
    pre_dizziness = Column(Boolean, default=False)
    pre_check_passed = Column(Boolean, default=True)
    pre_check_reason = Column(Text, default="")
    pause_reason = Column(Text, nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    person = relationship("Person", back_populates="sessions")
    plan = relationship("ExercisePlan", back_populates="sessions")
    reps = relationship("Rep", back_populates="session", cascade="all, delete-orphan")
    summary = relationship("SessionSummary", back_populates="session", uselist=False)

class Rep(Base):
    __tablename__ = "reps"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), index=True, nullable=False)
    exercise_id = Column(String(64), nullable=False)
    rep_number = Column(Integer, nullable=False)
    is_valid = Column(Boolean, default=True)
    duration_s = Column(Float, default=2.5)
    peak_angle = Column(Float, default=170.0)
    form_faults = Column(String(256), default="")
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="reps")

class SessionSummary(Base):
    __tablename__ = "session_summaries"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), unique=True, nullable=False)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    recovery_score = Column(Float, default=0.0)
    score_grade = Column(String(64), default="")
    breakdown_json = Column(Text, default="{}")
    target_reps = Column(Integer, default=0)
    completed_reps = Column(Integer, default=0)
    valid_reps = Column(Integer, default=0)
    fault_free_reps = Column(Integer, default=0)
    final_borg = Column(Integer, default=6)
    vitals_exceeded = Column(Boolean, default=False)
    safe_pauses = Column(Integer, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="summary")

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), index=True, nullable=False)
    test_name = Column(String(64), nullable=False) # 30s_chair_stand, timed_up_and_go
    score_value = Column(Float, nullable=False)
    score_unit = Column(String(32), default="reps") # reps or seconds
    assessment_notes = Column(Text, default="")
    reference_paper = Column(String(256), default="CDC STEADI Assessment Protocol")
    timestamp = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="screening_results")
