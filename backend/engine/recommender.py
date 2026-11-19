"""
ReBuild Exercise Recommendation Engine
Recommends tailored rehabilitation routines dynamically based on:
1. Patient Clinical History (Age, conditions, past session recovery scores, form fault history)
2. Current Real-Time Sensor Telemetry (Resting HR, core temperature, inactivity hours, risk band)
3. Subjective Fatigue & Symptom Pre-Checks (Borg RPE, pain, dizziness)
"""

from typing import Dict, Any, List, Optional

# Exercise Master Catalog with physiological intensity profiles
EXERCISE_CATALOG = {
    "seated_knee_extension": {
        "id": "seated_knee_extension",
        "name": "Seated Knee Extension",
        "tamil_name": "நாற்காலியில் முழங்கால் நீட்டுதல்",
        "target_condition": ["knee_osteoarthritis", "post_op_knee", "elderly_frailty", "general"],
        "intensity": "low",
        "cardiac_impact": "low",
        "joint_impact": "low",
        "base_sets": 2,
        "base_reps": 10,
        "base_rest_s": 30,
        "description": "Seated quad strengthening without weight-bearing joint compression."
    },
    "sit_to_stand": {
        "id": "sit_to_stand",
        "name": "Sit to Stand (Chair Stand)",
        "tamil_name": "நாற்காலியிலிருந்து எழுந்து அமருதல்",
        "target_condition": ["elderly_frailty", "mobility_recovery", "general"],
        "intensity": "moderate",
        "cardiac_impact": "moderate",
        "joint_impact": "moderate",
        "base_sets": 2,
        "base_reps": 8,
        "base_rest_s": 45,
        "description": "Functional lower body and core power exercise simulating daily chair transfers."
    },
    "standing_heel_raise": {
        "id": "standing_heel_raise",
        "name": "Standing Heel Raise",
        "tamil_name": "குதிங்கால் உயர்த்துதல்",
        "target_condition": ["balance_deficits", "venous_circulation", "elderly_frailty"],
        "intensity": "low",
        "cardiac_impact": "low",
        "joint_impact": "low",
        "base_sets": 2,
        "base_reps": 12,
        "base_rest_s": 30,
        "description": "Activates calf muscle pump to improve venous return and ankle stability."
    },
    "shoulder_raise": {
        "id": "shoulder_raise",
        "name": "Shoulder Front Raise",
        "tamil_name": "தோள்பட்டை முன்பக்க உயர்த்துதல்",
        "target_condition": ["hypertension", "upper_body_stiffness", "seated_mobility"],
        "intensity": "low",
        "cardiac_impact": "low",
        "joint_impact": "low",
        "base_sets": 2,
        "base_reps": 10,
        "base_rest_s": 30,
        "description": "Gentle seated shoulder mobility with minimal cardiovascular elevation."
    },
    "deep_breathing_mobility": {
        "id": "deep_breathing_mobility",
        "name": "Diaphragmatic Breathing & Ankle Pumps",
        "tamil_name": "ஆழ்ந்த மூச்சுப்பயிற்சி மற்றும் கணுக்கால் சுழற்சி",
        "target_condition": ["cardiac_caution", "fever_recovery", "acute_strain"],
        "intensity": "very_low",
        "cardiac_impact": "minimal",
        "joint_impact": "zero",
        "base_sets": 1,
        "base_reps": 10,
        "base_rest_s": 20,
        "description": "Parasympathetic nervous system recovery and gentle venous return without cardiac strain."
    }
}

class ExerciseRecommendationEngine:
    def __init__(self):
        pass

    def generate_recommendation(
        self,
        person: Dict[str, Any],
        current_reading: Optional[Dict[str, Any]] = None,
        recent_sessions: Optional[List[Dict[str, Any]]] = None,
        pre_check_symptoms: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes patient profile + current sensors + history to produce an adaptive prescription.
        """
        if current_reading is None:
            current_reading = {"hr": 72, "hr_ok": True, "temp": 36.6, "idle_s": 0, "risk_band": "green"}
        if recent_sessions is None:
            recent_sessions = []
        if pre_check_symptoms is None:
            pre_check_symptoms = {"pain": False, "dizziness": False, "borg": 6}

        reasons = []
        conditions_str = person.get("conditions", "").lower()
        age = person.get("age", 68)
        profile_type = person.get("profile_type", "elderly")

        # Telemetry metrics
        hr = current_reading.get("hr", 72)
        hr_ok = current_reading.get("hr_ok", True)
        temp = current_reading.get("temp", 36.6)
        idle_s = current_reading.get("idle_s", 0)
        risk_band = current_reading.get("risk_band", "green")

        # Symptom check
        has_pain = pre_check_symptoms.get("pain", False)
        has_dizziness = pre_check_symptoms.get("dizziness", False)
        borg_effort = pre_check_symptoms.get("borg", 6)

        # Average past Recovery Intelligence Score
        avg_past_score = 80.0
        if recent_sessions:
            scores = [s.get("recovery_score", 80.0) for s in recent_sessions if s.get("recovery_score")]
            if scores:
                avg_past_score = sum(scores) / len(scores)

        # -------------------------------------------------------------
        # 1. TIER CLASSIFICATION: Contraindicated, Gentle, Moderate, Active
        # -------------------------------------------------------------
        if has_pain or has_dizziness or temp >= 38.0 or (hr_ok and hr > 115) or risk_band == "red":
            tier = "contraindicated_rest"
            tier_name = "Restorative Rest & Recovery Only"
            if temp >= 38.0:
                reasons.append(f"Fever detected ({temp:.1f} °C). Strenuous exercise is clinically contraindicated.")
            if hr > 115:
                reasons.append(f"Resting heart rate ({hr} BPM) is significantly elevated.")
            if has_pain:
                reasons.append("Active pain reported by patient.")
            if has_dizziness:
                reasons.append("Dizziness reported; fall prevention requires full seated rest.")

            prescribed_items = [
                {
                    **EXERCISE_CATALOG["deep_breathing_mobility"],
                    "target_sets": 1,
                    "target_reps": 10,
                    "rest_s": 30,
                    "target_hr_ceiling": 95
                }
            ]
            advice = "Do not perform strenuous movements today. Rest comfortably, hydrate, and notify your caregiver or doctor if symptoms persist."

        elif hr > 88 or idle_s > 1800 or avg_past_score < 65 or risk_band == "amber" or "hypertension" in conditions_str and hr > 84:
            tier = "gentle_restorative"
            tier_name = "Gentle Seated Mobilization"
            if hr > 88:
                reasons.append(f"Resting heart rate is slightly elevated ({hr} BPM). Prescribing low cardiac-workload seated routines.")
            if idle_s > 1800:
                reasons.append(f"Patient has been immobile for {idle_s // 60} mins. Gentle activation needed to prevent stiffness.")
            if "osteoarthritis" in conditions_str or "knee" in conditions_str:
                reasons.append("Patient has knee osteoarthritis: Avoiding deep knee flexion under bodyweight.")
            if avg_past_score < 65:
                reasons.append(f"Previous session recovery adherence was moderate ({avg_past_score:.0f}/100); reducing volume to prevent overuse.")

            prescribed_items = [
                {
                    **EXERCISE_CATALOG["seated_knee_extension"],
                    "target_sets": 2,
                    "target_reps": 8,
                    "rest_s": 45,
                    "target_hr_ceiling": 110
                },
                {
                    **EXERCISE_CATALOG["shoulder_raise"],
                    "target_sets": 2,
                    "target_reps": 8,
                    "rest_s": 35,
                    "target_hr_ceiling": 110
                }
            ]
            advice = "Perform seated movements at a relaxed cadence. Take the full 45 seconds rest between sets."

        else:
            # Optimal Physiological State (Green Band, Low Baseline HR, Good Past Score)
            tier = "standard_active"
            tier_name = "Active Functional Rehabilitation"
            reasons.append(f"Resting vitals are optimal (Heart rate {hr} BPM, Temperature {temp:.1f} °C).")
            reasons.append("Patient is afebrile with zero reported pain.")
            if avg_past_score >= 80:
                reasons.append(f"High previous session adherence ({avg_past_score:.0f}/100); cleared for progressive functional strength.")

            prescribed_items = [
                {
                    **EXERCISE_CATALOG["seated_knee_extension"],
                    "target_sets": 2,
                    "target_reps": 10,
                    "rest_s": 30,
                    "target_hr_ceiling": 125
                },
                {
                    **EXERCISE_CATALOG["sit_to_stand"],
                    "target_sets": 2,
                    "target_reps": 8,
                    "rest_s": 45,
                    "target_hr_ceiling": 125
                },
                {
                    **EXERCISE_CATALOG["standing_heel_raise"],
                    "target_sets": 2,
                    "target_reps": 12,
                    "rest_s": 30,
                    "target_hr_ceiling": 120
                }
            ]
            advice = "Maintain good posture, reach full joint extension on every repetition, and follow the voice coach."

        return {
            "tier": tier,
            "tier_name": tier_name,
            "clinical_reasoning": reasons,
            "summary_sentence": " ".join(reasons),
            "prescribed_exercises": prescribed_items,
            "max_prescribed_hr": 95 if tier == "contraindicated_rest" else 115 if tier == "gentle_restorative" else 125,
            "max_prescribed_borg": 10 if tier == "contraindicated_rest" else 13 if tier == "gentle_restorative" else 15,
            "patient_context": {
                "name": person.get("name", "Ramesh Kumar"),
                "conditions": person.get("conditions", "None"),
                "current_hr": hr,
                "current_temp": temp,
                "idle_minutes": idle_s // 60,
                "avg_past_score": round(avg_past_score, 1)
            },
            "advice": advice
        }
