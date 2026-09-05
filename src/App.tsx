import { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { ItemOwner, LuggageType, PackingItem, UserSettings, Person, SavedTrip, PackedFilterType } from './types/packing';
import { STARTER_ITEMS } from './data/starterItems';
import { STARTER_TRIPS } from './data/starterTrips';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { LuggageFilter } from './components/LuggageFilter';
import { PackingItemRow } from './components/PackingItemRow';
import { AddItemBar } from './components/AddItemBar';
import { NewTripModal } from './components/NewTripModal';
import { SettingsModal } from './components/SettingsModal';
import { TripRepositoryModal } from './components/TripRepositoryModal';
import { ShareModal } from './components/ShareModal';
import { BagBreakdownModal } from './components/BagBreakdownModal';
import { syncService } from './services/syncService';
import { cloudDb } from './services/cloudDb';
import { Sparkles, Inbox } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'packmate_items_v10';
const STORAGE_KEY_SETTINGS = 'packmate_settings_v2';
const STORAGE_KEY_TRIPS = 'packmate_saved_trips_v2';

const DEFAULT_PEOPLE: Person[] = [
  { id: 'nina', name: 'Nina' },
  { id: 'mike', name: 'Mike' },
  { id: 'jesse', name: 'Jesse' },
  { id: 'teddy', name: 'Teddy' },
];

export function App() {
  // Load settings from local storage with migration to Louisville October 2026
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tripTitle === 'Louisville' || parsed.tripTitle === 'Calgary & Vacation Packing List 🏔️') {
          parsed.tripTitle = 'Louisville October 2026';
        }
        if (parsed.people && parsed.people.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      tripTitle: 'Louisville October 2026',
      people: DEFAULT_PEOPLE,
    };
  });

  // Load items from local storage
  const [items, setItems] = useState<PackingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed: PackingItem[] = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return STARTER_ITEMS.map((item) => (item.luggage ? item : { ...item, luggage: 'unassigned' }));
  });

  // Helper to normalize title key for deduplication (removes emojis, punctuation, and generic suffixes)
  const normalizeTripName = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\b(trip|getaway|vacation|list|master)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const sanitizeTrips = (trips: SavedTrip[]): SavedTrip[] => {
    const map = new Map<string, SavedTrip>();
    trips.forEach((t) => {
      if (!t || !t.id) return;
      if (t.title.toLowerCase().includes('calgary')) return;
      const key = t.id;
      if (!map.has(key) || new Date(t.savedAt) >= new Date(map.get(key)!.savedAt)) {
        map.set(key, t);
      }
    });
    return Array.from(map.values());
  };

  // Load saved trip snapshots repository (pre-seeded with Hudson Valley & Louisville October 2026)
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (saved) {
        const parsed: SavedTrip[] = JSON.parse(saved);
        if (parsed.length > 0) {
          const updated = parsed.map((t) =>
            t.title === 'Louisville' || t.id === 'starter_louisville'
              ? { ...t, title: 'Louisville October 2026' }
              : t
          );
          return sanitizeTrips(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return sanitizeTrips(STARTER_TRIPS);
  });

  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  // Navigation, Filter, Search & View state
  const [activeTab, setActiveTab] = useState<ItemOwner>('nina');
  const [selectedBags, setSelectedBags] = useState<Exclude<LuggageType, 'all'>[]>([]);
  const [showMorningOfOnly, setShowMorningOfOnly] = useState(false);
  const [packedFilter, setPackedFilter] = useState<PackedFilterType>('all');
  const [showNAItems, setShowNAItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(false);

  // Modals
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBagBreakdownOpen, setIsBagBreakdownOpen] = useState(false);

  // Real-time Sync state & refs
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const isRemoteUpdate = useRef(false);

  // Automatic Cloud Database sync (preserves all trips across devices automatically)
  useEffect(() => {
    const applyState = (state: any) => {
      isRemoteUpdate.current = true;
      if (state.items) {
        setItems((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(state.items)) return prev;
          return state.items;
        });
      }
      if (state.tripTitle) {
        setSettings((prev) => {
          if (prev.tripTitle === state.tripTitle) return prev;
          return { ...prev, tripTitle: state.tripTitle };
        });
      }
      if (state.savedTrips && state.savedTrips.length > 0) {
        setSavedTrips((prev) => {
          const merged = sanitizeTrips(state.savedTrips);
          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
      }
    };

    const handleSync = async () => {
      const cloudState = await cloudDb.pullCloudState();
      if (cloudState) {
        applyState(cloudState);
      }
    };

    handleSync();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('online', handleFocusOrVisible);

    const unsubCloud = cloudDb.onCloudStateChange((state) => {
      applyState(state);
    });

    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('online', handleFocusOrVisible);
      unsubCloud();
    };
  }, []);

  // Push updates to Cloud DB whenever items, title, or savedTrips change
  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    cloudDb.pushCloudState({
      items,
      tripTitle: settings.tripTitle,
      savedTrips,
      people: settings.people,
    });
  }, [items, settings.tripTitle, savedTrips]);

  // Sync Service connection & incoming message listener
  useEffect(() => {
    const unsubState = syncService.onStateChange((connected, _count, code) => {
      setIsSyncActive(connected);
      setSyncCode(code);
    });

    const unsubData = syncService.onData((payload) => {
      isRemoteUpdate.current = true;
      if (payload.type === 'SYNC_FULL_STATE' || payload.type === 'UPDATE_ITEMS') {
        if (payload.items) {
          setItems(payload.items);
        }
        if (payload.tripTitle) {
          setSettings((prev) => ({ ...prev, tripTitle: payload.tripTitle! }));
        }
        if (payload.savedTrips) {
          setSavedTrips((prev) => sanitizeTrips([...prev, ...payload.savedTrips!]));
        }
      } else if (payload.type === 'UPDATE_TITLE') {
        if (payload.tripTitle) {
          setSettings((prev) => ({ ...prev, tripTitle: payload.tripTitle! }));
        }
      } else if (payload.type === 'UPDATE_REPOSITORY') {
        if (payload.savedTrips) {
          setSavedTrips((prev) => sanitizeTrips([...prev, ...payload.savedTrips!]));
        }
      }
    });

    // Auto-connect if URL query parameter contains ?sync=CODE
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync');
    if (syncParam) {
      syncService.connectToRoom(syncParam, items, settings.tripTitle, savedTrips);
    }

    return () => {
      unsubState();
      unsubData();
    };
  }, []);

  const handleSaveTrip = (title?: string, itemsToSave?: PackingItem[]) => {
    const targetTitle = (title || settings.tripTitle || 'Vacation Packing List').trim();
    const targetItems = itemsToSave || items;
    const now = new Date().toISOString();
    const normKey = normalizeTripName(targetTitle);

    setSavedTrips((prev) => {
      // 1. Check if activeTripId exists in repository
      if (activeTripId) {
        const existingIndex = prev.findIndex((t) => t.id === activeTripId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            title: targetTitle,
            savedAt: now,
            items: JSON.parse(JSON.stringify(targetItems)),
            people: JSON.parse(JSON.stringify(settings.people)),
          };
          return sanitizeTrips(updated);
        }
      }

      // 2. Check if a trip with matching normalized title exists to update IN-PLACE
      const sameTitleIndex = prev.findIndex(
        (t) => normalizeTripName(t.title) === normKey
      );
      if (sameTitleIndex !== -1) {
        const updated = [...prev];
        updated[sameTitleIndex] = {
          ...updated[sameTitleIndex],
          title: targetTitle,
          savedAt: now,
          items: JSON.parse(JSON.stringify(targetItems)),
          people: JSON.parse(JSON.stringify(settings.people)),
        };
        setActiveTripId(updated[sameTitleIndex].id);
        return sanitizeTrips(updated);
      }

      // 3. Otherwise create a single entry
      const newId = 'trip_' + Date.now();
      setActiveTripId(newId);
      const newTrip: SavedTrip = {
        id: newId,
        title: targetTitle,
        savedAt: now,
        items: JSON.parse(JSON.stringify(targetItems)),
        people: JSON.parse(JSON.stringify(settings.people)),
      };
      return sanitizeTrips([newTrip, ...prev]);
    });
  };

  const handleStartNewTrip = (newTitle: string) => {
    // 1. Save current active trip in-place before starting fresh
    if (items.length > 0) {
      handleSaveTrip(settings.tripTitle || 'Vacation Packing List', items);
    }

    // 2. Prepare items for new trip (uncheck, preserve bag assignments & N/A flags)
    const resetItems = items.map((item) => ({ ...item, packed: false }));
    setActiveTripId(null);
    setSettings((prev) => ({
      ...prev,
      tripTitle: newTitle,
    }));
    setItems(resetItems);

    // 3. Save new trip in-place into repository immediately
    handleSaveTrip(newTitle, resetItems);
  };

  const handleLoadTrip = (savedTrip: SavedTrip) => {
    // 1. Save currently open trip in-place before switching
    if (items.length > 0) {
      handleSaveTrip(settings.tripTitle || 'Vacation Packing List', items);
    }

    // 2. Open the selected archived trip
    setActiveTripId(savedTrip.id);
    setItems(JSON.parse(JSON.stringify(savedTrip.items)));
    setSettings((prev) => ({
      ...prev,
      tripTitle: savedTrip.title,
    }));
  };

  const handleDeleteSavedTrip = (id: string) => {
    if (activeTripId === id) {
      setActiveTripId(null);
    }
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
  };

  // Save to LocalStorage whenever items change and broadcast to live peers
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (syncService.getIsConnected()) {
      syncService.broadcastPayload({
        type: 'UPDATE_ITEMS',
        items,
        tripTitle: settings.tripTitle,
      });
    }
  }, [items]);

  // Save settings whenever they change and broadcast title updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (syncService.getIsConnected() && settings.tripTitle) {
      syncService.broadcastPayload({
        type: 'UPDATE_TITLE',
        tripTitle: settings.tripTitle,
      });
    }
  }, [settings]);

  // Tab counters computed for all people and shared (excludes N/A items from denominators)
  const counts = useMemo(() => {
    const res: Record<string, { packed: number; total: number }> = {
      shared: { packed: 0, total: 0 },
    };

    (settings.people || []).forEach((p) => {
      res[p.id] = { packed: 0, total: 0 };
    });

    items.forEach((item) => {
      if (item.isNA) return; // N/A items decrease denominator by 1
      if (!res[item.owner]) {
        res[item.owner] = { packed: 0, total: 0 };
      }
      res[item.owner].total += 1;
      if (item.packed) res[item.owner].packed += 1;
    });

    return res;
  }, [items, settings.people]);

  // Total applicable items (excludes N/A items so denominator decreases by 1 for each N/A item)
  const applicableItems = useMemo(() => items.filter((i) => !i.isNA), [items]);
  const totalItems = applicableItems.length;
  const packedItems = applicableItems.filter((i) => i.packed).length;

  // Trigger celebration confetti when 100% packed
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0d9488', '#06b6d4', '#10b981', '#f59e0b'],
    });
  };

  // Handlers for items
  const handleTogglePacked = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextPacked = !item.packed;
          return { ...item, packed: nextPacked };
        }
        return item;
      });

      // Check if this action made the list 100% complete
      const total = updated.length;
      const packed = updated.filter((i) => i.packed).length;
      if (total > 0 && packed === total) {
        triggerConfetti();
      }

      return updated;
    });
  };

  const handleUpdateLuggage = (id: string, luggage: PackingItem['luggage']) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, luggage } : item))
    );
  };

  const handleToggleLastMinute = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLastMinute: !item.isLastMinute } : item
      )
    );
  };

  // Toggle item N/A (not applicable for this trip)
  const handleToggleNA = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isNA: !item.isNA } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditItemText = (id: string, newText: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  const handleAddItem = (newItem: Omit<PackingItem, 'id' | 'createdAt'>) => {
    const item: PackingItem = {
      ...newItem,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    setItems((prev) => [item, ...prev]);
  };

  const handleToggleBagFilter = (bag: LuggageType) => {
    if (bag === 'all') {
      setSelectedBags([]);
      return;
    }
    const bagType = bag as Exclude<LuggageType, 'all'>;
    setSelectedBags((prev) =>
      prev.includes(bagType) ? prev.filter((b) => b !== bagType) : [...prev, bagType]
    );
  };

  const handleResetTrip = () => {
    setItems((prev) => prev.map((item) => ({ ...item, packed: false })));
  };

  // Clear all bag selections
  const handleClearAllLuggage = () => {
    setItems((prev) => prev.map((item) => ({ ...item, luggage: 'unassigned' })));
  };

  // Reset to starter items
  const handleReloadStarterItems = () => {
    setItems(STARTER_ITEMS.map((item) => ({ ...item, luggage: 'unassigned' })));
  };

  // Clear all items
  const handleClearAllItems = () => {
    setItems([]);
  };

  // Filter items for current view
  const currentTabItems = useMemo(() => {
    return items.filter((item) => item.owner === activeTab);
  }, [items, activeTab]);

  const morningOfCount = useMemo(() => {
    return currentTabItems.filter((i) => i.isLastMinute && !i.isNA).length;
  }, [currentTabItems]);

  const naCount = useMemo(() => {
    return currentTabItems.filter((i) => i.isNA).length;
  }, [currentTabItems]);

  const displayedItems = useMemo(() => {
    return currentTabItems
      .filter((item) => {
        // If showing N/A view, filter for N/A items specifically
        if (showNAItems) {
          return !!item.isNA;
        }
        // Otherwise hide items marked N/A on this trip
        if (item.isNA) return false;

        if (showMorningOfOnly && !item.isLastMinute) return false;
        if (selectedBags.length > 0 && !selectedBags.includes(item.luggage as any)) {
          return false;
        }
        if (packedFilter === 'unpacked' && item.packed) return false;
        if (packedFilter === 'packed' && !item.packed) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesText = item.text.toLowerCase().includes(q);
          const matchesCategory = item.category?.toLowerCase().includes(q);
          const matchesOwner = item.owner?.toLowerCase().includes(q);
          const matchesLuggage = item.luggage?.toLowerCase().includes(q);
          if (!matchesText && !matchesCategory && !matchesOwner && !matchesLuggage) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
  }, [currentTabItems, showMorningOfOnly, selectedBags, packedFilter, showNAItems, searchQuery]);

  const groupedDisplayedItems = useMemo(() => {
    if (!groupByCategory) return null;
    const groups: Record<string, PackingItem[]> = {};
    displayedItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [displayedItems, groupByCategory]);

  const areAllDisplayedPacked = useMemo(() => {
    if (displayedItems.length === 0) return false;
    return displayedItems.every((i) => i.packed);
  }, [displayedItems]);

  const handleToggleSelectAllDisplayed = () => {
    if (displayedItems.length === 0) return;
    const targetState = !areAllDisplayedPacked;
    const displayedIds = new Set(displayedItems.map((i) => i.id));

    setItems((prev) => {
      const updated = prev.map((item) =>
        displayedIds.has(item.id) ? { ...item, packed: targetState } : item
      );

      const total = updated.length;
      const packed = updated.filter((i) => i.packed).length;
      if (targetState && total > 0 && packed === total) {
        triggerConfetti();
      }

      return updated;
    });
  };

  const activePerson = settings.people?.find((p) => p.id === activeTab);
  const activeOwnerDisplayName =
    activeTab === 'shared' ? 'Shared' : (activePerson?.name || activeTab);

  const handleRenameTripTitle = (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setSettings((prev) => ({
      ...prev,
      tripTitle: trimmed,
    }));
    handleSaveTrip(trimmed, items);
  };

  const handleImportSavedTrips = (importedTrips: SavedTrip[]) => {
    setSavedTrips((prev) => sanitizeTrips([...prev, ...importedTrips]));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 pb-safe">
      {/* Frozen Pane Top Section (Header, Person Tabs & Bag Filters remain fixed like Excel Freeze Panes) */}
      <div className="sticky top-0 z-30 shadow-xs">
        {/* Top Header */}
        <Header
          settings={settings}
          totalItems={totalItems}
          packedItems={packedItems}
          onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenRepositoryModal={() => setIsRepositoryModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenBagBreakdown={() => setIsBagBreakdownOpen(true)}
          onResetTrip={handleResetTrip}
          onRenameTripTitle={handleRenameTripTitle}
          isSyncActive={isSyncActive}
          syncCode={syncCode}
        />

        {/* Person Tabs (Nina, Mike, Jesse, Teddy, Shared) */}
        <TabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          settings={settings}
          counts={counts}
        />

        {/* Bag & Filter Bar */}
        <LuggageFilter
          selectedBags={selectedBags}
          onToggleBagFilter={handleToggleBagFilter}
          showMorningOfOnly={showMorningOfOnly}
          onToggleMorningOfOnly={() => setShowMorningOfOnly(!showMorningOfOnly)}
          packedFilter={packedFilter}
          onPackedFilterChange={setPackedFilter}
          morningOfCount={morningOfCount}
          onToggleSelectAll={handleToggleSelectAllDisplayed}
          areAllDisplayedPacked={areAllDisplayedPacked}
          showNAItems={showNAItems}
          onToggleShowNAItems={() => setShowNAItems(!showNAItems)}
          naCount={naCount}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          groupByCategory={groupByCategory}
          onToggleGroupByCategory={() => setGroupByCategory(!groupByCategory)}
        />
      </div>

      {/* Main List Area */}
      <main className="max-w-2xl mx-auto px-4 w-full flex-1 mt-1 space-y-4">
        {/* Quick Add Bar */}
        <AddItemBar
          activeOwner={activeTab}
          ownerName={activeOwnerDisplayName}
          onAddItem={handleAddItem}
        />

        {/* Item List */}
        {displayedItems.length > 0 ? (
          groupByCategory && groupedDisplayedItems ? (
            <div className="space-y-6">
              {Object.entries(groupedDisplayedItems).map(([category, catItems]) => (
                <div key={category} className="space-y-2.5">
                  <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>{category}</span>
                    <span className="text-slate-400 font-normal">({catItems.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {catItems.map((item) => (
                      <PackingItemRow
                        key={item.id}
                        item={item}
                        onTogglePacked={handleTogglePacked}
                        onUpdateLuggage={handleUpdateLuggage}
                        onToggleLastMinute={handleToggleLastMinute}
                        onToggleNA={handleToggleNA}
                        onDeleteItem={handleDeleteItem}
                        onEditItemText={handleEditItemText}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedItems.map((item) => (
                <PackingItemRow
                  key={item.id}
                  item={item}
                  onTogglePacked={handleTogglePacked}
                  onUpdateLuggage={handleUpdateLuggage}
                  onToggleLastMinute={handleToggleLastMinute}
                  onToggleNA={handleToggleNA}
                  onDeleteItem={handleDeleteItem}
                  onEditItemText={handleEditItemText}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center my-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No items found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {showMorningOfOnly
                ? 'No morning-of items in this tab. Click the ⏰ icon on any item to mark it as last-minute!'
                : packedFilter === 'unpacked' && currentTabItems.length > 0
                ? 'All items in this tab are packed! 🎉 Select "All" or "Packed" above to view packed items.'
                : packedFilter === 'packed' && currentTabItems.length > 0
                ? 'No items packed yet in this tab. Check off items as you pack to see them here!'
                : `No items in ${activeOwnerDisplayName}'s list yet. Type above to add your first item!`}
            </p>
          </div>
        )}

        {/* All packed celebration banner in this tab */}
        {(counts[activeTab]?.total ?? 0) > 0 &&
          counts[activeTab]?.packed === counts[activeTab]?.total && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs animate-in fade-in">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">
                  {activeOwnerDisplayName}'s packing is 100% complete! 🎉
                </p>
                <p className="text-xs text-emerald-700/80 mt-0.5">
                  Everything is checked off and ready for the trip.
                </p>
              </div>
            </div>
          )}
      </main>

      {/* Modals */}
      <NewTripModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        onStartNewTrip={handleStartNewTrip}
        currentTripTitle={settings.tripTitle}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        items={items}
        onReloadStarterItems={handleReloadStarterItems}
        onClearAllItems={handleClearAllItems}
        onClearAllLuggage={handleClearAllLuggage}
      />

      <TripRepositoryModal
        isOpen={isRepositoryModalOpen}
        onClose={() => setIsRepositoryModalOpen(false)}
        currentItems={items}
        currentSettings={settings}
        savedTrips={savedTrips}
        onSaveTrip={handleSaveTrip}
        onLoadTrip={handleLoadTrip}
        onDeleteSavedTrip={handleDeleteSavedTrip}
        onLoadOriginalMaster={handleReloadStarterItems}
        onImportSavedTrips={handleImportSavedTrips}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentItems={items}
        currentTitle={settings.tripTitle}
        savedTrips={savedTrips}
      />

      <BagBreakdownModal
        isOpen={isBagBreakdownOpen}
        onClose={() => setIsBagBreakdownOpen(false)}
        items={items}
      />
    </div>
  );
}

export default App;
