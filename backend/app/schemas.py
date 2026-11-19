"""
Pydantic Schemas for API Serialization and Request Validation
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- User & Auth -----------------
class UserLogin(BaseModel):
    username_or_phone: str
    pin: str

class UserOut(BaseModel):
    id: int
    username: str
    email_or_phone: str
    role: str

    class Config:
        from_attributes = True

# ----------------- Person & Consent -----------------
class ConsentCreate(BaseModel):
    consent_data_storage: bool = True
    consent_camera_local_processing: bool = True
    consent_caregiver_share: bool = True

class ConsentOut(ConsentCreate):
    id: int
    signed_at: datetime

    class Config:
        from_attributes = True

class PersonCreate(BaseModel):
    name: str
    age: int
    gender: str = "other"
    conditions: str = "None"
    language: str = "en"
    profile_type: str = "elderly"
    caregiver_name: str = "Family Caregiver"
    caregiver_phone: str = "+919876543210"

class PersonOut(PersonCreate):
    id: int
    created_at: datetime
    consent: Optional[ConsentOut] = None

    class Config:
        from_attributes = True

# ----------------- Telemetry Readings -----------------
class ReadingIn(BaseModel):
    t: int = Field(default=0, description="Arduino timestamp in ms")
    hr: int = Field(default=72, description="Heart rate in BPM")
    hr_ok: bool = Field(default=True, description="Beat valid flag")
    temp: float = Field(default=36.6, description="Core temperature in Celsius")
    humidity: float = Field(default=52.0, description="Ambient relative humidity percentage")
    motion: int = Field(default=1, description="PIR motion latch (1 or 0)")
    idle_s: int = Field(default=0, description="Seconds since last motion")
    vib: int = Field(default=0, description="Vibration pulses in last second")
    impact: int = Field(default=0, description="High impact burst detected (1 or 0)")
    arm: int = Field(default=0, description="Arm movement detected (1 or 0)")
    fw: str = Field(default="1.0", description="Firmware version")
    system_state: str = Field(default="S_NORMAL", description="Sentinel FSM state")

class ReadingOut(ReadingIn):
    id: int
    person_id: int
    timestamp: datetime
    low_signal: bool = False
    risk_score: int = 0
    risk_band: str = "green"
    risk_reason: str = ""
    raw_serial_line: Optional[str] = ""

    class Config:
        from_attributes = True

# ----------------- Alerts -----------------
class AlertOut(BaseModel):
    id: int
    person_id: int
    alert_type: str
    severity: str
    reason: str
    sms_sent: bool
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Exercise Plan -----------------
class ExerciseItemCreate(BaseModel):
    exercise_id: str
    exercise_name: str
    target_sets: int = 2
    target_reps: int = 10
    rest_s: int = 30
    order_idx: int = 0

class ExerciseItemOut(ExerciseItemCreate):
    id: int

    class Config:
        from_attributes = True

class ExercisePlanCreate(BaseModel):
    title: str = "Home Rehabilitation Plan"
    notes: str = ""
    approved_by_physio: bool = False
    physio_name: str = "Physiotherapist"
    max_hr_limit: int = 125
    max_borg_limit: int = 15
    min_temp_margin: float = 1.5
    items: List[ExerciseItemCreate] = []

class ExercisePlanOut(BaseModel):
    id: int
    person_id: int
    title: str
    notes: str
    approved_by_physio: bool
    physio_name: str
    max_hr_limit: int
    max_borg_limit: int
    min_temp_margin: float
    items: List[ExerciseItemOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- Sessions & Reps -----------------
class SessionStart(BaseModel):
    person_id: int
    plan_id: Optional[int] = None
    pre_borg: int = 6
    pre_pain: bool = False
    pre_dizziness: bool = False

class RepCreate(BaseModel):
    exercise_id: str
    rep_number: int
    is_valid: bool
    duration_s: float
    peak_angle: float
    form_faults: str = ""

class EffortUpdate(BaseModel):
    borg_rating: int = Field(ge=6, le=20)

class SessionFinish(BaseModel):
    final_borg: int = 6
    vitals_exceeded: bool = False
    safe_pauses: int = 0
    notes: str = ""

# ----------------- Screening Tests -----------------
class ScreeningTestCreate(BaseModel):
    test_name: str # "30s_chair_stand" or "timed_up_and_go"
    score_value: Optional[float] = None
    score: Optional[float] = None
    score_unit: Optional[str] = "reps"
    unit: Optional[str] = None
    risk_classification: Optional[str] = "normal"
    assessment_notes: Optional[str] = ""
    notes: Optional[str] = ""
    reference_paper: str = "CDC STEADI Protocol"

class ScreeningTestOut(BaseModel):
    id: int
    person_id: int
    test_name: str
    score: Optional[float] = None
    score_value: Optional[float] = None
    unit: Optional[str] = "reps"
    score_unit: Optional[str] = "reps"
    risk_classification: Optional[str] = "normal"
    notes: Optional[str] = ""
    assessment_notes: Optional[str] = ""
    reference_paper: Optional[str] = "CDC STEADI Protocol"
    timestamp: datetime

    class Config:
        from_attributes = True

# ----------------- Gemini API & LoRA Filter -----------------
class AIChatRequest(BaseModel):
    query: str
    person_id: int = 1
    use_lora_filter: bool = True
    context_limit: int = 25

class LoraFilterMetadata(BaseModel):
    adapter_id: str
    rank: int = 8
    alpha: int = 16
    target_modules: List[str] = ["q_proj", "v_proj", "clinical_reasoning_head"]
    patient_cohort: str
    historical_samples_analyzed: int
    avg_resting_hr: float
    avg_temp: float
    recent_fall_events: int
    inactivity_episodes: int
    physio_plan_compliance: str
    safety_guardrails_passed: bool
    guardrail_warnings: List[str] = []
    model_name: str

class AIChatResponse(BaseModel):
    query: str
    response: str
    lora_filter: LoraFilterMetadata
    timestamp: str
