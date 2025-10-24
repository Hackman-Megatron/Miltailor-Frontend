import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, User } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { usersService } from '../services/api';
import { User as UserType } from '../types';
import { getStatusColor, formatDate } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import UserForm from '../components/UserForm';
import { StatusBadge } from '../components/StatusBadge';

export const Utilisateurs = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersService.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ message: 'Erreur lors du chargement des utilisateurs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await usersService.delete(id);
      setToast({ message: 'Utilisateur supprimé avec succès', type: 'success' });
      loadUsers();
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleSubmit = async (data: Partial<UserType>) => {
    try {
      await usersService.create(data);
      setToast({ message: 'Utilisateur créé avec succès', type: 'success' });
      setShowModal(false);
      loadUsers();
    } catch (error) {
      setToast({ message: 'Erreur lors de la création de l\'utilisateur', type: 'error' });
      throw error;
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await usersService.update(userId, { statut: newStatus });
      setToast({ message: 'Statut mis à jour avec succès', type: 'success' });
      loadUsers();
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour du statut', type: 'error' });
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel Utilisateur
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-military-600 flex items-center justify-center text-white font-bold">
                            {user.nom_complet.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.nom_complet}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'Super Administrateur' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.telephone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.institution}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          currentStatus={user.statut}
                          availableStatuses={['Actif', 'Désactivé']}
                          onStatusChange={(newStatus) => handleStatusChange(user.id, newStatus)}
                          getStatusColor={getStatusColor}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(user.date_creation)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvel utilisateur"
        size="lg"
      >
        <UserForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};
