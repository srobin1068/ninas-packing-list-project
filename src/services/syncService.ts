import Peer, { type DataConnection } from 'peerjs';
import type { PackingItem, UserSettings, SavedTrip } from '../types/packing';

export interface SyncPayload {
  type: 'SYNC_FULL_STATE' | 'UPDATE_ITEMS' | 'UPDATE_TITLE' | 'UPDATE_REPOSITORY' | 'REQUEST_INITIAL_STATE';
  senderId: string;
  timestamp: number;
  items?: PackingItem[];
  tripTitle?: string;
  people?: UserSettings['people'];
  savedTrips?: SavedTrip[];
}

type SyncListener = (payload: SyncPayload) => void;
type ConnectionStateListener = (isConnected: boolean, peerCount: number, roomCode: string | null) => void;

class SyncManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private roomCode: string | null = null;
  private myId: string = Math.random().toString(36).substring(2, 9);

  private dataListeners: Set<SyncListener> = new Set();
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private isConnected: boolean = false;

  constructor() {
    this.initBroadcastChannel();
  }

  // Local browser cross-tab synchronization (BroadcastChannel)
  private initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('packmate_tab_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.senderId !== this.myId) {
          this.notifyDataListeners(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser environment', e);
    }
  }

  // Generate human-friendly 6-character room code (e.g. PACK-7K9X)
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PACK-${result}`;
  }

  // Host or Join a Real-Time Sync Room
  public async connectToRoom(
    code: string,
    currentItems?: PackingItem[],
    currentTitle?: string,
    currentSavedTrips?: SavedTrip[]
  ): Promise<string> {
    const cleanCode = code.trim().toUpperCase();
    this.roomCode = cleanCode;

    // Sanitize peer ID format for PeerJS
    const sanitizePeerId = (c: string) => `packmate_room_${c.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const hostPeerId = sanitizePeerId(cleanCode);

    // Destroy existing peer if any
    if (this.peer) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      // Try to become the Host for this Room Code
      const peer = new Peer(hostPeerId, {
        debug: 1,
      });

      peer.on('open', () => {
        this.peer = peer;
        this.isConnected = true;
        this.notifyStateListeners();

        // Listen for incoming peer connections
        peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn, currentItems, currentTitle, currentSavedTrips);
        });

        resolve(cleanCode);
      });

      peer.on('error', (err) => {
        // If host ID is already taken, connect as a Client to the host
        if (err.type === 'unavailable-id') {
          peer.destroy();
          this.connectAsClient(hostPeerId, cleanCode, currentItems, currentTitle, currentSavedTrips)
            .then(resolve)
            .catch(reject);
        } else {
          console.error('PeerJS connection error:', err);
          // Fallback to local mode with BroadcastChannel
          this.isConnected = true;
          this.notifyStateListeners();
          resolve(cleanCode);
        }
      });
    });
  }

  private connectAsClient(
    hostPeerId: string,
    cleanCode: string,
    _currentItems?: PackingItem[],
    _currentTitle?: string,
    _currentSavedTrips?: SavedTrip[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const clientPeer = new Peer({ debug: 1 });

      clientPeer.on('open', () => {
        this.peer = clientPeer;
        const conn = clientPeer.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          this.connections.set(hostPeerId, conn);
          this.isConnected = true;
          this.notifyStateListeners();

          conn.on('data', (data: any) => {
            this.notifyDataListeners(data);
          });

          // Request initial state from host
          const req: SyncPayload = {
            type: 'REQUEST_INITIAL_STATE',
            senderId: this.myId,
            timestamp: Date.now(),
          };
          conn.send(req);

          resolve(cleanCode);
        });

        conn.on('close', () => {
          this.connections.delete(hostPeerId);
          this.notifyStateListeners();
        });

        conn.on('error', (err) => {
          console.error('Client connection error:', err);
          reject(err);
        });
      });

      clientPeer.on('error', (err) => {
        reject(err);
      });
    });
  }

  private handleIncomingConnection(
    conn: DataConnection,
    currentItems?: PackingItem[],
    currentTitle?: string,
    currentSavedTrips?: SavedTrip[]
  ) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.notifyStateListeners();

      // Send initial full state to newly joined peer
      if (currentItems || currentSavedTrips) {
        const payload: SyncPayload = {
          type: 'SYNC_FULL_STATE',
          senderId: this.myId,
          timestamp: Date.now(),
          items: currentItems,
          tripTitle: currentTitle,
          savedTrips: currentSavedTrips,
        };
        conn.send(payload);
      }
    });

    conn.on('data', (data: any) => {
      if (data && data.type === 'REQUEST_INITIAL_STATE') {
        if (currentItems || currentSavedTrips) {
          const payload: SyncPayload = {
            type: 'SYNC_FULL_STATE',
            senderId: this.myId,
            timestamp: Date.now(),
            items: currentItems,
            tripTitle: currentTitle,
            savedTrips: currentSavedTrips,
          };
          conn.send(payload);
        }
      } else {
        this.notifyDataListeners(data);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.notifyStateListeners();
    });
  }

  // Broadcast data payload to all connected peers and local tabs
  public broadcastPayload(payload: Omit<SyncPayload, 'senderId' | 'timestamp'>) {
    const fullPayload: SyncPayload = {
      ...payload,
      senderId: this.myId,
      timestamp: Date.now(),
    };

    // 1. Broadcast to local tabs via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullPayload);
      } catch (e) {
        console.error('BroadcastChannel postMessage error:', e);
      }
    }

    // 2. Broadcast to connected remote peers via PeerJS
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(fullPayload);
      }
    });
  }

  // Subscribe to data events
  public onData(listener: SyncListener): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  // Subscribe to connection state events
  public onStateChange(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    // Initial call
    listener(this.isConnected, this.connections.size, this.roomCode);
    return () => this.stateListeners.delete(listener);
  }

  public getRoomCode(): string | null {
    return this.roomCode;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getPeerCount(): number {
    return this.connections.size;
  }

  // Disconnect from current room
  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.roomCode = null;
    this.isConnected = false;
    this.notifyStateListeners();
  }

  private notifyDataListeners(payload: SyncPayload) {
    this.dataListeners.forEach((listener) => listener(payload));
  }

  private notifyStateListeners() {
    this.stateListeners.forEach((listener) =>
      listener(this.isConnected, this.connections.size, this.roomCode)
    );
  }
}

export const syncService = new SyncManager();
