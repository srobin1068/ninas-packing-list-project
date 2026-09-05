import type { PackingItem, UserSettings, SavedTrip } from '../types/packing';

export interface CloudState {
  items: PackingItem[];
  tripTitle: string;
  savedTrips: SavedTrip[];
  people?: UserSettings['people'];
  updatedAt: number;
}

const LOCAL_FAMILY_KEY = 'packmate_cloud_family_data_v1';

class CloudDatabaseService {
  private syncListeners: Set<(state: CloudState) => void> = new Set();
  private lastContentKey: string = '';
  private pollInterval: any = null;

  constructor() {
    this.startPolling();
  }

  private startPolling() {
    if (typeof window === 'undefined') return;
    this.pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.pullCloudState();
      }
    }, 5000);
  }

  // Fetch full cloud state (items + saved trips repository)
  public async pullCloudState(): Promise<CloudState | null> {
    try {
      const res = await fetch('/api/sync', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data: CloudState = await res.json();
        if (data && data.items) {
          const contentKey = JSON.stringify({
            items: data.items,
            tripTitle: data.tripTitle,
            savedTrips: data.savedTrips,
            people: data.people,
          });

          if (contentKey !== this.lastContentKey) {
            this.lastContentKey = contentKey;
            localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(data));
            this.notifyListeners(data);
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('Sync server endpoint fallback to local cache', e);
    }

    // Fallback to localStorage cache
    try {
      const cached = localStorage.getItem(LOCAL_FAMILY_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const contentKey = JSON.stringify({
          items: parsed.items,
          tripTitle: parsed.tripTitle,
          savedTrips: parsed.savedTrips,
          people: parsed.people,
        });
        if (contentKey !== this.lastContentKey) {
          this.lastContentKey = contentKey;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading local cloud cache', e);
    }

    return null;
  }

  // Push updated state (items + tripTitle + savedTrips repository) to local sync server
  public async pushCloudState(state: Omit<CloudState, 'updatedAt'>): Promise<boolean> {
    const contentKey = JSON.stringify({
      items: state.items,
      tripTitle: state.tripTitle,
      savedTrips: state.savedTrips,
      people: state.people,
    });

    if (contentKey === this.lastContentKey) return true;
    this.lastContentKey = contentKey;

    const fullState: CloudState = {
      ...state,
      updatedAt: Date.now(),
    };
    const jsonStr = JSON.stringify(fullState);

    // 1. Always update local cache immediately
    try {
      localStorage.setItem(LOCAL_FAMILY_KEY, jsonStr);
    } catch (e) {
      console.error(e);
    }

    // 2. Push to local sync endpoint
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonStr,
      });
      return res.ok;
    } catch (e) {
      console.warn('Could not push to sync server endpoint', e);
      return false;
    }
  }

  public onCloudStateChange(listener: (state: CloudState) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifyListeners(state: CloudState) {
    this.syncListeners.forEach((l) => l(state));
  }

  public cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

export const cloudDb = new CloudDatabaseService();
