import Peer, { DataConnection } from 'peerjs';

export interface DataPacket {
  type: string;
  payload: string;
  timestamp?: number;
  senderId?: string;
}
interface PeerServiceEvents {
  onConnection: (conn: DataConnection) => void;
  onDisconnection: (peerId: string) => void;
  onData: (peerId: string, data: DataPacket) => void;
  onError: (error: Error) => void;
}



export class PeerJSOption {
  config?: {
    iceServers?: Array<{
      urls: string;
      username?: string;
      credential?: string;
    }>;
    iceTransportPolicy?: 'all' | 'relay';
  };
  port?: number;
  secure?: boolean;
  host?: string;
  path?: string;
  key?: string;
  debug?: number;
  pingInterval?: number;
}

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private events: Partial<PeerServiceEvents> = {};

  private isDataPacket(data: unknown): data is DataPacket {
    return (
        data !== null &&
        typeof data === 'object' &&
        'type' in data &&
        'payload' in data &&
        typeof data.type === 'string' &&
        typeof data.payload === 'string'
    );
  }

  /**
   * Initialize a new Peer connection
   * @param id Optional custom peer ID
   * @param options Optional PeerJS options
   */
  initialize(id: string, options?: PeerJSOption): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Initializing peer with ID:', id);
        this.peer = new Peer(id, options);
        console.log(`peer created ${this.peer.id}`);

        this.peer.on('open', (id) => {
          console.log('My peer ID is:', id);
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (this.events.onError) {
            this.events.onError(err);
          }
          reject(err);
        });
        console.log('waiting')
      } catch (error) {
        console.error('Failed to initialize peer:', error);
        reject(error);
      }
    });
  }

  /**
   * Connect to a remote peer
   * @param remotePeerId The ID of the peer to connect to
   */
  connect(remotePeerId: string): Promise<DataConnection> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      try {
        const conn = this.peer.connect(remotePeerId);

        conn.on('open', () => {
          this.handleConnection(conn);
          resolve(conn);
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          if (this.events.onError) {
            this.events.onError(err);
          }
          reject(err);
        });
      } catch (error) {
        console.error('Failed to connect to peer:', error);
        reject(error);
      }
    });
  }

  /**
   * Send data to a specific peer
   * @param peerId The ID of the peer to send data to
   * @param data The data to send
   */
  send(peerId: string, data: DataPacket): boolean {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }

  /**
   * Broadcast data to all connected peers
   * @param data The data to broadcast
   */
  broadcast(data: DataPacket): void {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  /**
   * Set event handlers
   * @param events Object containing event handlers
   */
  setEvents(events: Partial<PeerServiceEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Close all connections and destroy the peer
   */
  destroy(): void {
    this.connections.forEach((conn) => {
      conn.close();
    });
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /**
   * Get the current peer ID
   */
  getId(): string | null {
    return this.peer ? this.peer.id : null;
  }

  /**
   * Get all connected peer IDs
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Handle new connections
   */
  private handleConnection(conn: DataConnection): void {
    const peerId = conn.peer;
    this.connections.set(peerId, conn);

    if (this.events.onConnection) {
      this.events.onConnection(conn);
    }

    conn.on('data', (data) => {
      if (this.events.onData && this.isDataPacket(data)) {
        this.events.onData(peerId, data);
      }
    });

    conn.on('close', () => {
      this.connections.delete(peerId);
      if (this.events.onDisconnection) {
        this.events.onDisconnection(peerId);
      }
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      if (this.events.onError) {
        this.events.onError(err);
      }
    });
  }
}

// Export a singleton instance
export const peerService = new PeerService();

// Also export the class for testing or if multiple instances are needed
export default PeerService;
