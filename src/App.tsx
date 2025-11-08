import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Stocks } from './pages/Stocks';
import { Mouvements } from './pages/Mouvements';
import { Commandes } from './pages/Commandes';
import { Rapports } from './pages/Rapports';
import { Utilisateurs } from './pages/Utilisateurs';
import { FournisseursClients } from './pages/FournisseursClients';
import { Historique } from './pages/Historique';
import { Sessions } from './pages/Sessions';

// Composant pour gérer le loader uniquement sur les routes protégées
function InitializationLoader({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { checkAuth, restoreSession } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (token && refreshToken) {
          await checkAuth();
        } else if (refreshToken) {
          await restoreSession();
        }
      } catch (err) {
        console.error("Erreur d'authentification :", err);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkAuth, restoreSession]);

  // Les routes publiques (/ et /connexion) ne nécessitent pas d'attendre l'initialisation
  const isPublicRoute = location.pathname === '/' || location.pathname === '/connexion';

  if (!isInitialized && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <InitializationLoader>
        <Routes>
          {/* ✅ Route principale - redirige vers dashboard si authentifié, sinon home */}
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />

          {/* ✅ Routes protégées */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stocks"
            element={
              <ProtectedRoute>
                <Stocks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mouvements"
            element={
              <ProtectedRoute>
                <Mouvements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/commandes"
            element={
              <ProtectedRoute allowedRoles={['Administrateur', 'Super Administrateur']}>
                <Commandes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rapports"
            element={
              <ProtectedRoute allowedRoles={['Super Administrateur']}>
                <Rapports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/utilisateurs"
            element={
              <ProtectedRoute allowedRoles={['Super Administrateur']}>
                <Utilisateurs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/fournisseurs-clients"
            element={
              <ProtectedRoute>
                <FournisseursClients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historique"
            element={
              <ProtectedRoute allowedRoles={['Super Administrateur']}>
                <Historique />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute allowedRoles={['Super Administrateur']}>
                <Sessions />
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InitializationLoader>
    </BrowserRouter>
  );
}

export default App;