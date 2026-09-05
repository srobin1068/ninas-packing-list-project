import React, { useState, useRef } from 'react';
import type { PackingItem, UserSettings, SavedTrip } from '../types/packing';
import { STARTER_ITEMS } from '../data/starterItems';
import {
  FolderArchive,
  Save,
  X,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Upload,
  FileUp,
} from 'lucide-react';

interface TripRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItems: PackingItem[];
  currentSettings: UserSettings;
  savedTrips: SavedTrip[];
  onSaveTrip: (title: string) => void;
  onLoadTrip: (savedTrip: SavedTrip) => void;
  onDeleteSavedTrip: (id: string) => void;
  onLoadOriginalMaster: () => void;
  onImportSavedTrips: (trips: SavedTrip[]) => void;
}

export const TripRepositoryModal: React.FC<TripRepositoryModalProps> = ({
  isOpen,
  onClose,
  currentItems,
  currentSettings,
  savedTrips,
  onSaveTrip,
  onLoadTrip,
  onDeleteSavedTrip,
  onLoadOriginalMaster,
  onImportSavedTrips,
}) => {
  const [newTripTitle, setNewTripTitle] = useState(currentSettings.tripTitle || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;
    onSaveTrip(newTripTitle.trim());
    setNewTripTitle(currentSettings.tripTitle || '');
  };

  const copyTripToClipboard = (tripTitle: string, items: PackingItem[], id: string) => {
    const formatted = `🧳 PackMate Trip Archive: ${tripTitle}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Total Items: ${items.length}\n\n` +
      items.map((i) => `[${i.packed ? 'x' : ' '}] ${i.text} (${i.owner} - ${i.luggage})`).join('\n');

    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportRepository = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedTrips, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "packmate_repository_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportSavedTrips(parsed);
          setImportStatus(`Successfully imported ${parsed.length} packing list(s)!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Invalid backup file format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Trip Repository & Archives</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">Save, sync, and reference past packing lists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Save Current Trip Section */}
          <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <Save className="w-4 h-4 text-teal-600" />
                <span>Save Current Packing List</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportRepository}
                  disabled={savedTrips.length === 0}
                  className="px-2.5 py-1 bg-white hover:bg-teal-100/60 text-teal-800 border border-teal-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-2xs disabled:opacity-40"
                  title="Export all saved trips as a backup JSON file"
                >
                  <FileUp className="w-3 h-3 text-teal-600" />
                  <span>Export All</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                  title="Import a repository backup JSON file onto this device"
                >
                  <Upload className="w-3 h-3" />
                  <span>Import Backup</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-teal-800">
              Save a snapshot of your current trip ({currentItems.length} items) into your repository for future vacation reference.
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="text"
                value={newTripTitle}
                onChange={(e) => setNewTripTitle(e.target.value)}
                placeholder="Trip name (e.g. Banff Beach Vacation 2026)..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-teal-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>
            </form>
          </div>

          {/* Repository List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Saved Packing Lists ({savedTrips.length})</span>
              </span>
            </div>

            {/* Master Original Backup Card */}
            <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Master Family Vacation List</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                      Original Backup
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original spreadsheet items for Nina, Mike, Jesse, Teddy & Shared ({STARTER_ITEMS.length} items).
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Load original master spreadsheet items into active list?')) {
                      onLoadOriginalMaster();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restore Master</span>
                </button>
              </div>
            </div>

            {/* User Saved Trips */}
            {savedTrips.length > 0 ? (
              <div className="space-y-2.5">
                {savedTrips.map((trip) => {
                  const dateStr = new Date(trip.savedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={trip.id}
                      className="border border-slate-200 bg-white rounded-2xl p-4 hover:border-slate-300 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {trip.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              {trip.items.length} items
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyTripToClipboard(trip.title, trip.items, trip.id)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                            title="Copy formatted list"
                          >
                            {copiedId === trip.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const currentTitle = currentSettings.tripTitle || 'Current Packing List';
                              if (confirm(`Open "${trip.title}"?\n\nYour current packing list ("${currentTitle}") will be automatically saved to your Repository so no data is lost.`)) {
                                onLoadTrip(trip);
                                onClose();
                              }
                            }}
                            className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Open Trip</span>
                          </button>

                          <button
                            onClick={() => onDeleteSavedTrip(trip.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete saved trip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  No saved trip snapshots yet. Use the input above to archive your first trip!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
