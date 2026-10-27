import os
from flask import Blueprint, request, jsonify, current_app
from services.excel_service import ExcelService
from services.timetable_generator import TimetableGenerator
from routes.auth_routes import token_required, admin_required

timetable_bp = Blueprint('timetable', __name__)

DAY_ORDER = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
    "Sunday": 7
}

def sort_timetable_chronologically(entries):
    """
    Sorts timetable entries strictly by Day (Monday -> Sunday) and Period/Time (Period 1 -> 6).
    """
    def sort_key(item):
        d_val = DAY_ORDER.get(str(item.get("day", "")).strip(), 99)
        raw_p = str(item.get("period", "")).replace("P", "").strip()
        p_val = int(raw_p) if raw_p.isdigit() else 99
        s_time = str(item.get("start_time", ""))
        return (d_val, p_val, s_time)

    return sorted(entries, key=sort_key)

def get_active_data():
    active_path = current_app.config.get('ACTIVE_EXCEL_PATH')
    if not active_path or not os.path.exists(active_path):
        active_path = os.path.join(current_app.config['SAMPLE_FOLDER'], "sample_timetable.xlsx")
    excel_service = ExcelService(active_path)
    return excel_service.load_data()

@timetable_bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    data = get_active_data()
    df = data.get("Students")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/subjects', methods=['GET'])
@token_required
def get_subjects():
    data = get_active_data()
    df = data.get("Subjects")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/faculty', methods=['GET'])
@token_required
def get_faculty():
    data = get_active_data()
    df = data.get("Faculty")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/rooms', methods=['GET'])
@token_required
def get_rooms():
    data = get_active_data()
    df = data.get("Rooms")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/groups', methods=['GET'])
@token_required
def get_groups():
    data = get_active_data()
    df = data.get("TeacherGroups")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/timeslots', methods=['GET'])
@token_required
def get_timeslots():
    data = get_active_data()
    df = data.get("TimeSlots")
    return jsonify(df.fillna("").to_dict(orient="records") if not df.empty else [])

@timetable_bp.route('/generate-timetable', methods=['POST'])
@admin_required
def generate_timetable():
    data = get_active_data()
    generator = TimetableGenerator(data)
    result = generator.generate()

    current_app.config['GENERATED_TIMETABLE'] = result["timetable"]
    current_app.config['LAST_GENERATION_RESULT'] = result

    return jsonify(result)

@timetable_bp.route('/regenerate-timetable', methods=['POST'])
@admin_required
def regenerate_timetable():
    return generate_timetable()

@timetable_bp.route('/timetable', methods=['GET'])
@token_required
def get_full_timetable():
    timetable = current_app.config.get('GENERATED_TIMETABLE')
    if timetable is None:
        data = get_active_data()
        generator = TimetableGenerator(data)
        res = generator.generate()
        timetable = res["timetable"]
        current_app.config['GENERATED_TIMETABLE'] = timetable
        current_app.config['LAST_GENERATION_RESULT'] = res

    section_filter = request.args.get("section")
    group_filter = request.args.get("group")
    subject_filter = request.args.get("subject")
    faculty_filter = request.args.get("faculty")
    room_filter = request.args.get("room")
    day_filter = request.args.get("day")
    period_filter = request.args.get("period")

    filtered = list(timetable)
    if section_filter:
        filtered = [x for x in filtered if x.get("section") == section_filter]
    if group_filter:
        filtered = [x for x in filtered if x.get("group_id") == group_filter]
    if subject_filter:
        filtered = [x for x in filtered if x.get("subject_id") == subject_filter or x.get("subject_code") == subject_filter]
    if faculty_filter:
        filtered = [x for x in filtered if x.get("faculty_id") == faculty_filter]
    if room_filter:
        filtered = [x for x in filtered if x.get("room_id") == room_filter]
    if day_filter:
        filtered = [x for x in filtered if x.get("day") == day_filter]
    if period_filter:
        filtered = [x for x in filtered if str(x.get("period")) == str(period_filter)]

    sorted_results = sort_timetable_chronologically(filtered)
    return jsonify(sorted_results)

@timetable_bp.route('/timetable/student', methods=['GET'])
@token_required
def get_student_timetable():
    user = request.current_user

    requested_stu_id = request.args.get("student_id")
    if user.get("role") == "student" and requested_stu_id and requested_stu_id != user.get("user_id"):
        return jsonify({"error": "Forbidden: You are not authorized to view another student's timetable."}), 403

    student_id = user.get("user_id") if user.get("role") == "student" else (requested_stu_id or "STU001")

    data = get_active_data()
    students_df = data.get("Students")
    
    student_info = None
    if not students_df.empty:
        stu_match = students_df[students_df["student_id"].astype(str) == str(student_id)]
        if not stu_match.empty:
            student_info = stu_match.iloc[0].to_dict()

    if not student_info:
        student_info = {
            "student_id": student_id,
            "student_name": user.get("name", "Student"),
            "section": user.get("section", "Section A"),
            "group_id": user.get("group_id", "G1")
        }

    group_id = str(student_info.get("group_id", "G1"))

    timetable = current_app.config.get('GENERATED_TIMETABLE')
    if timetable is None:
        generator = TimetableGenerator(data)
        res = generator.generate()
        timetable = res["timetable"]
        current_app.config['GENERATED_TIMETABLE'] = timetable
        current_app.config['LAST_GENERATION_RESULT'] = res

    student_entries = [entry for entry in timetable if str(entry.get("group_id")) == group_id]
    sorted_student_entries = sort_timetable_chronologically(student_entries)

    return jsonify({
        "student": student_info,
        "timetable": sorted_student_entries
    })

@timetable_bp.route('/timetable/group', methods=['GET'])
@token_required
def get_group_timetable():
    group_id = request.args.get("group_id", "G1")
    timetable = current_app.config.get('GENERATED_TIMETABLE')
    if timetable is None:
        data = get_active_data()
        generator = TimetableGenerator(data)
        res = generator.generate()
        timetable = res["timetable"]
        current_app.config['GENERATED_TIMETABLE'] = timetable

    group_entries = [entry for entry in timetable if str(entry.get("group_id")) == str(group_id)]
    sorted_group_entries = sort_timetable_chronologically(group_entries)
    return jsonify(sorted_group_entries)

@timetable_bp.route('/timetable/section', methods=['GET'])
@token_required
def get_section_timetable():
    section = request.args.get("section", "Section A")
    timetable = current_app.config.get('GENERATED_TIMETABLE')
    if timetable is None:
        data = get_active_data()
        generator = TimetableGenerator(data)
        res = generator.generate()
        timetable = res["timetable"]
        current_app.config['GENERATED_TIMETABLE'] = timetable

    section_entries = [entry for entry in timetable if str(entry.get("section")) == str(section)]
    sorted_section_entries = sort_timetable_chronologically(section_entries)
    return jsonify(sorted_section_entries)
