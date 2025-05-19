# src/services/plan_service.py
import random

# --- Funções de Cálculo de BMR, TDEE, Calorias e Macros (sem alterações) ---

def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
    """Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation."""
    if not all([gender, isinstance(weight_kg, (int, float)), isinstance(height_cm, (int, float)), isinstance(age, int)]):
        raise ValueError("Invalid input for BMR calculation: gender, weight, height, and age must be provided and be of correct types.")
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        raise ValueError("Weight, height, and age must be positive values for BMR calculation.")

    if gender.lower() == "masculino":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    elif gender.lower() == "feminino":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    else:
        raise ValueError("Gender must be 'masculino' or 'feminino' for BMR calculation.")
    return bmr

def get_activity_multiplier(activity_level: str) -> float:
    """Returns activity multiplier based on activity level."""
    if not activity_level:
        raise ValueError("Activity level must be provided.")
    
    activity_level = activity_level.lower()
    multipliers = {
        "sedentario": 1.2,
        "leve": 1.375,
        "moderado": 1.55,
        "intenso": 1.725,
    }
    if activity_level not in multipliers:
        raise ValueError(f"Invalid activity level: {activity_level}. Choose from {list(multipliers.keys())}")
    return multipliers[activity_level]

def calculate_tdee(bmr: float, activity_multiplier: float) -> float:
    """Calculates Total Daily Energy Expenditure (TDEE)."""
    if bmr <= 0 or activity_multiplier <= 0:
        raise ValueError("BMR and activity multiplier must be positive for TDEE calculation.")
    return bmr * activity_multiplier

def adjust_calories_for_goal(tdee: float, goal: str) -> float:
    """Adjusts daily calories based on the user's goal."""
    if tdee <= 0:
        raise ValueError("TDEE must be positive for goal adjustment.")
    if not goal:
        raise ValueError("Goal must be provided.")

    goal = goal.lower()
    calorie_adjustment = 0
    if goal == "emagrecer":
        calorie_adjustment = -500
    elif goal == "ganhar_massa":
        calorie_adjustment = 300
    elif goal == "manter":
        calorie_adjustment = 0
    else:
        raise ValueError(f"Invalid goal: {goal}. Choose from 'emagrecer', 'manter', 'ganhar_massa'.")
    
    adjusted_calories = tdee + calorie_adjustment
    return max(adjusted_calories, 1200)

def calculate_macronutrients(total_calories: float, goal: str) -> dict:
    """Calculates macronutrient split (protein, carbs, fat) in grams."""
    if total_calories <= 0:
        raise ValueError("Total calories must be positive for macronutrient calculation.")
    if not goal:
        raise ValueError("Goal must be provided for macronutrient calculation.")

    goal = goal.lower()
    if goal == "emagrecer":
        protein_percentage = 0.40
        carb_percentage = 0.30
        fat_percentage = 0.30
    elif goal == "ganhar_massa":
        protein_percentage = 0.30
        carb_percentage = 0.50
        fat_percentage = 0.20
    elif goal == "manter":
        protein_percentage = 0.30
        carb_percentage = 0.40
        fat_percentage = 0.30
    else:
        raise ValueError(f"Invalid goal for macronutrient calculation: {goal}")

    protein_calories = total_calories * protein_percentage
    carb_calories = total_calories * carb_percentage
    fat_calories = total_calories * fat_percentage

    protein_grams = round(protein_calories / 4)
    carb_grams = round(carb_calories / 4)
    fat_grams = round(fat_calories / 9)

    return {
        "protein_g": protein_grams,
        "carbs_g": carb_grams,
        "fat_g": fat_grams,
        "target_calories": round(total_calories)
    }

# --- Funções de Geração de Planos de Exemplo (sem alterações) ---

def generate_sample_daily_meals(target_calories: int, macros: dict) -> list[dict]:
    meal_types = [
        {"name": "Pequeno-almoço", "calorie_ratio": 0.25, "time": "08:00"},
        {"name": "Lanche da manhã", "calorie_ratio": 0.10, "time": "10:30"},
        {"name": "Almoço", "calorie_ratio": 0.30, "time": "13:00"},
        {"name": "Lanche da tarde", "calorie_ratio": 0.10, "time": "16:00"},
        {"name": "Jantar", "calorie_ratio": 0.25, "time": "19:30"}
    ]
    daily_meals_data = []
    for meal_type in meal_types:
        meal_calories = round(target_calories * meal_type["calorie_ratio"])
        meal_protein_g = round(macros["protein_g"] * meal_type["calorie_ratio"])
        meal_carbs_g = round(macros["carbs_g"] * meal_type["calorie_ratio"])
        meal_fat_g = round(macros["fat_g"] * meal_type["calorie_ratio"])
        daily_meals_data.append({
            "meal_name": meal_type["name"],
            "description": f"Exemplo de {meal_type['name'].lower()} com aproximadamente {meal_calories} kcal.",
            "calories": meal_calories,
            "protein_g": meal_protein_g,
            "carbs_g": meal_carbs_g,
            "fat_g": meal_fat_g,
            "suggested_time": meal_type["time"]
        })
    return daily_meals_data

def generate_sample_workout_plan(activity_level: str, goal: str, days_per_week: int = 4) -> list[dict]:
    if days_per_week not in [4, 5]: days_per_week = 4
    workout_days = []
    focus_options_strength = ["Peito e Tríceps", "Costas e Bíceps", "Pernas e Ombros", "Corpo Inteiro", "Descanso Ativo/Cardio"]
    focus_options_general = ["Treino de Força A", "Treino de Força B", "Treino de Força C", "Cardio e Core", "Descanso Ativo"]
    selected_focus_options = random.sample(focus_options_strength if goal == "ganhar_massa" else focus_options_general, days_per_week)
    training_schedule = [1, 2, 4, 5] if days_per_week == 4 else [1, 2, 3, 5, 6]
    for i in range(days_per_week):
        day_focus = selected_focus_options[i]
        day_data = {"day_of_week": training_schedule[i], "focus": day_focus, "exercises": []}
        if "Peito" in day_focus: day_data["exercises"].extend([{"exercise_name": "Supino Reto", "sets": 3, "reps": "8-12"}, {"exercise_name": "Crucifixo Inclinado", "sets": 3, "reps": "10-15"}, {"exercise_name": "Flexões", "sets": 3, "reps": "Até à falha"}])
        elif "Costas" in day_focus: day_data["exercises"].extend([{"exercise_name": "Barra Fixa (ou Puxada Alta)", "sets": 3, "reps": "6-10"}, {"exercise_name": "Remada Curvada", "sets": 3, "reps": "8-12"}, {"exercise_name": "Hiperextensão Lombar", "sets": 3, "reps": "12-15"}])
        elif "Pernas" in day_focus: day_data["exercises"].extend([{"exercise_name": "Agachamento Livre", "sets": 4, "reps": "8-12"}, {"exercise_name": "Leg Press", "sets": 3, "reps": "10-15"}, {"exercise_name": "Extensora", "sets": 3, "reps": "12-15"}, {"exercise_name": "Flexora", "sets": 3, "reps": "12-15"}])
        else: day_data["exercises"].extend([{"exercise_name": "Corrida Leve (Esteira)", "sets": 1, "reps": "20-30 min"}, {"exercise_name": "Prancha Abdominal", "sets": 3, "reps": "30-60 seg"}, {"exercise_name": "Bicicleta Ergométrica", "sets": 1, "reps": "15-20 min"}])
        workout_days.append(day_data)
    return workout_days

# --- NOVA Função para Sugestões de IA (Simulada) ---

def generate_ai_food_suggestions(preferences: dict) -> list[str]:
    """Gera sugestões de variações alimentares com base nas preferências (simulado)."""
    suggestions = []
    liked_foods = preferences.get("liked_foods", "").lower().split(',') if preferences.get("liked_foods") else []
    disliked_foods = preferences.get("disliked_foods", "").lower().split(',') if preferences.get("disliked_foods") else []
    dietary_restrictions = preferences.get("dietary_restrictions", "").lower()

    if "frango" in liked_foods and "peixe" not in disliked_foods:
        suggestions.append("Ótimo que gosta de frango! Para variar, que tal salmão grelhado ou bacalhau assado como fontes de proteína magra?")
    elif "frango" in disliked_foods:
        suggestions.append("Se não gosta de frango, pode optar por peru, tofu grelhado, ou lentilhas para as suas refeições proteicas.")
    
    if "arroz" in liked_foods:
        suggestions.append("O arroz é uma boa fonte de carboidratos. Experimente variar com quinoa, batata doce ou massa integral.")

    if "vegetariano" in dietary_restrictions or "vegan" in dietary_restrictions:
        suggestions.append("Para a sua dieta vegetariana/vegana, explore receitas com grão de bico, feijão preto, edamame e uma variedade de vegetais coloridos.")
    elif "sem glúten" in dietary_restrictions or "gluten-free" in dietary_restrictions:
        suggestions.append("Para opções sem glúten, além de arroz e batata, considere tapioca, pão de queijo (se não houver restrição a laticínios) ou pães feitos com farinhas sem glúten.")

    if not suggestions:
        suggestions.append("Para receber sugestões mais personalizadas, preencha detalhadamente as suas preferências alimentares!")
        suggestions.append("Experimente adicionar um novo vegetal colorido ao seu prato todos os dias para mais nutrientes.")

    return random.sample(suggestions, k=min(len(suggestions), 2)) # Retorna até 2 sugestões aleatórias

def generate_ai_workout_suggestions(preferences: dict) -> list[str]:
    """Gera sugestões de variações de treino com base nas preferências (simulado)."""
    suggestions = []
    preferred_workouts = preferences.get("preferred_workout_types", "").lower().split(',') if preferences.get("preferred_workout_types") else []
    
    if "força" in preferred_workouts or "strength" in preferred_workouts:
        suggestions.append("Para o seu treino de força, lembre-se de variar os exercícios para cada grupo muscular a cada 4-6 semanas para continuar a progredir.")
        suggestions.append("Considere adicionar exercícios compostos como agachamento, levantamento terra e supino, pois trabalham múltiplos grupos musculares.")
    
    if "cardio" in preferred_workouts:
        suggestions.append("Para variar o seu cardio, alterne entre corrida, bicicleta, elíptico ou natação. HIIT (Treino Intervalado de Alta Intensidade) também é uma ótima opção para queimar calorias.")
    
    if "yoga" in preferred_workouts or "pilates" in preferred_workouts:
        suggestions.append("Excelente escolha! Yoga e Pilates são ótimos para flexibilidade, força do core e bem-estar mental. Tente uma nova postura ou sequência esta semana.")

    if preferences.get("workout_time_preference") == "manhã":
        suggestions.append("Treinar de manhã é ótimo para começar o dia com energia! Não se esqueça de um bom aquecimento.")
    
    if not suggestions:
        suggestions.append("Para sugestões de treino mais personalizadas, indique os seus tipos de treino favoritos e horários.")
        suggestions.append("Lembre-se da importância do descanso e da recuperação para evitar lesões e otimizar os resultados.")

    return random.sample(suggestions, k=min(len(suggestions), 2)) # Retorna até 2 sugestões aleatórias

