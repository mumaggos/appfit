from src.extensions import db
from sqlalchemy.dialects.mysql import BOOLEAN # For MySQL compatibility if switched later

class WorkoutPlan(db.Model):
    __tablename__ = "workout_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days_per_week = db.Column(db.Integer)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)

    days = db.relationship("WorkoutPlanDay", backref="workout_plan", lazy=True)

    def __repr__(self):
        return f"<WorkoutPlan {self.id} for User {self.user_id}>"

class WorkoutPlanDay(db.Model):
    __tablename__ = "workout_plan_days"

    id = db.Column(db.Integer, primary_key=True)
    workout_plan_id = db.Column(db.Integer, db.ForeignKey("workout_plans.id"), nullable=False)
    day_of_week = db.Column(db.Integer)
    focus = db.Column(db.String(100))

    exercises = db.relationship("WorkoutExercise", backref="workout_plan_day", lazy=True)

    def __repr__(self):
        return f"<WorkoutPlanDay {self.id} for Plan {self.workout_plan_id}>"

class WorkoutExercise(db.Model):
    __tablename__ = "workout_exercises"

    id = db.Column(db.Integer, primary_key=True)
    workout_plan_day_id = db.Column(db.Integer, db.ForeignKey("workout_plan_days.id"), nullable=False)
    exercise_name = db.Column(db.String(150), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.String(50))
    # Add other fields later

    def __repr__(self):
        return f"<WorkoutExercise {self.id} for Day {self.workout_plan_day_id}>"

