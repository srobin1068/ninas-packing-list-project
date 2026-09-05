import React from 'react';
import type { PackingItem } from '../types/packing';
import { LUGGAGE_INFO, type LuggageType } from '../types/packing';
import { Briefcase, X, CheckCircle2 } from 'lucide-react';

interface BagBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PackingItem[];
}

export const BagBreakdownModal: React.FC<BagBreakdownModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  if (!isOpen) return null;

  const bagTypes: Exclude<LuggageType, 'all'>[] = [
    'carry_on',
    'checked',
    'personal',
    'diaper',
    'computer',
    'unassigned',
  ];

  const applicableItems = items.filter((i) => !i.isNA);

  const stats = bagTypes.map((type) => {
    const bagItems = applicableItems.filter((i) => i.luggage === type);
    const packedCount = bagItems.filter((i) => i.packed).length;
    const totalCount = bagItems.length;
    const percentage = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
    const info = LUGGAGE_INFO[type] || { label: 'Unassigned', icon: '📦', bg: 'bg-slate-100' };

    return {
      type,
      label: info.label,
      icon: info.icon,
      packedCount,
      totalCount,
      percentage,
      items: bagItems,
    };
  });

  const totalPacked = applicableItems.filter((i) => i.packed).length;
  const totalItems = applicableItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Bag Breakdown & Distribution</h3>
              <p className="text-xs text-slate-500 font-medium">Packing progress grouped by luggage type</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Overall summary banner */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90">Total Trip Progress</p>
              <h4 className="text-xl font-extrabold mt-0.5">
                {totalPacked} of {totalItems} Packed
              </h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">
                {totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : 0}%
              </span>
              <p className="text-[11px] opacity-85">Completed</p>
            </div>
          </div>

          {/* Bag Progress List */}
          <div className="space-y-3 pt-2">
            {stats.map((stat) => {
              const isDone = stat.totalCount > 0 && stat.packedCount === stat.totalCount;

              return (
                <div
                  key={stat.type}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="text-base">{stat.icon}</span>
                      <span>{stat.label}</span>
                      {isDone && (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready!
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 font-semibold">
                      <span className="text-slate-800 font-bold">{stat.packedCount}</span> of{' '}
                      <span>{stat.totalCount}</span> items{' '}
                      <span className="text-teal-600">({stat.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500'
                          : stat.packedCount > 0
                          ? 'bg-teal-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
