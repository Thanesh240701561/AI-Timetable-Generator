import json
from app import app

def run_tests():
    print("==================================================")
    print("RUNNING FULL SYSTEM INTEGRATION VERIFICATION SUITE")
    print("==================================================")

    client = app.test_client()

    # 1. Admin Login Verification
    print("\n[Step 1] Testing Admin Login...")
    res = client.post('/api/login', json={"username": "admin", "password": "admin123", "role": "admin"})
    print("  -> HTTP Status Code:", res.status_code)
    assert res.status_code == 200, "Admin login failed!"
    admin_data = res.get_json()
    admin_token = admin_data["token"]
    print("  -> Result: Admin authenticated successfully. JWT Token acquired.")

    # 2. Student Login Verification
    print("\n[Step 2] Testing Student Login (STU001)...")
    res = client.post('/api/login', json={"username": "STU001", "password": "student123", "role": "student"})
    print("  -> HTTP Status Code:", res.status_code)
    assert res.status_code == 200, "Student login failed!"
    stu_data = res.get_json()
    stu_token = stu_data["token"]
    print(f"  -> Result: Student '{stu_data['user']['name']}' (Group {stu_data['user']['group_id']}) authenticated successfully.")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # 3. Excel Data & Schema Validation
    print("\n[Step 3] Validating Excel Data Workbook...")
    res = client.post('/api/validate-excel', headers=admin_headers)
    val_data = res.get_json()
    print("  -> HTTP Status Code:", res.status_code)
    print("  -> Schema Validation Status:", "VALID" if val_data.get("valid") else "INVALID")
    print("  -> Errors Count:", len(val_data.get("errors", [])))
    print("  -> Warnings Count:", len(val_data.get("warnings", [])))
    assert val_data.get("valid") == True, "Excel validation failed!"

    # 4. Trigger AI Constraint Satisfaction Solver (CSP)
    print("\n[Step 4] Executing AI CSP Timetable Solver...")
    res = client.post('/api/generate-timetable', headers=admin_headers)
    print("  -> HTTP Status Code:", res.status_code)
    gen_data = res.get_json()
    print("  -> Solver Message:", gen_data.get("message"))
    print("  -> Solver Stats:", json.dumps(gen_data.get("stats"), indent=2))
    assert gen_data.get("success") == True, "Timetable generation failed!"
    timetable = gen_data.get("timetable", [])
    assert len(timetable) > 0, "Generated timetable is empty!"

    # 5. Group-Wise Parallel Scheduling & Automatic Breaks Check
    print("\n[Step 5] Verifying Group-Wise Parallel Schedules & Automatic Breaks...")
    class_entries = [t for t in timetable if t.get("status") == "Class"]
    break_entries = [t for t in timetable if t.get("status") == "Break"]
    print(f"  -> Total Generated Grid Entries: {len(timetable)}")
    print(f"  -> Scheduled Class Periods: {len(class_entries)}")
    print(f"  -> Automatic Break Periods: {len(break_entries)}")
    assert len(class_entries) > 0, "No classes were scheduled!"
    assert len(break_entries) > 0, "No automatic breaks were generated!"

    # 6. Student Privacy Protection Verification
    print("\n[Step 6] Verifying Student Timetable Privacy & Security...")
    # Fetch own timetable as STU001
    res_own = client.get('/api/timetable/student', headers=stu_headers)
    print("  -> STU001 requesting own timetable HTTP Status:", res_own.status_code)
    assert res_own.status_code == 200, "Student failed to fetch own timetable!"
    stu_tt = res_own.get_json().get("timetable", [])
    stu_classes = [t for t in stu_tt if t.get("status") == "Class"]
    print(f"  -> STU001 Schedule: {len(stu_tt)} total slots ({len(stu_classes)} classes, {len(stu_tt)-len(stu_classes)} breaks across week)")

    # Attempt unauthorized request: STU001 attempting to fetch STU002's timetable
    res_forbidden = client.get('/api/timetable/student?student_id=STU002', headers=stu_headers)
    print("  -> STU001 attempting unauthorized query for STU002 HTTP Status:", res_forbidden.status_code)
    assert res_forbidden.status_code == 403, f"Privacy violation! Expected 403 Forbidden, got {res_forbidden.status_code}"
    print("  -> Privacy Security Verified: Server returned HTTP 403 Forbidden on unauthorized student access.")

    # 8. Filter & Chronological Sorting Verification
    print("\n[Step 8] Verifying Filter Results Chronological Sorting (Day & Time)...")
    res_filtered = client.get('/api/timetable?section=Section%20A', headers=admin_headers)
    print("  -> Filtered Section A HTTP Status Code:", res_filtered.status_code)
    filtered_data = res_filtered.get_json()
    assert res_filtered.status_code == 200, "Filtered timetable request failed!"

    DAY_ORDER = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7}
    prev_sort_key = (0, 0, "")
    is_sorted = True
    for item in filtered_data:
        d_val = DAY_ORDER.get(str(item.get("day", "")).strip(), 99)
        raw_p = str(item.get("period", "")).replace("P", "").strip()
        p_val = int(raw_p) if raw_p.isdigit() else 99
        s_time = str(item.get("start_time", ""))
        curr_sort_key = (d_val, p_val, s_time)
        if curr_sort_key < prev_sort_key:
            is_sorted = False
            break
        prev_sort_key = curr_sort_key

    print(f"  -> Filtered Results Count: {len(filtered_data)}")
    print(f"  -> Chronological Order Check (Day & Time): {'PASSED' if is_sorted else 'FAILED'}")
    assert is_sorted, "Filtered timetable results are not chronologically sorted by day and period/time!"

    print("\n==================================================")
    print("ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS! ")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
