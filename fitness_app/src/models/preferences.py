from src.extensions import db
from datetime import datetime

class UserPreference(db.Model):
    __tablename__ = "user_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    
    # Preferências Alimentares
    liked_foods = db.Column(db.Text, nullable=True)  # Comma-separated or JSON string
    disliked_foods = db.Column(db.Text, nullable=True) # Comma-separated or JSON string
    dietary_restrictions = db.Column(db.Text, nullable=True) # e.g., vegan, gluten-free, lactose intolerant
    allergies = db.Column(db.Text, nullable=True) # Comma-separated or JSON string

    # Preferências de Treino
    preferred_workout_types = db.Column(db.Text, nullable=True) # e.g., strength, cardio, HIIT, yoga
    # disliked_workout_types = db.Column(db.Text, nullable=True)
    workout_frequency_preference = db.Column(db.Integer, nullable=True) # Days per week
    workout_time_preference = db.Column(db.String(50), nullable=True) # e.g., morning, afternoon, evening
    fitness_level_self_assessed = db.Column(db.String(50), nullable=True) # Beginner, Intermediate, Advanced (can complement activity_level from profile)
    specific_goals_text = db.Column(db.Text, nullable=True) # More detailed goals beyond the main one

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to User (optional, if needed for direct access from User model)
    # user = db.relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreference {self.user_id}>"

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "liked_foods": self.liked_foods,
            "disliked_foods": self.disliked_foods,
            "dietary_restrictions": self.dietary_restrictions,
            "allergies": self.allergies,
            "preferred_workout_types": self.preferred_workout_types,
            "workout_frequency_preference": self.workout_frequency_preference,
            "workout_time_preference": self.workout_time_preference,
            "fitness_level_self_assessed": self.fitness_level_self_assessed,
            "specific_goals_text": self.specific_goals_text,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

