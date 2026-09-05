import React, { useState, useEffect } from 'react';
import {
  Palmtree,
  Plus,
  Settings,
  CheckCircle2,
  FolderArchive,
  Pencil,
  Check,
  Radio,
  BarChart2,
  RotateCcw,
  Printer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { UserSettings } from '../types/packing';

interface HeaderProps {
  settings: UserSettings;
  totalItems: number;
  packedItems: number;
  onOpenNewTripModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRepositoryModal: () => void;
  onOpenShareModal: () => void;
  onOpenBagBreakdown: () => void;
  onResetTrip: () => void;
  onRenameTripTitle: (newTitle: string) => void;
  isSyncActive?: boolean;
  syncCode?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  totalItems,
  packedItems,
  onOpenNewTripModal,
  onOpenSettingsModal,
  onOpenRepositoryModal,
  onOpenShareModal,
  onOpenBagBreakdown,
  onResetTrip,
  onRenameTripTitle,
  isSyncActive,
  syncCode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(settings.tripTitle || '');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    setTitleInput(settings.tripTitle || '');
  }, [settings.tripTitle]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveTitle = () => {
    onRenameTripTitle(titleInput.trim());
    setIsEditingTitle(false);
  };

  const percent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  const isAllPacked = totalItems > 0 && packedItems === totalItems;

  const namesDisplay = settings.people && settings.people.length > 0
    ? settings.people.map((p) => p.name).join(', ')
    : 'Nina, Mike, Jesse & Teddy';

  return (
    <header className="bg-white border-b border-slate-200 pt-safe">
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
        {/* Row 1: App Branding, Network Status & Action Toolbar */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Network Status */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xs shrink-0">
              <Palmtree className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight">PackMate</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
              title={isOnline ? 'Online & Synced' : 'Offline Mode (Saved Locally)'}
            >
              {isOnline ? <Wifi className="w-2.5 h-2.5 text-emerald-600" /> : <WifiOff className="w-2.5 h-2.5 text-amber-600" />}
              <span>{isOnline ? 'Synced' : 'Offline'}</span>
            </span>
          </div>

          {/* Top Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Bag Breakdown Analytics Button */}
            <button
              onClick={onOpenBagBreakdown}
              title="Bag Breakdown & Distribution Analytics"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-xl transition border border-teal-200/80 shadow-2xs flex items-center gap-1 text-xs font-semibold"
            >
              <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Analytics</span>
            </button>

            {/* Unpack / Reset List Button */}
            <button
              onClick={() => {
                if (confirm('Unpack / reset all items on this list for your next trip?\n\nAll item checkmarks will be reset, while preserving your custom items, bag assignments, and N/A selections.')) {
                  onResetTrip();
                }
              }}
              title="Unpack / Reset checklist for next trip"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Print / PDF Export Button */}
            <button
              onClick={() => window.print()}
              title="Print or Export PDF checklist"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Share / Live Sync Button */}
            <button
              onClick={onOpenShareModal}
              title="Share & Live Sync in real-time"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] rounded-xl transition flex items-center gap-1 text-xs font-semibold border ${
                isSyncActive
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:text-teal-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSyncActive ? 'animate-pulse text-white' : 'text-teal-600'}`} />
              <span className="hidden sm:inline">
                {isSyncActive ? (syncCode ? `Live: ${syncCode}` : 'Live') : 'Share'}
              </span>
            </button>

            <button
              onClick={onOpenNewTripModal}
              title="Start a new packing list"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 rounded-xl transition flex items-center gap-1 text-xs font-semibold border border-teal-200/80 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600 stroke-[2.5]" />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={onOpenRepositoryModal}
              title="Saved Trip Repository"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition flex items-center gap-1 text-xs font-medium border border-slate-200"
            >
              <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={onOpenSettingsModal}
              title="Settings & Names"
              className="p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Row 2: Full Width Trip Title */}
        <div className="pt-0.5">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleInput(settings.tripTitle || '');
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                placeholder="Enter list name..."
                className="text-base sm:text-lg font-bold text-slate-800 border-2 border-teal-400 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white w-full"
              />
              <button
                onClick={handleSaveTitle}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shrink-0 flex items-center gap-1 text-xs"
                title="Save title"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setTitleInput(settings.tripTitle || '');
                setIsEditingTitle(true);
              }}
              className="group flex items-center gap-2 cursor-pointer hover:opacity-80 transition py-0.5"
              title="Click to edit packing list name"
            >
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-snug tracking-tight break-words">
                {settings.tripTitle || 'Vacation Packing List'}
              </h1>
              <Pencil className="w-4 h-4 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-teal-600 transition shrink-0" />
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Packing for: <span className="font-semibold text-slate-700">{namesDisplay}</span>
          </p>
        </div>

        {/* Row 3: Packing Progress Bar */}
        <div className="pt-1.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              {isAllPacked ? (
                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Takeoff! 🏖️
                </span>
              ) : (
                <span>Packing Progress</span>
              )}
            </div>
            <div className="text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{packedItems}</span> of{' '}
              <span>{totalItems}</span> packed{' '}
              <span className="text-teal-600 font-semibold">({percent}%)</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllPacked
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
