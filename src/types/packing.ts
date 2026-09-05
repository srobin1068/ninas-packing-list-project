export type LuggageType = 'all' | 'carry_on' | 'checked' | 'personal' | 'diaper' | 'computer' | 'unassigned';

export type ItemOwner = 'nina' | 'mike' | 'jesse' | 'teddy' | 'shared' | string;

export type PackedFilterType = 'all' | 'unpacked' | 'packed';

export interface Person {
  id: string;
  name: string;
}

export interface PackingItem {
  id: string;
  text: string;
  packed: boolean;
  owner: ItemOwner;
  luggage: 'carry_on' | 'checked' | 'personal' | 'diaper' | 'computer' | 'unassigned';
  isLastMinute: boolean;
  isNA?: boolean;
  category?: string;
  createdAt: number;
}

export interface UserSettings {
  tripTitle: string;
  people: Person[];
}

export interface SavedTrip {
  id: string;
  title: string;
  savedAt: string;
  items: PackingItem[];
  people: Person[];
}

export const LUGGAGE_INFO: Record<Exclude<LuggageType, 'all'>, { label: string; icon: string; shortLabel: string; bg: string; text: string; border: string }> = {
  carry_on: {
    label: 'Carry-On Suitcase',
    shortLabel: 'Carry-On',
    icon: '🧳',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  checked: {
    label: 'Checked Luggage',
    shortLabel: 'Checked',
    icon: '✈️',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  personal: {
    label: 'Backpack / Personal Item',
    shortLabel: 'Personal Bag',
    icon: '🎒',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  diaper: {
    label: 'Diaper Bag',
    shortLabel: 'Diaper Bag',
    icon: '👶',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  computer: {
    label: 'Computer / Laptop Bag',
    shortLabel: 'Computer Bag',
    icon: '💻',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  unassigned: {
    label: 'Unassigned Bag',
    shortLabel: 'Any Bag',
    icon: '📦',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};
