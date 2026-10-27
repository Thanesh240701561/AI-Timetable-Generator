import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app

auth_bp = Blueprint('auth', __name__)

SECRET_KEY = "AI_TIMETABLE_SECRET_KEY_SUPER_SECURE_2026_32BYTES"

# Demo User Storage
DEMO_STUDENTS = {
    "STU001": {"student_id": "STU001", "name": "Rahul Sharma", "section": "Section A", "group_id": "G1", "password": "student123"},
    "STU002": {"student_id": "STU002", "name": "Priya Singh", "section": "Section A", "group_id": "G1", "password": "student123"},
    "STU003": {"student_id": "STU003", "name": "Aman Verma", "section": "Section A", "group_id": "G2", "password": "student123"},
    "STU004": {"student_id": "STU004", "name": "Neha Patel", "section": "Section B", "group_id": "G3", "password": "student123"},
    "STU005": {"student_id": "STU005", "name": "Rohan Kumar", "section": "Section B", "group_id": "G3", "password": "student123"},
    "STU006": {"student_id": "STU006", "name": "Ananya Roy", "section": "Section B", "group_id": "G4", "password": "student123"},
    "STU007": {"student_id": "STU007", "name": "Karan Gupta", "section": "Section C", "group_id": "G5", "password": "student123"},
    "STU008": {"student_id": "STU008", "name": "Sneha Rao", "section": "Section C", "group_id": "G6", "password": "student123"},
}

def generate_token(user_data):
    payload = {
        "user_id": user_data["user_id"],
        "name": user_data["name"],
        "role": user_data["role"],
        "section": user_data.get("section", ""),
        "group_id": user_data.get("group_id", ""),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization token is missing."}), 401
        
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.current_user = decoded
        except Exception as e:
            return jsonify({"error": f"Invalid or expired token: {str(e)}"}), 401
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization token is missing."}), 401
        
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if decoded.get("role") != "admin":
                return jsonify({"error": "Admin access required. Unauthorized."}), 403
            request.current_user = decoded
        except Exception as e:
            return jsonify({"error": f"Invalid or expired token: {str(e)}"}), 401
        
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()
    role = str(data.get("role", "admin")).strip().lower()

    if role == "admin":
        if username == "admin" and password == "admin123":
            user_data = {
                "user_id": "admin",
                "name": "System Administrator",
                "role": "admin"
            }
            token = generate_token(user_data)
            return jsonify({
                "message": "Admin login successful",
                "token": token,
                "user": user_data
            })
        else:
            return jsonify({"error": "Invalid Admin credentials. Demo: admin / admin123"}), 401

    elif role == "student":
        student_key = username.upper()
        if student_key in DEMO_STUDENTS:
            stu_info = DEMO_STUDENTS[student_key]
            if password == stu_info["password"]:
                user_data = {
                    "user_id": stu_info["student_id"],
                    "name": stu_info["name"],
                    "role": "student",
                    "section": stu_info["section"],
                    "group_id": stu_info["group_id"]
                }
                token = generate_token(user_data)
                return jsonify({
                    "message": "Student login successful",
                    "token": token,
                    "user": user_data
                })
            else:
                return jsonify({"error": "Invalid Student password. Demo: student123"}), 401
        else:
            return jsonify({"error": f"Student ID '{username}' not found. Try demo ID: STU001"}), 401

    return jsonify({"error": "Invalid role requested."}), 400

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({"message": "Successfully logged out."})

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({"user": request.current_user})
