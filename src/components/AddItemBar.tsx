import React, { useState, useRef } from 'react';
import type { ItemOwner, PackingItem } from '../types/packing';
import { LUGGAGE_INFO } from '../types/packing';
import { Plus, Clock } from 'lucide-react';

interface AddItemBarProps {
  activeOwner: ItemOwner;
  ownerName: string;
  onAddItem: (item: Omit<PackingItem, 'id' | 'createdAt'>) => void;
}

export const AddItemBar: React.FC<AddItemBarProps> = ({
  activeOwner,
  ownerName,
  onAddItem,
}) => {
  const [text, setText] = useState('');
  const [luggage, setLuggage] = useState<PackingItem['luggage']>('carry_on');
  const [isLastMinute, setIsLastMinute] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const luggageCycle: PackingItem['luggage'][] = ['carry_on', 'checked', 'personal', 'diaper', 'computer'];

  const cycleLuggage = () => {
    const nextIdx = (luggageCycle.indexOf(luggage) + 1) % luggageCycle.length;
    setLuggage(luggageCycle[nextIdx]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAddItem({
      text: text.trim(),
      packed: false,
      owner: activeOwner,
      luggage,
      isLastMinute,
    });

    setText('');
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-teal-500/80 rounded-2xl p-2 shadow-lg shadow-teal-500/10 flex items-center gap-2 transition-all focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Add item to ${ownerName}'s list...`}
        className="flex-1 bg-transparent px-2.5 py-2 sm:py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium min-h-[40px]"
      />

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Bag Selector Toggle */}
        <button
          type="button"
          onClick={cycleLuggage}
          title={`Bag: ${LUGGAGE_INFO[luggage].label} (Tap to change)`}
          className={`flex items-center gap-1 text-xs px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl border font-medium transition active:scale-95 min-h-[40px] ${LUGGAGE_INFO[luggage].bg} ${LUGGAGE_INFO[luggage].text} ${LUGGAGE_INFO[luggage].border}`}
        >
          <span className="text-sm">{LUGGAGE_INFO[luggage].icon}</span>
          <span className="hidden sm:inline text-xs font-semibold">{LUGGAGE_INFO[luggage].shortLabel}</span>
        </button>

        {/* Morning-of Toggle */}
        <button
          type="button"
          onClick={() => setIsLastMinute(!isLastMinute)}
          title={isLastMinute ? 'Will be marked as Morning-Of item' : 'Mark as Morning-Of item'}
          className={`p-2.5 sm:p-1.5 rounded-xl border transition active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center ${
            isLastMinute
              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className={`w-4 h-4 ${isLastMinute ? 'fill-amber-400 text-amber-700' : ''}`} />
        </button>

        {/* Add Button */}
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white font-semibold p-2.5 sm:p-2 rounded-xl transition active:scale-95 flex items-center justify-center shadow-xs min-h-[40px] min-w-[40px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
};
