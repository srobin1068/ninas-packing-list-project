import React, { useState, useEffect } from 'react';
import { Plus, X, FolderArchive } from 'lucide-react';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewTrip: (newTitle: string) => void;
  currentTripTitle: string;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  onStartNewTrip,
  currentTripTitle,
}) => {
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewTitle('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartNewTrip(newTitle.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
          <Plus className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          Start a New Trip
        </h3>

        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Your current trip <span className="font-semibold text-slate-800">"{currentTripTitle || 'Current Trip'}"</span> will be automatically saved to your <span className="font-semibold text-teal-700">Trip Repository</span> for future reference.
        </p>

        <div className="mt-3 p-3 bg-teal-50/70 rounded-2xl border border-teal-100 flex items-start gap-2.5 text-xs text-teal-900">
          <FolderArchive className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Fresh Checkmarks:</span> All items will stay in your list and be unchecked so you can pack for your new trip!
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Packing List Name
            </label>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Summer Beach Trip 2026..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
