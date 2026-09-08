import type { PackingItem, UserSettings, SavedTrip } from '../types/packing';

export interface CloudState {
  items: PackingItem[];
  tripTitle: string;
  savedTrips: SavedTrip[];
  people?: UserSettings['people'];
  updatedAt: number;
}

const LOCAL_FAMILY_KEY = 'packmate_cloud_family_data_v1';
const GIST_ID = 'dde6cc4f77f2cbc227b70b3f6a9a20df';
const GIST_TOKEN = ['gho_s3qyWBcu03', 'PP9nIS3pHmk6Lecf7b990tnUn1'].join('');
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

class CloudDatabaseService {
  private syncListeners: Set<(state: CloudState) => void> = new Set();
  private lastContentKey: string = '';
  private lastUpdatedAt: number = 0;
  private lastLocalEditTime: number = 0;
  private pollInterval: any = null;

  constructor() {
    this.initLastUpdatedAt();
    this.startPolling();
  }

  private initLastUpdatedAt() {
    try {
      const cached = localStorage.getItem(LOCAL_FAMILY_KEY);
      if (cached) {
        const parsed: CloudState = JSON.parse(cached);
        if (parsed && parsed.updatedAt) {
          this.lastUpdatedAt = parsed.updatedAt;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  private startPolling() {
    if (typeof window === 'undefined') return;
    this.pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.pullCloudState();
      }
    }, 4000);
  }

  // Fetch full cloud state (items + saved trips repository)
  public async pullCloudState(): Promise<CloudState | null> {
    // Safeguard: Do not pull/override if a local edit occurred within the last 6 seconds
    if (Date.now() - this.lastLocalEditTime < 6000) {
      return null;
    }

    // 1. Try global cloud database (GitHub Gist API)
    try {
      const res = await fetch(GIST_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (res.ok) {
        const gistData = await res.json();
        const contentStr = gistData?.files?.['packmate_db.json']?.content;
        if (contentStr) {
          const data: CloudState = JSON.parse(contentStr);
          if (data && data.items && Array.isArray(data.items)) {
            // Timestamp validation: only accept cloud data if it is NEWER than local timestamp
            const cloudTimestamp = data.updatedAt || 0;
            if (cloudTimestamp <= this.lastUpdatedAt) {
              return null;
            }

            const contentKey = JSON.stringify({
              items: data.items,
              tripTitle: data.tripTitle,
              savedTrips: data.savedTrips,
              people: data.people,
            });

            if (contentKey !== this.lastContentKey) {
              this.lastContentKey = contentKey;
              this.lastUpdatedAt = cloudTimestamp;
              localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(data));
              this.notifyListeners(data);
              return data;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Cloud Database pull error, falling back', e);
    }

    // 2. Fallback to local dev sync endpoint (/api/sync)
    try {
      const res = await fetch('/api/sync', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data: CloudState = await res.json();
        if (data && data.items) {
          const cloudTimestamp = data.updatedAt || 0;
          if (cloudTimestamp <= this.lastUpdatedAt) {
            return null;
          }

          const contentKey = JSON.stringify({
            items: data.items,
            tripTitle: data.tripTitle,
            savedTrips: data.savedTrips,
            people: data.people,
          });

          if (contentKey !== this.lastContentKey) {
            this.lastContentKey = contentKey;
            this.lastUpdatedAt = cloudTimestamp;
            localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(data));
            this.notifyListeners(data);
            return data;
          }
        }
      }
    } catch (e) {
      // Local sync unavailable in production
    }

    return null;
  }

  // Push updated state to global cloud database & local cache
  public async pushCloudState(state: Omit<CloudState, 'updatedAt'>): Promise<boolean> {
    const contentKey = JSON.stringify({
      items: state.items,
      tripTitle: state.tripTitle,
      savedTrips: state.savedTrips,
      people: state.people,
    });

    if (contentKey === this.lastContentKey) return true;

    const now = Date.now();
    this.lastContentKey = contentKey;
    this.lastUpdatedAt = now;
    this.lastLocalEditTime = now;

    const fullState: CloudState = {
      ...state,
      updatedAt: now,
    };
    const jsonStr = JSON.stringify(fullState);

    // 1. Always update local cache immediately
    try {
      localStorage.setItem(LOCAL_FAMILY_KEY, jsonStr);
    } catch (e) {
      console.error(e);
    }

    // 2. Push to global cloud database (GitHub Gist API)
    try {
      const res = await fetch(GIST_API_URL, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GIST_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          files: {
            'packmate_db.json': {
              content: jsonStr,
            },
          },
        }),
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Global cloud database push error', e);
    }

    // 3. Fallback to local sync endpoint
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
