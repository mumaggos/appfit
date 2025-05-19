from src.extensions import db
from sqlalchemy.dialects.mysql import BOOLEAN # For MySQL compatibility if switched later

class DietPlan(db.Model):
    __tablename__ = "diet_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    daily_calories = db.Column(db.Integer)
    daily_protein_g = db.Column(db.Integer)  # Added
    daily_carbs_g = db.Column(db.Integer)    # Added
    daily_fat_g = db.Column(db.Integer)      # Added
    is_active = db.Column(db.Boolean, default=True)

    meals = db.relationship("DietPlanMeal", backref="diet_plan", lazy=True)

    def __repr__(self):
        return f"<DietPlan {self.id} for User {self.user_id}>"

class DietPlanMeal(db.Model):
    __tablename__ = "diet_plan_meals"
    id = db.Column(db.Integer, primary_key=True)
    diet_plan_id = db.Column(db.Integer, db.ForeignKey("diet_plans.id"), nullable=False)
    day_of_week = db.Column(db.Integer)
    meal_name = db.Column(db.String(100))
    description = db.Column(db.Text)
    # Add other fields later

    def __repr__(self):
        return f"<DietPlanMeal {self.id} for Plan {self.diet_plan_id}>"

