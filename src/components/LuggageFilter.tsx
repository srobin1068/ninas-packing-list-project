import React from 'react';
import type { LuggageType, PackedFilterType } from '../types/packing';
import { LUGGAGE_INFO } from '../types/packing';
import { Clock, CheckSquare, Square, Ban, Search, X, LayoutGrid, List, CheckCircle2, CircleDashed } from 'lucide-react';

interface LuggageFilterProps {
  selectedBags: Exclude<LuggageType, 'all'>[];
  onToggleBagFilter: (type: LuggageType) => void;
  showMorningOfOnly: boolean;
  onToggleMorningOfOnly: () => void;
  packedFilter: PackedFilterType;
  onPackedFilterChange: (filter: PackedFilterType) => void;
  morningOfCount: number;
  onToggleSelectAll: () => void;
  areAllDisplayedPacked: boolean;
  showNAItems: boolean;
  onToggleShowNAItems: () => void;
  naCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  groupByCategory: boolean;
  onToggleGroupByCategory: () => void;
}

export const LuggageFilter: React.FC<LuggageFilterProps> = ({
  selectedBags,
  onToggleBagFilter,
  showMorningOfOnly,
  onToggleMorningOfOnly,
  packedFilter,
  onPackedFilterChange,
  morningOfCount,
  onToggleSelectAll,
  areAllDisplayedPacked,
  showNAItems,
  onToggleShowNAItems,
  naCount,
  searchQuery,
  onSearchQueryChange,
  groupByCategory,
  onToggleGroupByCategory,
}) => {
  const luggageOptions: { id: LuggageType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Bags', icon: '🧳' },
    { id: 'carry_on', label: LUGGAGE_INFO.carry_on.shortLabel, icon: LUGGAGE_INFO.carry_on.icon },
    { id: 'checked', label: LUGGAGE_INFO.checked.shortLabel, icon: LUGGAGE_INFO.checked.icon },
    { id: 'personal', label: LUGGAGE_INFO.personal.shortLabel, icon: LUGGAGE_INFO.personal.icon },
    { id: 'diaper', label: LUGGAGE_INFO.diaper.shortLabel, icon: LUGGAGE_INFO.diaper.icon },
    { id: 'computer', label: LUGGAGE_INFO.computer.shortLabel, icon: LUGGAGE_INFO.computer.icon },
  ];

  const getStatusText = () => {
    if (searchQuery.trim()) {
      return `🔍 Search: "${searchQuery.trim()}"`;
    }
    if (packedFilter === 'unpacked') {
      return '⏳ Unpacked Items Only (A-Z)';
    }
    if (packedFilter === 'packed') {
      return '✅ Packed Items Only (A-Z)';
    }
    if (showMorningOfOnly && selectedBags.length === 0) {
      return '⏰ Showing Morning-Of Items';
    }
    if (showMorningOfOnly && selectedBags.length > 0) {
      const names = selectedBags
        .map((b) => LUGGAGE_INFO[b]?.shortLabel || b)
        .join(' + ');
      return `⏰ Showing Morning-Of Items in ${names}`;
    }
    if (selectedBags.length === 0) {
      return 'All Bags & Items';
    }
    if (selectedBags.length === 1) {
      return `Showing items in ${LUGGAGE_INFO[selectedBags[0]]?.label || selectedBags[0]}`;
    }
    const names = selectedBags
      .map((b) => LUGGAGE_INFO[b]?.shortLabel || b)
      .join(' + ');
    return `Showing items in ${names}`;
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-2 space-y-2">
        {/* Search Bar & Category View Toggle Row */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search items, bags, categories..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white font-medium transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group by Category Toggle */}
          <button
            onClick={onToggleGroupByCategory}
            title={groupByCategory ? 'Switch to flat list view' : 'Group items by category'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 shrink-0 ${
              groupByCategory
                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {groupByCategory ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{groupByCategory ? 'By Category' : 'Flat List'}</span>
          </button>
        </div>

        {/* Bag Selection Pills & Morning-of toggle */}
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5 pt-0.5">
          {luggageOptions.map((opt) => {
            const isAll = opt.id === 'all';
            const isActive = isAll
              ? selectedBags.length === 0
              : selectedBags.includes(opt.id as any);

            return (
              <button
                key={opt.id}
                onClick={() => onToggleBagFilter(opt.id)}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 shrink-0 border min-h-[34px] ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs ring-2 ring-slate-400/30'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {!isAll && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                )}
              </button>
            );
          })}

          {/* Morning-of departure filter pill */}
          <button
            onClick={onToggleMorningOfOnly}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 shrink-0 border min-h-[34px] ${
              showMorningOfOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Filter items that can only be packed the morning of departure"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
            <span>Morning-Of</span>
            {morningOfCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  showMorningOfOnly
                    ? 'bg-white text-amber-700'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {morningOfCount}
              </span>
            )}
          </button>
        </div>

        {/* Secondary filter row: Packed status segmented control & Select All */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">
            {getStatusText()}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleSelectAll}
              className="flex items-center gap-1 text-slate-600 hover:text-teal-700 font-medium py-0.5 px-2 rounded-lg hover:bg-slate-100 transition"
              title={areAllDisplayedPacked ? 'Deselect all items in this view' : 'Select all items in this view'}
            >
              {areAllDisplayedPacked ? (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>Select All</span>
                </>
              )}
            </button>

            {/* Segmented Filter: All | To Pack | Packed */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 shrink-0">
              <button
                onClick={() => onPackedFilterChange('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  packedFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Show all items (alphabetical)"
              >
                All
              </button>
              <button
                onClick={() => onPackedFilterChange('unpacked')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  packedFilter === 'unpacked'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Show only items not yet packed (alphabetical)"
              >
                <CircleDashed className="w-3 h-3" />
                <span>To Pack</span>
              </button>
              <button
                onClick={() => onPackedFilterChange('packed')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  packedFilter === 'packed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Show only items already packed (alphabetical)"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Packed</span>
              </button>
            </div>

            {naCount > 0 && (
              <button
                onClick={onToggleShowNAItems}
                className={`flex items-center gap-1 font-medium py-0.5 px-2 rounded-lg transition ${
                  showNAItems
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Toggle view for items marked Not Applicable on this trip"
              >
                <Ban className="w-3.5 h-3.5 text-rose-500" />
                <span>{showNAItems ? 'Hide N/A' : `N/A (${naCount})`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
