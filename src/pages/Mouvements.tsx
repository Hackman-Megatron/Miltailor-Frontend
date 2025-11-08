import { useEffect, useState } from 'react';
import { Plus, Download, Upload, TrendingUp, TrendingDown, FileDown, Edit, Trash2, Eye } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { mouvementsService, pdfService } from '../services/api';
import { Mouvement } from '../types';
import { formatDateTime } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import MouvementForm from '../components/MouvementForm';

export const Mouvements = () => {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [stats, setStats] = useState({ entrees_externes: 0, entrees_internes: 0, sorties_externes: 0, sorties_internes: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<Mouvement | null>(null);
  const [viewingMouvement, setViewingMouvement] = useState<Mouvement | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      const [mouvementsRes, statsRes] = await Promise.all([
        mouvementsService.getAll({ type: filterType }),
        mouvementsService.getStats(),
      ]);
      setMouvements(mouvementsRes.data || []);

      const statsData = statsRes.data || [];
      const statsMap: any = {
        entrees_externes: 0,
        entrees_internes: 0,
        sorties_externes: 0,
        sorties_internes: 0
      };

      statsData.forEach((stat: any) => {
        if (stat.type === 'Entrée Externe') statsMap.entrees_externes = stat.count;
        if (stat.type === 'Entrée Interne') statsMap.entrees_internes = stat.count;
        if (stat.type === 'Sortie Externe') statsMap.sorties_externes = stat.count;
        if (stat.type === 'Sortie Interne') statsMap.sorties_internes = stat.count;
      });

      setStats(statsMap);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const getTypeIcon = (type: string) => {
    if (type.includes('Entrée')) return <Download className="w-4 h-4" />;
    return <Upload className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('Entrée')) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const handleSubmit = async (data: Partial<Mouvement>) => {
    try {
      if (editingMouvement) {
        await mouvementsService.update(editingMouvement.id, data);
        setToast({ message: 'Mouvement modifié avec succès', type: 'success' });
      } else {
        await mouvementsService.create(data);
        setToast({ message: 'Mouvement créé avec succès', type: 'success' });
      }
      setShowModal(false);
      setEditingMouvement(null);
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de l\'enregistrement du mouvement', type: 'error' });
      throw error;
    }
  };

  const handleEdit = (mouvement: Mouvement) => {
    setEditingMouvement(mouvement);
    setShowModal(true);
  };

  const handleView = (mouvement: Mouvement) => {
    setViewingMouvement(mouvement);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ?')) return;

    try {
      await mouvementsService.delete(id);
      setToast({ message: 'Mouvement supprimé avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMouvement(null);
  };

  const handleExportPDF = async () => {
    if (mouvements.length === 0) {
      setToast({ message: 'Aucune donnée à exporter', type: 'warning' });
      return;
    }

    try {
      setLoading(true);

      const filters = {
        type: filterType || 'Tous les types',
        nombre_mouvements: mouvements.length.toString(),
        periode: 'Toutes les dates'
      };

      console.log('[MOUVEMENTS PDF] Envoi des filtres:', filters);

      // Appel direct à la nouvelle route
      const response = await pdfService.generateMouvementsReport(filters);
      
      // Créer le blob et déclencher le téléchargement
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-mouvements-${new Date().toISOString().slice(0, 10)}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      // Nettoyage
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ 
        message: `Rapport exporté avec succès (${mouvements.length} mouvements)`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('[MOUVEMENTS PDF] Erreur:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Mouvements de Stock</h1>
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
                setEditingMouvement(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Mouvement
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mouvements de Stock</h2>
          <p className="text-sm text-gray-600 mb-6">Historique complet des entrées et sorties</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Entrées Externes</h3>
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.entrees_externes}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Entrées Internes</h3>
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.entrees_internes}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Sorties Externes</h3>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.sorties_externes}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Sorties Internes</h3>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.sorties_internes}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            >
              <option value="">Tous les types</option>
              <option value="Entrée Externe">Entrée Externe</option>
              <option value="Entrée Interne">Entrée Interne</option>
              <option value="Sortie Externe">Sortie Externe</option>
              <option value="Sortie Interne">Sortie Interne</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
              Historique des Mouvements
            </h3>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source/Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mouvements.map((mouvement) => (
                      <tr key={mouvement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(mouvement.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(mouvement.type)}`}>
                            {getTypeIcon(mouvement.type)}
                            {mouvement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{mouvement.article_nom || mouvement.notes || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{Math.floor(mouvement.quantite)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mouvement.source_destination}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mouvement.reference}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mouvement.utilisateur_nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleView(mouvement)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Consulter">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(mouvement)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(mouvement.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {mouvements.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucun mouvement trouvé</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMouvement ? 'Modifier le mouvement' : 'Nouveau mouvement de stock'}
        size="lg"
      >
        <MouvementForm
          mouvement={editingMouvement}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Détails du mouvement"
        size="lg"
      >
        {viewingMouvement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date et heure</label>
                <p className="text-base text-gray-900">{formatDateTime(viewingMouvement.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(viewingMouvement.type)}`}>
                    {getTypeIcon(viewingMouvement.type)}
                    {viewingMouvement.type}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Article</label>
                <p className="text-base text-gray-900">{viewingMouvement.article_nom || viewingMouvement.notes || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantité</label>
                <p className="text-base font-semibold text-gray-900">{Math.floor(viewingMouvement.quantite)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantification</label>
                <p className="text-base font-semibold text-gray-900">{viewingMouvement.quantification}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source/Destination</label>
                <p className="text-base text-gray-900">{viewingMouvement.source_destination}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Référence</label>
                <p className="text-base text-gray-900">{viewingMouvement.reference}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Utilisateur</label>
                <p className="text-base text-gray-900">{viewingMouvement.utilisateur_nom}</p>
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