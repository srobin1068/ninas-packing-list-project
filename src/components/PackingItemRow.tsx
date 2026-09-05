import React, { useState } from 'react';
import type { PackingItem } from '../types/packing';
import { Check, Clock, Trash2, Edit2, CheckCheck } from 'lucide-react';

interface PackingItemRowProps {
  item: PackingItem;
  onTogglePacked: (id: string) => void;
  onUpdateLuggage: (id: string, luggage: PackingItem['luggage']) => void;
  onToggleLastMinute: (id: string) => void;
  onToggleNA: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItemText: (id: string, newText: string) => void;
}

export const PackingItemRow: React.FC<PackingItemRowProps> = ({
  item,
  onTogglePacked,
  onUpdateLuggage,
  onToggleLastMinute,
  onToggleNA,
  onDeleteItem,
  onEditItemText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEditItemText(item.id, editText.trim());
    } else {
      setEditText(item.text);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl transition-all duration-200 border ${
        item.packed
          ? 'bg-white border-slate-200 shadow-xs opacity-85'
          : 'bg-white border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm'
      }`}
    >
      {/* Top / Main Row: Checkbox, Text & Mobile Quick Edit/Delete Icons */}
      <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Custom Checkbox */}
          <button
            type="button"
            onClick={() => onTogglePacked(item.id)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
              item.packed
                ? 'bg-teal-600 text-white shadow-xs'
                : 'border-2 border-slate-300 hover:border-teal-500 bg-white'
            }`}
            aria-label={item.packed ? 'Mark unpacked' : 'Mark packed'}
          >
            {item.packed && <Check className="w-4 h-4 stroke-[2.5]" />}
          </button>

          {/* Text / Inline Edit */}
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') {
                    setEditText(item.text);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="w-full text-sm font-medium border border-teal-400 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
              />
              <button
                onClick={handleSaveEdit}
                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-md shrink-0"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => onTogglePacked(item.id)}
              className="cursor-pointer min-w-0 flex-1 select-none py-0.5"
            >
              <p className={`text-sm font-medium leading-snug select-none ${
                item.packed ? 'line-through text-slate-400' : 'text-slate-800'
              }`}>
                {item.text}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Quick Action Buttons (Edit & Delete on Top Right of Row) */}
        <div className="flex items-center gap-0.5 shrink-0 sm:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Edit item name"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteItem(item.id);
            }}
            title="Delete item"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Controls Row: Morning-of badge, Desktop Actions, Bag Dropdown & N/A button */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t border-slate-100/80 sm:border-t-0 w-full sm:w-auto">
        <div className="flex items-center gap-1.5">
          {/* Morning-Of Flag Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLastMinute(item.id);
            }}
            title={item.isLastMinute ? 'Morning-of departure item (Active)' : 'Mark as morning-of item'}
            className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] font-semibold ${
              item.isLastMinute
                ? 'bg-amber-100 border-amber-300 text-amber-800 ring-1 ring-amber-200'
                : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${item.isLastMinute ? 'fill-amber-400 text-amber-700' : ''}`} />
            <span className="sm:hidden text-[10px]">{item.isLastMinute ? 'Morning-Of' : 'Morning'}</span>
          </button>

          {/* Desktop Edit & Delete Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Edit item name"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.id);
              }}
              title="Delete item"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Luggage Select Dropdown */}
          <select
            value={item.luggage}
            onChange={(e) => onUpdateLuggage(item.id, e.target.value as PackingItem['luggage'])}
            onClick={(e) => e.stopPropagation()}
            className={`text-xs font-semibold px-2 py-1.5 rounded-lg border transition cursor-pointer outline-none focus:ring-2 focus:ring-teal-400 shrink-0 ${
              item.luggage === 'unassigned'
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                : item.luggage === 'carry_on'
                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                : item.luggage === 'checked'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : item.luggage === 'diaper'
                ? 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
                : item.luggage === 'computer'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Select bag for this item"
          >
            <option value="unassigned">📦 Select Bag</option>
            <option value="carry_on">🧳 Carry-On</option>
            <option value="checked">✈️ Checked</option>
            <option value="personal">🎒 Personal</option>
            <option value="diaper">👶 Diaper Bag</option>
            <option value="computer">💻 Computer Bag</option>
          </select>

          {/* N/A (Not Applicable) Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleNA(item.id);
            }}
            title={item.isNA ? 'Item marked N/A (Restore to list)' : 'Mark as Not Applicable (N/A) for this trip'}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold tracking-tight transition border shrink-0 ${
              item.isNA
                ? 'bg-rose-100 text-rose-700 border-rose-300 font-extrabold ring-1 ring-rose-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
            }`}
          >
            N/A
          </button>
        </div>
      </div>
    </div>
  );
};
