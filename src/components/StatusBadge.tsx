import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface StatusBadgeProps {
  currentStatus: string;
  availableStatuses: string[];
  onStatusChange: (newStatus: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  disabled?: boolean;
}

export const StatusBadge = ({
  currentStatus,
  availableStatuses,
  onStatusChange,
  getStatusColor,
  disabled = false
}: StatusBadgeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (selectedStatus === currentStatus) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(selectedStatus);
      setIsEditing(false);
    } catch (error) {
      setSelectedStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={loading}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
          title="Enregistrer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
          title="Annuler"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentStatus)} ${
        !disabled ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
      }`}
      title={!disabled ? 'Cliquer pour modifier' : ''}
    >
      {currentStatus}
    </button>
  );
};
