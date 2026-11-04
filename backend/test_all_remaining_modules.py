import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def req(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        return {"error": e.code, "body": err}

def main():
    print("=== Testing Remaining Modules (7, 8, 9, 10) ===")

    # 1. Login Bob (Provider)
    bob_login = req("POST", "/auth/login", {"email": "bob@electric.com", "password": "Password123!"})
    assert bob_login.get("success"), f"Bob login failed: {bob_login}"
    bob_token = bob_login["data"]["access_token"]
    print("1. Bob (Provider) logged in.")

    # 2. Module 7: Set Availability
    avail_payload = {
        "schedule": [
            {"day_of_week": 1, "start_time": "09:00", "end_time": "18:00", "is_available": True},
            {"day_of_week": 2, "start_time": "09:00", "end_time": "18:00", "is_available": True},
            {"day_of_week": 3, "start_time": "09:00", "end_time": "18:00", "is_available": True},
            {"day_of_week": 4, "start_time": "09:00", "end_time": "18:00", "is_available": True},
            {"day_of_week": 5, "start_time": "09:00", "end_time": "18:00", "is_available": True},
            {"day_of_week": 6, "start_time": "10:00", "end_time": "15:00", "is_available": True},
        ]
    }
    set_avail = req("PUT", "/providers/me/availability", avail_payload, token=bob_token)
    assert set_avail.get("success"), f"Set avail failed: {set_avail}"
    print(f"2. Availability updated: {len(set_avail['data'])} days configured.")

    # Query public slots for Bob
    slots = req("GET", "/providers/1/slots?date=2026-11-09") # Monday
    assert slots.get("success"), f"Slots query failed: {slots}"
    print(f"2b. Public time slots for provider #1 on 2026-11-09: {len(slots['data'])} slots generated.")

    # 3. Module 8: Technician Management
    tech_payload = {
        "full_name": "Tom Electrician",
        "email": "tom.tech@electric.com",
        "phone": "+919876543999",
        "employee_code": "TECH-001",
        "skills": "Ceiling fans, wiring, circuit breakers",
    }
    add_tech = req("POST", "/providers/me/technicians", tech_payload, token=bob_token)
    if add_tech.get("success"):
        tech_id = add_tech["data"]["user_id"]
        print(f"3. Added technician '{add_tech['data']['full_name']}' (user_id={tech_id}).")
    else:
        print(f"3. Technician status: {add_tech}")

    list_techs = req("GET", "/providers/me/technicians", token=bob_token)
    assert list_techs.get("success"), f"List techs failed: {list_techs}"
    print(f"3b. Provider currently has {len(list_techs['data'])} technician(s).")

    # 4. Module 9: Notifications Check
    notifs = req("GET", "/notifications", token=bob_token)
    assert notifs.get("success"), f"Notifications failed: {notifs}"
    print(f"4. Bob notifications: {len(notifs['data']['items'])} total, {notifs['data']['unread_count']} unread.")

    # 5. Module 10: Public Provider Profile
    prof = req("GET", "/providers/1/profile")
    assert prof.get("success"), f"Profile query failed: {prof}"
    print(f"5. Provider Profile #1: '{prof['data']['business_name']}', rating={prof['data']['average_rating']}, {len(prof['data']['services'])} services, {len(prof['data']['reviews'])} reviews.")

    print("\nALL REMAINING MODULES (7, 8, 9, 10) BACKEND VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
