"""
ReBuild Smart Vital Parameter-Based Rehabilitation Recommendation Engine
Complete Automation: Automatically assigns suitable exercise sessions for each parameter.

Canonical Exercises (Strictly the 4 Approved):
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
- GREEN: Parameters within prescribed limits. Auto-assigns full functional active routine.
- YELLOW: Abnormal parameter detected. Auto-assigns parameter-specific protective routine and dispatches warning notification.
- RED: Critical readings or acute symptoms. Medical stop, halts all exercises, dispatches urgent medical instructions.
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
        trigger_parameter = "optimal"

        # 1. Heart Rate
        hr_status = "NORMAL"
        hr_reason = "Within normal resting cardiac range (55-100 BPM)."
        hr_action = "Cardiac reserve cleared for prescribed physical activity."

        if not hr_ok or hr <= 0:
            hr_status = "WARNING"
            hr_reason = "Pulse signal intermittent or sensor displaced."
            hr_action = "Reposition pulse sensor on finger before initiating exercise."
            trigger_parameter = "hr"
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
            hr_reason = f"Severe bradycardia detected ({hr:.0f} BPM < {thresholds['min_hr']} BPM)."
            hr_action = "STOP all activity immediately. Sit comfortably, notify caregiver Anita and seek emergency medical evaluation."
            trigger_parameter = "hr"
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} BPM",
                "category": "RED",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr < 55:
            hr_status = "WARNING"
            hr_reason = f"Borderline low heart rate ({hr:.0f} BPM)."
            hr_action = "Auto-assigning calf muscle pump routine to boost venous return."
            trigger_parameter = "hr_low"
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} BPM",
                "category": "YELLOW",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr > thresholds["max_hr_exercise"]:
            hr_status = "CRITICAL"
            hr_reason = f"Severe tachycardia detected ({hr:.0f} BPM > {thresholds['max_hr_exercise']} BPM ceiling)."
            hr_action = "STOP rehabilitation immediately. Remain seated, breathe slowly, and alert medical personnel."
            trigger_parameter = "hr"
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} BPM",
                "category": "RED",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        elif hr > thresholds["max_hr_resting"]:
            hr_status = "WARNING"
            hr_reason = f"Elevated resting heart rate ({hr:.0f} BPM > {thresholds['max_hr_resting']} BPM)."
            hr_action = "Auto-assigning low-cardiac seated protocol. Pause standing transfers."
            trigger_parameter = "hr_high"
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} BPM",
                "category": "YELLOW",
                "reason": hr_reason,
                "safety_action": hr_action,
                "timestamp": now_iso
            })
        else:
            notifications.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} BPM",
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
            trigger_parameter = "temp"
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
            trigger_parameter = "temp"
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
            temp_action = "Auto-assigning minimal exertion seated protocol to avoid thermal elevation."
            if trigger_parameter == "optimal":
                trigger_parameter = "temp"
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
            if trigger_parameter == "optimal":
                trigger_parameter = "temp"
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
            trigger_parameter = "spo2"
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
            spo2_action = "Auto-assigning gentle thoracic expansion routine. Pause strenuous leg standing."
            if trigger_parameter in ["optimal", "humidity"]:
                trigger_parameter = "spo2"
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
            if trigger_parameter == "optimal":
                trigger_parameter = "humidity"
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
            humidity_action = "Advisory: Recommend room ventilation or cooling. Auto-assigning extended 60s rest intervals."
            if trigger_parameter == "optimal":
                trigger_parameter = "humidity"
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

        # Overall category
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
            "trigger_parameter": trigger_parameter,
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
        trigger_param = vital_eval["trigger_parameter"]
        notifications = vital_eval["notifications"]
        reasons: List[str] = []

        if has_pain or has_dizziness:
            if has_dizziness:
                overall_cat = "RED"
                trigger_param = "dizziness"
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
                trigger_param = "pain"
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

        # =========================================================================
        # AUTOMATED PARAMETER-TO-EXERCISE ASSIGNMENT MATRIX
        # =========================================================================
        prescribed_exercises: List[Dict[str, Any]] = []

        # 1. CRITICAL RED OVERRIDE: Stop rehabilitation, zero exercises!
        if overall_cat == "RED" or temp >= 38.0 or (hr_ok and hr > 115) or has_pain or has_dizziness or risk_band == "red":
            tier = "contraindicated_rest"
            tier_name = "Rehabilitation Contraindicated - Medical Stop"
            can_exercise = False
            advice = (
                "CRITICAL MEDICAL ALERT: Vital parameters have exceeded clinical safety thresholds. "
                "All rehabilitation exercises are strictly halted. Do not attempt exercise. "
                "Sit comfortably, rest calmly, and seek immediate clinical care."
            )
            prescribed_exercises = []

        # 2. PARAMETER-SPECIFIC YELLOW AUTO-ASSIGNMENTS
        elif overall_cat == "YELLOW" or hr > 88 or idle_s > 1800 or risk_band == "amber":
            tier = "gentle_restorative"
            can_exercise = False if overall_cat == "YELLOW" else True

            # Case A: Elevated Heart Rate (Yellow) -> Auto-assign Low-Cardiac Seated Protocol
            if trigger_param in ["hr", "hr_high"] or hr > 88:
                tier_name = "Auto-Assigned: Low-Cardiac Seated Protocol"
                reasons.append(f"Heart rate elevated ({hr:.0f} BPM). Auto-assigned seated routine to eliminate cardiac workload.")
                ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
                ex1["default_sets"] = 2
                ex1["default_reps"] = 8
                ex1["rest_s"] = 45
                ex1["why_selected"] = f"Auto-assigned due to elevated heart rate ({hr:.0f} BPM): Maintains quadriceps activation while seated, avoiding cardiovascular spikes."

                ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])
                ex4["default_sets"] = 2
                ex4["default_reps"] = 8
                ex4["rest_s"] = 40
                ex4["why_selected"] = "Auto-assigned seated arm elevation with low hemodynamic resistance."

                prescribed_exercises = [ex1, ex4]
                advice = f"⚡ Autonomous Adaptation: Heart rate is in YELLOW category ({hr:.0f} BPM). Auto-assigned Low-Cardiac Seated Protocol (Seated Knee Extensions & Shoulder Raises) with 45s rest intervals."

            # Case B: Borderline Low Heart Rate (Yellow) -> Auto-assign Venous Calf Pump Protocol
            elif trigger_param == "hr_low" or (hr < 55 and hr >= 50):
                tier_name = "Auto-Assigned: Venous Return & Calf Pump Protocol"
                reasons.append(f"Heart rate borderline low ({hr:.0f} BPM). Auto-assigned calf muscle pump to stimulate venous return.")
                ex3 = dict(FOUR_CANONICAL_EXERCISES["standing_heel_raise"])
                ex3["default_sets"] = 2
                ex3["default_reps"] = 8
                ex3["rest_s"] = 35
                ex3["why_selected"] = f"Auto-assigned due to low heart rate ({hr:.0f} BPM): Calf contractions compress deep veins to enhance cardiac venous return."

                ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
                ex1["default_sets"] = 2
                ex1["default_reps"] = 8
                ex1["rest_s"] = 30
                ex1["why_selected"] = "Seated knee extensions performed with light cadence."

                prescribed_exercises = [ex3, ex1]
                advice = f"⚡ Autonomous Adaptation: Heart rate is borderline low ({hr:.0f} BPM). Auto-assigned Venous Calf Pump Protocol to stimulate venous circulation."

            # Case C: SpO2 Mild Desaturation (Yellow) -> Auto-assign Thoracic Expansion Protocol
            elif trigger_param == "spo2" or (spo2 < 95 and spo2 >= 90):
                tier_name = "Auto-Assigned: Thoracic Respiratory Expansion Protocol"
                reasons.append(f"SpO2 mild desaturation ({spo2:.0f}%). Auto-assigned gentle thoracic expansion.")
                ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])
                ex4["default_sets"] = 2
                ex4["default_reps"] = 8
                ex4["rest_s"] = 45
                ex4["why_selected"] = f"Auto-assigned due to SpO2 desaturation ({spo2:.0f}%): Coordinated arm elevation expands ribcage and improves alveolar oxygen exchange."

                ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
                ex1["default_sets"] = 1
                ex1["default_reps"] = 8
                ex1["rest_s"] = 45
                ex1["why_selected"] = "Low metabolic demand seated movement to prevent creating an oxygen debt."

                prescribed_exercises = [ex4, ex1]
                advice = f"⚡ Autonomous Adaptation: Blood oxygen in YELLOW category (SpO2 {spo2:.0f}%). Auto-assigned Thoracic Respiratory Expansion Protocol with deep diaphragmatic breathing."

            # Case D: Body Temp Low-Grade Elevation (Yellow) -> Minimal Exertion Protocol
            elif trigger_param == "temp" or (temp >= 37.6 and temp < 38.0):
                tier_name = "Auto-Assigned: Minimal Metabolic Burden Protocol"
                reasons.append(f"Temperature low-grade elevated ({temp:.1f} °C). Auto-assigned minimal exertion.")
                ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
                ex1["default_sets"] = 1
                ex1["default_reps"] = 8
                ex1["rest_s"] = 60
                ex1["why_selected"] = f"Auto-assigned due to temperature ({temp:.1f} °C): Minimal joint mobility preserving range without generating metabolic heat."

                prescribed_exercises = [ex1]
                advice = f"⚡ Autonomous Adaptation: Body temperature in YELLOW category ({temp:.1f} °C). Auto-assigned Minimal Metabolic Protocol with extended 60s rest."

            # Case E: High Humidity (Yellow) -> Extended Rest Protocol
            else:
                tier_name = "Auto-Assigned: Extended Rest Low-Thermal Burden Protocol"
                reasons.append(f"Environmental humidity high ({humidity:.1f}%). Auto-assigned extended recovery intervals.")
                ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
                ex1["default_sets"] = 2
                ex1["default_reps"] = 8
                ex1["rest_s"] = 60
                ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])
                ex4["default_sets"] = 2
                ex4["default_reps"] = 8
                ex4["rest_s"] = 45

                prescribed_exercises = [ex1, ex4]
                advice = f"⚡ Autonomous Adaptation: Ambient humidity is high ({humidity:.1f}%). Auto-assigned Extended Rest Routine to prevent heat accumulation."

        # 3. OPTIMAL GREEN STATE -> Auto-assigns Full Functional Active Protocol
        else:
            tier = "standard_active"
            tier_name = "Auto-Assigned: Full Functional Active Rehabilitation"
            can_exercise = True
            reasons.append(f"Vitals optimal (HR {hr:.0f} BPM, Temp {temp:.1f} °C, SpO2 {spo2:.0f}%, Humidity {humidity:.1f}%).")
            reasons.append("Patient afebrile with zero reported pain.")

            ex1 = dict(FOUR_CANONICAL_EXERCISES["seated_knee_extension"])
            ex2 = dict(FOUR_CANONICAL_EXERCISES["sit_to_stand"])
            ex3 = dict(FOUR_CANONICAL_EXERCISES["standing_heel_raise"])
            ex4 = dict(FOUR_CANONICAL_EXERCISES["shoulder_raise"])

            if "osteoarthritis" in conditions_str or "knee" in conditions_str:
                ex1["why_selected"] = "Selected for knee osteoarthritis: Peri-articular quadriceps strengthening offloading patellar stress."
                ex2["why_selected"] = "Selected for functional mobility: Controlled chair transfers reinforcing independent rising and CDC STEADI fall prevention."
                ex3["why_selected"] = "Selected for calf venous pump: Activates gastrocnemius muscle pump and enhances ankle stability."
                ex4["why_selected"] = "Selected for postural control: Thoracic chest expansion without spinal flexion."

            prescribed_exercises = [ex1, ex2, ex3, ex4]
            advice = "⚡ Autonomous Adaptation: All vital parameters in GREEN category. Auto-assigned Full Functional Active Rehabilitation Protocol (all 4 canonical exercises cleared)."

        summary_sentence = " ".join(reasons) if reasons else advice

        return {
            "tier": tier,
            "tier_name": tier_name,
            "overall_category": overall_cat,
            "trigger_parameter": trigger_param,
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
