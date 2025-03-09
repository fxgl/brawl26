import express, {Request, Response, NextFunction} from 'express';
import {IClient, IMessage, PeerServer} from 'peer';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import {ConnectionStatusEnum, DataPacket, DataPacketWrapper, MessageType} from "../../shared/datapacket";

// Server configuration
const PORT = process.env.PORT || 3000;
const PEER_PORT = process.env.PEER_PORT || 9000;

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize PeerServer
const peerServer = PeerServer({
    port: Number(PEER_PORT),
    path: '/peerjs',
    host: 'localhost',
    //proxied: true,
    key: 'fxbrawl',
});


interface ClientProfile {
    rtcClient: IClient;
    state: ConnectionStatusEnum;
}

// After the existing interface definitions, add:
interface Match {
    peer1Id: string;
    peer2Id: string;
    startTime: number;
    timeoutId: NodeJS.Timeout;
}

// Active matches tracking
const activeMatches: Map<string, Match> = new Map(); // matchId -> Match
// Peer to match mapping for quick lookups
const peerToMatchMap: Map<string, string> = new Map(); // peerId -> matchId

// Connected peers tracking
const connectedPeers: Map<string, ClientProfile> = new Map();
// Update the connection handler to add peers to the map
// Update the connection handler to add peers to the map
peerServer.on('connection', (client: IClient) => {
    console.log(`New peer connected: ${client.getId()}`);
    const clientId = client.getId();

    // Add the new peer to connectedPeers map
    connectedPeers.set(clientId, {
        rtcClient: client,
        state: ConnectionStatusEnum.idle
    });

    const peer = connectedPeers.get(clientId);
    if (peer) {
        // Check if this peer was in a match
        const matchId = peerToMatchMap.get(clientId);
        if (matchId) {
            const match = activeMatches.get(matchId);
            if (match) {
                // Peer was in an active match, put them back in
                changeAndNotifyStatusChange(peer, ConnectionStatusEnum.match);

                // Notify them about their match
                const otherPeerId = match.peer1Id === clientId ? match.peer2Id : match.peer1Id;
                notifyMatchReconnection(clientId, otherPeerId);
            } else {
                // Match no longer exists
                peerToMatchMap.delete(clientId);
                changeAndNotifyStatusChange(peer, ConnectionStatusEnum.connected);
            }
        } else {
            // Normal connection
            changeAndNotifyStatusChange(peer, ConnectionStatusEnum.connected);
        }

        broadcastPeerUpdate();
    }
});
peerServer.on('disconnect', (client: IClient) => {
    const clientId = client.getId();
    console.log(`Peer disconnected: ${clientId}`);

    // Check if this peer was in a match
    const matchId = peerToMatchMap.get(clientId);

    // We don't remove from peerToMatchMap here to allow reconnection
    // But we do remove from connectedPeers
    connectedPeers.delete(clientId);

    // If they were in a match, notify the other peer
    if (matchId) {
        const match = activeMatches.get(matchId);
        if (match) {
            const otherPeerId = match.peer1Id === clientId ? match.peer2Id : match.peer1Id;
            const otherPeer = connectedPeers.get(otherPeerId);

            if (otherPeer) {
                otherPeer.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.PEER_DISCONNECTED,
                        peerDisconnected: { peerId: clientId }
                    }
                });
            }

            // If both peers are disconnected, end the match
            if (!connectedPeers.has(match.peer1Id) && !connectedPeers.has(match.peer2Id)) {
                endMatch(matchId);
            }
        }
    }

    // Notify remaining peers about the disconnection
    broadcastPeerUpdate();
});

// Add a function to handle messages that might change peer state
peerServer.on('message', (client: IClient, message: IMessage) => {


    // Parse the message to handle state changes
    try {
        const data = message as unknown as DataPacketWrapper;

        if (data.type === MessageType.DATA && data.packet) {
            console.log(`New peer message: ${client.getId()} ${JSON.stringify(message)}`);
            handlePeerStateChange(client, data.packet);
        }
    } catch (error) {
        console.error(`Error processing message from ${client.getId()}:`, error);
    }
});

// Function to create a new match between two peers
function createMatch(peer1Id: string, peer2Id: string): void {
    const matchId = `match_${Date.now()}_${peer1Id}_${peer2Id}`;

    // Set up match timeout (10 minutes = 600000 ms)
    const timeoutId = setTimeout(() => {
        endMatch(matchId);
    }, 600000);

    // Create match object
    const match: Match = {
        peer1Id,
        peer2Id,
        startTime: Date.now(),
        timeoutId
    };

    // Store match
    activeMatches.set(matchId, match);

    // Map peers to this match
    peerToMatchMap.set(peer1Id, matchId);
    peerToMatchMap.set(peer2Id, matchId);

    // Notify both peers about the match
    notifyMatchCreated(peer1Id, peer2Id);
}

// Function to end a match
function endMatch(matchId: string,peer:string): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    // Clear the timeout
    clearTimeout(match.timeoutId);

    // Get peer profiles
    const peer1Profile = connectedPeers.get(match.peer1Id);
    const peer2Profile = connectedPeers.get(match.peer2Id);

    // Update peer states if they're still connected
    if (peer1Profile && peer1Profile.state === ConnectionStatusEnum.match) {
        changeAndNotifyStatusChange(peer1Profile, ConnectionStatusEnum.connected);
    }

    if (peer2Profile && peer2Profile.state === ConnectionStatusEnum.match) {
        changeAndNotifyStatusChange(peer2Profile, ConnectionStatusEnum.connected);
    }

    // Remove match mappings
    peerToMatchMap.delete(match.peer1Id);
    peerToMatchMap.delete(match.peer2Id);
    activeMatches.delete(matchId);

    // Notify peers that match has ended
    if (peer1Profile) {
        peer1Profile.rtcClient.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_ENDED,
                matchEnded: { reason: "Match time limit reached" }
            }
        });
    }

    if (peer2Profile) {
        peer2Profile.rtcClient.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_ENDED,
                matchEnded: { reason: "Match time limit reached" }
            }
        });
    }
}


// Function to handle peer state changes based on messages
function handlePeerStateChange(client: IClient, packet: DataPacket): void {
    const clientId = client.getId();
    const clientProfile = connectedPeers.get(clientId);

    if (!clientProfile) return;

    // Update state based on packet type
    switch (packet.type) {
        case MessageType.LOOKING_FOR_MATCH:
            changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.lookingForMatch);
            attemptMatchmaking(clientId);
            break;

        case MessageType.CANCEL_MATCH_SEARCH:
            if(clientProfile && clientProfile.state === ConnectionStatusEnum.lookingForMatch) {
                changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.connected);
            }
            else
            {
                notifyError( clientProfile,`cant cancel match search while in ${clientProfile.state}`);
            }
            break;

        case MessageType.CANCEL_MATCH:
            if(clientProfile && clientProfile.state === ConnectionStatusEnum.match) {
                // Get the match this peer is in
                const matchId = peerToMatchMap.get(clientId);
                if (matchId) {
                    endMatch(matchId,clientId);
                } else {
                    changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.connected);
                }
            }
            else
            {
                notifyError(clientProfile, `Can't cancel match while in ${clientProfile.state}`);
            }
            break;

        case MessageType.MATCH_ACCEPTED:
            // Logic for when a match is accepted
            if (packet.matchAccepted && packet.matchAccepted.targetPeerId) {
                const targetPeerId = packet.matchAccepted.targetPeerId;
                const targetProfile = connectedPeers.get(targetPeerId);

                if (targetProfile && targetProfile.state === ConnectionStatusEnum.lookingForMatch) {
                    // Use the changeAndNotifyStatusChange function for both peers
                    changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.match);
                    changeAndNotifyStatusChange(targetProfile, ConnectionStatusEnum.match);

                    // Create a match between the two peers
                    createMatch(clientId, targetPeerId);
                }
            }
            break;
    }

    // Update the map with the new state
    connectedPeers.set(clientId, clientProfile);
}

// Function to notify a peer about reconnecting to an existing match
function notifyMatchReconnection(reconnectedPeerId: string, otherPeerId: string): void {
    const reconnectedPeer = connectedPeers.get(reconnectedPeerId)?.rtcClient;
    const otherPeer = connectedPeers.get(otherPeerId)?.rtcClient;

    if (reconnectedPeer) {
        // Notify the reconnected peer
        reconnectedPeer.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_RECONNECTED,
                matchReconnected: { targetPeerId: otherPeerId }
            }
        });
    }

    if (otherPeer) {
        // Notify the other peer that their opponent has reconnected
        otherPeer.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.PEER_RECONNECTED,
                peerReconnected: { peerId: reconnectedPeerId }
            }
        });
    }
}

// Function to attempt matchmaking for a peer looking for a match
function attemptMatchmaking(peerId: string): void {
    const clientProfile = connectedPeers.get(peerId);
    if (!clientProfile || clientProfile.state !== ConnectionStatusEnum.lookingForMatch) return;

    // Find another peer looking for a match
    for (const [id, profile] of connectedPeers.entries()) {
        if (id !== peerId && profile.state === ConnectionStatusEnum.lookingForMatch) {
            // Notify both peers about potential match
            notifyPotentialMatch(peerId, id);
            break;
        }
    }
}

// Function to notify peers about a potential match
function notifyPotentialMatch(peer1Id: string, peer2Id: string): void {
    const peer1 = connectedPeers.get(peer1Id)?.rtcClient;
    const peer2 = connectedPeers.get(peer2Id)?.rtcClient;

    if (peer1 && peer2) {
        // Send match proposal to both peers
        // peer1.send<DataPacketWrapper>({
        //     type: MessageType.DATA, packet: {
        //         type: MessageType.MATCH_PROPOSED,
        //         matchProposed: { targetPeerId: peer2Id }
        //     }
        // });

        peer2.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_PROPOSED,
                matchProposed: { targetPeerId: peer1Id }
            }
        });
    }
}

function changeAndNotifyStatusChange(profile: ClientProfile,status:ConnectionStatusEnum ): void {
        const peer = profile?.rtcClient;
        const packet:DataPacketWrapper = {
            type: MessageType.DATA, packet: {
                type: MessageType.STATUS_UPDATE,
                statusUpdate: { statusFrom: profile?.state, statusTo: status }
            }
        }
        profile.state = status;
        peer.send<DataPacketWrapper>(packet);
}

function notifyError(profile: ClientProfile,message:string ): void {
    const peer = profile?.rtcClient;
    const packet:DataPacketWrapper = {
        type: MessageType.DATA, packet: {
            type: MessageType.SERVER_ERROR,
            serverError: { message: message }
        }
    }
    peer.send<DataPacketWrapper>(packet);
}


// Function to notify peers about a created match
function notifyMatchCreated(peer1Id: string, peer2Id: string): void {
    const peer1 = connectedPeers.get(peer1Id)?.rtcClient;
    const peer2 = connectedPeers.get(peer2Id)?.rtcClient;

    if (peer1 && peer2) {
        // Send match confirmation to both peers
        peer1.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_CREATED,
                matchCreated: { targetPeerId: peer2Id }
            }
        });

        peer2.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_CREATED,
                matchCreated: { targetPeerId: peer1Id }
            }
        });
    }
}

// Function to broadcast peer list updates to all connected peers
function broadcastPeerUpdate(): void {
    const peerIds = Array.from(connectedPeers.keys());

    for (const [id, profile] of connectedPeers.entries()) {
        profile.rtcClient.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.PEER_LIST_UPDATE,
                peerListUpdate: { connectedPeers: peerIds }
            }
        });
    }
}

// Handle server errors
peerServer.on('error', (error: Error) => {
    console.log(`PeerServer error: ${error.message}`);
});
