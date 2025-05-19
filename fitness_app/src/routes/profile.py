from flask import Blueprint, request, jsonify, session
from src.models.user import User
from src.models.profile import UserProfile
from src.extensions import db
from functools import wraps

profile_bp = Blueprint("profile", __name__)

# Decorator to ensure user is logged in
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@profile_bp.route("/", methods=["POST"])
@login_required
def create_or_update_profile():
    user_id = session["user_id"]
    data = request.get_json()

    profile = UserProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        # Create new profile if it doesn't exist
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    # Update fields if they are in the request data
    profile.full_name = data.get("full_name", profile.full_name)
    profile.age = data.get("age", profile.age)
    profile.gender = data.get("gender", profile.gender)
    profile.height_cm = data.get("height_cm", profile.height_cm)
    profile.weight_kg = data.get("weight_kg", profile.weight_kg)
    profile.activity_level = data.get("activity_level", profile.activity_level)
    profile.goal = data.get("goal", profile.goal)

    try:
        db.session.commit()
        return jsonify(profile.to_dict()), 200 if profile.id else 201 # 200 for update, 201 for create
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@profile_bp.route("/", methods=["GET"])
@login_required
def get_profile():
    user_id = session["user_id"]
    profile = UserProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    
    return jsonify(profile.to_dict()), 200

