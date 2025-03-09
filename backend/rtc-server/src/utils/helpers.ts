import { IClient } from 'peer';
import { DataPacketWrapper, MessageType, ConnectionStatusEnum } from '../../../shared/datapacket';
import { ClientProfile } from '../types';

// Helper function to change peer status and notify them
export function changeAndNotifyStatusChange(profile: ClientProfile, status: ConnectionStatusEnum): void {
    const peer = profile?.rtcClient;
    const packet: DataPacketWrapper = {
        type: MessageType.DATA, packet: {
            type: MessageType.STATUS_UPDATE,
            statusUpdate: { statusFrom: profile?.state, statusTo: status }
        }
    };
    profile.state = status;
    peer.send<DataPacketWrapper>(packet);
}

// Helper function to notify a peer about an error
export function notifyError(profile: ClientProfile, message: string): void {
    const peer = profile?.rtcClient;
    const packet: DataPacketWrapper = {
        type: MessageType.DATA, packet: {
            type: MessageType.SERVER_ERROR,
            serverError: { message: message }
        }
    };
    peer.send<DataPacketWrapper>(packet);
}

// Generate a unique proposal ID
export function generateProposalId(initiatorId: string, targetPeerIds: string[]): string {
    return `proposal_${Date.now()}_${initiatorId}_${targetPeerIds.join('_')}`;
}

// Function to broadcast peer list updates to all connected peers
export function broadcastPeerUpdate(connectedPeers: Map<string, ClientProfile>): void {
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
