import React, { useState, useEffect, FormEvent } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface UserPreferencesFormData {
  liked_foods: string;
  disliked_foods: string;
  dietary_restrictions: string;
  allergies: string;
  preferred_workout_types: string;
  workout_frequency_preference: number | string;
  workout_time_preference: string;
  fitness_level_self_assessed: string;
  specific_goals_text: string;
}

interface AISuggestions {
  food: string[];
  workout: string[];
}

const UserPreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferencesFormData>({
    liked_foods: '',
    disliked_foods: '',
    dietary_restrictions: '',
    allergies: '',
    preferred_workout_types: '',
    workout_frequency_preference: '',
    workout_time_preference: '',
    fitness_level_self_assessed: '',
    specific_goals_text: '',
  });
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({ food: [], workout: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get('/preferences/');
        if (response.data && response.status === 200) {
          setPreferences({
            liked_foods: response.data.liked_foods || '',
            disliked_foods: response.data.disliked_foods || '',
            dietary_restrictions: response.data.dietary_restrictions || '',
            allergies: response.data.allergies || '',
            preferred_workout_types: response.data.preferred_workout_types || '',
            workout_frequency_preference: response.data.workout_frequency_preference || '',
            workout_time_preference: response.data.workout_time_preference || '',
            fitness_level_self_assessed: response.data.fitness_level_self_assessed || '',
            specific_goals_text: response.data.specific_goals_text || '',
          });
          // Fetch suggestions after preferences are loaded
          fetchAISuggestions(response.data); 
        }
      } catch (err: any) {
        console.error("Failed to fetch preferences:", err);
        setError(err.response?.data?.error || "Falha ao carregar as preferências.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const fetchAISuggestions = async (currentPrefs?: UserPreferencesFormData) => {
    if (!user) return;
    setIsLoadingSuggestions(true);
    const prefsToUse = currentPrefs || preferences;
    // Only fetch if there's some preference data, or always fetch to get default messages
    // if (Object.values(prefsToUse).some(val => val !== '' && val !== null)) { 
      try {
        const foodResponse = await apiClient.get('/preferences/suggestions/food');
        const workoutResponse = await apiClient.get('/preferences/suggestions/workout');
        setAiSuggestions({
          food: foodResponse.data.suggestions || [],
          workout: workoutResponse.data.suggestions || [],
        });
      } catch (err) {
        console.error("Failed to fetch AI suggestions:", err);
        toast({
          title: "Erro ao Carregar Sugestões",
          description: "Não foi possível carregar as sugestões da IA.",
          variant: "destructive",
        });
      }
    // }
    setIsLoadingSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      ...preferences,
      workout_frequency_preference: preferences.workout_frequency_preference ? parseInt(String(preferences.workout_frequency_preference), 10) : null,
    };

    try {
      const response = await apiClient.post('/preferences/', payload);
      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Preferências Atualizadas!",
          description: "As suas preferências foram guardadas com sucesso.",
        });
        if(response.data){
            setPreferences({
                liked_foods: response.data.liked_foods || '',
                disliked_foods: response.data.disliked_foods || '',
                dietary_restrictions: response.data.dietary_restrictions || '',
                allergies: response.data.allergies || '',
                preferred_workout_types: response.data.preferred_workout_types || '',
                workout_frequency_preference: response.data.workout_frequency_preference || '',
                workout_time_preference: response.data.workout_time_preference || '',
                fitness_level_self_assessed: response.data.fitness_level_self_assessed || '',
                specific_goals_text: response.data.specific_goals_text || '',
            });
            fetchAISuggestions(response.data); // Refresh suggestions after saving
        }
      } else {
        setError(response.data.error || "Falha ao guardar as preferências.");
      }
    } catch (err: any) {
      console.error("Failed to save preferences:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao guardar as preferências.");
      toast({
        title: "Erro ao Guardar Preferências",
        description: err.response?.data?.error || "Não foi possível guardar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">A carregar preferências...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-indigo-600">Minhas Preferências e Sugestões IA</CardTitle>
          <CardDescription>Ajuste as suas preferências para receber sugestões personalizadas da nossa IA (simulada).</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Food Preferences */}
            <section>
              <h3 className="text-xl font-semibold mb-3 text-gray-700 border-b pb-2">Preferências Alimentares</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label htmlFor="liked_foods">Alimentos que Gosta (separados por vírgula)</Label>
                  <Textarea id="liked_foods" name="liked_foods" value={preferences.liked_foods} onChange={handleChange} placeholder="Ex: frango, brócolos, aveia" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="disliked_foods">Alimentos que Não Gosta (separados por vírgula)</Label>
                  <Textarea id="disliked_foods" name="disliked_foods" value={preferences.disliked_foods} onChange={handleChange} placeholder="Ex: peixe, fígado, jiló" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dietary_restrictions">Restrições Alimentares (ex: vegano, sem glúten)</Label>
                  <Input id="dietary_restrictions" name="dietary_restrictions" type="text" value={preferences.dietary_restrictions} onChange={handleChange} placeholder="Ex: vegetariano, sem lactose" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="allergies">Alergias (separadas por vírgula)</Label>
                  <Input id="allergies" name="allergies" type="text" value={preferences.allergies} onChange={handleChange} placeholder="Ex: amendoim, marisco" className="mt-1" />
                </div>
              </div>
            </section>

            {/* Workout Preferences */}
            <section>
              <h3 className="text-xl font-semibold mb-3 text-gray-700 border-b pb-2">Preferências de Treino</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label htmlFor="preferred_workout_types">Tipos de Treino Preferidos (separados por vírgula)</Label>
                  <Input id="preferred_workout_types" name="preferred_workout_types" type="text" value={preferences.preferred_workout_types} onChange={handleChange} placeholder="Ex: força, cardio, yoga" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="workout_frequency_preference">Frequência de Treino (dias/semana)</Label>
                  <Input id="workout_frequency_preference" name="workout_frequency_preference" type="number" value={preferences.workout_frequency_preference} onChange={handleChange} placeholder="Ex: 3" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label htmlFor="workout_time_preference">Horário de Treino Preferido</Label>
                  <Select name="workout_time_preference" value={preferences.workout_time_preference} onValueChange={(value) => handleSelectChange("workout_time_preference", value)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um horário" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualquer">Qualquer</SelectItem>
                      <SelectItem value="manhã">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fitness_level_self_assessed">Nível de Fitness Autoavaliado</Label>
                  <Select name="fitness_level_self_assessed" value={preferences.fitness_level_self_assessed} onValueChange={(value) => handleSelectChange("fitness_level_self_assessed", value)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o seu nível" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermedio">Intermédio</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="specific_goals_text">Objetivos Específicos Adicionais (opcional)</Label>
                <Textarea id="specific_goals_text" name="specific_goals_text" value={preferences.specific_goals_text} onChange={handleChange} placeholder="Ex: correr uma maratona, aumentar força no supino" className="mt-1" />
              </div>
            </section>
            
            <div className="pt-4">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
                {isSaving ? "A guardar..." : "Guardar Preferências"}
              </Button>
            </div>
          </form>

          {/* AI Suggestions Section */}
          <section className="mt-10 pt-6 border-t">
            <h3 className="text-2xl font-semibold mb-4 text-center text-indigo-600">Sugestões da IA para Si</h3>
            {isLoadingSuggestions ? (
              <p className="text-center">A carregar sugestões...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg text-green-600">Sugestões Alimentares</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {aiSuggestions.food.length > 0 ? (
                      aiSuggestions.food.map((sugg, index) => <p key={`food-${index}`} className="text-sm">- {sugg}</p>)
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma sugestão alimentar disponível. Preencha as suas preferências!</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg text-blue-600">Sugestões de Treino</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {aiSuggestions.workout.length > 0 ? (
                      aiSuggestions.workout.map((sugg, index) => <p key={`workout-${index}`} className="text-sm">- {sugg}</p>)
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma sugestão de treino disponível. Preencha as suas preferências!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPreferencesPage;

