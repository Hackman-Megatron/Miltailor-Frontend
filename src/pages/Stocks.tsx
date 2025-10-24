import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Download } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { articlesService, categoriesService, pdfService } from '../services/api';
import { Article, Categorie } from '../types';
import { getStatusColor } from '../utils/formatters';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import { StatusBadge } from '../components/StatusBadge';

export const Stocks = () => {
  const [activeTab, setActiveTab] = useState<'matieres' | 'uniformes'>('matieres');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        type: activeTab === 'matieres' ? 'matiere_premiere' : 'uniforme_fini',
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categorie = selectedCategory;

      const [articlesRes, categoriesRes] = await Promise.all([
        articlesService.getAll(params),
        categoriesService.getAll(),
      ]);

      if (articlesRes.data.data) {
        setArticles(articlesRes.data.data || []);
        setTotalPages(articlesRes.data.pagination?.pages || 1);
        setTotalItems(articlesRes.data.pagination?.total || 0);
      } else {
        setArticles(articlesRes.data || []);
      }

      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const filteredArticles = articles;

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      await articlesService.delete(id);
      setToast({ message: 'Article supprimé avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleSubmit = async (data: Partial<Article>) => {
    try {
      if (editingArticle) {
        await articlesService.update(editingArticle.id, data);
        setToast({ message: 'Article modifié avec succès', type: 'success' });
      } else {
        await articlesService.create(data);
        setToast({ message: 'Article créé avec succès', type: 'success' });
      }
      setShowModal(false);
      setEditingArticle(null);
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de l\'enregistrement', type: 'error' });
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setShowModal(true);
  };

  const handleView = (article: Article) => {
    setViewingArticle(article);
    setShowViewModal(true);
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      await articlesService.update(articleId, { statut: newStatus });
      setToast({ message: 'Statut mis à jour avec succès', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour du statut', type: 'error' });
      throw error;
    }
  };

  const handleExportPDF = async () => {
    if (filteredArticles.length === 0) {
      setToast({ message: 'Aucune donnée à exporter', type: 'warning' });
      return;
    }

    try {
      const filters = {
        type: activeTab === 'matieres' ? 'Matières premières' : 'Uniformes finis',
        catégorie: selectedCategory || 'Toutes',
        recherche: searchTerm || '-'
      };

      const response = await pdfService.generateReport('stocks', filteredArticles, filters);

      if (response.data.success) {
        const downloadResponse = await pdfService.downloadReport(response.data.filename);
        const blob = new Blob([downloadResponse.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast({ message: 'Rapport exporté avec succès', type: 'success' });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setToast({ message: 'Erreur lors de l\'export', type: 'error' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Stocks</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-military-700 text-military-700 rounded-lg hover:bg-military-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => {
                setEditingArticle(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel Article
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('matieres')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'matieres'
                    ? 'text-military-700 border-b-2 border-military-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Matières Premières
              </button>
              <button
                onClick={() => setActiveTab('uniformes')}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'uniformes'
                    ? 'text-military-700 border-b-2 border-military-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Uniformes Finis
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.nom}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              {totalItems > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} articles
                  </span>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emplacement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étagère</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{article.nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.categorie}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.institution}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{article.quantite}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.unite_mesure}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.emplacement}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.etagere}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            currentStatus={article.statut}
                            availableStatuses={['Normal', 'Faible']}
                            onStatusChange={(newStatus) => handleStatusChange(article.id, newStatus)}
                            getStatusColor={getStatusColor}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleView(article)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Consulter">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(article)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(article.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredArticles.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucun article trouvé</p>
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
        title={editingArticle ? 'Modifier l\'article' : `Nouvel article - ${activeTab === 'matieres' ? 'Matière première' : 'Uniforme fini'}`}
        size="lg"
      >
        <ArticleForm
          article={editingArticle}
          type={activeTab === 'matieres' ? 'matiere_premiere' : 'uniforme_fini'}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Détails de l'article"
        size="lg"
      >
        {viewingArticle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nom</label>
                <p className="text-base font-semibold text-gray-900">{viewingArticle.nom}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Catégorie</label>
                <p className="text-base text-gray-900">{viewingArticle.categorie}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Institution</label>
                <p className="text-base text-gray-900">{viewingArticle.institution}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-base text-gray-900">
                  {viewingArticle.type === 'matiere_premiere' ? 'Matière première' : 'Uniforme fini'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantité</label>
                <p className="text-base font-semibold text-gray-900">{viewingArticle.quantite} {viewingArticle.unite_mesure}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingArticle.statut)}`}>
                    {viewingArticle.statut}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Emplacement</label>
                <p className="text-base text-gray-900">{viewingArticle.emplacement}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Étagère</label>
                <p className="text-base text-gray-900">{viewingArticle.etagere}</p>
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
