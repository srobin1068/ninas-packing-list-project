import type { SavedTrip } from '../types/packing';
import { STARTER_ITEMS } from './starterItems';

export const STARTER_TRIPS: SavedTrip[] = [
  {
    id: 'starter_hudson_valley',
    title: 'Hudson Valley',
    savedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    items: STARTER_ITEMS.map((item) => {
      if (item.text.toLowerCase().includes('jacket') || item.text.toLowerCase().includes('sweater')) {
        return { ...item, packed: true, luggage: 'carry_on' };
      }
      return { ...item, packed: false };
    }),
    people: [
      { id: 'nina', name: 'Nina' },
      { id: 'mike', name: 'Mike' },
      { id: 'jesse', name: 'Jesse' },
      { id: 'teddy', name: 'Teddy' },
    ],
  },
  {
    id: 'starter_louisville',
    title: 'Louisville October 2026',
    savedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: STARTER_ITEMS.map((item) => {
      if (item.text.toLowerCase().includes('shoe') || item.text.toLowerCase().includes('hat')) {
        return { ...item, packed: true, luggage: 'personal' };
      }
      return { ...item, packed: false };
    }),
    people: [
      { id: 'nina', name: 'Nina' },
      { id: 'mike', name: 'Mike' },
      { id: 'jesse', name: 'Jesse' },
      { id: 'teddy', name: 'Teddy' },
    ],
  },
];
