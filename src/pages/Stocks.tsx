import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Trash2, Download } from 'lucide-react';
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

  // ─── Chargement des données ───────────────────────────────────────────────
  // useCallback pour stabiliser la référence et éviter les double-appels
  const loadData = useCallback(async (
    tab: 'matieres' | 'uniformes',
    page: number,
    search: string,
    category: string
  ) => {
    setLoading(true);
    // Vider la liste AVANT le fetch pour éviter d'afficher les anciens résultats
    setArticles([]);

    const typeParam = tab === 'matieres' ? 'matiere_premiere' : 'uniforme_fini';

    const params: Record<string, any> = {
      type: typeParam,
      page,
      limit: itemsPerPage,
    };

    if (search)   params.search   = search;
    if (category) params.categorie = category;

    // Pour les uniformes finis : ne montrer que ceux qui ont du stock
    if (tab === 'uniformes') {
      params.quantite_min = 1;
    }

    // ── Log de contrôle ──────────────────────────────────────────────────
    console.group(`[Stocks] loadData — onglet="${tab}"`);
    console.log('Paramètres envoyés à l\'API :', params);
    // ─────────────────────────────────────────────────────────────────────

    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        articlesService.getAll(params),
        categoriesService.getAll(),
      ]);

      // ── Log de la réponse ────────────────────────────────────────────
      const rawData = articlesRes.data?.data ?? articlesRes.data ?? [];
      console.log(`Réponse reçue : ${rawData.length} article(s)`);
      if (rawData.length > 0) {
        console.log('Premier article reçu :', {
          nom: rawData[0].nom,
          type: rawData[0].type,
          institution: rawData[0].institution,
          quantite: rawData[0].quantite,
        });
        // Vérification : tous les articles retournés ont-ils le bon type ?
        const wrongType = rawData.filter((a: Article) => a.type !== typeParam);
        if (wrongType.length > 0) {
          console.warn(`⚠️ ${wrongType.length} article(s) avec un type inattendu (attendu: ${typeParam}) :`, wrongType.map((a: Article) => ({ nom: a.nom, type: a.type })));
        } else {
          console.log(`✅ Tous les articles ont bien le type "${typeParam}"`);
        }
      }
      console.groupEnd();
      // ─────────────────────────────────────────────────────────────────

      if (articlesRes.data?.data) {
        setArticles(articlesRes.data.data ?? []);
        setTotalPages(articlesRes.data.pagination?.pages ?? 1);
        setTotalItems(articlesRes.data.pagination?.total ?? 0);
      } else {
        setArticles(articlesRes.data ?? []);
        setTotalPages(1);
        setTotalItems((articlesRes.data ?? []).length);
      }

      setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
    } catch (error) {
      console.error('[Stocks] Erreur chargement :', error);
      console.groupEnd();
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []); // pas de dépendances : on passe tout en paramètre

  // ─── Déclencher le fetch à chaque changement de filtre ───────────────────
  useEffect(() => {
    loadData(activeTab, currentPage, searchTerm, selectedCategory);
  }, [activeTab, currentPage, searchTerm, selectedCategory, loadData]);

  // ─── Changement d'onglet — réinitialise tout l'état filtrant ─────────────
  const handleTabChange = (tab: 'matieres' | 'uniformes') => {
    setActiveTab(tab);
    setSelectedCategory('');
    setSearchTerm('');
    setCurrentPage(1);
    // Les articles seront vidés et rechargés par le useEffect ci-dessus
  };

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    try {
      await articlesService.delete(id);
      setToast({ message: 'Article supprimé avec succès', type: 'success' });
      loadData(activeTab, currentPage, searchTerm, selectedCategory);
    } catch {
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
      loadData(activeTab, currentPage, searchTerm, selectedCategory);
    } catch {
      setToast({ message: "Erreur lors de l'enregistrement", type: 'error' });
      throw new Error('Submit failed');
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      await articlesService.update(articleId, { statut: newStatus });
      setToast({ message: 'Statut mis à jour avec succès', type: 'success' });
      loadData(activeTab, currentPage, searchTerm, selectedCategory);
    } catch {
      setToast({ message: 'Erreur lors de la mise à jour du statut', type: 'error' });
      throw new Error('Status update failed');
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  const handleExportPDF = async () => {
    if (articles.length === 0) {
      setToast({ message: 'Aucune donnée à exporter', type: 'warning' });
      return;
    }
    try {
      setLoading(true);
      const filters = {
        type: activeTab === 'matieres' ? 'Matières premières' : 'Uniformes finis',
        categorie: selectedCategory || 'Toutes',
        search: searchTerm || '',
        statut: 'Tous',
        institution: 'Toutes',
      };
      const response = await pdfService.generateStocksReport(filters);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-stocks-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: `Rapport exporté (${articles.length} articles)`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || "Erreur lors de l'export", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────── JSX ─────────────────────────── */
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Stocks</h1>
            {activeTab === 'uniformes' && (
              <p className="text-sm text-gray-600 mt-1">
                Uniformes finis terminés uniquement (quantité &gt; 0)
              </p>
            )}
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-military-700 text-military-700 rounded-lg hover:bg-military-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>

        {/* ── Tableau principal ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">

          {/* Onglets */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['matieres', 'uniformes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'text-military-700 border-b-2 border-military-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'matieres' ? 'Matières Premières' : 'Uniformes Finis'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">

            {/* Filtres */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              {/* Pagination info */}
              {totalItems > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} articles
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="px-3">Page {currentPage} sur {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-700" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                      {activeTab === 'uniformes' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantification</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{article.nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.categorie}</td>
                        {activeTab === 'uniformes' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.institution}</td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{Math.floor(article.quantite)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{article.quantification}</td>
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
                            <button
                              onClick={() => { setViewingArticle(article); setShowViewModal(true); }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Consulter"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {articles.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {activeTab === 'uniformes'
                        ? 'Aucun uniforme fini en stock pour le moment'
                        : 'Aucun article trouvé'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal création/édition ── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingArticle(null); }}
        title={editingArticle
          ? "Modifier l'article"
          : `Nouvel article — ${activeTab === 'matieres' ? 'Matière première' : 'Uniforme fini'}`}
        size="lg"
      >
        <ArticleForm
          article={editingArticle}
          type={activeTab === 'matieres' ? 'matiere_premiere' : 'uniforme_fini'}
          onSubmit={handleSubmit}
          onCancel={() => { setShowModal(false); setEditingArticle(null); }}
        />
      </Modal>

      {/* ── Modal consultation ── */}
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
              {viewingArticle.type === 'uniforme_fini' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Institution</label>
                  <p className="text-base text-gray-900">{viewingArticle.institution}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-base text-gray-900">
                  {viewingArticle.type === 'matiere_premiere' ? 'Matière première' : 'Uniforme fini'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantité</label>
                <p className="text-base font-semibold text-gray-900">
                  {Math.floor(viewingArticle.quantite)} {viewingArticle.quantification}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingArticle.statut)}`}>
                  {viewingArticle.statut}
                </span>
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