import { IClient, IMessage } from 'peer';
import { ConnectionStatusEnum, DataPacket, DataPacketWrapper, MessageType, Scores } from  "../../../shared/datapacket";
import {ClientProfile, Match, MatchProposal} from '../types';
import { changeAndNotifyStatusChange, notifyError } from '../utils/helpers';
import { MAX_PEERS_PER_MATCH } from '../server/config';
import { assignNewHost, endMatch, leavePeerFromMatch, notifyMatchReconnection } from '../match/match';
import { submitScore, notifyScoreSubmitted } from '../score/score';
import { attemptMatchmaking } from '../matchmaking/matchmaking';

// Function to handle peer state changes based on messages
export function handlePeerStateChange(
    client: IClient, 
    packet: DataPacket,
    connectedPeers: Map<string, ClientProfile>,
    activeMatches: Map<string, Match>,
    peerToMatchMap: Map<string, string>,
    activeProposals: Map<string, MatchProposal>
): void {
    const clientId = client.getId();
    const clientProfile = connectedPeers.get(clientId);

    if (!clientProfile) return;

    // Update state based on packet type
    switch (packet.type) {
        case MessageType.LOOKING_FOR_MATCH:
            const maxPeers = packet.lookingForMatch?.maxPeers || MAX_PEERS_PER_MATCH;
            changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.lookingForMatch);
            attemptMatchmaking(
                clientId, 
                maxPeers, 
                connectedPeers, 
                activeMatches, 
                peerToMatchMap, 
                activeProposals
            );
            break;

        case MessageType.CANCEL_MATCH_SEARCH:
            if(clientProfile && clientProfile.state === ConnectionStatusEnum.lookingForMatch) {
                changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.connected);
            } else {
                notifyError(clientProfile, `Can't cancel match search while in ${clientProfile.state}`);
            }
            break;

        case MessageType.LEAVE_MATCH:
            if(clientProfile && clientProfile.state === ConnectionStatusEnum.match) {
                // Get the match this peer is in
                const matchId = peerToMatchMap.get(clientId);
                if (matchId) {
                    // Submit a score if provided
                    if (packet.leaveMatch && packet.leaveMatch.scores !== undefined) {
                        submitScore(clientId, matchId, packet.leaveMatch.scores, activeMatches);
                    }

                    leavePeerFromMatch(clientId, matchId, activeMatches, connectedPeers);
                } else {
                    changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.connected);
                }
            } else {
                notifyError(clientProfile, `Can't leave match while in ${clientProfile.state}`);
            }
            break;

        case MessageType.MATCH_ACCEPT:
            if (packet.matchAccept && packet.matchAccept.proposalId) {
                const proposalId = packet.matchAccept.proposalId;
                const proposal = activeProposals.get(proposalId);

                if (proposal) {
                    // Check if this peer is part of the proposal
                    const allPeerIds = [proposal.initiatorId, ...proposal.targetPeerIds];
                    if (allPeerIds.includes(clientId)) {
                        // Mark this peer as accepting
                        proposal.acceptedPeers.add(clientId);

                        // Notify all peers in the proposal about this acceptance
                        for (const peerId of allPeerIds) {
                            const peer = connectedPeers.get(peerId);
                            if (peer) {
                                peer.rtcClient.send<DataPacketWrapper>({
                                    type: MessageType.DATA, packet: {
                                        type: MessageType.PEER_ACCEPTED_MATCH,
                                        peerAcceptedMatch: {
                                            proposalId,
                                            hostPeerId: proposal.hostId,
                                            acceptedCount: proposal.acceptedPeers.size,
                                            totalCount: allPeerIds.length
                                        }
                                    }
                                });
                            }
                        }

                        // Temporarily change peer status to indicate they're in the accepting state
                        changeAndNotifyStatusChange(clientProfile, ConnectionStatusEnum.matchAccepting);

                        // Check if everyone has accepted
                        if (proposal.acceptedPeers.size === allPeerIds.length) {
                            // Everyone accepted! Create the match
                            clearTimeout(proposal.timeoutId);

                            // Change state for all peers to match
                            for (const peerId of allPeerIds) {
                                const profile = connectedPeers.get(peerId);
                                if (profile) {
                                    changeAndNotifyStatusChange(profile, ConnectionStatusEnum.match);
                                }
                            }

                            // Create the match with all peers
                            // This needs to be imported from index.ts to avoid circular dependencies
                            // The main index.ts createMatch function will have access to all the maps
                            const { createMatch } = require('../index');
                            createMatch(allPeerIds, proposal.maxPeers);

                            // Clean up the proposal
                            activeProposals.delete(proposalId);
                        }
                    } else {
                        notifyError(clientProfile, "You are not part of this match proposal");
                    }
                } else {
                    notifyError(clientProfile, "Match proposal not found or has expired");
                }
            }
            break;

        case MessageType.MATCH_DECLINE:
            if (packet.matchDecline && packet.matchDecline.proposalId) {
                const proposalId = packet.matchDecline.proposalId;
                const proposal = activeProposals.get(proposalId);

                if (proposal) {
                    // Get all peers in the proposal
                    const allPeerIds = [proposal.initiatorId, ...proposal.targetPeerIds];

                    // Notify all peers that this one declined
                    for (const peerId of allPeerIds) {
                        const peer = connectedPeers.get(peerId);
                        if (peer) {
                            peer.rtcClient.send<DataPacketWrapper>({
                                type: MessageType.DATA, packet: {
                                    type: MessageType.PEER_DECLINED_MATCH,
                                    peerDeclinedMatch: {
                                        proposalId,
                                        peerId: clientId
                                    }
                                }
                            });

                            // If this peer had accepted, set them back to lookingForMatch
                            if (proposal.acceptedPeers.has(peerId)) {
                                changeAndNotifyStatusChange(peer, ConnectionStatusEnum.lookingForMatch);
                            }
                        }
                    }

                    // Cancel the timeout
                    clearTimeout(proposal.timeoutId);

                    // Clean up the proposal
                    activeProposals.delete(proposalId);
                }
            }
            break;

        case MessageType.SUBMIT_SCORE:
            if (clientProfile && clientProfile.state === ConnectionStatusEnum.match) {
                const matchId = peerToMatchMap.get(clientId);
                if (matchId && packet.submitScore && packet.submitScore.scores !== undefined) {
                    submitScore(clientId, matchId, packet.submitScore.scores, activeMatches);
                    notifyScoreSubmitted(
                        clientId, 
                        matchId, 
                        packet.submitScore.scores, 
                        activeMatches, 
                        connectedPeers
                    );
                } else {
                    notifyError(clientProfile, "Failed to submit score: Invalid match or score");
                }
            } else {
                notifyError(clientProfile, `Can't submit score while in ${clientProfile.state}`);
            }
            break;
    }

    // Update the map with the new state
    connectedPeers.set(clientId, clientProfile);
}

// Handle new peer connection
export function handlePeerConnection(
    client: IClient,
    connectedPeers: Map<string, ClientProfile>,
    peerToMatchMap: Map<string, string>,
    activeMatches: Map<string, Match>
): void {
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
                match.activeMembers++;

                // Notify them about their match
                notifyMatchReconnection(clientId, match, connectedPeers);

                // Also notify other peers in the match about the reconnection
                for (const peerId of match.peerIds) {
                    if (peerId !== clientId && connectedPeers.has(peerId)) {
                        const otherPeer = connectedPeers.get(peerId);
                        if (otherPeer) {
                            otherPeer.rtcClient.send<DataPacketWrapper>({
                                type: MessageType.DATA, packet: {
                                    type: MessageType.PEER_RECONNECTED,
                                    peerReconnected: { peerId: clientId }
                                }
                            });
                        }
                    }
                }
            } else {
                // Match no longer exists
                peerToMatchMap.delete(clientId);
                changeAndNotifyStatusChange(peer, ConnectionStatusEnum.connected);
            }
        } else {
            // Normal connection
            changeAndNotifyStatusChange(peer, ConnectionStatusEnum.connected);
        }
    }
}

// Handle peer disconnection
export function handlePeerDisconnection(
    client: IClient,
    connectedPeers: Map<string, ClientProfile>,
    peerToMatchMap: Map<string, string>,
    activeMatches: Map<string, Match>
): void {
    const clientId = client.getId();
    console.log(`Peer disconnected: ${clientId}`);

    // Check if this peer was in a match
    const matchId = peerToMatchMap.get(clientId);

    // We don't remove from peerToMatchMap here to allow reconnection
    // But we do remove from connectedPeers
    connectedPeers.delete(clientId);

    // If they were in a match, handle it appropriately
    if (matchId) {
        const match = activeMatches.get(matchId);
        if (match) {
            match.activeMembers--;

            // Notify all other peers in the match about the disconnection
            for (const peerId of match.peerIds) {
                if (peerId !== clientId && connectedPeers.has(peerId)) {
                    const otherPeer = connectedPeers.get(peerId);
                    if (otherPeer) {
                        otherPeer.rtcClient.send<DataPacketWrapper>({
                            type: MessageType.DATA, packet: {
                                type: MessageType.PEER_DISCONNECTED,
                                peerDisconnected: { peerId: clientId }
                            }
                        });
                    }
                }
            }

            // If the host disconnected, assign a new host
            if (match.hostId === clientId && match.activeMembers > 0) {
                assignNewHost(match, connectedPeers);
            }

            // If no peers are left in the match, close it
            if (match.activeMembers <= 0) {
                endMatch(matchId, activeMatches, peerToMatchMap, connectedPeers);
            }
        }
    }
}

// Handle peer message
export function handlePeerMessage(
    client: IClient, 
    message: IMessage,
    connectedPeers: Map<string, ClientProfile>,
    activeMatches: Map<string, Match>,
    peerToMatchMap: Map<string, string>,
    activeProposals: Map<string, MatchProposal>
): void {
    // Parse the message to handle state changes
    try {
        const data = message as unknown as DataPacketWrapper;

        if (data.type === MessageType.DATA && data.packet) {
            console.log(`New peer message: ${client.getId()} ${JSON.stringify(message)}`);
            handlePeerStateChange(
                client, 
                data.packet, 
                connectedPeers,
                activeMatches,
                peerToMatchMap,
                activeProposals
            );
        }
    } catch (error) {
        console.error(`Error processing message from ${client.getId()}:`, error);
    }
}
