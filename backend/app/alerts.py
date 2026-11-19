"""
Notification & Alert Dispatcher
Supports Twilio SMS with automatic fallback to mock logger.
Handles multi-lingual message templates (English & Tamil) and alert hygiene cooldowns.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger("rebuild.alerts")

# Multilingual Alert Templates
ALERT_TEMPLATES = {
    "en": {
        "fall": (
            "🚨 CRITICAL REBUILD ALERT: A potential fall has been detected for {name} with immobility. "
            "Please check on them immediately or call emergency services (112 / 911). "
            "Location: Home chair / monitored area."
        ),
        "fall_candidate": (
            "⚠️ REBUILD NOTICE: High-impact movement detected for {name}. Fall countdown active. Awaiting response."
        ),
        "hr_drift": (
            "⚠️ HEALTH NOTICE: Resting heart rate for {name} has drifted above their normal 7-day baseline: {reason}."
        ),
        "fever": (
            "🌡️ TEMPERATURE ALERT: Elevated core temperature recorded for {name} ({temp:.1f} °C). Please review vitals."
        ),
        "inactivity": (
            "ℹ️ ACTIVITY NOTICE: Prolonged stillness detected for {name} ({idle_min} mins). Movement prompt dispatched."
        ),
        "heat_stress": (
            "☀️ HEAT STRESS WARNING: High cardiac workload and temperature elevation detected for {name}. Prompting rest and hydration."
        ),
        "safe_pause": (
            "🛑 REHABILITATION PAUSE: Exercise session for {name} was safely paused. Reason: {reason}."
        )
    },
    "ta": {
        "fall": (
            "🚨 அவசர எச்சரிக்கை: {name} அவர்கள் கீழே விழுந்திருக்க வாய்ப்புள்ளது. உடனடியாக அவரை தொடர்பு கொள்ளவும் "
            "அல்லது அவசர மருத்துவ உதவிக்கு அழைக்கவும் (112)."
        ),
        "fall_candidate": (
            "⚠️ எச்சரிக்கை: {name} அவர்களுக்கு திடீர் அதிர்வு பதிவாகியுள்ளது. சரிபார்க்கவும்."
        ),
        "hr_drift": (
            "⚠️ உடல்நலக் குறிப்பு: {name} அவர்களின் இதயத் துடிப்பு இயல்பான அளவை விட அதிகரித்துள்ளது: {reason}."
        ),
        "fever": (
            "🌡️ காய்ச்சல் எச்சரிக்கை: {name} அவர்களுக்கு உடல் வெப்பநிலை அதிகமாக உள்ளது ({temp:.1f} °C)."
        ),
        "inactivity": (
            "ℹ️ இயக்கமின்மை: {name} அவர்கள் நீண்ட நேரமாக ஒரே இடத்தில் உள்ளார் ({idle_min} நிமிடங்கள்). உடல் அசைவு நினைவூட்டல் அனுப்பப்பட்டது."
        ),
        "heat_stress": (
            "☀️ வெப்ப அழுத்த எச்சரிக்கை: அதிக இதயத் துடிப்பு மற்றும் உடல் வெப்பம் பதிவாகியுள்ளது. ஓய்வும் தண்ணீரும் அருந்த அறிவுறுத்தப்படுகிறது."
        ),
        "safe_pause": (
            "🛑 உடற்பயிற்சி நிறுத்தம்: பாதுகாப்பு காரணங்களுக்காக {name} அவர்களின் பயிற்சி நிறுத்தப்பட்டது. காரணம்: {reason}."
        )
    }
}

class AlertDispatcher:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        self.from_number = os.getenv("TWILIO_FROM_NUMBER", "").strip()
        self.use_twilio = bool(self.account_sid and self.auth_token and self.from_number)

        # Alert Hygiene Cooldown Tracker: (person_id, alert_type) -> last_dispatched_datetime
        self.cooldown_tracker: Dict[tuple, datetime] = {}
        self.cooldown_seconds = {
            "fall": 60,            # 1 min cooldown for repeat fall
            "hr_drift": 3600,      # 1 hour cooldown for drift
            "fever": 1800,         # 30 min cooldown
            "inactivity": 1800,    # 30 min cooldown
            "heat_stress": 900,    # 15 min cooldown
            "safe_pause": 60       # 1 min cooldown
        }

    def can_dispatch(self, person_id: int, alert_type: str) -> bool:
        key = (person_id, alert_type)
        if key not in self.cooldown_tracker:
            return True
        last_time = self.cooldown_tracker[key]
        cooldown = self.cooldown_seconds.get(alert_type, 300)
        return (datetime.now() - last_time).total_seconds() >= cooldown

    def format_message(
        self,
        alert_type: str,
        person_name: str,
        lang: str = "en",
        **kwargs
    ) -> str:
        lang_key = lang if lang in ALERT_TEMPLATES else "en"
        templates = ALERT_TEMPLATES[lang_key]
        template = templates.get(alert_type, templates["inactivity"])
        return template.format(name=person_name, **kwargs)

    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Sends SMS via Twilio if configured, or logs clearly to console mock.
        """
        if self.use_twilio:
            try:
                from twilio.rest import Client
                client = Client(self.account_sid, self.auth_token)
                msg = client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=to_phone
                )
                logger.info(f"Twilio SMS sent successfully: SID {msg.sid} to {to_phone}")
                return {"success": True, "provider": "twilio", "sid": msg.sid}
            except Exception as e:
                logger.error(f"Twilio SMS failed to send: {e}")
                return {"success": False, "provider": "twilio", "error": str(e)}
        else:
            # Fallback Mock Logger
            print(f"\n==================== [MOCK SMS DISPATCHED] ====================")
            print(f"TO:      {to_phone}")
            print(f"MESSAGE: {message}")
            print(f"TIME:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"===============================================================\n")
            return {
                "success": True,
                "provider": "mock_logger",
                "note": "Twilio keys not configured; dispatched to mock alert log."
            }
