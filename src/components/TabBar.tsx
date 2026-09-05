import React from 'react';
import type { ItemOwner, UserSettings } from '../types/packing';
import { User, HeartHandshake, Smile, Sparkles, UserCheck } from 'lucide-react';

interface TabBarProps {
  activeTab: ItemOwner;
  onSelectTab: (tab: ItemOwner) => void;
  settings: UserSettings;
  counts: Record<ItemOwner, { packed: number; total: number }>;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  counts,
}) => {
  const getPersonIcon = (id: string, index: number) => {
    if (id === 'nina') return <User className="w-4 h-4" />;
    if (id === 'mike') return <UserCheck className="w-4 h-4" />;
    if (id === 'jesse') return <Smile className="w-4 h-4" />;
    if (id === 'teddy') return <Sparkles className="w-4 h-4" />;
    return index % 2 === 0 ? <Smile className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const tabs: { id: ItemOwner; label: string; icon: React.ReactNode }[] = [
    ...(settings.people || []).map((person, idx) => ({
      id: person.id,
      label: person.name,
      icon: getPersonIcon(person.id, idx),
    })),
    {
      id: 'shared',
      label: 'Shared',
      icon: <HeartHandshake className="w-4 h-4" />,
    },
  ];

  const useGrid = tabs.length <= 5;

  return (
    <div className="bg-white border-b border-slate-200 px-1.5 sm:px-3 pt-2">
      <div
        className={`max-w-2xl mx-auto pb-0.5 ${
          useGrid ? 'grid gap-1' : 'flex gap-1.5 overflow-x-auto no-scrollbar'
        }`}
        style={useGrid ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const stat = counts[tab.id] || { packed: 0, total: 0 };
          const isDone = stat.total > 0 && stat.packed === stat.total;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-t-xl transition-all relative border-b-2 text-xs sm:text-sm ${
                useGrid ? 'w-full min-w-0' : 'flex-1 min-w-[72px] shrink-0'
              } ${
                isActive
                  ? 'border-teal-600 text-teal-700 font-semibold bg-teal-50/40 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 max-w-full min-w-0">
                <span className={`shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                <span className="truncate font-medium text-[11px] sm:text-xs leading-tight">
                  {tab.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5 mt-0.5 text-[10px] sm:text-[11px]">
                <span
                  className={`px-1.5 py-0.2 rounded-full font-bold ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isActive
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stat.packed}/{stat.total}
                </span>
                {isDone && <span className="text-[9px]">✨</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
