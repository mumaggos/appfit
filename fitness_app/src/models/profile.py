from src.extensions import db
from datetime import datetime

class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)  # e.g., 'masculino', 'feminino', 'outro'
    height_cm = db.Column(db.Integer, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)
    activity_level = db.Column(db.String(50), nullable=True)  # e.g., 'sedentario', 'leve', 'moderado', 'intenso'
    goal = db.Column(db.String(50), nullable=True)  # e.g., 'emagrecer', 'manter', 'ganhar_massa'
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<UserProfile {self.user_id}>"

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "age": self.age,
            "gender": self.gender,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "activity_level": self.activity_level,
            "goal": self.goal,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

