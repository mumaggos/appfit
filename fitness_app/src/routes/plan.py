# src/routes/plan.py
from flask import Blueprint, jsonify, session, current_app
from src.models import User, UserProfile, DietPlan, DietPlanMeal, WorkoutPlan, WorkoutPlanDay, WorkoutExercise
from src.extensions import db
from src.services import plan_service
from src.routes.profile import login_required
from datetime import date, timedelta

plan_bp = Blueprint("plan", __name__)

@plan_bp.route("/generate", methods=["POST"]) 
@login_required
def generate_plan():
    user_id = session["user_id"]
    profile = UserProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"error": "User profile not found. Please complete your profile first."}), 404

    required_fields_map = {
        "gender": profile.gender,
        "weight_kg": profile.weight_kg,
        "height_cm": profile.height_cm,
        "age": profile.age,
        "activity_level": profile.activity_level,
        "goal": profile.goal
    }
    missing_fields = [name for name, value in required_fields_map.items() if not value]
    if missing_fields:
        return jsonify({"error": f"Missing profile information: {', '.join(missing_fields)}. Please complete your profile."}), 400

    try:
        bmr = plan_service.calculate_bmr(profile.gender, profile.weight_kg, profile.height_cm, profile.age)
        activity_multiplier = plan_service.get_activity_multiplier(profile.activity_level)
        tdee = plan_service.calculate_tdee(bmr, activity_multiplier)
        target_calories = plan_service.adjust_calories_for_goal(tdee, profile.goal)
        macros = plan_service.calculate_macronutrients(target_calories, profile.goal)

        # Deactivate existing active plans
        DietPlan.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})
        WorkoutPlan.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})

        # Create Diet Plan
        new_diet_plan = DietPlan(
            user_id=user_id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            daily_calories=macros["target_calories"],
            daily_protein_g=macros["protein_g"],
            daily_carbs_g=macros["carbs_g"],
            daily_fat_g=macros["fat_g"],
            is_active=True
        )
        db.session.add(new_diet_plan)
        db.session.flush() # Flush to get new_diet_plan.id for meal association

        sample_daily_meals = plan_service.generate_sample_daily_meals(macros["target_calories"], macros)
        # For a 30-day plan, we can repeat the weekly sample or generate more variety.
        # For now, let's assume a 7-day cycle for meals and save one week's worth.
        for day_num in range(1, 8): # 1=Monday, 7=Sunday
            for meal_data in sample_daily_meals:
                db_meal = DietPlanMeal(
                    diet_plan_id=new_diet_plan.id,
                    day_of_week=day_num, # Store for each day of the week
                    meal_name=meal_data["meal_name"],
                    description=meal_data["description"],
                    calories=meal_data["calories"],
                    protein_g=meal_data["protein_g"],
                    carbs_g=meal_data["carbs_g"],
                    fat_g=meal_data["fat_g"],
                    suggested_time=meal_data["suggested_time"]
                )
                db.session.add(db_meal)
        current_app.logger.info(f"User {user_id} New Diet Plan ID: {new_diet_plan.id} with sample meals created.")

        # Create Workout Plan
        days_per_week_preference = 4 # Could be a user preference later
        sample_workout_days = plan_service.generate_sample_workout_plan(profile.activity_level, profile.goal, days_per_week_preference)
        
        new_workout_plan = WorkoutPlan(
            user_id=user_id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            days_per_week=days_per_week_preference,
            description=f"Plano de treino para {profile.goal.lower()} com foco em {profile.activity_level.lower()} atividade.",
            is_active=True
        )
        db.session.add(new_workout_plan)
        db.session.flush() # Flush to get new_workout_plan.id

        for workout_day_data in sample_workout_days:
            wp_day = WorkoutPlanDay(
                workout_plan_id=new_workout_plan.id,
                day_of_week=workout_day_data["day_of_week"],
                focus=workout_day_data["focus"]
            )
            db.session.add(wp_day)
            db.session.flush() # Flush to get wp_day.id

            for exercise_data in workout_day_data["exercises"]:
                wp_exercise = WorkoutExercise(
                    workout_plan_day_id=wp_day.id,
                    exercise_name=exercise_data["exercise_name"],
                    sets=exercise_data["sets"],
                    reps=exercise_data["reps"]
                )
                db.session.add(wp_exercise)
        current_app.logger.info(f"User {user_id} New Workout Plan ID: {new_workout_plan.id} with sample exercises created.")

        db.session.commit()

        return jsonify({
            "message": "Diet and Workout plans generated successfully.",
            "diet_plan_id": new_diet_plan.id,
            "workout_plan_id": new_workout_plan.id,
            "tdee": round(tdee, 2),
            "target_calories": macros["target_calories"],
            "macronutrients": macros
        }), 201

    except ValueError as ve:
        current_app.logger.error(f"ValueError for user {user_id}: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Exception for user {user_id}: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred."}), 500

@plan_bp.route("/diet/current", methods=["GET"])
@login_required
def get_current_diet_plan():
    user_id = session["user_id"]
    diet_plan = DietPlan.query.filter_by(user_id=user_id, is_active=True).first()
    if not diet_plan:
        return jsonify({"message": "No active diet plan found."}), 404

    meals_query = DietPlanMeal.query.filter_by(diet_plan_id=diet_plan.id).order_by(DietPlanMeal.day_of_week, DietPlanMeal.suggested_time).all()
    meals_by_day = {day: [] for day in range(1, 8)}
    for meal in meals_query:
        meals_by_day[meal.day_of_week].append({
            "meal_name": meal.meal_name,
            "description": meal.description,
            "calories": meal.calories,
            "protein_g": meal.protein_g,
            "carbs_g": meal.carbs_g,
            "fat_g": meal.fat_g,
            "suggested_time": meal.suggested_time
        })

    return jsonify({
        "id": diet_plan.id,
        "start_date": diet_plan.start_date.isoformat(),
        "end_date": diet_plan.end_date.isoformat(),
        "daily_calories": diet_plan.daily_calories,
        "daily_protein_g": diet_plan.daily_protein_g,
        "daily_carbs_g": diet_plan.daily_carbs_g,
        "daily_fat_g": diet_plan.daily_fat_g,
        "meals_by_day": meals_by_day
    }), 200

@plan_bp.route("/workout/current", methods=["GET"])
@login_required
def get_current_workout_plan():
    user_id = session["user_id"]
    workout_plan = WorkoutPlan.query.filter_by(user_id=user_id, is_active=True).first()
    if not workout_plan:
        return jsonify({"message": "No active workout plan found."}), 404

    days_query = WorkoutPlanDay.query.filter_by(workout_plan_id=workout_plan.id).order_by(WorkoutPlanDay.day_of_week).all()
    plan_days_data = []
    for day in days_query:
        exercises_query = WorkoutExercise.query.filter_by(workout_plan_day_id=day.id).all()
        exercises_data = [{
            "exercise_name": ex.exercise_name,
            "sets": ex.sets,
            "reps": ex.reps
        } for ex in exercises_query]
        plan_days_data.append({
            "day_of_week": day.day_of_week,
            "focus": day.focus,
            "exercises": exercises_data
        })

    return jsonify({
        "id": workout_plan.id,
        "start_date": workout_plan.start_date.isoformat(),
        "end_date": workout_plan.end_date.isoformat(),
        "days_per_week": workout_plan.days_per_week,
        "description": workout_plan.description,
        "plan_days": plan_days_data
    }), 200

