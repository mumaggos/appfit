import React, { useState, useEffect, FormEvent } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface UserProfileData {
  full_name: string;
  age: number | string; // Allow string for input, convert to number on save
  gender: string;
  height_cm: number | string;
  weight_kg: number | string;
  activity_level: string;
  goal: string;
}

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData>({
    full_name: '',
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    activity_level: '',
    goal: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get('/profile/');
        if (response.data && response.status === 200) {
          setProfileData({
            full_name: response.data.full_name || '',
            age: response.data.age || '',
            gender: response.data.gender || '',
            height_cm: response.data.height_cm || '',
            weight_kg: response.data.weight_kg || '',
            activity_level: response.data.activity_level || '',
            goal: response.data.goal || '',
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError(err.response?.data?.error || "Falha ao carregar o perfil.");
        toast({
          title: "Erro ao Carregar Perfil",
          description: err.response?.data?.error || "Não foi possível carregar os dados do seu perfil.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      ...profileData,
      age: profileData.age ? parseInt(String(profileData.age), 10) : undefined,
      height_cm: profileData.height_cm ? parseInt(String(profileData.height_cm), 10) : undefined,
      weight_kg: profileData.weight_kg ? parseFloat(String(profileData.weight_kg)) : undefined,
    };

    try {
      const response = await apiClient.post('/profile/', payload);
      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Perfil Atualizado!",
          description: "Os seus dados de perfil foram guardados com sucesso.",
        });
        // Optionally re-fetch or update state if backend returns the updated profile
        if(response.data){
             setProfileData({
                full_name: response.data.full_name || '',
                age: response.data.age || '',
                gender: response.data.gender || '',
                height_cm: response.data.height_cm || '',
                weight_kg: response.data.weight_kg || '',
                activity_level: response.data.activity_level || '',
                goal: response.data.goal || '',
            });
        }
      } else {
        setError(response.data.error || "Falha ao guardar o perfil.");
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao guardar o perfil.");
      toast({
        title: "Erro ao Guardar Perfil",
        description: err.response?.data?.error || "Não foi possível guardar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">A carregar perfil...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-600">O Seu Perfil Fitness</CardTitle>
          <CardDescription>Mantenha os seus dados atualizados para receber planos personalizados.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input id="full_name" name="full_name" type="text" value={profileData.full_name} onChange={handleChange} placeholder="Seu nome completo" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input id="age" name="age" type="number" value={profileData.age} onChange={handleChange} placeholder="Sua idade" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select name="gender" value={profileData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o seu sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="height_cm">Altura (cm)</Label>
                <Input id="height_cm" name="height_cm" type="number" value={profileData.height_cm} onChange={handleChange} placeholder="Sua altura em cm" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input id="weight_kg" name="weight_kg" type="number" step="0.1" value={profileData.weight_kg} onChange={handleChange} placeholder="Seu peso em kg" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="activity_level">Nível de Atividade Física</Label>
                <Select name="activity_level" value={profileData.activity_level} onValueChange={(value) => handleSelectChange("activity_level", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o nível de atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário (pouco ou nenhum exercício)</SelectItem>
                    <SelectItem value="leve">Leve (exercício leve 1-3 dias/semana)</SelectItem>
                    <SelectItem value="moderado">Moderado (exercício moderado 3-5 dias/semana)</SelectItem>
                    <SelectItem value="intenso">Intenso (exercício intenso 6-7 dias/semana)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
                <Label htmlFor="goal">Objetivo Principal</Label>
                <Select name="goal" value={profileData.goal} onValueChange={(value) => handleSelectChange("goal", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecer">Emagrecer</SelectItem>
                    <SelectItem value="manter">Manter Peso</SelectItem>
                    <SelectItem value="ganhar_massa">Ganhar Massa Muscular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="col-span-1 md:col-span-2 pt-4">
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSaving}>
                {isSaving ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;

