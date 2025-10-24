import { useState, useEffect } from 'react';
import { Commande, Article } from '../types';
import { articlesService } from '../services/api';

interface CommandeFormProps {
  commande?: Commande | null;
  onSubmit: (data: Partial<Commande>) => Promise<void>;
  onCancel: () => void;
}

export default function CommandeForm({ commande, onSubmit, onCancel }: CommandeFormProps) {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [formData, setFormData] = useState({
    institution: commande?.institution || '',
    article: commande?.article || '',
    quantite: commande?.quantite || 0,
    prix_unitaire: commande?.montant && commande?.quantite ? commande.montant / commande.quantite : 0,
    montant: commande?.montant || 0,
    priorite: (commande?.priorite || 'Normale') as 'Haute' | 'Normale' | 'Basse' | 'Urgente',
    date_livraison_prevue: commande?.date_livraison_prevue || '',
    notes: '',
  });

  useEffect(() => {
    loadArticles();
  }, []);

  // Calcul automatique du montant total
  useEffect(() => {
    const montantTotal = formData.quantite * formData.prix_unitaire;
    setFormData(prev => ({ ...prev, montant: montantTotal }));
  }, [formData.quantite, formData.prix_unitaire]);

  const loadArticles = async () => {
    try {
      const res = await articlesService.getAll({ type: 'uniforme_fini' });
      if (res.data.data) {
        setArticles(res.data.data || []);
      } else {
        setArticles(res.data || []);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envoyer les données avec le montant calculé
      const { prix_unitaire, ...dataToSubmit } = formData;
      await onSubmit(dataToSubmit);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <option value="Armée">Armée</option>
            <option value="Gendarmerie">Gendarmerie</option>
            <option value="Police">Police</option>
            <option value="Pompiers">Pompiers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.article}
            onChange={(e) => setFormData({ ...formData, article: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner un article</option>
            {articles.map((article) => (
              <option key={article.id} value={article.nom}>
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
            Prix unitaire (FCFA) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.prix_unitaire}
            onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant total (FCFA)
          </label>
          <input
            type="number"
            value={formData.montant}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Calculé automatiquement (Quantité × Prix unitaire)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.priorite}
            onChange={(e) => setFormData({ ...formData, priorite: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="Basse">Basse</option>
            <option value="Normale">Normale</option>
            <option value="Haute">Haute</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de livraison prévue
          </label>
          <input
            type="date"
            value={formData.date_livraison_prevue}
            onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
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
          placeholder="Notes additionnelles sur la commande..."
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
          {commande ? 'Modifier la commande' : 'Créer la commande'}
        </button>
      </div>
    </form>
  );
}