import os
from flask import Blueprint, request, jsonify, send_file, current_app
from services.excel_service import ExcelService
from routes.auth_routes import admin_required

excel_bp = Blueprint('excel', __name__)

@excel_bp.route('/upload-excel', methods=['POST'])
@admin_required
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    if not file.filename.endswith('.xlsx'):
        return jsonify({"error": "Only .xlsx files are supported."}), 400

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, "uploaded_timetable.xlsx")
    file.save(file_path)

    # Validate file
    excel_service = ExcelService(file_path)
    validation_res = excel_service.validate_excel()

    # Save as active file if valid
    if validation_res["valid"]:
        current_app.config['ACTIVE_EXCEL_PATH'] = file_path

    return jsonify({
        "message": "File uploaded successfully",
        "file_name": file.filename,
        "validation": validation_res
    })

@excel_bp.route('/excel-template', methods=['GET'])
def get_template():
    template_path = os.path.join(current_app.config['UPLOAD_FOLDER'], "timetable_template.xlsx")
    ExcelService.generate_sample_workbook(template_path)
    return send_file(template_path, as_attachment=True, download_name="AI_Timetable_Template.xlsx")

@excel_bp.route('/excel-preview', methods=['GET'])
def get_excel_preview():
    active_path = current_app.config.get('ACTIVE_EXCEL_PATH')
    if not active_path or not os.path.exists(active_path):
        # Fallback to sample file
        active_path = os.path.join(current_app.config['SAMPLE_FOLDER'], "sample_timetable.xlsx")

    excel_service = ExcelService(active_path)
    data = excel_service.load_data()

    preview = {}
    for sheet_name, df in data.items():
        # Replace NaN values with empty string or None for JSON compatibility
        records = df.fillna("").to_dict(orient="records")
        preview[sheet_name] = records

    return jsonify({"data": preview, "file_path": active_path})

@excel_bp.route('/validate-excel', methods=['POST'])
@admin_required
def validate_excel():
    active_path = current_app.config.get('ACTIVE_EXCEL_PATH')
    if not active_path or not os.path.exists(active_path):
        active_path = os.path.join(current_app.config['SAMPLE_FOLDER'], "sample_timetable.xlsx")

    excel_service = ExcelService(active_path)
    res = excel_service.validate_excel()
    return jsonify(res)
