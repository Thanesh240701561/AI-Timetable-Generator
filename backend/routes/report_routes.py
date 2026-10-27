import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from services.export_service import ExportService
from routes.auth_routes import token_required

report_bp = Blueprint('report', __name__)

@report_bp.route('/conflicts', methods=['GET'])
@token_required
def get_conflicts():
    last_res = current_app.config.get('LAST_GENERATION_RESULT') or {}
    conflicts = last_res.get('conflicts', [])
    return jsonify(conflicts)

@report_bp.route('/generation-status', methods=['GET'])
@token_required
def get_generation_status():
    last_res = current_app.config.get('LAST_GENERATION_RESULT') or {}
    stats = last_res.get('stats', {
        "total_tasks": 0,
        "assigned_classes": 0,
        "total_entries": 0,
        "unassigned_count": 0,
        "conflict_count": 0
    })
    
    status_str = "Generated" if current_app.config.get('GENERATED_TIMETABLE') is not None else "Not Generated"
    
    return jsonify({
        "status": status_str,
        "last_generation_time": current_app.config.get('LAST_GEN_TIME', datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        "stats": stats,
        "message": last_res.get('message', "Ready to generate.")
    })

@report_bp.route('/export/excel', methods=['GET'])
@token_required
def export_excel():
    timetable = current_app.config.get('GENERATED_TIMETABLE', [])
    last_res = current_app.config.get('LAST_GENERATION_RESULT') or {}
    conflicts = last_res.get('conflicts', [])

    export_type = request.args.get("type", "Complete Timetable")
    excel_stream = ExportService.export_timetable_excel(timetable, export_type, conflicts)

    return send_file(
        excel_stream,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"AI_Timetable_Export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )
