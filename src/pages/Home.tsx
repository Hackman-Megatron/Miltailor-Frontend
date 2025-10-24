import { useNavigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { articlesService } from '../services/api';

export const Home = () => {
  const navigate = useNavigate();
  const [uniformes, setUniformes] = useState<any[]>([]);

  useEffect(() => {
    loadUniformes();
  }, []);

  const loadUniformes = async () => {
    try {
      const response = await articlesService.getAll({ type: 'uniforme_fini', limit: 6 });
      setUniformes(response.data || []);
    } catch (error) {
      setUniformes([
        {
          id: '1',
          nom: 'Tenue Opérationnelle',
          type: 'Camouflée',
          institution: 'Armée',
          disponibilite: 'Disponible',
        },
        {
          id: '2',
          nom: 'Tenue de Cérémonie',
          type: 'Officiers',
          institution: 'Armée',
          disponibilite: 'Disponible',
        },
        {
          id: '3',
          nom: 'Tenue de Service',
          type: 'Tous grades',
          institution: 'Gendarmerie',
          disponibilite: 'Sur commande',
        },
        {
          id: '4',
          nom: 'Tenue Combat',
          type: 'Camouflée',
          institution: 'Armée',
          disponibilite: 'Disponible',
        },
        {
          id: '5',
          nom: 'Tenue Pompiers',
          type: 'Service',
          institution: 'Pompiers',
          disponibilite: 'Disponible',
        },
        {
          id: '6',
          nom: 'Tenue Police',
          type: 'Tous grades',
          institution: 'Police',
          disponibilite: 'Sur commande',
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-military-700 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Atelier Militaire CEFTA</h1>
                <p className="text-sm text-gray-600">Ekounou - Cameroun</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/connexion')}
              className="flex items-center gap-2 px-6 py-2.5 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-military-700 rounded-lg flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Catalogue des Tenues Militaires</h2>
              <p className="text-gray-600">Armée Camerounaise - Guide des uniformes réglementaires</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">À propos du catalogue</h3>
                <p className="text-gray-700 leading-relaxed max-w-3xl">
                  Ce catalogue présente l'ensemble des tenues réglementaires de l'Armée Camerounaise. Chaque tenue est conçue
                  pour répondre à des besoins spécifiques en termes d'opérationnalité, de représentation et de tradition militaire.
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-military-700 mb-1">6</p>
                <p className="text-sm text-gray-600">Types de tenues</p>
                <p className="text-2xl font-bold text-military-700 mt-4">3</p>
                <p className="text-sm text-gray-600">Catégories</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniformes.map((uniforme) => (
            <div
              key={uniforme.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-64 bg-gradient-to-br from-military-700 to-military-500 relative">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/90 text-military-700 text-xs font-semibold rounded-full">
                    {uniforme.type || 'Tous grades'}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-20 h-20 text-white/30" />
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-military-800/80 text-white text-xs font-medium rounded">
                    {uniforme.institution || uniforme.categorie}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{uniforme.nom}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Disponibilité</span>
                  <span className={`text-sm font-semibold ${
                    uniforme.disponibilite === 'Disponible' || uniforme.statut === 'Normal'
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}>
                    {uniforme.disponibilite || (uniforme.statut === 'Normal' ? 'Disponible' : 'Sur commande')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-military-700 text-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-military-200">© 2025 Atelier Militaire CEFTA - Gestion de Stock</p>
            <p className="text-sm text-military-300 mt-2">Ekounou, Cameroun</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
