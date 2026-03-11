import { useState, useEffect } from 'react';
import { Commande, Client, Article } from '../types';
import { clientsService, articlesService } from '../services/api';
import { Plus } from 'lucide-react';

interface CommandeFormProps {
  commande?: Commande | null;
  onSubmit: (data: Partial<Commande>) => Promise<void>;
  onCancel: () => void;
}

// ─── QuantiteInput défini HORS du composant parent ───────────────────────────
// Déclaré au niveau module pour rester stable entre les renders et ne jamais
// perdre le focus lors de la frappe.
interface QuantiteInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  hint?: string;
}
function QuantiteInput({ value, onChange, label = 'Quantité', hint }: QuantiteInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
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
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const AVAILABLE_ARTICLES = [
  'Camouflés',
  'Tenues claires',
  'Trei gendarmerie',
  'Vareuse',
  'Tenue cafard',
];

export default function CommandeForm({ commande, onSubmit, onCancel }: CommandeFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nom: '', telephone: '' });
  const [uniformesFinis, setUniformesFinis] = useState<Article[]>([]);
  const [tirerDuStock, setTirerDuStock] = useState(false);
  const [selectedUniforme, setSelectedUniforme] = useState('');

  // Quantité stockée en string pour permettre la saisie libre
  const [quantiteRaw, setQuantiteRaw] = useState<string>(
    commande?.quantite != null ? String(commande.quantite) : ''
  );

  const [formData, setFormData] = useState({
    institution: commande?.institution || '',
    client_id: commande?.client_id || '',
    article: commande?.article || '',
    quantite: commande?.quantite || 0,
    priorite: (commande?.priorite || 'Normale') as 'Haute' | 'Normale' | 'Basse' | 'Urgente',
    date_livraison_prevue: commande?.date_livraison_prevue || new Date().toISOString().split('T')[0],
    statut: commande?.statut || 'En attente',
  });

  const [currentStep, setCurrentStep] = useState<'details' | 'client'>('details');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const clientsRes = await clientsService.getAll();
      const uniformesRes = await articlesService.getAll({ type: 'uniforme_fini' });

      setClients(clientsRes.data?.data || clientsRes.data || []);
      setUniformesFinis(uniformesRes.data?.data || uniformesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setClients([]);
      setUniformesFinis([]);
    }
  };

  // Synchronise quantiteRaw → formData.quantite
  const handleQuantiteChange = (raw: string) => {
    setQuantiteRaw(raw);
    setFormData(prev => ({ ...prev, quantite: raw === '' ? 0 : parseInt(raw, 10) }));
  };

  const handleCreateClient = async () => {
    if (!newClient.nom.trim() || !newClient.telephone.trim()) {
      alert('Le nom et le téléphone sont requis');
      return;
    }
    try {
      const response = await clientsService.create(newClient);
      const createdClient = response.data.data || response.data;
      setClients(prev => [...prev, createdClient]);
      setFormData(prev => ({ ...prev, client_id: createdClient.id }));
      setNewClient({ nom: '', telephone: '' });
      setShowNewClient(false);
      alert('Client créé avec succès !');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création du client');
    }
  };

  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const quantiteParsed = parseInt(quantiteRaw, 10);

    if (tirerDuStock) {
      if (!selectedUniforme || !quantiteRaw || quantiteParsed <= 0 || !formData.priorite || !formData.date_livraison_prevue) {
        alert('Veuillez remplir tous les champs requis (uniforme, quantité, priorité, date de livraison)');
        return;
      }
      const uniforme = uniformesFinis.find(u => u.id === selectedUniforme);
      if (uniforme && uniforme.quantite < quantiteParsed) {
        alert(`Stock insuffisant. Disponible: ${uniforme.quantite} unités`);
        return;
      }
    } else {
      if (!formData.institution || !formData.article || !quantiteRaw || quantiteParsed <= 0) {
        alert('Veuillez remplir tous les champs requis');
        return;
      }
    }
    setCurrentStep('client');
  };

  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCurrentStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantiteParsed = parseInt(quantiteRaw, 10);

    if (!formData.client_id) {
      alert('Veuillez sélectionner ou créer un client');
      return;
    }

    if (tirerDuStock) {
      if (!selectedUniforme || !quantiteRaw || quantiteParsed <= 0 || !formData.priorite || !formData.date_livraison_prevue) {
        alert('Veuillez remplir tous les champs requis (uniforme, quantité, priorité, date de livraison)');
        return;
      }
      const uniforme = uniformesFinis.find(u => u.id === selectedUniforme);
      if (uniforme && uniforme.quantite < quantiteParsed) {
        alert(`Stock insuffisant. Disponible: ${uniforme.quantite} unités`);
        return;
      }
      if (!formData.institution || !formData.article) {
        alert('Erreur: Institution ou article manquant');
        return;
      }
    } else {
      if (!formData.institution || !formData.article || !quantiteRaw || quantiteParsed <= 0) {
        alert('Veuillez remplir tous les champs requis');
        return;
      }
    }

    setLoading(true);
    try {
      const dataToSubmit: any = {
        institution: formData.institution,
        article: formData.article,
        quantite: quantiteParsed,
        priorite: formData.priorite,
        date_livraison_prevue: formData.date_livraison_prevue,
        client_id: String(formData.client_id),
        tirer_du_stock: tirerDuStock,
      };

      if (tirerDuStock) dataToSubmit.uniforme_id = selectedUniforme;
      if (commande) dataToSubmit.statut = formData.statut;

      console.log('📤 Données envoyées:', dataToSubmit);
      await onSubmit(dataToSubmit);
    } catch (error: any) {
      console.error('❌ Erreur lors de la soumission:', error);
      if (error.response?.data?.errors) {
        const msgs = error.response.data.errors.map((e: any) => e.msg).join('\n');
        alert(`Erreurs de validation:\n${msgs}`);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Une erreur est survenue lors de la création de la commande');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${currentStep === 'details' ? 'text-military-700' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'details' ? 'bg-military-700 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Détails de la commande</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'client' ? 'bg-military-700' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${currentStep === 'client' ? 'text-military-700' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'client' ? 'bg-military-700 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Sélection du client</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── ÉTAPE 1 : Détails ─────────────────────────────────────────── */}
        {currentStep === 'details' && (
          <div className="space-y-6">
            {/* Checkbox tirer du stock */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="tirerDuStock"
                checked={tirerDuStock}
                onChange={(e) => {
                  setTirerDuStock(e.target.checked);
                  setSelectedUniforme('');
                  setQuantiteRaw('');
                  setFormData(prev => ({ ...prev, institution: '', article: '', quantite: 0 }));
                }}
                className="w-4 h-4 text-military-600 bg-gray-100 border-gray-300 rounded focus:ring-military-500 focus:ring-2"
              />
              <label htmlFor="tirerDuStock" className="text-sm font-medium text-blue-800 cursor-pointer">
                Tirer du stock hors commande
              </label>
            </div>

            {tirerDuStock ? (
              /* Mode tirage du stock */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sélectionner un uniforme fini <span className="text-red-500">*</span>
                  </label>
                  <select required value={selectedUniforme}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setSelectedUniforme(uid);
                      const u = uniformesFinis.find(u => u.id === uid);
                      if (u) {
                        setFormData(prev => ({ ...prev, institution: u.institution, article: u.nom, quantite: 0 }));
                        setQuantiteRaw('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                    <option value="">Sélectionner un uniforme</option>
                    {uniformesFinis.map(u => (
                      <option key={u.id} value={u.id}>{u.nom} - {u.institution} (Stock: {u.quantite})</option>
                    ))}
                  </select>
                </div>

                {/* ✅ Champ quantité stable — mode tirage stock */}
                <QuantiteInput
                  value={quantiteRaw}
                  onChange={handleQuantiteChange}
                  hint={selectedUniforme ? `Stock disponible : ${uniformesFinis.find(u => u.id === selectedUniforme)?.quantite ?? 0} unités` : undefined}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité <span className="text-red-500">*</span>
                  </label>
                  <select required value={formData.priorite}
                    onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                    {['Basse', 'Normale', 'Haute', 'Urgente'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de livraison prévue <span className="text-red-500">*</span>
                  </label>
                  <input type="date" required value={formData.date_livraison_prevue}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none" />
                </div>

                {/* Infos automatiques */}
                <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Informations remplies automatiquement :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-700">Institution :</span> {formData.institution || 'Non sélectionnée'}</div>
                    <div><span className="font-medium text-gray-700">Article :</span> {formData.article || 'Non sélectionné'}</div>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ⚠️ <strong>Note :</strong> Cette commande sera créée avec le statut "Livrée" et une sortie externe sera automatiquement enregistrée.
                  </p>
                </div>
              </div>
            ) : (
              /* Mode commande normale */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution <span className="text-red-500">*</span>
                  </label>
                  <select required value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                    <option value="">Sélectionner une institution</option>
                    {['forêt', 'sahel', 'sapeurs-pompiers', 'pompiers', 'gendarmerie', 'armée', 'air', 'marine'].map(i => (
                      <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Article <span className="text-red-500">*</span>
                  </label>
                  <select required value={formData.article}
                    onChange={(e) => setFormData(prev => ({ ...prev, article: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                    <option value="">Sélectionner un article</option>
                    {AVAILABLE_ARTICLES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* ✅ Champ quantité stable — mode commande normale */}
                <QuantiteInput value={quantiteRaw} onChange={handleQuantiteChange} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité <span className="text-red-500">*</span>
                  </label>
                  <select required value={formData.priorite}
                    onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value as any }))}
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

                {commande && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select required value={formData.statut}
                      onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                      {['En attente', 'En production', 'Livrée', 'Terminée', 'Annulée'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : Client ──────────────────────────────────────────── */}
        {currentStep === 'client' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select required value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none">
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom} - {c.telephone}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${showNewClient ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-military-700 text-white hover:bg-military-600'}`}>
                  <Plus className="w-4 h-4" />
                  {showNewClient ? 'Annuler' : 'Nouveau'}
                </button>
              </div>
            </div>

            {showNewClient && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du nouveau client <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={newClient.nom}
                    onChange={(e) => setNewClient(prev => ({ ...prev, nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                    placeholder="Nom complet" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone du nouveau client <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="tel" value={newClient.telephone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, telephone: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                      placeholder="+237 XXX XXX XXX" />
                    <button type="button" onClick={handleCreateClient}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Créer
                    </button>
                  </div>
                </div>
              </>
            )}

            {commande && formData.client_id && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Client sélectionné :</strong>{' '}
                  {clients.find(c => c.id === formData.client_id)?.nom || commande.client_nom || 'Chargement...'}
                  {' - '}
                  {clients.find(c => c.id === formData.client_id)?.telephone || commande.client_telephone || ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          {currentStep === 'details' ? (
            <button type="button" onClick={onCancel} disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Annuler
            </button>
          ) : (
            <button type="button" onClick={handlePrevStep} disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Précédent
            </button>
          )}

          <div className="flex gap-3">
            {currentStep === 'details' ? (
              <button type="button" onClick={handleNextStep}
                className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors">
                Suivant
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {commande ? 'Modifier la commande' : 'Créer la commande'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}