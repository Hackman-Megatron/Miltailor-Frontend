// UserView.tsx - Composant de consultation
import { User } from '../types';
import { formatDate } from '../utils/formatters';

interface UserViewProps {
  user: User;
  onEdit: () => void;
  onClose: () => void;
}

export function UserView({ user, onEdit, onClose }: UserViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-military-600 flex items-center justify-center text-white text-2xl font-bold">
          {user.nom_complet.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.nom_complet}</h2>
          <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
            user.role === 'Super Administrateur' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
          <p className="text-gray-900">{user.telephone || 'Non renseigné'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Institution</label>
          <p className="text-gray-900">{user.institution || 'Non renseignée'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Statut</label>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
            user.statut === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.statut}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Date de création</label>
          <p className="text-gray-900">{formatDate(user.date_creation)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">ID</label>
          <p className="text-gray-900 font-mono text-sm">{user.id}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Fermer
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-military-700 text-white rounded-lg hover:bg-military-600 transition-colors"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}
