// UserEditForm.tsx - Composant de modification
import { useState } from 'react';
import { User } from '../types';

interface UserEditFormProps {
  user: User;
  onSubmit: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

export function UserEditForm({ user, onSubmit, onCancel }: UserEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: user.nom_complet,
    email: user.email,
    telephone: user.telephone || '',
    role: user.role,
    institution: user.institution || '',
    statut: user.statut,
    modifier_mot_de_passe: false,
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation du mot de passe si modification demandée
    if (formData.modifier_mot_de_passe) {
      if (formData.nouveau_mot_de_passe !== formData.confirmer_mot_de_passe) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }
      if (formData.nouveau_mot_de_passe.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    setLoading(true);
    try {
      const dataToSubmit: any = {
        nom_complet: formData.nom_complet,
        email: formData.email,
        telephone: formData.telephone || null,
        role: formData.role,
        institution: formData.institution || null,
        statut: formData.statut,
      };

      // Ajouter le mot de passe seulement si modification demandée
      if (formData.modifier_mot_de_passe && formData.nouveau_mot_de_passe) {
        dataToSubmit.password = formData.nouveau_mot_de_passe;
      }

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.nom_complet}
            onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rôle <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="Administrateur">Administrateur</option>
            <option value="Super Administrateur">Super Administrateur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Institution
          </label>
          <select
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="">Sélectionner une institution (optionnel)</option>
            <option value="Forêt">Forêt</option>
            <option value="Sahel">Sahel</option>
            <option value="Sapeurs-pompiers">Sapeurs-pompiers</option>
            <option value="Pompiers">Pompiers</option>
            <option value="Gendarmerie">Gendarmerie</option>
            <option value="Armée">Armée</option>
            <option value="Air">Air</option>
            <option value="Marine">Marine</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
          >
            <option value="Actif">Actif</option>
            <option value="Désactivé">Désactivé</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="modifier_mot_de_passe"
            checked={formData.modifier_mot_de_passe}
            onChange={(e) => setFormData({ 
              ...formData, 
              modifier_mot_de_passe: e.target.checked,
              nouveau_mot_de_passe: '',
              confirmer_mot_de_passe: ''
            })}
            className="w-4 h-4 text-military-600 border-gray-300 rounded focus:ring-military-500"
          />
          <label htmlFor="modifier_mot_de_passe" className="text-sm font-medium text-gray-900">
            Modifier le mot de passe
          </label>
        </div>

        {formData.modifier_mot_de_passe && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required={formData.modifier_mot_de_passe}
                minLength={6}
                value={formData.nouveau_mot_de_passe}
                onChange={(e) => setFormData({ ...formData, nouveau_mot_de_passe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required={formData.modifier_mot_de_passe}
                minLength={6}
                value={formData.confirmer_mot_de_passe}
                onChange={(e) => setFormData({ ...formData, confirmer_mot_de_passe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>
        )}
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
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}