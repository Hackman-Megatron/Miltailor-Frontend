import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, Clock, Package as PackageIcon, CheckCircle, FileDown, Edit, Trash2, Eye, Search } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { commandesService, pdfService } from '../services/api';
import { Commande } from '../types';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import CommandeForm from '../components/CommandeForm';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const Commandes = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState({ totales: 0, en_attente: 0, en_production: 0, livrees: 0, terminees: 0, annulees: 0 });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInstitution, setFilterInstitution] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les dates de COMMANDE
  const [dateCommandeDebut, setDateCommandeDebut] = useState('');
  const [dateCommandeFin, setDateCommandeFin] = useState('');
  
  // États pour les dates de LIVRAISON
  const [dateLivraisonDebut, setDateLivraisonDebut] = useState('');
  const [dateLivraisonFin, setDateLivraisonFin] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCommande, setEditingCommande] = useState<Commande | null>(null);
  const [viewingCommande, setViewingCommande] = useState<Commande | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterInstitution, filterPriority, searchTerm, dateCommandeDebut, dateCommandeFin, dateLivraisonDebut, dateLivraisonFin, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (filterStatus) params.statut = filterStatus;
      if (filterInstitution) params.institution = filterInstitution;
      if (filterPriority) params.priorite = filterPriority;
      if (searchTerm) params.search = searchTerm;
      
      // Dates de COMMANDE
      if (dateCommandeDebut) params.date_commande_debut = dateCommandeDebut;
      if (dateCommandeFin) params.date_commande_fin = dateCommandeFin;
      
      // Dates de LIVRAISON
      if (dateLivraisonDebut) params.date_livraison_debut = dateLivraisonDebut;
      if (dateLivraisonFin) params.date_livraison_fin = dateLivraisonFin;

      console.log('📅 Paramètres de filtrage envoyés:', params);

      const [commandesRes, statsRes] = await Promise.all([
        commandesService.getAll(params),
        commandesService.getStats(),
      ]);

      // Traiter les commandes avec pagination
      if (commandesRes.data.data) {
        setCommandes(commandesRes.data.data || []);
        setTotalPages(commandesRes.data.pagination?.pages || 1);
        setTotalItems(commandesRes.data.pagination?.total || 0);
      } else {
        setCommandes(commandesRes.data || []);
        setTotalPages(1);
        setTotalItems(commandesRes.data?.length || 0);
      }
      
      // Accéder correctement aux données de stats
      const statsData = statsRes.data?.data || statsRes.data || {};
      
      const statsMap: any = {
         totales: 0,
         en_attente: 0,
         en_production: 0,
         livrees: 0,
         terminees: 0,
         annulees: 0
       };

       // Vérifier si par_statut existe et est un tableau
       if (statsData.par_statut && Array.isArray(statsData.par_statut)) {
         statsData.par_statut.forEach((stat: any) => {
           if (stat.statut === 'En attente') statsMap.en_attente = stat.count;
           if (stat.statut === 'En production') statsMap.en_production = stat.count;
           if (stat.statut === 'Livrée') statsMap.livrees = stat.count;
           if (stat.statut === 'Terminée') statsMap.terminees = stat.count;
           if (stat.statut === 'Annulée') statsMap.annulees = stat.count;
         });
       }

       // Utiliser les valeurs directes du backend
       statsMap.totales = statsData.total_commandes || 0;
      
      setStats(statsMap);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Commande>) => {
    try {
      if (editingCommande) {
        await commandesService.update(editingCommande.id, data);
        setToast({ message: 'Commande modifiée avec succès', type: 'success' });
      } else {
        await commandesService.create(data);
        setToast({ message: 'Commande créée avec succès', type: 'success' });
      }
      setShowModal(false);
      setEditingCommande(null);
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de l\'enregistrement de la commande', type: 'error' });
      throw error;
    }
  };

  const handleEdit = (commande: Commande) => {
    setEditingCommande(commande);
    setShowModal(true);
  };

  const handleView = (commande: Commande) => {
    setViewingCommande(commande);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      await commandesService.delete(id);
      setToast({ message: 'Commande supprimée avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCommande(null);
  };

  const handleStatusChange = async (commandeId: string, newStatus: string) => {
    try {
      await commandesService.update(commandeId, { statut: newStatus });
      setToast({ message: 'Statut mis à jour avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour du statut', type: 'error' });
      throw error;
    }
  };

  const handlePriorityChange = async (commandeId: string, newPriority: string) => {
    try {
      await commandesService.update(commandeId, { priorite: newPriority });
      setToast({ message: 'Priorité mise à jour avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour de la priorité', type: 'error' });
      throw error;
    }
  };

  const handleExportPDF = async () => {
    if (commandes.length === 0) {
      setToast({ message: 'Aucune donnée à exporter', type: 'warning' });
      return;
    }

    try {
      setLoading(true);

      const filters = {
        statut: filterStatus || 'Tous',
        institution: filterInstitution || 'Toutes',
        priorite: filterPriority || 'Toutes',
        nombre_commandes: commandes.length.toString(),
        start_date: dateCommandeDebut || '',
        end_date: dateCommandeFin || ''
      };

      console.log('[COMMANDES PDF] Envoi des filtres:', filters);

      const response = await pdfService.generateCommandesReport(filters);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-commandes-${new Date().toISOString().slice(0, 10)}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ 
        message: `Rapport exporté avec succès (${commandes.length} commandes)`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('[COMMANDES PDF] Erreur:', error);
      setToast({ 
        message: error.response?.data?.message || 'Erreur lors de l\'export du rapport', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-military-700 text-military-700 rounded-lg hover:bg-military-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => {
                setEditingCommande(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Commande
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
           <StatCard
             title="Commandes totales"
             value={stats.totales}
             icon={ShoppingCart}
             subtitle="Toutes les commandes"
           />
           <StatCard
             title="En attente"
             value={stats.en_attente}
             icon={Clock}
             subtitle="Commandes en attente"
           />
           <StatCard
             title="En production"
             value={stats.en_production}
             icon={PackageIcon}
             subtitle="Commandes en cours"
           />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
           <StatCard
             title="Livrées"
             value={stats.livrees}
             icon={CheckCircle}
             subtitle="Commandes livrées"
           />
           <StatCard
             title="Terminées"
             value={stats.terminees}
             icon={CheckCircle}
             subtitle="Commandes terminées"
           />
           <StatCard
             title="Annulées"
             value={stats.annulees}
             icon={CheckCircle}
             subtitle="Commandes annulées"
           />
         </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4 mb-6">
            {/* Barre de recherche */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, article ou client..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Filtres principaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="En production">En production</option>
                <option value="Livrée">Livrée</option>
                <option value="Terminée">Terminée</option>
                <option value="Annulée">Annulée</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
              >
                <option value="">Toutes les priorités</option>
                <option value="Basse">Basse</option>
                <option value="Normale">Normale</option>
                <option value="Haute">Haute</option>
                <option value="Urgente">Urgente</option>
              </select>

              <select
                value={filterInstitution}
                onChange={(e) => {
                  setFilterInstitution(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
              >
                <option value="">Toutes les institutions</option>
                <option value="forêt">Forêt</option>
                <option value="sahel">Sahel</option>
                <option value="sapeurs-pompiers">Sapeurs-pompiers</option>
                <option value="pompiers">Pompiers</option>
                <option value="gendarmerie">Gendarmerie</option>
                <option value="armée">Armée</option>
                <option value="air">Air</option>
                <option value="marine">Marine</option>
              </select>
            </div>

            {/* Filtres par dates de COMMANDE */}
            <div className="border border-gray-200 rounded-lg p-4 bg-green-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Filtrer par Date de Commande
              </label>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={dateCommandeFin}
                    onChange={(e) => {
                      console.log('📅 Date commande fin changée:', e.target.value);
                      setDateCommandeFin(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Filtres par dates de LIVRAISON */}
            <div className="border border-blue-200 rounded-lg p-4 bg-green-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚚 Filtrer par Date de Livraison Prévue
              </label>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={dateLivraisonFin}
                    onChange={(e) => {
                      console.log('🚚 Date livraison fin changée:', e.target.value);
                      setDateLivraisonFin(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bouton de réinitialisation */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFilterStatus('');
                  setFilterInstitution('');
                  setFilterPriority('');
                  setSearchTerm('');
                  setDateCommandeDebut('');
                  setDateCommandeFin('');
                  setDateLivraisonDebut('');
                  setDateLivraisonFin('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>

            {/* Affichage des filtres actifs et pagination */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>
                    Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} commandes
                  </span>
                  <span className="text-xs text-gray-500">
                    {filterStatus && `Statut: ${filterStatus}`}
                    {filterInstitution && ` • Institution: ${filterInstitution}`}
                    {filterPriority && ` • Priorité: ${filterPriority}`}
                    {searchTerm && ` • Recherche: "${searchTerm}"`}
                    {(dateCommandeDebut || dateCommandeFin) && ` • Commande: ${dateCommandeDebut || '...'} → ${dateCommandeFin || '...'}`}
                    {(dateLivraisonDebut || dateLivraisonFin) && ` • Livraison: ${dateLivraisonDebut || '...'} → ${dateLivraisonFin || '...'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="px-3">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date commande</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livraison prévue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commandes.map((commande) => (
                    <tr key={commande.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-military-700">
                        <div className="flex items-center gap-2">
                          {commande.numero}
                          {commande.priorite === 'Urgente' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              URGENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{commande.institution}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{commande.article}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{commande.quantite}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{commande.client_nom || '-'}</div>
                          {commande.client_telephone && (
                            <div className="text-xs text-gray-500">{commande.client_telephone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            currentStatus={commande.statut}
                            availableStatuses={['En attente', 'En production', 'Livrée', 'Terminée', 'Annulée']}
                            onStatusChange={(newStatus) => handleStatusChange(commande.id, newStatus)}
                            getStatusColor={getStatusColor}
                          />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge
                          currentPriority={commande.priorite}
                          availablePriorities={['Basse', 'Normale', 'Haute', 'Urgente']}
                          onPriorityChange={(newPriority) => handlePriorityChange(commande.id, newPriority)}
                          getPriorityColor={getPriorityColor}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <div>{formatDate(commande.date_commande)}</div>
                          {commande.date_livraison_prevue && (
                            <div className="text-xs text-gray-500">
                              {new Date(commande.date_livraison_prevue) < new Date() && commande.statut !== 'Livrée' && commande.statut !== 'Terminée'
                                ? '⚠️ En retard'
                                : 'Prévue'
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {commande.date_livraison_prevue ? formatDate(commande.date_livraison_prevue) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleView(commande)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Consulter">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(commande)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(commande.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {commandes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune commande trouvée</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCommande ? 'Modifier la commande' : 'Nouvelle commande'}
        size="lg"
      >
        <CommandeForm
          commande={editingCommande}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Détails de la commande"
        size="lg"
      >
        {viewingCommande && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Numéro</label>
                <p className="text-base font-semibold text-military-700">{viewingCommande.numero}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Institution</label>
                <p className="text-base text-gray-900">{viewingCommande.institution}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Article</label>
                <p className="text-base text-gray-900">{viewingCommande.article}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantité</label>
                <p className="text-base font-semibold text-gray-900">{viewingCommande.quantite}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <p className="text-base text-gray-900">{viewingCommande.client_nom || 'Non spécifié'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingCommande.statut)}`}>
                    {viewingCommande.statut}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Priorité</label>
                <p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(viewingCommande.priorite)}`}>
                    {viewingCommande.priorite}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date de commande</label>
                <p className="text-base text-gray-900">{formatDate(viewingCommande.date_commande)}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Date de livraison prévue</label>
                <p className="text-base text-gray-900">
                  {viewingCommande.date_livraison_prevue ? formatDate(viewingCommande.date_livraison_prevue) : 'Non définie'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
};