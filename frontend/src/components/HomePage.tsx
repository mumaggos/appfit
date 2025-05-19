import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-128px)] bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center p-6 text-white">
      <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-xl rounded-lg p-10 md:p-16 max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6">
          Transforme Seu Corpo, Eleve Sua Vida!
        </h1>
        <p className="text-lg sm:text-xl text-gray-100 mb-10">
          Receba uma dieta e plano de treino mensal totalmente personalizado com base nos seus dados. Alcance seus objetivos de fitness com orientação especializada e acompanhamento contínuo.
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-6">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 text-lg">
              Comece Já Gratuitamente
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-500 font-semibold px-8 py-3 text-lg">
              Já Tenho Conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

