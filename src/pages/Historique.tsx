import { useEffect, useState } from 'react';
import { Calendar, Filter, Search, ShoppingCart, Package, UserPlus, LogIn, TrendingUp, Database } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { historiqueService, usersService } from '../services/api';
import { Historique as HistoriqueType, User as UserType } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

export const Historique = () => {
  const [historique, setHistorique] = useState<HistoriqueType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoriqueType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('tous');

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    table_concernee: '',
    utilisateur_id: '',
    type_activite: '',
  });

  const categories = [
    { value: 'tous', label: 'Toutes les transactions', icon: Database },
    { value: 'connexion', label: 'Connexions', icon: LogIn },
    { value: 'commande', label: 'Commandes', icon: ShoppingCart },
    { value: 'stock', label: 'Stocks', icon: Package },
    { value: 'mouvement', label: 'Mouvements', icon: TrendingUp },
    { value: 'utilisateur', label: 'Utilisateurs', icon: UserPlus },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historiqueRes, usersRes] = await Promise.all([
        historiqueService.getAll(),
        usersService.getAll(),
      ]);
      setHistorique(historiqueRes.data?.data || historiqueRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.table_concernee) params.table_concernee = filters.table_concernee;
      if (filters.utilisateur_id) params.utilisateur_id = filters.utilisateur_id;
      if (filters.type_activite) params.type_activite = filters.type_activite;
      if (searchTerm) params.search = searchTerm;

      const response = await historiqueService.getAll(params);
      setHistorique(response.data?.data || response.data || []);
      setToast({ message: 'Filtres appliqués avec succès', type: 'success' });
    } catch (error) {
      console.error('Error filtering data:', error);
      setToast({ message: 'Erreur lors du filtrage', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setActiveCategory(category);
    try {
      setLoading(true);
      if (category === 'tous') {
        await loadData();
      } else {
        const response = await historiqueService.getFiltered({ categorie: category });
        setHistorique(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error('Error filtering by category:', error);
      setToast({ message: 'Erreur lors du filtrage', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      table_concernee: '',
      utilisateur_id: '',
      type_activite: '',
    });
    setSearchTerm('');
    setActiveCategory('tous');
    loadData();
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('créé') || action.toLowerCase().includes('ajout')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.toLowerCase().includes('modif') || action.toLowerCase().includes('mise à jour')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.toLowerCase().includes('supprim')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.toLowerCase().includes('connexion')) {
      return 'bg-military-100 text-military-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'connexion':
        return <LogIn className="w-4 h-4" />;
      case 'commande':
        return <ShoppingCart className="w-4 h-4" />;
      case 'stock':
        return <Package className="w-4 h-4" />;
      case 'mouvement':
        return <TrendingUp className="w-4 h-4" />;
      case 'utilisateur':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const filteredHistorique = historique.filter((item) =>
    searchTerm
      ? item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.utilisateur_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des Activités</h1>
            <p className="text-gray-600 mt-1">Toutes les actions effectuées sur la plateforme</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres Avancés</h2>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher dans l'historique..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                  <select
                    value={filters.table_concernee}
                    onChange={(e) => setFilters({ ...filters, table_concernee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  >
                    <option value="">Toutes les tables</option>
                    <option value="articles">Articles</option>
                    <option value="mouvements">Mouvements</option>
                    <option value="commandes">Commandes</option>
                    <option value="users">Utilisateurs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                  <select
                    value={filters.utilisateur_id}
                    onChange={(e) => setFilters({ ...filters, utilisateur_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  >
                    <option value="">Tous les utilisateurs</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nom_complet}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
                >
                  Appliquer les filtres
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistorique.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetailsModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(item.date_action)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          {getTypeIcon(item.type_activite)}
                          <span className="capitalize">{item.type_activite}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(item.action)}`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.utilisateur_nom || 'Système'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.role || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.montant ? formatCurrency(item.montant) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate" title={item.details}>
                          {item.details || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredHistorique.length === 0 && (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune transaction trouvée</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedItem && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Détails de la transaction"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure</label>
              <p className="text-gray-900">{formatDate(selectedItem.date_action)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'activité</label>
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedItem.type_activite)}
                <span className="capitalize text-gray-900">{selectedItem.type_activite}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getActionColor(selectedItem.action)}`}>
                {selectedItem.action}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
              <p className="text-gray-900">{selectedItem.utilisateur_nom || 'Système'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <p className="text-gray-900">{selectedItem.role || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table concernée</label>
              <p className="text-gray-900 capitalize">{selectedItem.table_concernee}</p>
            </div>
            {selectedItem.montant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                <p className="text-gray-900 font-semibold">{formatCurrency(selectedItem.montant)}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Détails</label>
              <p className="text-gray-900 whitespace-pre-wrap">{selectedItem.details || 'Aucun détail disponible'}</p>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};
