import { useState, useEffect } from 'react';
import { Article, Categorie } from '../types';
import { categoriesService } from '../services/api';

interface ArticleFormProps {
  article?: Article | null;
  type: 'matiere_premiere' | 'uniforme_fini';
  onSubmit: (data: Partial<Article>) => Promise<void>;
  onCancel: () => void;
}

export default function ArticleForm({ article, type, onSubmit, onCancel }: ArticleFormProps) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: article?.nom || '',
    categorie: article?.categorie || '',
    institution: article?.institution || '',
    quantite: article?.quantite || 0,
    unite_mesure: article?.unite_mesure || '',
    emplacement: article?.emplacement || '',
    etagere: article?.etagere || '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.categorie && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.nom === formData.categorie);
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, unite_mesure: selectedCategory.unite_mesure }));
      }
    }
  }, [formData.categorie, categories]);

  const loadCategories = async () => {
    try {
      const res = await categoriesService.getAll();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, type });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l'article <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            placeholder="Ex: Tissu camouflage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.categorie}
            onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.nom}>
                {cat.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Institution <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner une institution</option>
            <option value="FAB">FAB - Forces Armées Béninoises</option>
            <option value="Police">Police Nationale</option>
            <option value="Gendarmerie">Gendarmerie</option>
            <option value="Sapeurs-Pompiers">Sapeurs-Pompiers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité initiale <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            />
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 flex items-center min-w-[100px] justify-center">
              {formData.unite_mesure || 'Unité'}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emplacement <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.emplacement}
            onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            placeholder="Ex: Entrepôt A"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Étagère <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.etagere}
            onChange={(e) => setFormData({ ...formData, etagere: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            placeholder="Ex: A-12"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {article ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
