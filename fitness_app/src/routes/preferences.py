from flask import Blueprint, request, jsonify, session, current_app
from src.models import User, UserPreference
from src.extensions import db
from src.routes.profile import login_required # Reuse login_required decorator
from src.services import plan_service # Import the plan_service for AI suggestions

preferences_bp = Blueprint("preferences", __name__, url_prefix="/api/preferences")

@preferences_bp.route("/", methods=["POST"])
@login_required
def create_or_update_preferences():
    user_id = session["user_id"]
    data = request.get_json()

    preferences = UserPreference.query.filter_by(user_id=user_id).first()

    if not preferences:
        preferences = UserPreference(user_id=user_id)
        db.session.add(preferences)
    
    # Update fields from request data
    preferences.liked_foods = data.get("liked_foods", preferences.liked_foods)
    preferences.disliked_foods = data.get("disliked_foods", preferences.disliked_foods)
    preferences.dietary_restrictions = data.get("dietary_restrictions", preferences.dietary_restrictions)
    preferences.allergies = data.get("allergies", preferences.allergies)
    preferences.preferred_workout_types = data.get("preferred_workout_types", preferences.preferred_workout_types)
    preferences.workout_frequency_preference = data.get("workout_frequency_preference", preferences.workout_frequency_preference)
    preferences.workout_time_preference = data.get("workout_time_preference", preferences.workout_time_preference)
    preferences.fitness_level_self_assessed = data.get("fitness_level_self_assessed", preferences.fitness_level_self_assessed)
    preferences.specific_goals_text = data.get("specific_goals_text", preferences.specific_goals_text)

    try:
        db.session.commit()
        current_app.logger.info(f"User {user_id} preferences updated/created.")
        return jsonify(preferences.to_dict()), 200 # Return 200 for both create and update for simplicity here
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving preferences for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred while saving preferences."}), 500

@preferences_bp.route("/", methods=["GET"])
@login_required
def get_preferences():
    user_id = session["user_id"]
    preferences = UserPreference.query.filter_by(user_id=user_id).first()

    if not preferences:
        # Return a default empty structure to help frontend form rendering
        return jsonify({
            "user_id": user_id,
            "liked_foods": "",
            "disliked_foods": "",
            "dietary_restrictions": "",
            "allergies": "",
            "preferred_workout_types": "",
            "workout_frequency_preference": None,
            "workout_time_preference": "",
            "fitness_level_self_assessed": "",
            "specific_goals_text": "",
            "updated_at": None
        }), 200
    
    return jsonify(preferences.to_dict()), 200

@preferences_bp.route("/suggestions/food", methods=["GET"])
@login_required
def get_food_suggestions():
    user_id = session["user_id"]
    preferences = UserPreference.query.filter_by(user_id=user_id).first()

    if not preferences:
        return jsonify({"suggestions": ["Por favor, preencha as suas preferências alimentares primeiro para receber sugestões personalizadas."]}), 200
    
    # Convert UserPreference object to a dictionary to pass to the service function
    prefs_dict = preferences.to_dict()
    food_suggs = plan_service.generate_ai_food_suggestions(prefs_dict)
    current_app.logger.info(f"Food suggestions generated for user {user_id}.")
    return jsonify({"suggestions": food_suggs}), 200

@preferences_bp.route("/suggestions/workout", methods=["GET"])
@login_required
def get_workout_suggestions():
    user_id = session["user_id"]
    preferences = UserPreference.query.filter_by(user_id=user_id).first()

    if not preferences:
        return jsonify({"suggestions": ["Por favor, preencha as suas preferências de treino primeiro para receber sugestões personalizadas."]}), 200

    prefs_dict = preferences.to_dict()
    workout_suggs = plan_service.generate_ai_workout_suggestions(prefs_dict)
    current_app.logger.info(f"Workout suggestions generated for user {user_id}.")
    return jsonify({"suggestions": workout_suggs}), 200

