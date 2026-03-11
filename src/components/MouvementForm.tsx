import { useState, useEffect } from 'react';
import { Mouvement, Article, Fournisseur, Commande } from '../types';
import { articlesService, fournisseursService, commandesService } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Plus } from 'lucide-react';

interface MouvementFormProps {
  mouvement?: Mouvement | null;
  onSubmit: (data: Partial<Mouvement>) => Promise<void>;
  onCancel: () => void;
}

// ─── QuantiteInput défini HORS du composant parent ───────────────────────────
// Si ce composant était déclaré à l'intérieur de MouvementForm, React le
// recréérait à chaque render, détruisant le focus après chaque frappe.
interface QuantiteInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}
function QuantiteInput({ value, onChange, label = 'Quantité', required = true }: QuantiteInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || /^\d+$/.test(raw)) onChange(raw);
        }}
        onFocus={(e) => e.target.select()}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
        placeholder="Ex : 50"
        autoComplete="off"
      />
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES_ARTICLES = {
  'Tissus': ['Camouflés', 'Tenues claires', 'Trei gendarmerie', 'Vareuse', 'Tenue cafard', 'Thermocollant', 'Fond de poches', 'Doublure'],
  'Fils': ['Camouflés', 'Tenues claires', 'Trei gendarmerie', 'Vareuse', 'Tenue cafard', 'Thermocollant', 'Fond de poches', 'Doublure'],
  'Boutons': ['Boutons simples', 'Boutons à pression'],
  'Fermetures': ['Camouflés', 'Tenues claires', 'Trei gendarmerie', 'Vareuse', 'Tenue cafard'],
  'Autres Fournitures': ['Élastiques', 'Velcro', 'Lacets', 'Étiquettes', "Plastiques d'emballage", 'Lames/découseurs', 'Viselines', 'Gros grains'],
};

const ARTICLES_COMMANDES = ['Camouflés', 'Tenues claires', 'Trei gendarmerie', 'Vareuse', 'Tenue cafard'];

const QUANTIFICATIONS_AUTO_CATEGORIE: { [key: string]: string } = {
  'Tissus': 'rouleaux',
  'Fils': 'rouleaux',
  'Boutons': 'cartons',
};

const UNITES_MESURE_FLEXIBLES = ['rouleaux', 'cartons', 'bobines', 'sacs', 'pièces', 'balots'];
const UNITES_MESURE = ['rouleaux', 'cartons', 'bobines', 'sacs', 'pièces', 'kg', 'mètres', 'balots'];

export default function MouvementForm({ mouvement, onSubmit, onCancel }: MouvementFormProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableArticles, setAvailableArticles] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'commande' | 'fournisseur'>('type');
  const [entreeInterneType, setEntreeInterneType] = useState<'commande' | 'hors_commande' | null>(null);
  const [showNewFournisseurForm, setShowNewFournisseurForm] = useState(false);
  const [newFournisseur, setNewFournisseur] = useState({ nom: '', email: '', telephone: '' });

  // Quantité en string pour permettre la saisie libre (vide → chiffres sans blocage)
  const [quantiteRaw, setQuantiteRaw] = useState<string>(
    mouvement?.quantite != null ? String(mouvement.quantite) : ''
  );

  const [formData, setFormData] = useState<{
    type: string;
    fournisseur_id?: string;
    categorie?: string;
    article_nom?: string;
    article_id?: string;
    quantite: number;
    quantification: string;
    destination?: string;
    notes: string;
    commande_id?: string;
    institution?: string;
    priorite?: string;
    date_livraison_prevue?: string;
  }>({
    type: mouvement?.type || '',
    fournisseur_id: '',
    categorie: '',
    article_nom: '',
    article_id: mouvement?.article_id || '',
    quantite: mouvement?.quantite || 0,
    quantification: 'rouleaux',
    destination: '',
    notes: mouvement?.notes || '',
    institution: '',
    priorite: 'Normale',
  });

  useEffect(() => { loadArticles(); loadFournisseurs(); }, []);

  useEffect(() => {
    if (formData.type === 'Entrée Interne' && entreeInterneType === 'commande') loadCommandesEnProduction();
    else if (formData.type === 'Sortie Externe') loadCommandesTerminees();
  }, [formData.type, entreeInterneType]);

  useEffect(() => {
    if (formData.categorie && formData.type === 'Entrée Externe') {
      setAvailableArticles(CATEGORIES_ARTICLES[formData.categorie as keyof typeof CATEGORIES_ARTICLES] || []);
      setFormData(prev => ({ ...prev, article_nom: '' }));
    }
  }, [formData.categorie]);

  useEffect(() => {
    if (formData.categorie && formData.type === 'Entrée Externe') {
      const uniteAuto = QUANTIFICATIONS_AUTO_CATEGORIE[formData.categorie];
      if (uniteAuto) setFormData(prev => ({ ...prev, quantification: uniteAuto }));
    }
  }, [formData.categorie]);

  const handleQuantiteChange = (raw: string) => {
    setQuantiteRaw(raw);
    setFormData(prev => ({ ...prev, quantite: raw === '' ? 0 : parseInt(raw, 10) }));
  };

  const syncQuantiteFromCommande = (qty: number) => {
    setQuantiteRaw(String(qty));
    setFormData(prev => ({ ...prev, quantite: qty }));
  };

  const loadArticles = async () => {
    try {
      const response = await articlesService.getAll({ type: 'matiere_premiere' });
      setArticles(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch { setArticles([]); }
  };

  const loadFournisseurs = async () => {
    try {
      const response = await fournisseursService.getAll();
      setFournisseurs(Array.isArray(response.data?.data) ? response.data.data : response.data || []);
    } catch { /* silencieux */ }
  };

  const loadCommandesEnProduction = async () => {
    try {
      const response = await commandesService.getAll();
      const data = response.data?.data || response.data || [];
      setCommandes(data.filter((c: Commande) => c.statut === 'En attente' || c.statut === 'En production'));
    } catch { setCommandes([]); }
  };

  const loadCommandesTerminees = async () => {
    try {
      const response = await commandesService.getAll();
      const data = response.data?.data || response.data || [];
      setCommandes(data.filter((c: Commande) => c.statut === 'Terminée'));
    } catch { /* silencieux */ }
  };

  const handleCreateFournisseur = async () => {
    if (!newFournisseur.nom.trim() || !newFournisseur.telephone.trim()) {
      alert('Le nom et le téléphone sont requis'); return;
    }
    try {
      const response = await fournisseursService.create(newFournisseur);
      const created = response.data.data || response.data;
      setFournisseurs(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, fournisseur_id: created.id }));
      setNewFournisseur({ nom: '', email: '', telephone: '' });
      setShowNewFournisseurForm(false);
      alert('Fournisseur créé avec succès !');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création du fournisseur');
    }
  };

  const handleTypeSelection = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
    setQuantiteRaw('');
    if (type === 'Entrée Externe' || type === 'Sortie Interne') setCurrentStep('details');
    else setCurrentStep('commande');
  };

  const handleEntreeInterneTypeSelection = (type: 'commande' | 'hors_commande') => {
    setEntreeInterneType(type);
    if (type === 'hors_commande') setCurrentStep('details');
  };

  const handleCommandeSelection = (commandeId: string) => {
    const selected = commandes.find(c => c.id === commandeId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        commande_id: commandeId,
        article_nom: selected.article,
        quantite: selected.quantite,
        institution: selected.institution,
      }));
      syncQuantiteFromCommande(selected.quantite);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantiteParsed = parseInt(quantiteRaw, 10);

    if (formData.type === 'Entrée Externe') {
      if (!formData.categorie || !formData.article_nom) {
        alert("Veuillez remplir la catégorie et l'article"); return;
      }
      if (!quantiteRaw || quantiteParsed <= 0) {
        alert('Veuillez saisir une quantité valide (supérieure à 0)'); return;
      }
      // fournisseur_id validé à l'étape fournisseur (required sur le select)
    } else if (formData.type === 'Sortie Interne') {
      if (!formData.article_nom || !formData.categorie) {
        alert("Veuillez spécifier l'article et sa catégorie"); return;
      }
      if (!formData.destination) {
        alert('Veuillez spécifier la destination'); return;
      }
      if (!quantiteRaw || quantiteParsed <= 0) {
        alert('Veuillez saisir une quantité valide (supérieure à 0)'); return;
      }
      const articleEnStock = articles.find(a => a.nom === formData.article_nom && a.categorie === formData.categorie);
      if (!articleEnStock) {
        alert("Cet article n'existe pas en stock. Impossible d'effectuer une sortie interne."); return;
      }
      if (articleEnStock.quantite < quantiteParsed) {
        alert(`Quantité insuffisante en stock. Disponible: ${articleEnStock.quantite} ${articleEnStock.quantification}`); return;
      }
      // destination facultative — aucune validation
    } else if (formData.type === 'Entrée Interne') {
      if (entreeInterneType === 'commande' && !formData.commande_id) {
        alert('Veuillez sélectionner une commande'); return;
      }
      if (entreeInterneType === 'hors_commande') {
        if (!formData.institution || !formData.article_nom) {
          alert("Veuillez remplir l'institution et l'article"); return;
        }
        if (!quantiteRaw || quantiteParsed <= 0) {
          alert('Veuillez saisir une quantité valide (supérieure à 0)'); return;
        }
      }
    } else if (formData.type === 'Sortie Externe') {
      if (!formData.commande_id) { alert('Veuillez sélectionner une commande'); return; }
    }

    setLoading(true);
    try {
      const submitData: any = {
        type: formData.type,
        quantite: isNaN(quantiteParsed) ? formData.quantite : quantiteParsed,
        notes: formData.notes || '',
      };

      if (formData.type === 'Entrée Externe') {
      if (formData.fournisseur_id) submitData.fournisseur_id = formData.fournisseur_id;
        submitData.categorie = formData.categorie;
        submitData.article_nom = formData.article_nom;
        submitData.unite_mesure = formData.quantification;
      } else if (formData.type === 'Sortie Interne') {
        submitData.article_nom = formData.article_nom;
        submitData.categorie = formData.categorie;
        if (formData.destination) submitData.destination = formData.destination;
        const article = articles.find(a => a.nom === formData.article_nom && a.categorie === formData.categorie);
        if (article) submitData.article_id = article.id;
      } else if (formData.type === 'Entrée Interne') {
        if (entreeInterneType === 'commande') {
          submitData.commande_id = formData.commande_id;
          submitData.entree_type = 'commande';
        } else {
          submitData.institution = formData.institution;
          submitData.article_nom = formData.article_nom;
          submitData.priorite = formData.priorite;
          submitData.date_livraison_prevue = formData.date_livraison_prevue;
          submitData.entree_type = 'hors_commande';
        }
      } else if (formData.type === 'Sortie Externe') {
        submitData.commande_id = formData.commande_id;
      }

      console.log('📤 Envoi des données:', submitData);
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'type', label: 'Type de mouvement' },
      { id: 'commande', label: formData.type === 'Entrée Interne' ? "Type d'entrée" : 'Sélection commande' },
      { id: 'details', label: 'Détails' },
      { id: 'fournisseur', label: 'Fournisseur' },
    ];
    const activeSteps =
      formData.type === 'Entrée Externe' ? ['type', 'details', 'fournisseur']
      : formData.type === 'Sortie Interne' ? ['type', 'details']
      : ['type', 'commande', 'details'];

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {activeSteps.map((stepId, index) => {
          const step = steps.find(s => s.id === stepId);
          const isActive = currentStep === stepId;
          const isPast = activeSteps.indexOf(currentStep) > index;
          return (
            <div key={stepId} className="flex items-center">
              {index > 0 && <div className={`w-12 h-0.5 ${isPast || isActive ? 'bg-military-700' : 'bg-gray-200'}`} />}
              <div className={`flex items-center ${isActive ? 'text-military-700' : isPast ? 'text-military-500' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? 'bg-military-700 text-white' : isPast ? 'bg-military-500 text-white' : 'bg-gray-200'}`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-xs font-medium hidden md:inline">{step?.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isQuantificationAuto = formData.categorie && QUANTIFICATIONS_AUTO_CATEGORIE[formData.categorie];
  const getUnitesMesureDisponibles = () =>
    (formData.categorie === 'Fermetures' || formData.categorie === 'Autres Fournitures')
      ? UNITES_MESURE_FLEXIBLES : UNITES_MESURE;

  const CheckmarkBadge = () => (
    <div className="w-6 h-6 bg-military-700 rounded-full flex items-center justify-center ml-2 shrink-0">
      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderStepIndicator()}

      {/* ── ÉTAPE 1 : Type ────────────────────────────────────────────────── */}
      {currentStep === 'type' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionnez le type de mouvement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Entrée Externe', 'Entrée Interne', 'Sortie Interne', 'Sortie Externe'].map((type) => (
              <button key={type} type="button" onClick={() => handleTypeSelection(type)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${formData.type === type ? 'border-military-700 bg-military-50' : 'border-gray-200 hover:border-military-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{type}</h4>
                    <p className="text-sm text-gray-600">
                      {type === 'Entrée Externe' && 'Réception de matières premières depuis un fournisseur'}
                      {type === 'Entrée Interne' && 'Production terminée (sur commande ou hors commande)'}
                      {type === 'Sortie Interne' && 'Utilisation de matières premières pour production'}
                      {type === 'Sortie Externe' && "Livraison d'une commande terminée"}
                    </p>
                  </div>
                  {formData.type === type && <CheckmarkBadge />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE 2a : Entrée Interne — choix type ──────────────────────── */}
      {currentStep === 'commande' && formData.type === 'Entrée Interne' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Type d'entrée interne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['commande', 'hors_commande'] as const).map((t) => (
              <button key={t} type="button" onClick={() => handleEntreeInterneTypeSelection(t)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${entreeInterneType === t ? 'border-military-700 bg-military-50' : 'border-gray-200 hover:border-military-300'}`}>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {t === 'commande' ? 'Entrée sur commande' : 'Entrée hors commande'}
                </h4>
                <p className="text-sm text-gray-600">
                  {t === 'commande' ? "Production d'une commande existante" : 'Production anticipée sans commande'}
                </p>
              </button>
            ))}
          </div>

          {entreeInterneType === 'commande' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une commande <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commandes.length === 0
                  ? <div className="text-center py-8 text-gray-500">Aucune commande en attente ou en production</div>
                  : commandes.map((commande) => (
                    <div key={commande.id} onClick={() => handleCommandeSelection(commande.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.commande_id === commande.id ? 'border-military-700 bg-military-50' : 'border-gray-200 hover:border-military-300'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-military-700">{commande.numero}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${commande.statut === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                              {commande.statut}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>Institution:</strong> {commande.institution}</p>
                            <p><strong>Article:</strong> {commande.article}</p>
                            <p><strong>Quantité:</strong> {commande.quantite} unités</p>
                            {commande.client_nom && <p><strong>Client:</strong> {commande.client_nom}</p>}
                          </div>
                        </div>
                        {formData.commande_id === commande.id && <CheckmarkBadge />}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAPE 2b : Sortie Externe — sélection commande ──────────────── */}
      {currentStep === 'commande' && formData.type === 'Sortie Externe' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner une commande à livrer</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commandes.length === 0
              ? <div className="text-center py-8 text-gray-500">Aucune commande terminée disponible pour livraison</div>
              : commandes.map((commande) => (
                <div key={commande.id} onClick={() => handleCommandeSelection(commande.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.commande_id === commande.id ? 'border-military-700 bg-military-50' : 'border-gray-200 hover:border-military-300'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-military-700">{commande.numero}</span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Terminée</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Institution:</strong> {commande.institution}</p>
                        <p><strong>Article:</strong> {commande.article}</p>
                        <p><strong>Quantité:</strong> {commande.quantite} unités</p>
                        {commande.client_nom && <p><strong>Client:</strong> {commande.client_nom}</p>}
                        {commande.date_livraison_prevue && <p><strong>Livraison prévue:</strong> {formatDate(commande.date_livraison_prevue)}</p>}
                      </div>
                    </div>
                    {formData.commande_id === commande.id && <CheckmarkBadge />}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE détails ───────────────────────────────────────────────── */}
      {currentStep === 'details' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du mouvement</h3>

          {/* Entrée Externe */}
          {formData.type === 'Entrée Externe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie <span className="text-red-500">*</span></label>
                <select required value={formData.categorie}
                  onChange={(e) => setFormData(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  <option value="">Sélectionner une catégorie</option>
                  {Object.keys(CATEGORIES_ARTICLES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article <span className="text-red-500">*</span></label>
                <select required value={formData.article_nom} disabled={!formData.categorie}
                  onChange={(e) => setFormData(prev => ({ ...prev, article_nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none disabled:bg-gray-100">
                  <option value="">Sélectionner un article</option>
                  {availableArticles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantification <span className="text-red-500">*</span></label>
                <select required value={formData.quantification} disabled={!!isQuantificationAuto}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantification: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                  {getUnitesMesureDisponibles().map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
                {isQuantificationAuto && <p className="text-xs text-gray-500 mt-1">Quantification automatique pour cet article</p>}
              </div>
              {/* ✅ Champ quantité stable — Entrée Externe */}
              <QuantiteInput value={quantiteRaw} onChange={handleQuantiteChange} />
            </div>
          )}

          {/* Sortie Interne */}
          {formData.type === 'Sortie Interne' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie <span className="text-red-500">*</span></label>
                <select required value={formData.categorie}
                  onChange={(e) => setFormData(prev => ({ ...prev, categorie: e.target.value, article_nom: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  <option value="">Sélectionner une catégorie</option>
                  {[...new Set(articles.map(a => a.categorie))].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article <span className="text-red-500">*</span></label>
                <select required value={formData.article_nom} disabled={!formData.categorie}
                  onChange={(e) => setFormData(prev => ({ ...prev, article_nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none disabled:bg-gray-100">
                  <option value="">Sélectionner un article</option>
                  {articles.filter(a => a.categorie === formData.categorie).map(a => (
                    <option key={a.id} value={a.nom}>{a.nom} (Stock: {a.quantite} {a.quantification})</option>
                  ))}
                </select>
              </div>
              {/* ✅ Champ quantité stable — Sortie Interne */}
              <QuantiteInput value={quantiteRaw} onChange={handleQuantiteChange} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                  placeholder="Ex : Atelier de production" />
              </div>
            </div>
          )}

          {/* Entrée Interne — Hors commande */}
          {formData.type === 'Entrée Interne' && entreeInterneType === 'hors_commande' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution <span className="text-red-500">*</span></label>
                <select required value={formData.institution}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  <option value="">Sélectionner une institution</option>
                  {['Forêt', 'Sahel', 'Sapeurs-pompiers', 'Pompiers', 'Gendarmerie', 'Armée', 'Air', 'Marine'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article <span className="text-red-500">*</span></label>
                <select required value={formData.article_nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, article_nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  <option value="">Sélectionner un article</option>
                  {ARTICLES_COMMANDES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* ✅ Champ quantité stable — Entrée Interne hors commande */}
              <QuantiteInput value={quantiteRaw} onChange={handleQuantiteChange} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select value={formData.priorite}
                  onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  {['Basse', 'Normale', 'Haute', 'Urgente'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison prévue</label>
                <input type="date" value={formData.date_livraison_prevue}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none" />
              </div>
            </div>
          )}

          {formData.type !== 'Entrée Externe' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} rows={3}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none resize-none"
                  placeholder="Notes additionnelles..." />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Information :</span> La référence du mouvement sera générée automatiquement de manière chronologique.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ÉTAPE fournisseur — facultatif ──────────────────────────────── */}
      {currentStep === 'fournisseur' && formData.type === 'Entrée Externe' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélection du fournisseur</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur <span className="text-red-500">*</span></label>
              <select required value={formData.fournisseur_id}
                onChange={(e) => setFormData(prev => ({ ...prev, fournisseur_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Le fournisseur n'est pas dans la liste ?</p>
              <button type="button" onClick={() => setShowNewFournisseurForm(!showNewFournisseurForm)}
                className={`w-full px-4 py-2 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${showNewFournisseurForm ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-military-300 text-military-700 hover:bg-military-50'}`}>
                <Plus className="w-4 h-4" />
                {showNewFournisseurForm ? 'Annuler' : 'Créer un nouveau fournisseur'}
              </button>
            </div>

            {showNewFournisseurForm && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Nouveau fournisseur</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
                    <input type="text" value={newFournisseur.nom}
                      onChange={(e) => setNewFournisseur(prev => ({ ...prev, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                      placeholder="Ex: Entreprise ABC" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
                    <input type="tel" value={newFournisseur.telephone}
                      onChange={(e) => setNewFournisseur(prev => ({ ...prev, telephone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                      placeholder="+237 XXX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={newFournisseur.email}
                      onChange={(e) => setNewFournisseur(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                      placeholder="contact@entreprise.com" />
                  </div>
                  <button type="button" onClick={handleCreateFournisseur}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Créer le fournisseur
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={formData.notes} rows={3}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none resize-none"
              placeholder="Notes additionnelles..." />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">ℹ️ Information :</span> La référence du mouvement sera générée automatiquement de manière chronologique.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button type="button" disabled={loading}
          onClick={() => {
            if (currentStep === 'details') {
              if (formData.type === 'Entrée Interne' && entreeInterneType === 'hors_commande') setCurrentStep('commande');
              else if (formData.type === 'Entrée Externe' || formData.type === 'Sortie Interne') setCurrentStep('type');
              else setCurrentStep('commande');
            } else if (currentStep === 'commande') {
              setCurrentStep('type');
            } else if (currentStep === 'fournisseur') {
              setCurrentStep('details');
            } else {
              onCancel();
            }
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          {currentStep === 'type' ? 'Annuler' : 'Précédent'}
        </button>

        {currentStep === 'type' && formData.type && (
          <button type="button"
            onClick={() => { if (formData.type === 'Entrée Externe' || formData.type === 'Sortie Interne') setCurrentStep('details'); else setCurrentStep('commande'); }}
            className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors">
            Suivant
          </button>
        )}

        {currentStep === 'commande' && (
          <>
            {formData.type === 'Entrée Interne' && entreeInterneType && (
              <button type="button"
                onClick={() => { if (entreeInterneType === 'hors_commande' || formData.commande_id) setCurrentStep('details'); }}
                disabled={entreeInterneType === 'commande' && !formData.commande_id}
                className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {entreeInterneType === 'commande' ? 'Valider la sélection' : 'Suivant'}
              </button>
            )}
            {formData.type === 'Sortie Externe' && formData.commande_id && (
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enregistrer la livraison
              </button>
            )}
          </>
        )}

        {currentStep === 'details' && formData.type === 'Entrée Externe' && (
          <button type="button" onClick={() => setCurrentStep('fournisseur')}
            disabled={!formData.categorie || !formData.article_nom || !quantiteRaw || parseInt(quantiteRaw, 10) <= 0}
            className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Suivant
          </button>
        )}

        {currentStep === 'details' && formData.type !== 'Entrée Externe' && (
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mouvement ? 'Modifier le mouvement' : 'Enregistrer le mouvement'}
          </button>
        )}

        {currentStep === 'fournisseur' && formData.type === 'Entrée Externe' && (
          <button type="submit" disabled={loading || !formData.fournisseur_id}
            className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mouvement ? 'Modifier le mouvement' : "Enregistrer l'entrée externe"}
          </button>
        )}
      </div>
    </form>
  );
}