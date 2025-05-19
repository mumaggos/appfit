import React, { useEffect, useState } from 'react';
import apiClient from '../services/api'; // Corrected path
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components for styling
import AdvertisementBanner from './AdvertisementBanner'; // Import AdvertisementBanner

interface Meal {
  meal_name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  suggested_time: string;
}

interface DietPlanData {
  id: number;
  start_date: string;
  end_date: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  meals_by_day: Record<string, Meal[]>; 
}

interface Exercise {
  exercise_name: string;
  sets: number | string;
  reps: string;
}

interface WorkoutPlanDay {
  day_of_week: number;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutPlanData {
  id: number;
  start_date: string;
  end_date: string;
  days_per_week: number;
  description: string;
  plan_days: WorkoutPlanDay[];
}

const Dashboard: React.FC = () => {
  const [dietPlan, setDietPlan] = useState<DietPlanData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dietResponse = await apiClient.get("/plan/diet/current");
      if (dietResponse.data && dietResponse.status === 200) {
        setDietPlan(dietResponse.data);
      } else if (dietResponse.status === 404) {
        setDietPlan(null); 
      }

      const workoutResponse = await apiClient.get("/plan/workout/current");
      if (workoutResponse.data && workoutResponse.status === 200) {
        setWorkoutPlan(workoutResponse.data);
      } else if (workoutResponse.status === 404) {
        setWorkoutPlan(null); 
      }

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      if (err.response && err.response.status === 401) {
        setError("Autenticação necessária. Por favor, faça login novamente.");
      } else {
        setError("Falha ao carregar os dados do dashboard.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateNewPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/plan/generate");
      if (response.status === 201) {
        fetchDashboardData();
        alert("Novo plano gerado com sucesso!");
      } else {
        setError(response.data.error || "Falha ao gerar novo plano.");
      }
    } catch (err: any) {
      console.error("Error generating new plan:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao gerar o novo plano.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">A carregar dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">Erro: {error}</div>;
  }

  const getDayName = (dayNumber: number | string) => {
    const num = typeof dayNumber === 'string' ? parseInt(dayNumber, 10) : dayNumber;
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    // Assuming backend day_of_week is 1 (Monday) to 7 (Sunday) or similar
    // Adjust if backend uses 0-6 where 0 is Sunday or Monday
    // For a 1-7 (Mon-Sun) system, (num - 1 + 7) % 7 could map to 0-6 (Mon-Sun if Monday is 0)
    // Or simply adjust the array: const days = ["Segunda-feira", ..., "Domingo"]; if day 1 is Monday
    // Let's assume a 0-6 (Sun-Sat) or 1-7 (Sun-Sat) mapping for simplicity with modulo
    return days[num % 7]; 
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">O Meu Painel Fitness</h1>

      <div className="text-center mb-8">
        <Button onClick={handleGenerateNewPlan} disabled={isLoading} size="lg" className="bg-green-600 hover:bg-green-700">
          {isLoading ? "A gerar..." : "Gerar Novo Plano Mensal"}
        </Button>
      </div>

      {/* Advertisement Banner - Top */}
      <AdvertisementBanner placementArea="dashboard_top" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Diet Plan Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-green-700">Plano de Dieta Atual</CardTitle>
          </CardHeader>
          <CardContent>
            {dietPlan ? (
              <div className="space-y-3">
                <p><strong>Calorias Diárias:</strong> {dietPlan.daily_calories} kcal</p>
                <p><strong>Proteínas:</strong> {dietPlan.daily_protein_g}g | <strong>Carboidratos:</strong> {dietPlan.daily_carbs_g}g | <strong>Gorduras:</strong> {dietPlan.daily_fat_g}g</p>
                <p className="text-sm text-gray-500">Plano válido de {new Date(dietPlan.start_date).toLocaleDateString()} até {new Date(dietPlan.end_date).toLocaleDateString()}</p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">Refeições da Semana:</h3>
                {Object.entries(dietPlan.meals_by_day).map(([day, meals]) => (
                  (meals && meals.length > 0) && (
                    <div key={day} className="mb-3 p-3 border rounded-md bg-gray-50">
                      <h4 className="font-semibold text-md text-gray-700">{getDayName(day)}</h4>
                      {meals.map((meal, index) => (
                        <div key={index} className="ml-2 mt-1 pb-1 border-b last:border-b-0">
                          <p><strong>{meal.meal_name} ({meal.suggested_time}):</strong> {meal.description}</p>
                          <p className="text-xs">Cal: {meal.calories}, P: {meal.protein_g}g, C: {meal.carbs_g}g, F: {meal.fat_g}g</p>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum plano de dieta ativo encontrado. Gere um novo plano!</p>
            )}
          </CardContent>
        </Card>

        {/* Workout Plan Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-blue-700">Plano de Treino Atual</CardTitle>
          </CardHeader>
          <CardContent>
            {workoutPlan ? (
              <div className="space-y-3">
                <p>{workoutPlan.description}</p>
                <p><strong>Dias por semana:</strong> {workoutPlan.days_per_week}</p>
                <p className="text-sm text-gray-500">Plano válido de {new Date(workoutPlan.start_date).toLocaleDateString()} até {new Date(workoutPlan.end_date).toLocaleDateString()}</p>

                <h3 className="text-xl font-medium mt-4 mb-2">Treinos da Semana:</h3>
                {workoutPlan.plan_days.map((day, index) => (
                  <div key={index} className="mb-3 p-3 border rounded-md bg-gray-50">
                    <h4 className="font-semibold text-md text-gray-700">{getDayName(day.day_of_week)} - Foco: {day.focus}</h4>
                    <ul className="list-disc ml-6 mt-1 space-y-1 text-sm">
                      {day.exercises.map((exercise, exIndex) => (
                        <li key={exIndex}>{exercise.exercise_name}: {exercise.sets} séries x {exercise.reps} reps</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum plano de treino ativo encontrado. Gere um novo plano!</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Advertisement Banner - Bottom */}
      <AdvertisementBanner placementArea="dashboard_bottom" className="mt-8" />

    </div>
  );
};

export default Dashboard;

