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

// Connected peers tracking
const connectedPeers: Map<string, ClientProfile> = new Map();
// Update the connection handler to add peers to the map
peerServer.on('connection', (client: IClient) => {
    console.log(`New peer connected: ${client.getId()}`);

    // Add the new peer to connectedPeers map
     connectedPeers.set(client.getId(), {
        rtcClient: client,
        state: ConnectionStatusEnum.idle
    });
     const peer = connectedPeers.get(client.getId());
     if (peer) {
         changeAndNotifyStatusChange(peer, ConnectionStatusEnum.connected);
         broadcastPeerUpdate();
     }
});

// Update the disconnect handler to remove peers from the map
peerServer.on('disconnect', (client: IClient) => {
    console.log(`Peer disconnected: ${client.getId()}`);

    // Remove the disconnected peer from the map
    connectedPeers.delete(client.getId());

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

        case MessageType.MATCH_ACCEPTED:
            // Logic for when a match is accepted
            if (packet.matchAccepted && packet.matchAccepted.targetPeerId) {
                const targetPeerId = packet.matchAccepted.targetPeerId;
                const targetProfile = connectedPeers.get(targetPeerId);

                if (targetProfile && targetProfile.state === ConnectionStatusEnum.lookingForMatch) {
                    // Use the changeAndNotifyStatusChange function for both peers
                    changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.match);
                    changeAndNotifyStatusChange(targetProfile, ConnectionStatusEnum.match);

                    // Notify both peers about the match
                    notifyMatchCreated(clientId, targetPeerId);
                }
            }
            break;
    }

    // Update the map with the new state
    connectedPeers.set(clientId, clientProfile);
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
