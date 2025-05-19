from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.sql import func # Import func for server_default

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now()) # Use func.now() for server-side default
    is_admin = db.Column(db.Boolean, nullable=False, default=False) # New admin field

    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")
    diet_plans = db.relationship('DietPlan', backref='user', lazy=True, cascade="all, delete-orphan")
    workout_plans = db.relationship('WorkoutPlan', backref='user', lazy=True, cascade="all, delete-orphan")
    # Corrected relationship for UserPreference, assuming one-to-one or one-to-many if multiple preference sets were allowed (here one-to-one)
    preferences = db.relationship('UserPreference', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username} (Admin: {self.is_admin})>'

    def to_dict(self): # Added a to_dict method for easier serialization if needed
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

