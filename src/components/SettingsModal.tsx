import React, { useState } from 'react';
import type { UserSettings, PackingItem, Person } from '../types/packing';
import { LUGGAGE_INFO } from '../types/packing';
import { X, Copy, Check, Trash2, RefreshCw, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  items: PackingItem[];
  onReloadStarterItems: () => void;
  onClearAllItems: () => void;
  onClearAllLuggage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  items,
  onReloadStarterItems,
  onClearAllItems,
  onClearAllLuggage,
}) => {
  const [people, setPeople] = useState<Person[]>(() => {
    return settings.people && settings.people.length > 0
      ? settings.people
      : [
          { id: 'nina', name: 'Nina' },
          { id: 'mike', name: 'Mike' },
          { id: 'jesse', name: 'Jesse' },
          { id: 'teddy', name: 'Teddy' },
        ];
  });
  const [tripTitle, setTripTitle] = useState(settings.tripTitle);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePersonName = (id: string, newName: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleSave = () => {
    onUpdateSettings({
      tripTitle: tripTitle.trim() || 'Vacation Packing List',
      people: people.map((p) => ({
        ...p,
        name: p.name.trim() || (p.id.charAt(0).toUpperCase() + p.id.slice(1)),
      })),
    });
    onClose();
  };

  const handleCopyToClipboard = () => {
    const formatSection = (title: string, ownerItems: PackingItem[]) => {
      if (ownerItems.length === 0) return '';
      const lines = ownerItems.map((i) => {
        const bag = LUGGAGE_INFO[i.luggage].icon;
        const lastMinute = i.isLastMinute ? ' [⏰ Morning-of]' : '';
        const status = i.packed ? '✅' : '⬜';
        return `${status} ${bag} ${i.text}${lastMinute}`;
      });
      return `\n### ${title}\n` + lines.join('\n');
    };

    let fullText = `🧳 ${tripTitle}\n`;
    people.forEach((p) => {
      const pItems = items.filter((i) => i.owner === p.id);
      fullText += formatSection(`${p.name}'s List`, pItems);
    });

    const sharedItems = items.filter((i) => i.owner === 'shared');
    fullText += formatSection('Shared Items', sharedItems);

    navigator.clipboard.writeText(fullText.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">App Settings & Customize</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Trip / Vacation Name
            </label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              placeholder="e.g. Hawaii Summer 🌴 or Weekend Getaway"
              className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Family & Travelers Packing Tabs
            </label>
            <div className="grid grid-cols-2 gap-3">
              {people.map((p, idx) => (
                <div key={p.id}>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tab {idx + 1} Name
                  </label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdatePersonName(p.id, e.target.value)}
                    placeholder={`Name ${idx + 1}`}
                    className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Quick Tools & Actions
          </label>

          {/* Copy list button */}
          <button
            onClick={handleCopyToClipboard}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between text-xs font-medium transition"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy whole packing list as text (to send in iMessage)</span>
            </div>
            {copied ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied!
              </span>
            ) : null}
          </button>

          {/* Clear all bag selections */}
          <button
            onClick={() => {
              onClearAllLuggage();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium transition"
          >
            <RefreshCw className="w-4 h-4 text-teal-600" />
            <span>Reset all bag selections to "📦 Select Bag"</span>
          </button>

          {/* Reload spreadsheet items */}
          <button
            onClick={() => {
              if (confirm('Reload your original spreadsheet items?')) {
                onReloadStarterItems();
                onClose();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Reload original spreadsheet items</span>
          </button>

          {/* Clear all items */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete ALL items from all lists? This cannot be undone.')) {
                onClearAllItems();
                onClose();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-medium transition"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Clear all items (Start with a blank canvas)</span>
          </button>
        </div>

        {/* Tip for mobile app */}
        <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Phone Tip: Add to Home Screen</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Open this in Safari on your iPhone, tap the Share button (square with arrow), and choose "Add to Home Screen" to use it just like an app!
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
