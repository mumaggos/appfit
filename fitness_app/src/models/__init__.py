# This file makes the 'models' directory a Python package
# and can be used to conveniently import all models.

from .user import User
from .profile import UserProfile
from .diet import DietPlan, DietPlanMeal
from .workout import WorkoutPlan, WorkoutPlanDay, WorkoutExercise
from .preferences import UserPreference

__all__ = [
    "User",
    "UserProfile",
    "DietPlan",
    "DietPlanMeal",
    "WorkoutPlan",
    "WorkoutPlanDay",
    "WorkoutExercise",
    "UserPreference",
]

