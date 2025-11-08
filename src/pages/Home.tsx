import { useNavigate } from 'react-router-dom';
import { LogIn, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { articlesService } from '../services/api';
import { uniformImages } from '../utils/images-catalogue';
import { useAuthStore } from '../store/authStore';

export const Home = () => {
  const navigate = useNavigate();
  const [uniformes, setUniformes] = useState<any[]>([]);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadUniformes();
    // Rediriger automatiquement vers le dashboard si l'utilisateur est authentifié
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // NOTE: Cette page ne s'affiche que si l'utilisateur n'est pas authentifié
  // Les utilisateurs authentifiés sont automatiquement redirigés vers le dashboard

  const loadUniformes = async () => {
    try {
      const response = await articlesService.getAll({ type: 'uniforme_fini', limit: 6 });
      setUniformes(response.data || []);
    } catch (error) {
      setUniformes([
        { id: '1', nom: 'Tenue Opérationnelle', type: 'Camouflée', institution: 'Armée', disponibilite: 'Disponible' },
        { id: '2', nom: 'Tenue de Cérémonie', type: 'Officiers', institution: 'Armée', disponibilite: 'Disponible' },
        { id: '3', nom: 'Tenue de Service', type: 'Tous grades', institution: 'Gendarmerie', disponibilite: 'Sur commande' },
        { id: '4', nom: 'Tenue Combat', type: 'Camouflée', institution: 'Armée', disponibilite: 'Disponible' },
        { id: '5', nom: 'Tenue Pompiers', type: 'Service', institution: 'Pompiers', disponibilite: 'Disponible' },
        { id: '6', nom: 'Tenue Police', type: 'Tous grades', institution: 'Police', disponibilite: 'Sur commande' },
      ]);
    }
  };

  const handleLoginClick = () => {
    if (isAuthenticated && user) {
      // Si l'utilisateur est déjà authentifié, rediriger vers le dashboard
      navigate('/dashboard');
    } else {
      // Sinon, rediriger vers la page de connexion
      navigate('/connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Atelier Militaire CEFTA</h1>
          <button
            onClick={handleLoginClick}
            className="flex items-center gap-2 px-6 py-2.5 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors font-medium"
          >
            <LogIn className="w-4 h-4" />
            {isAuthenticated ? 'Accéder au Dashboard' : 'Se connecter'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Présentation catalogue */}
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
            </div>
          </div>
        </div>
        {/* Grids d'images normalisées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniformes.map((uniforme) => (
            <div key={uniforme.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              {uniformImages[uniforme.id] && (
                <img
                  src={uniformImages[uniforme.id]}
                  alt={uniforme.nom}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{uniforme.nom}</h3>
                <p className="text-sm text-gray-600 mb-2">{uniforme.type} - {uniforme.institution}</p>
                <span className={`text-sm font-semibold ${
                  uniforme.disponibilite === 'Disponible' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {uniforme.disponibilite}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};