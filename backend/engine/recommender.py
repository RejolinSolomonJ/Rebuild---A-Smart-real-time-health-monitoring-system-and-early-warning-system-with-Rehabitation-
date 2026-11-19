"""
ReBuild Smart Vital Parameter-Based Rehabilitation Recommendation Engine
Strictly adheres to the 4 approved clinical exercises:
1. Seated Knee Extension
2. Sit to Stand (Chair Stand)
3. Standing Heel Raise
4. Shoulder Front Raise

Parameters Monitored:
- Heart Rate (BPM)
- Body Temperature (°C)
- SpO2 (%)
- Environmental Humidity (%)

Notification Categories:
- GREEN: Parameters within prescribed limits. Display assigned exercise.
- YELLOW: Abnormal readings. Pause exercise, reassess and display a warning.
- RED: Critical readings or concerning symptoms. Stop rehabilitation and display urgent medical instructions.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

FOUR_CANONICAL_EXERCISES = {
    "seated_knee_extension": {
        "id": "seated_knee_extension",
        "name": "Seated Knee Extension",
        "tamil_name": "நாற்காலியில் அமர்ந்து முழங்கால் நீட்டுதல்",
        "category": "Lower Body Strengthening",
        "target_muscle": "Quadriceps & Patellar Tendon",
        "primary_joint": "knee",
        "purpose": "Strengthens quadriceps muscles and stabilizes the patellofemoral joint without axial joint loading, ideal for knee osteoarthritis.",
        "instructions": "Sit upright on a sturdy chair with feet flat. Slowly extend your knee until your lower leg is nearly horizontal, hold for 1 second, and gently lower with control.",
        "default_sets": 2,
        "default_reps": 10,
        "default_duration_s": 60,
        "rest_s": 30,
        "why_selected": "Prescribed for knee osteoarthritis to build peri-articular quadriceps strength while avoiding bodyweight compressive stress on the knee cartilage."
    },
    "sit_to_stand": {
        "id": "sit_to_stand",
        "name": "Sit to Stand (Chair Stand)",
        "tamil_name": "நாற்காலியிலிருந்து எழுந்து அமருதல்",
        "category": "Functional Mobility & Fall Prevention",
        "target_muscle": "Gluteus Maximus, Quadriceps, Core",
        "primary_joint": "hip_knee",
        "purpose": "Enhances lower body functional power, dynamic balance, and safe transfer independence as assessed in the CDC STEADI Chair Stand protocol.",
        "instructions": "Sit on the front half of a stable chair with arms folded across chest. Lean forward slightly from the hips and stand up fully, pause, then lower gently back down.",
        "default_sets": 2,
        "default_reps": 8,
        "default_duration_s": 60,
        "rest_s": 45,
        "why_selected": "Prescribed to improve hip and knee extensor strength required for independent chair transfers and reducing geriatric fall risk."
    },
    "standing_heel_raise": {
        "id": "standing_heel_raise",
        "name": "Standing Heel Raise",
        "tamil_name": "குதிங்கால் உயர்த்துதல்",
        "category": "Balance & Venous Return",
        "target_muscle": "Gastrocnemius, Soleus (Calf Muscle Pump)",
        "primary_joint": "ankle",
        "purpose": "Activates the peripheral skeletal muscle pump to facilitate venous blood return from lower limbs and reinforces ankle proprioceptive stability.",
        "instructions": "Stand tall holding onto a wall or chair for light balance. Push through the balls of both feet to elevate your heels, pause for 1 second at the peak, and smoothly lower.",
        "default_sets": 2,
        "default_reps": 12,
        "default_duration_s": 45,
        "rest_s": 30,
        "why_selected": "Prescribed to enhance lower-extremity circulation, reduce peripheral edema, and improve ankle dynamic balance on uneven ground."
    },
    "shoulder_raise": {
        "id": "shoulder_raise",
        "name": "Shoulder Front Raise",
        "tamil_name": "தோள்பட்டை முன்பக்க உயர்த்துதல்",
        "category": "Upper Body Posture & Mobility",
        "target_muscle": "Anterior Deltoid, Rotator Cuff, Upper Trapezius",
        "primary_joint": "shoulder",
        "purpose": "Promotes thoracic spinal upright posture, shoulder flexion range of motion, and scapular stabilization with low cardiovascular demand.",
        "instructions": "Sit or stand tall with arms at sides. Slowly elevate arms forward to shoulder height with elbows straight, hold for 1 second, and gently lower down.",
        "default_sets": 2,
        "default_reps": 10,
        "default_duration_s": 60,
        "rest_s": 30,
        "why_selected": "Prescribed to maintain upper body functional reach, chest expansion, and posture without increasing cardiac afterload."
    }
}

class ExerciseRecommendationEngine:
    def __init__(self):
        pass

    def evaluate_vitals(
        self,
        hr: float,
        hr_ok: bool,
        temp: float,
        spo2: float,
        humidity: float,
        custom_thresholds: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        thresholds = {
            "min_hr": 50,
            "max_hr_resting": 100,
            "max_hr_exercise": 125,
            "min_temp": 35.5,
            "fever_temp": 38.0,
            "warning_temp": 37.6,
            "min_spo2_warning": 95.0,
            "min_spo2_critical": 90.0
        }
        if custom_thresholds:
            thresholds.update(custom_thresholds)

        now_iso = datetime.utcnow().isoformat()
        notifications: List[Dict[str, Any]] = []
        statuses: Dict[str, Dict[str, Any]] = {}

        # 1. Heart Rate
        hr_status = "NORMAL"
        hr_reason = "Within normal resting cardiac range (55-100 BPM)."
        hr_action = "Cardiac reserve cleared for prescribed physical activity."

        if not hr_ok or hr <= 0:
            hr_status = "WARNING"
            hr_reason = "Pulse signal intermittent or sensor displaced."
            hr_action = "Reposition pulse sensor on finger before initiating exercise."
            notifications.append({
                "parameter": "Heart Rate",
                "value": "Disconnected / Signal Artifact",
                "category": "YELLOW",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr < thresholds["min_hr"]:
            hr_status = "CRITICAL"
            hr_reason = f"Severe bradycardia detected ({hr} BPM < {thresholds['min_hr']} BPM)."
            hr_action = "STOP all activity immediately. Sit comfortably, notify caregiver Anita and seek emergency medical evaluation."
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr} BPM",
                "category": "RED",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr < 55:
            hr_status = "WARNING"
            hr_reason = f"Borderline low heart rate ({hr} BPM)."
            hr_action = "Pause exercise. Assess patient for dizziness, lightheadedness, or medication side effects."
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr} BPM",
                "category": "YELLOW",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr > thresholds["max_hr_exercise"]:
            hr_status = "CRITICAL"
            hr_reason = f"Severe tachycardia detected ({hr} BPM > {thresholds['max_hr_exercise']} BPM ceiling)."
            hr_action = "STOP rehabilitation immediately. Remain seated, breathe slowly, and alert medical personnel."
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr} BPM",
                "category": "RED",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr > thresholds["max_hr_resting"]:
            hr_status = "WARNING"
            hr_reason = f"Elevated resting heart rate ({hr} BPM > {thresholds['max_hr_resting']} BPM)."
            hr_action = "Pause exercise session. Hydrate, rest seated for 5 minutes, and verify before proceeding."
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr} BPM",
                "category": "YELLOW",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        else:
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr} BPM",
                "category": "GREEN",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })

        statuses["hr"] = {
            "value": hr if hr_ok else 74,
            "status": hr_status,
            "unit": "BPM",
            "reason": hr_reason,
            "action": hr_action
        }

        # 2. Body Temperature
        temp_status = "NORMAL"
        temp_reason = "Normothermic baseline (36.0°C - 37.5°C)."
        temp_action = "Body temperature suitable for rehabilitation."

        if temp < thresholds["min_temp"]:
            temp_status = "CRITICAL"
            temp_reason = f"Hypothermia alert: Body temperature {temp:.1f}°C is dangerously low (< {thresholds['min_temp']}°C)."
            temp_action = "STOP exercise immediately. Wrap in warm blankets, provide warm fluids, and seek urgent clinical assessment."
            notifications.append({
                "parameter": "Body Temperature",
                "value": f"{temp:.1f} °C",
                "category": "RED",
                "reason": temp_reason,
                "safety_action": temp_action,
                "timestamp": now_iso
            })
        elif temp >= thresholds["fever_temp"]:
            temp_status = "CRITICAL"
            temp_reason = f"Fever detected ({temp:.1f}°C >= {thresholds['fever_temp']}°C). Strenuous exercise is clinically contraindicated."
            temp_action = "Postpone all rehabilitation exercises. Rest in bed, hydrate, monitor symptoms, and consult doctor."
            notifications.append({
                "parameter": "Body Temperature",
                "value": f"{temp:.1f} °C",
                "category": "RED",
                "reason": temp_reason,
                "safety_action": temp_action,
                "timestamp": now_iso
            })
        elif temp >= thresholds["warning_temp"]:
            temp_status = "WARNING"
            temp_reason = f"Low-grade temperature elevation ({temp:.1f}°C)."
            temp_action = "Postpone high-exertion exercises. Reassess temperature in 15 minutes before starting."
            notifications.append({
                "parameter": "Body Temperature",
                "value": f"{temp:.1f} °C",
                "category": "YELLOW",
                "reason": temp_reason,
                "safety_action": temp_action,
                "timestamp": now_iso
            })
        elif temp < 36.0:
            temp_status = "WARNING"
            temp_reason = f"Sub-normal core temperature ({temp:.1f}°C)."
            temp_action = "Ensure warm ambient room temperature before proceeding with gentle exercises."
            notifications.append({
                "parameter": "Body Temperature",
                "value": f"{temp:.1f} °C",
                "category": "YELLOW",
                "reason": temp_reason,
                "safety_action": temp_action,
                "timestamp": now_iso
            })
        else:
            notifications.append({
                "parameter": "Body Temperature",
                "value": f"{temp:.1f} °C",
                "category": "GREEN",
                "reason": temp_reason,
                "safety_action": temp_action,
                "timestamp": now_iso
            })

        statuses["temp"] = {
            "value": temp,
            "status": temp_status,
            "unit": "°C",
            "reason": temp_reason,
            "action": temp_action
        }

        # 3. SpO2 Blood Oxygen
        spo2_status = "NORMAL"
        spo2_reason = "Peripheral oxygen saturation is optimal (95% - 100%)."
        spo2_action = "Pulmonary oxygen exchange verified. Cleared for exercise."

        if spo2 < thresholds["min_spo2_critical"]:
            spo2_status = "CRITICAL"
            spo2_reason = f"Critical hypoxemia: SpO2 is {spo2:.0f}% (< {thresholds['min_spo2_critical']}%), indicating severe desaturation."
            spo2_action = "STOP all physical activity immediately. Sit fully upright in Fowler's position, apply prescribed oxygen, and call emergency services."
            notifications.append({
                "parameter": "SpO2 (Blood Oxygen)",
                "value": f"{spo2:.0f}%",
                "category": "RED",
                "reason": spo2_reason,
                "safety_action": spo2_action,
                "timestamp": now_iso
            })
        elif spo2 < thresholds["min_spo2_warning"]:
            spo2_status = "WARNING"
            spo2_reason = f"Mild oxygen desaturation detected ({spo2:.0f}% < {thresholds['min_spo2_warning']}%)."
            spo2_action = "Pause exercise session. Rest seated, perform deep diaphragmatic breathing, and reassess SpO2 before continuing."
            notifications.append({
                "parameter": "SpO2 (Blood Oxygen)",
                "value": f"{spo2:.0f}%",
                "category": "YELLOW",
                "reason": spo2_reason,
                "safety_action": spo2_action,
                "timestamp": now_iso
            })
        else:
            notifications.append({
                "parameter": "SpO2 (Blood Oxygen)",
                "value": f"{spo2:.0f}%",
                "category": "GREEN",
                "reason": spo2_reason,
                "safety_action": spo2_action,
                "timestamp": now_iso
            })

        statuses["spo2"] = {
            "value": spo2,
            "status": spo2_status,
            "unit": "%",
            "reason": spo2_reason,
            "action": spo2_action
        }

        # 4. Environmental Humidity
        humidity_status = "NORMAL"
        humidity_reason = "Ambient humidity is in the comfortable zone (30% - 60%)."
        humidity_action = "Environmental conditions are favorable for exercise."

        if humidity < 30.0:
            humidity_status = "WARNING"
            humidity_reason = f"Dry ambient air detected ({humidity:.1f}% < 30%). May irritate respiratory mucous membranes."
            humidity_action = "Low humidity advisory: Ensure adequate water hydration before and during exercise."
            notifications.append({
                "parameter": "Environmental Humidity",
                "value": f"{humidity:.1f}%",
                "category": "YELLOW",
                "reason": humidity_reason,
                "safety_action": humidity_action,
                "timestamp": now_iso
            })
        elif humidity > 70.0:
            humidity_status = "WARNING"
            humidity_reason = f"High humidity thermal burden ({humidity:.1f}% > 70%). Severely hinders evaporative sweat cooling."
            humidity_action = "Advisory: Recommend room ventilation or cooling prior to exercise. Take extended rest breaks."
            notifications.append({
                "parameter": "Environmental Humidity",
                "value": f"{humidity:.1f}%",
                "category": "YELLOW",
                "reason": humidity_reason,
                "safety_action": humidity_action,
                "timestamp": now_iso
            })
        elif humidity > 60.0:
            humidity_status = "WARNING"
            humidity_reason = f"Moderate humidity elevation ({humidity:.1f}%)."
            humidity_action = "Ensure gentle room airflow. Take 45s rests between sets."
            notifications.append({
                "parameter": "Environmental Humidity",
                "value": f"{humidity:.1f}%",
                "category": "YELLOW",
                "reason": humidity_reason,
                "safety_action": humidity_action,
                "timestamp": now_iso
            })
        else:
            notifications.append({
                "parameter": "Environmental Humidity",
                "value": f"{humidity:.1f}%",
                "category": "GREEN",
                "reason": humidity_reason,
                "safety_action": humidity_action,
                "timestamp": now_iso
            })

        statuses["humidity"] = {
            "value": humidity,
            "status": humidity_status,
            "unit": "%",
            "reason": humidity_reason,
            "action": humidity_action
        }

        # Vital parameters (HR, Temp, SpO2) govern overall safety
        vital_categories = [
            statuses["hr"]["status"],
            statuses["temp"]["status"],
            statuses["spo2"]["status"]
        ]

        if "CRITICAL" in vital_categories:
            overall_category = "RED"
        elif "WARNING" in vital_categories:
            overall_category = "YELLOW"
        else:
            overall_category = "GREEN"

        return {
            "overall_category": overall_category,
            "statuses": statuses,
            "notifications": notifications,
            "evaluated_at": now_iso
        }

    def generate_recommendation(
        self,
        person: Dict[str, Any],
        current_reading: Optional[Dict[str, Any]] = None,
        recent_sessions: Optional[List[Dict[str, Any]]] = None,
        pre_check_symptoms: Optional[Dict[str, Any]] = None,
        custom_thresholds: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if current_reading is None:
            current_reading = {"hr": 74, "hr_ok": True, "temp": 36.6, "spo2": 98.0, "humidity": 52.0}
        if recent_sessions is None:
            recent_sessions = []
        if pre_check_symptoms is None:
            pre_check_symptoms = {"pain": False, "dizziness": False, "borg": 6}

        hr = float(current_reading.get("hr", 74))
        hr_ok = bool(current_reading.get("hr_ok", True))
        temp = float(current_reading.get("temp", 36.6))
        spo2 = float(current_reading.get("spo2", 98.0))
        humidity = float(current_reading.get("humidity", 52.0))
        idle_s = int(current_reading.get("idle_s", 0))
        risk_band = current_reading.get("risk_band", "green")
        is_simulated = current_reading.get("source") != "HARDWARE_SERIAL"

        has_pain = pre_check_symptoms.get("pain", False)
        has_dizziness = pre_check_symptoms.get("dizziness", False)

        vital_eval = self.evaluate_vitals(
            hr=hr,
            hr_ok=hr_ok,
            temp=temp,
            spo2=spo2,
            humidity=humidity,
            custom_thresholds=custom_thresholds
        )

        overall_cat = vital_eval["overall_category"]
        notifications = vital_eval["notifications"]
        reasons: List[str] = []

        if has_pain or has_dizziness:
            if has_dizziness:
                overall_cat = "RED"
                reasons.append("Dizziness reported; fall prevention requires full seated rest.")
                notifications.insert(0, {
                    "parameter": "Dizziness / Vertigo",
                    "value": "Symptom Reported",
                    "category": "RED",
                    "reason": "Dizziness indicates cerebral hypoperfusion or vestibular instability. Fall risk is critical.",
                    "safety_action": "STOP all standing or seated exercises immediately. Rest head and call caregiver.",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif has_pain:
                if overall_cat != "RED":
                    overall_cat = "YELLOW"
                reasons.append("Active pain reported by patient.")
                notifications.insert(0, {
                    "parameter": "Joint / Muscular Pain",
                    "value": "Symptom Reported",
                    "category": "YELLOW",
                    "reason": "Active pain reported by patient. Exercising through acute joint pain exacerbates inflammation.",
                    "safety_action": "Pause exercise. Apply rest and ice if prescribed, and consult your physiotherapist.",
                    "timestamp": datetime.utcnow().isoformat()
                })

        # Append vital reasons
        if temp >= 38.0:
            reasons.append(f"Fever detected ({temp:.1f} °C). Strenuous exercise is clinically contraindicated.")
        if hr > 115:
            reasons.append(f"Resting heart rate ({hr:.0f} BPM) is significantly elevated.")
        if spo2 < 90:
            reasons.append(f"Critical hypoxemia: SpO2 ({spo2:.0f}%) is dangerously low.")
        elif spo2 < 95:
            reasons.append(f"Mild oxygen desaturation detected ({spo2:.0f}%).")

        conditions_str = person.get("conditions", "").lower()

        # Decision Logic:
        # RED: Critical readings or concerning symptoms -> Stop rehabilitation, display urgent medical instructions.
        # YELLOW: Abnormal readings -> Pause exercise, reassess and display a warning.
        # GREEN: Parameters within prescribed limits -> Display assigned exercise.
        if overall_cat == "RED" or temp >= 38.0 or (hr_ok and hr > 115) or has_pain or has_dizziness or risk_band == "red":
            tier = "contraindicated_rest"
            tier_name = "Restorative Rest & Recovery Only (Medical Stop)"
            can_exercise = False
            advice = (
                "CRITICAL MEDICAL ALERT: Vital parameters have exceeded clinical safety thresholds. "
                "All rehabilitation exercises are strictly halted. Do not attempt exercise. "
                "Sit comfortably, rest calmly, and seek immediate clinical care."
            )
            # Empty list: Do not prescribe exercise as treatment for abnormal vitals!
            prescribed_exercises = []

        elif overall_cat == "YELLOW" or hr > 88 or idle_s > 1800 or risk_band == "amber":
            tier = "gentle_restorative"
            tier_name = "Gentle Seated Mobilization (Caution Protocol)"
            can_exercise = False if overall_cat == "YELLOW" else True
            if hr > 88:
                reasons.append(f"Resting heart rate is slightly elevated ({hr:.0f} BPM). Prescribing low cardiac-workload seated routines.")
            if idle_s > 1800:
                reasons.append(f"Patient has been immobile for {idle_s // 60} mins. Gentle activation needed to prevent stiffness.")
            if "osteoarthritis" in conditions_str or "knee" in conditions_str:
                reasons.append("Patient has knee osteoarthritis: Avoiding deep knee flexion under bodyweight.")

            ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
            ex1["target_sets"] = 2
            ex1["target_reps"] = 8
            ex1["rest_s"] = 45
            ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])
            ex4["target_sets"] = 2
            ex4["target_reps"] = 8
            ex4["rest_s"] = 35

            prescribed_exercises = [ex1, ex4]
            advice = (
                "SAFETY CAUTION: Minor parameter elevation or prolonged stillness detected. "
                "Only low-cardiac seated movements are permitted after vital reassessment."
            )

        else:
            # GREEN: Optimal Physiological State
            tier = "standard_active"
            tier_name = "Active Functional Rehabilitation"
            can_exercise = True
            reasons.append(f"Resting vitals are optimal (Heart rate {hr:.0f} BPM, Temperature {temp:.1f} °C, SpO2 {spo2:.0f}%).")
            reasons.append("Patient is afebrile with zero reported pain.")

            ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
            ex2 = dict(FOUR_CANONICAL_EXERCISES["sit_to_stand"])
            ex3 = dict(FOUR_CANONICAL_EXERCISES["standing_heel_raise"])
            ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])

            if "osteoarthritis" in conditions_str or "knee" in conditions_str:
                ex1["why_selected"] = "Selected as primary exercise: Strengthens quadriceps to offload patellofemoral stress from Ramesh's mild knee osteoarthritis."
                ex2["why_selected"] = "Selected for functional mobility: Performed with controlled knee alignment to maintain chair rise capability without knee valgus."
                ex3["why_selected"] = "Selected for ankle stability: Enhances proprioceptive balance and lower leg venous return."
                ex4["why_selected"] = "Selected for postural balance: Gentle arm elevation maintaining thoracic mobility without spinal flexion."

            prescribed_exercises = [ex1, ex2, ex3, ex4]
            advice = (
                "Vital signs are optimal and verified within personal baseline bounds. "
                "You are cleared to perform your physiotherapist-prescribed routine. "
                "Maintain smooth cadence, breathe steadily, and follow posture guidance."
            )

        summary_sentence = " ".join(reasons) if reasons else advice

        return {
            "tier": tier,
            "tier_name": tier_name,
            "overall_category": overall_cat,
            "can_exercise": can_exercise,
            "is_simulated": is_simulated,
            "clinical_reasoning": reasons,
            "summary_sentence": summary_sentence,
            "statuses": vital_eval["statuses"],
            "notifications": notifications,
            "prescribed_exercises": prescribed_exercises,
            "max_prescribed_hr": 95 if tier == "contraindicated_rest" else 115 if tier == "gentle_restorative" else 125,
            "max_prescribed_borg": 10 if tier == "contraindicated_rest" else 13 if tier == "gentle_restorative" else 15,
            "advice": advice,
            "patient_context": {
                "name": person.get("name", "Ramesh Kumar"),
                "conditions": person.get("conditions", "None"),
                "current_hr": hr,
                "current_temp": temp,
                "current_spo2": spo2,
                "current_humidity": humidity
            },
            "evaluated_at": vital_eval["evaluated_at"]
        }

recommender_engine = ExerciseRecommendationEngine()
