import { useEffect, useState } from 'react';
import { Search, Plus, Mail, Phone, MapPin, Edit2, Trash2, Building2, Users } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fournisseursService, clientsService } from '../services/api';
import { Fournisseur, Client } from '../types';
import { formatDate } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { FournisseurForm } from '../components/FournisseurForm';
import { ClientForm } from '../components/ClientForm';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/authStore';

export const FournisseursClients = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'fournisseurs' | 'clients'>('fournisseurs');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [showClientDeleteModal, setShowClientDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const isSuperAdmin = user?.role === 'Super Administrateur';
  const isAdmin = user?.role === 'Administrateur';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'fournisseurs') {
        const response = await fournisseursService.getAll();
        if (response.data && Array.isArray(response.data.data)) {
          setFournisseurs(response.data.data);
        } else {
          console.error('Unexpected response structure:', response.data);
          setFournisseurs([]);
        }
      } else {
        const response = await clientsService.getAll();
        if (response.data && Array.isArray(response.data.data)) {
          setClients(response.data.data);
        } else {
          console.error('Unexpected response structure:', response.data);
          setClients([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (activeTab === 'fournisseurs') {
        setFournisseurs([]);
      } else {
        setClients([]);
      }
    } finally {
      setLoading(false);
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
      loadData();
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
      loadData();
    } catch (error: any) {
      console.error('Error deleting fournisseur:', error);
      setToast({
        message: error.response?.data?.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const handleClientSubmit = async (data: Partial<Client>) => {
    try {
      if (selectedClient) {
        await clientsService.update(selectedClient.id, data);
        setToast({ message: 'Client mis à jour avec succès', type: 'success' });
      } else {
        await clientsService.create(data);
        setToast({ message: 'Client créé avec succès', type: 'success' });
      }
      setShowClientForm(false);
      setSelectedClient(undefined);
      loadData();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setToast({
        message: error.response?.data?.message || 'Erreur lors de l\'enregistrement',
        type: 'error'
      });
    }
  };

  const handleClientDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await clientsService.delete(clientToDelete.id);
      setToast({ message: 'Client supprimé avec succès', type: 'success' });
      setShowClientDeleteModal(false);
      setClientToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      setToast({
        message: error.response?.data?.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const filteredFournisseurs = fournisseurs.filter((fournisseur) => {
    const matchesSearch =
      fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fournisseur.telephone && fournisseur.telephone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fournisseur.adresse && fournisseur.adresse.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs et Clients</h1>
            <p className="text-gray-600 mt-1">Gérer les fournisseurs et clients de l'atelier militaire</p>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouveau fournisseur
              </button>
              <button
                onClick={() => setShowClientForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouveau client
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('fournisseurs')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'fournisseurs'
                    ? 'text-military-700 border-b-2 border-military-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Fournisseurs
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'text-military-700 border-b-2 border-military-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Clients
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'fournisseurs'
                      ? "Rechercher par nom, email, téléphone ou adresse..."
                      : "Rechercher par nom ou téléphone..."
                  }
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
          ) : activeTab === 'fournisseurs' ? (
            filteredFournisseurs.length === 0 ? (
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
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleEdit(fournisseur)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
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
            )
          ) : (
            filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nom du client</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Téléphone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date d'ajout</th>
                      {(isAdmin || isSuperAdmin) && (
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-military-600 flex items-center justify-center text-white font-bold">
                              {client.nom.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{client.nom}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.telephone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(client.date_creation)}
                        </td>
                        {(isAdmin || isSuperAdmin) && (
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientForm(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    setClientToDelete(client);
                                      setShowClientDeleteModal(true);
                                  }}
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
            )
          )}
          </div>
        </div>
      </div>

      {showForm && (
        <FournisseurForm
          fournisseur={selectedFournisseur}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {showClientForm && (
        <ClientForm
          client={selectedClient}
          onSubmit={handleClientSubmit}
          onClose={() => {
            setShowClientForm(false);
            setSelectedClient(undefined);
          }}
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

      {showClientDeleteModal && clientToDelete && (
        <Modal
          isOpen={showClientDeleteModal}
          title="Supprimer le client"
          onClose={() => {
            setShowClientDeleteModal(false);
            setClientToDelete(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le client <strong>{clientToDelete.nom}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowClientDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClientDeleteConfirm}
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
