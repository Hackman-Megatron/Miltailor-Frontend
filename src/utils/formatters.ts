export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} ₣ CFA`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (statut: string): string => {
  const colors: Record<string, string> = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'En production': 'bg-blue-100 text-blue-800',
    'Livrée': 'bg-green-100 text-green-800',
    'Terminée': 'bg-purple-100 text-purple-800', // NOUVEAU
    'Annulée': 'bg-red-100 text-red-800',
    'Normal': 'bg-green-100 text-green-800',
    'Faible': 'bg-red-100 text-red-800',
    'Actif': 'bg-green-100 text-green-800',
    'Désactivé': 'bg-gray-100 text-gray-800',
  };
  return colors[statut] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priorite: string): string => {
  const colors: Record<string, string> = {
    'Basse': 'bg-gray-100 text-gray-800',
    'Normale': 'bg-blue-100 text-blue-800',
    'Haute': 'bg-orange-100 text-orange-800',
    'Urgente': 'bg-red-100 text-red-800',
  };
  return colors[priorite] || 'bg-gray-100 text-gray-800';
};
