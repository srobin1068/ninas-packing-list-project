import React from 'react';
import { RotateCcw, X, Sparkles } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  tripTitle: string;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  tripTitle,
}) => {
  if (!isOpen) return null;

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
          <RotateCcw className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          Reset for your next vacation?
        </h3>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          This will uncheck all items across <span className="font-semibold text-slate-800">{tripTitle || 'all lists'}</span> so you can start packing fresh.
        </p>

        <div className="mt-3 p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center gap-2 text-xs text-teal-800">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Don't worry! None of your items will be deleted. Only the checkmarks will be cleared.</span>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition active:scale-95"
          >
            Yes, Reset Checkmarks
          </button>
        </div>
      </div>
    </div>
  );
};
