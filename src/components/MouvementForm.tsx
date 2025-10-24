import { useState, useEffect } from 'react';
import { Mouvement, Article } from '../types';
import { articlesService } from '../services/api';

interface MouvementFormProps {
  mouvement?: Mouvement | null;
  onSubmit: (data: Partial<Mouvement>) => Promise<void>;
  onCancel: () => void;
}

export default function MouvementForm({ mouvement, onSubmit, onCancel }: MouvementFormProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    type: string;
    article_id: string;
    quantite: number;
    source_destination: string;
    reference: string;
    notes: string;
  }>({
    type: mouvement?.type || '',
    article_id: mouvement?.article_id || '',
    quantite: mouvement?.quantite || 0,
    source_destination: mouvement?.source_destination || '',
    reference: mouvement?.reference || '',
    notes: '',
  });

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await articlesService.getAll({});
      // response.data contient {success: true, data: [...]}
      // donc les articles sont dans response.data.data
      if (response.data && Array.isArray(response.data.data)) {
        setArticles(response.data.data);
      } else {
        console.error('Unexpected response structure:', response.data);
        setArticles([]);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData as Partial<Mouvement>);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de mouvement <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner un type</option>
            <option value="Entrée Externe">Entrée Externe</option>
            <option value="Entrée Interne">Entrée Interne</option>
            <option value="Sortie Externe">Sortie Externe</option>
            <option value="Sortie Interne">Sortie Interne</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.article_id}
            onChange={(e) => setFormData({ ...formData, article_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner un article</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.nom} (Stock: {article.quantite})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantite}
            onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source/Destination <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.source_destination}
            onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            placeholder="Ex: Fournisseur XYZ, Unité ABC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Référence <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
            placeholder="Ex: BL-2024-001"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none resize-none"
          placeholder="Notes additionnelles..."
        />
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
          {mouvement ? 'Modifier le mouvement' : 'Créer le mouvement'}
        </button>
      </div>
    </form>
  );
}
