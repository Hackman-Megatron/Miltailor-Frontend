import { useEffect, useState } from 'react';
import { Monitor, MapPin, Clock, X } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { authService } from '../services/api';
import { Session } from '../types';
import { formatDate } from '../utils/formatters';
import { Toast } from '../components/Toast';

export const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await authService.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setToast({ message: 'Erreur lors du chargement des sessions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session ?')) return;

    try {
      await authService.endSession(sessionId);
      setToast({ message: 'Session terminée avec succès', type: 'success' });
      loadSessions();
    } catch (error) {
      setToast({ message: 'Erreur lors de la terminaison de la session', type: 'error' });
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expirée';
      case 'logout':
        return 'Déconnectée';
      default:
        return statut;
    }
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Navigateur inconnu';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Navigateur inconnu';
  };

  const activeSessions = sessions.filter(s => s.statut === 'active');
  const inactiveSessions = sessions.filter(s => s.statut !== 'active');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions Actives</h1>
            <p className="text-gray-600 mt-1">Gérer les sessions utilisateurs connectées</p>
          </div>
          <div className="bg-military-100 px-4 py-2 rounded-lg">
            <p className="text-sm text-military-700 font-medium">
              {activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} active{activeSessions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sessions Actives</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune session active</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-green-600" />
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.statut)}`}>
                        {getStatusLabel(session.statut)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEndSession(session.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Terminer la session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{session.nom_complet}</p>
                      <p className="text-xs text-gray-500">{session.email}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{session.ip_address || 'IP inconnue'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Monitor className="w-3 h-3" />
                      <span>{getBrowserInfo(session.user_agent)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Connecté: {formatDate(session.date_connexion)}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Dernière activité: {formatDate(session.derniere_activite)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {inactiveSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des Sessions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navigateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connexion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déconnexion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inactiveSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.nom_complet}</p>
                          <p className="text-xs text-gray-500">{session.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getBrowserInfo(session.user_agent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(session.date_connexion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.date_deconnexion ? formatDate(session.date_deconnexion) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.statut)}`}>
                          {getStatusLabel(session.statut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};
