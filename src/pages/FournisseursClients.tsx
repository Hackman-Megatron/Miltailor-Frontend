import { useEffect, useState } from 'react';
import { Search, Plus, Mail, Phone, MapPin, Edit2, Trash2, Building2 } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fournisseursService } from '../services/api';
import { Fournisseur } from '../types';
import { formatDate } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { FournisseurForm } from '../components/FournisseurForm';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/authStore';

export const FournisseursClients = () => {
  const { user } = useAuthStore();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);

  const isSuperAdmin = user?.role === 'Super Administrateur';
  const isAdmin = user?.role === 'Administrateur';

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      setLoading(true); // Ajouter ceci au début
      const response = await fournisseursService.getAll();
      // response.data contient {success: true, data: [...]}
      if (response.data && Array.isArray(response.data.data)) {
        setFournisseurs(response.data.data);
      } else {
        console.error('Unexpected response structure:', response.data);
        setFournisseurs([]);
      }
    } catch (error) {
      console.error('Error loading fournisseurs:', error);
      setFournisseurs([]);
    } finally {
      setLoading(false); // ⚠️ AJOUTER CECI
    }
  };

  const handleCreate = () => {
    setSelectedFournisseur(undefined);
    setShowForm(true);
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowForm(true);
  };

  const handleSubmit = async (data: Partial<Fournisseur>) => {
    try {
      if (selectedFournisseur) {
        await fournisseursService.update(selectedFournisseur.id, data);
        setToast({ message: 'Fournisseur mis à jour avec succès', type: 'success' });
      } else {
        await fournisseursService.create(data);
        setToast({ message: 'Fournisseur créé avec succès', type: 'success' });
      }
      setShowForm(false);
      loadFournisseurs();
    } catch (error: any) {
      console.error('Error saving fournisseur:', error);
      setToast({
        message: error.response?.data?.message || 'Erreur lors de l\'enregistrement',
        type: 'error'
      });
    }
  };

  const handleDeleteClick = (fournisseur: Fournisseur) => {
    setFournisseurToDelete(fournisseur);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fournisseurToDelete) return;

    try {
      await fournisseursService.delete(fournisseurToDelete.id);
      setToast({ message: 'Fournisseur supprimé avec succès', type: 'success' });
      setShowDeleteModal(false);
      setFournisseurToDelete(null);
      loadFournisseurs();
    } catch (error: any) {
      console.error('Error deleting fournisseur:', error);
      setToast({
        message: error.response?.data?.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const filteredFournisseurs = fournisseurs.filter((fournisseur) => {
    const matchesSearch =
      fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fournisseur.telephone && fournisseur.telephone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fournisseur.adresse && fournisseur.adresse.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
            <p className="text-gray-600 mt-1">Gérer les fournisseurs de l'atelier militaire</p>
          </div>
          {(isAdmin || isSuperAdmin) && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau fournisseur
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
            </div>
          ) : filteredFournisseurs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nom du fournisseur</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Téléphone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Adresse</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date d'ajout</th>
                    {(isAdmin || isSuperAdmin) && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredFournisseurs.map((fournisseur) => (
                    <tr key={fournisseur.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-military-600 flex items-center justify-center text-white font-bold">
                            {fournisseur.nom.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{fournisseur.nom}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{fournisseur.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {fournisseur.telephone ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{fournisseur.telephone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {fournisseur.adresse ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">{fournisseur.adresse}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(fournisseur.date_creation)}
                      </td>
                      {(isAdmin || isSuperAdmin) && (
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(fournisseur)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteClick(fournisseur)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <FournisseurForm
          fournisseur={selectedFournisseur}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {showDeleteModal && fournisseurToDelete && (
        <Modal
          isOpen={showDeleteModal}
          title="Supprimer le fournisseur"
          onClose={() => {
            setShowDeleteModal(false);
            setFournisseurToDelete(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{fournisseurToDelete.nom}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFournisseurToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};
