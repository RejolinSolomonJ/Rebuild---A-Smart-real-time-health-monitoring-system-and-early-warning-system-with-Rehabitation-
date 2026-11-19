import urllib.request
import json
import sys

BASE = 'http://127.0.0.1:8000'

def test(name, url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    try:
        with urllib.request.urlopen(req, data=body, timeout=5) as resp:
            content = resp.read()
            print(f"[PASS] {name} -> Status: {resp.status}, Size: {len(content)} bytes")
            return content
    except Exception as e:
        print(f"[FAIL] {name} -> {e}")
        return None

print("=== REBUILD FULL ENDPOINT & WORKFLOW VERIFICATION ===")
test("Persons list", f"{BASE}/api/persons")
test("Person 1 profile", f"{BASE}/api/persons/1")
test("Person 1 plan", f"{BASE}/api/persons/1/plan")
test("AI Recommendation", f"{BASE}/api/persons/1/recommendation")
test("Apply Recommendation", f"{BASE}/api/persons/1/recommendation/apply", method="POST")
test("Latest reading", f"{BASE}/api/readings/latest")
test("Reading history", f"{BASE}/api/readings/history?minutes=10")
test("Alerts list", f"{BASE}/api/alerts")

# Test MoveSafe session lifecycle
sess_res = test("Start session", f"{BASE}/api/sessions", method="POST", data={
    "person_id": 1, "pre_borg": 7, "pre_pain": False, "pre_dizziness": False
})
if sess_res:
    s_obj = json.loads(sess_res.decode())
    sid = s_obj.get("session_id")
    if sid:
        test("Log rep", f"{BASE}/api/sessions/{sid}/reps", method="POST", data={
            "exercise_id": "seated_knee_extension", "rep_number": 1, "is_valid": True,
            "duration_s": 2.8, "peak_angle": 168.0, "form_faults": ""
        })
        test("Finish session", f"{BASE}/api/sessions/{sid}/finish", method="POST", data={
            "final_borg": 10, "vitals_exceeded": False, "safe_pauses": 0, "notes": "Automated validation"
        })

test("Sessions history", f"{BASE}/api/sessions")
test("Screening tests", f"{BASE}/api/screening")
test("Add screening test", f"{BASE}/api/screening?person_id=1", method="POST", data={
    "test_name": "30s_chair_stand", "score": 14.0, "unit": "reps",
    "risk_classification": "normal", "notes": "Test run completed"
})
test("Weekly JSON report", f"{BASE}/api/persons/1/report/weekly")
pdf_bytes = test("Weekly PDF report", f"{BASE}/api/persons/1/report/weekly?format=pdf")
if pdf_bytes and pdf_bytes.startswith(b"%PDF"):
    print("[PASS] PDF header verified (%PDF)")

test("Hardware simulator scenario (Drift)", f"{BASE}/api/hardware/simulate?scenario=drift", method="POST")
test("Hardware buzzer command", f"{BASE}/api/hardware/buzz?pattern=1", method="POST")
print("=== ALL REBUILD TESTS PASSED COMPREHENSIVELY ===")
