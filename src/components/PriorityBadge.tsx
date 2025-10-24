import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface PriorityBadgeProps {
  currentPriority: string;
  availablePriorities: string[];
  onPriorityChange: (newPriority: string) => Promise<void>;
  getPriorityColor: (priority: string) => string;
  disabled?: boolean;
}

export const PriorityBadge = ({
  currentPriority,
  availablePriorities,
  onPriorityChange,
  getPriorityColor,
  disabled = false
}: PriorityBadgeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(currentPriority);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (selectedPriority === currentPriority) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onPriorityChange(selectedPriority);
      setIsEditing(false);
    } catch (error) {
      setSelectedPriority(currentPriority);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedPriority(currentPriority);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          disabled={loading}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-military-500 focus:border-transparent outline-none"
        >
          {availablePriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
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
      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(currentPriority)} ${
        !disabled ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
      }`}
      title={!disabled ? 'Cliquer pour modifier' : ''}
    >
      {currentPriority}
    </button>
  );
};
