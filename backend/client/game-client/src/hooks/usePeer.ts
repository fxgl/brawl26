import {useState, useEffect, useCallback} from 'react';
import {DataConnection} from 'peerjs';
import {PeerJSOption, peerService} from '../utils/peerService';
import {DataPacket} from "../../../../shared/datapacket.ts";


interface UsePeerOptions {
    onConnection?: (conn: DataConnection) => void;
    onDisconnection?: (peerId: string) => void;
    onData?: (peerId: string, data: DataPacket) => void;
    onServerData?: (data: DataPacket) => void;
    onError?: (error: Error) => void;
    test?:string;
}

// Define the default options outside the hook function
const DEFAULT_PEER_OPTIONS: PeerJSOption = {
  config: {
    iceServers: [
      {
        urls: 'stun:brawl.positrondynamics.tech:3478'
      },
      {
        urls: 'turn:brawl.positrondynamics.tech:3479',
        username: 'webrtcuser',
        credential: 'webrtcpassword'
      },
      {
        urls: 'turns:brawl.positrondynamics.tech:5349',
        username: 'webrtcuser',
        credential: 'webrtcpassword'
      }
    ],
    iceTransportPolicy: 'all',
  },
//  port: 443, secure: true,
//  host: 'brawl.positrondynamics.tech',
    host: 'localhost', port: 9001,
    path: '/peerjs/', key: 'fxbrawl',
};

export function usePeer(options: UsePeerOptions) {
    const [myPeerId, setMyPeerId] = useState<string | null>(null);
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);



    // Initialize the peer
    const initialize = useCallback(async (id: string) => {
        setIsConnecting(true);
        setError(null);

        try {
            console.log(`initialize ${id}`);
            const peerId = await peerService.initialize(id, DEFAULT_PEER_OPTIONS);
            console.log(`connected ${peerId}`);
            setMyPeerId(peerId);
            return peerId;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Connect to a remote peer
    const connect = useCallback(async (remotePeerId: string) => {
        setIsConnecting(true);
        setError(null);

        try {
            const conn = await peerService.connect(remotePeerId);
            //setConnectedPeers(peerService.getConnectedPeers());
            return conn;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Send data to a specific peer
    const send = useCallback((peerId: string, data: DataPacket) => {
        return peerService.send(peerId, data);
    }, []);
    const sendServer = useCallback((data: DataPacket) => {
        return peerService.sendServer(data);
    }, []);


    // Broadcast data to all connected peers
    const broadcast = useCallback((data: DataPacket) => {
        peerService.broadcast(data);
    }, []);

    // Clean up on unmount
    useEffect(() => {
        console.error('peerService.create')
        // Set up event handlers
        peerService.setEvents({
            onConnection: (conn: DataConnection) => {
                setConnectedPeers(peerService.getConnectedPeers());
                options.onConnection?.(conn);
            },
            onDisconnection: (peerId: string) => {
                setConnectedPeers(peerService.getConnectedPeers());
                options.onDisconnection?.(peerId);
            },
            onData: options.onData,
            onServerData: options.onServerData,
            onError: (err: Error) => {
                setError(err);
                options.onError?.(err);
            }
        });


        // Clean up on unmount
        return () => {
            console.error('peerService.destroy();')
            peerService.destroy();
        };
    }, []);

    return {
        myPeerId,
        connectedPeers,
        isConnecting,
        error,
        initialize,
        connect,
        send,
        sendServer,
        broadcast,
        destroy: peerService.destroy.bind(peerService)
    };
}
