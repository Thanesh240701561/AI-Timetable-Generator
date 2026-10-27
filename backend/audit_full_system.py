import json
import requests

BASE_URL = "http://localhost:5000/api"

def audit():
    print("=" * 60)
    print("      COMPREHENSIVE END-TO-END SYSTEM VERIFICATION      ")
    print("=" * 60)

    # 1. Admin Authentication
    print("\n[Check 1] Admin Authentication (/login)...")
    res = requests.post(f"{BASE_URL}/login", json={"username": "admin", "password": "admin123", "role": "admin"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin Auth Successful. Token acquired.")

    # 2. Student Authentication
    print("\n[Check 2] Student Authentication (/login)...")
    res = requests.post(f"{BASE_URL}/login", json={"username": "STU001", "password": "student123", "role": "student"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    stu_token = res.json()["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    print(f"  [OK] Student Auth Successful. User: {res.json()['user']['name']} ({res.json()['user']['group_id']})")

    # 3. Excel Validation & Preview
    print("\n[Check 3] Excel Schema & Data Preview...")
    res = requests.post(f"{BASE_URL}/validate-excel", headers=admin_headers)
    assert res.status_code == 200 and res.json()["valid"] == True, "Excel validation failed!"
    print("  [OK] Excel Schema: VALID (0 errors)")

    res_prev = requests.get(f"{BASE_URL}/excel-preview", headers=admin_headers)
    assert res_prev.status_code == 200, "Excel preview failed!"
    sheets = list(res_prev.json()["data"].keys())
    print(f"  [OK] Excel Preview Loaded Sheets: {', '.join(sheets)}")

    # 4. Entity Endpoints
    print("\n[Check 4] Entity Data Endpoints...")
    entities = ['students', 'subjects', 'faculty', 'rooms', 'groups', 'timeslots']
    for entity in entities:
        r = requests.get(f"{BASE_URL}/{entity}", headers=admin_headers)
        assert r.status_code == 200, f"Failed to fetch {entity}"
        print(f"  [OK] Entity '/{entity}': {len(r.json())} items loaded")

    # 5. AI Timetable Generator Execution
    print("\n[Check 5] AI CSP Timetable Generator (/generate-timetable)...")
    res_gen = requests.post(f"{BASE_URL}/generate-timetable", headers=admin_headers)
    assert res_gen.status_code == 200 and res_gen.json()["success"] == True, "Timetable generation failed!"
    stats = res_gen.json()["stats"]
    print(f"  [OK] Solver Output: {stats['assigned_classes']} Classes, {stats['total_entries'] - stats['assigned_classes']} Automatic Breaks, {stats['conflict_count']} Conflicts")

    # 6. Complete & Filtered Timetable Chronological Order
    print("\n[Check 6] Timetable Filtering & Chronological Sorting (Day & Time)...")
    filters = [
        {},
        {"section": "Section A"},
        {"subject": "SUB101"},
        {"faculty": "FAC001"},
        {"room": "ROOM101"},
        {"day": "Monday"}
    ]
    DAY_ORDER = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7}

    for f in filters:
        r = requests.get(f"{BASE_URL}/timetable", headers=admin_headers, params=f)
        assert r.status_code == 200, f"Filter request failed for {f}"
        items = r.json()
        
        # Verify chronological sorting
        prev_key = (0, 0, "")
        sorted_ok = True
        for item in items:
            d_val = DAY_ORDER.get(str(item.get("day", "")).strip(), 99)
            raw_p = str(item.get("period", "")).replace("P", "").strip()
            p_val = int(raw_p) if raw_p.isdigit() else 99
            s_time = str(item.get("start_time", ""))
            curr_key = (d_val, p_val, s_time)
            if curr_key < prev_key:
                sorted_ok = False
                break
            prev_key = curr_key
        
        filter_label = f"Filter {f}" if f else "Full Timetable"
        assert sorted_ok, f"Sorting check failed for {filter_label}"
        print(f"  [OK] {filter_label}: {len(items)} items returned in strict Chronological Order")

    # 7. Student Timetable & Privacy Protection (HTTP 403)
    print("\n[Check 7] Student Timetable & Security (403 Forbidden)...")
    r_own = requests.get(f"{BASE_URL}/timetable/student", headers=stu_headers)
    assert r_own.status_code == 200, "Student own schedule failed!"
    print(f"  [OK] STU001 Schedule: {len(r_own.json()['timetable'])} items")

    r_forbidden = requests.get(f"{BASE_URL}/timetable/student?student_id=STU002", headers=stu_headers)
    assert r_forbidden.status_code == 403, f"Privacy test failed! Expected 403, got {r_forbidden.status_code}"
    print("  [OK] Security Privacy Enforcement: Server returned HTTP 403 Forbidden on unauthorized student query.")

    # 8. Report Status & Excel Export
    print("\n[Check 8] Reports & Excel Export...")
    r_stat = requests.get(f"{BASE_URL}/generation-status", headers=admin_headers)
    assert r_stat.status_code == 200, "Status query failed"
    print(f"  [OK] Generation Status: {r_stat.json()['status']}")

    r_export = requests.get(f"{BASE_URL}/export/excel?type=Complete%20Timetable", headers=admin_headers)
    assert r_export.status_code == 200 and len(r_export.content) > 0, "Excel export failed!"
    print(f"  [OK] Excel Export: {len(r_export.content)} bytes file generated cleanly")

    print("\n" + "=" * 60)
    print("      ALL ENDPOINTS & LOGIC VERIFIED WITH 100% SUCCESS!      ")
    print("=" * 60)

if __name__ == '__main__':
    audit()
