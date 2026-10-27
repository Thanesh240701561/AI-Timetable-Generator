import os
from flask import Flask
from flask_cors import CORS
from services.excel_service import ExcelService
from routes.auth_routes import auth_bp
from routes.excel_routes import excel_bp
from routes.timetable_routes import timetable_bp
from routes.report_routes import report_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
SAMPLE_FOLDER = os.path.join(BASE_DIR, "sample_data")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SAMPLE_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SAMPLE_FOLDER'] = SAMPLE_FOLDER
app.config['SECRET_KEY'] = "AI_TIMETABLE_SECRET_KEY_SUPER_SECURE_2026_32BYTES"
app.config['ACTIVE_EXCEL_PATH'] = os.path.join(SAMPLE_FOLDER, "sample_timetable.xlsx")
app.config['GENERATED_TIMETABLE'] = None
app.config['LAST_GENERATION_RESULT'] = None

# Initialize Sample Workbook if not exists
sample_path = os.path.join(SAMPLE_FOLDER, "sample_timetable.xlsx")
if not os.path.exists(sample_path):
    ExcelService.generate_sample_workbook(sample_path)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(excel_bp, url_prefix='/api')
app.register_blueprint(timetable_bp, url_prefix='/api')
app.register_blueprint(report_bp, url_prefix='/api')

@app.route('/')
def home():
    return {"status": "AI Timetable Generator API is running", "version": "1.0.0"}

if __name__ == '__main__':
    print("Starting AI Timetable Generator Backend Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
