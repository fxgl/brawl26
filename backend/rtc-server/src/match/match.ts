import { ConnectionStatusEnum, DataPacketWrapper, Match, MessageType, Scores } from '../../../shared/datapacket';
import { ClientProfile } from '../types';
import { changeAndNotifyStatusChange } from '../utils/helpers';
import { MATCH_TIMEOUT } from '../server/config';

// Function to create a new match with multiple peers
export function createMatch(
    peerIds: string[], 
    maxPeers: number,
    activeMatches: Map<string, Match>,
    peerToMatchMap: Map<string, string>,
    connectedPeers: Map<string, ClientProfile>
): void {
    const matchId = `match_${Date.now()}_${peerIds.join('_')}`;
    const hostId = peerIds[0]; // First peer is the host by default

    // Set up match timeout (10 minutes = 600000 ms)
    const timeoutId = setTimeout(() => {
        endMatch(matchId, activeMatches, peerToMatchMap, connectedPeers);
    }, MATCH_TIMEOUT);

    // Create match object
    const match: Match = {
        matchId,
        peerIds,
        hostId,
        startTime: Date.now(),
        timeoutId,
        activeMembers: peerIds.length,
        results: peerIds.map(id => ({ peerId: id, result: {} })),
        finalScore: {result:{}}
    };

    // Store match
    activeMatches.set(matchId, match);

    // Map peers to this match
    for (const peerId of peerIds) {
        peerToMatchMap.set(peerId, matchId);
    }

    // Notify all peers about the match
    notifyMatchCreated(match, connectedPeers);
}

// Function to end a match
export function endMatch(
    matchId: string,
    activeMatches: Map<string, Match>,
    peerToMatchMap: Map<string, string>,
    connectedPeers: Map<string, ClientProfile>
): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    // Clear the timeout
    clearTimeout(match.timeoutId);

    // Determine the final score if possible (find majority)
    calculateFinalScore(match);

    // Get peer profiles and update their states
    for (const peerId of match.peerIds) {
        const peerProfile = connectedPeers.get(peerId);
        if (peerProfile && peerProfile.state === ConnectionStatusEnum.match) {
            changeAndNotifyStatusChange(peerProfile, ConnectionStatusEnum.connected);

            // Notify peer that match has ended with the final result
            peerProfile.rtcClient.send<DataPacketWrapper>({
                type: MessageType.DATA, packet: {
                    type: MessageType.MATCH_ENDED,
                    matchEnded: {
                        reason: "Match has ended",
                        finalScore: match.finalScore
                    }
                }
            });
        }

        // Remove match mappings
        peerToMatchMap.delete(peerId);
    }

    // Delete the match
    activeMatches.delete(matchId);
}

// Calculate the final score based on majority voting
export function calculateFinalScore(match: Match): void {
    // Count occurrences of each score
    const scoreCount = new Map<Scores, number>();

    // Skip null scores (peers who left without submitting)
    for (const result of match.results) {
        if (result !== null) {
            const count = scoreCount.get(result) || 0;
            scoreCount.set(result, count + 1);
        }
    }

    // Find the score with the most votes
    let maxCount = 0;
    let majorityScore: Scores|null = null;

    for (const [score, count] of scoreCount.entries()) {
        if (count > maxCount) {
            maxCount = count;
            majorityScore = score;
        }
    }

    // Only set the final score if there's a clear majority
    if (majorityScore && maxCount > match.results.filter(r => r !== null).length / 2) {
        match.finalScore = majorityScore;
    }
}

// Function to handle a peer leaving a match
export function leavePeerFromMatch(
    peerId: string, 
    matchId: string,
    activeMatches: Map<string, Match>,
    connectedPeers: Map<string, ClientProfile>
): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    const peerProfile = connectedPeers.get(peerId);

    // Update peer state if still connected
    if (peerProfile) {
        match.activeMembers--;
        changeAndNotifyStatusChange(peerProfile, ConnectionStatusEnum.connected);
    }

    // If this was the host, assign a new host
    if (match.hostId === peerId && match.activeMembers > 0) {
        assignNewHost(match, connectedPeers);
    }

    // Notify other peers in the match
    for (const otherPeerId of match.peerIds) {
        if (otherPeerId !== peerId && connectedPeers.has(otherPeerId)) {
            const otherPeer = connectedPeers.get(otherPeerId);
            if (otherPeer) {
                otherPeer.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.PEER_LEFT_MATCH,
                        peerLeftMatch: { peerId: peerId }
                    }
                });
            }
        }
    }
}

// Assign a new host for a match
export function assignNewHost(match: Match, connectedPeers: Map<string, ClientProfile>): void {
    // Find the first connected peer to be the new host
    for (const peerId of match.peerIds) {
        if (connectedPeers.has(peerId) && peerId !== match.hostId) {
            match.hostId = peerId;

            // Notify the new host
            const newHost = connectedPeers.get(peerId);
            if (newHost) {
                newHost.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.HOST_ASSIGNED,
                        hostAssigned: { isHost: true }
                    }
                });
            }

            // Notify all other peers about the new host
            for (const otherPeerId of match.peerIds) {
                if (otherPeerId !== peerId && connectedPeers.has(otherPeerId)) {
                    const otherPeer = connectedPeers.get(otherPeerId);
                    if (otherPeer) {
                        otherPeer.rtcClient.send<DataPacketWrapper>({
                            type: MessageType.DATA, packet: {
                                type: MessageType.HOST_CHANGED,
                                hostChanged: { newHostId: peerId }
                            }
                        });
                    }
                }
            }

            break;
        }
    }
}

// Function to notify a peer about reconnecting to an existing match
export function notifyMatchReconnection(
    reconnectedPeerId: string, 
    match: Match,
    connectedPeers: Map<string, ClientProfile>
): void {
    const reconnectedPeer = connectedPeers.get(reconnectedPeerId)?.rtcClient;

    if (reconnectedPeer) {
        // Notify the reconnected peer with all match information
        reconnectedPeer.send<DataPacketWrapper>({
            type: MessageType.DATA, packet: {
                type: MessageType.MATCH_RECONNECTED,
                matchReconnected: {
                    matchId: match.matchId,
                    peerIds: match.peerIds,
                    isHost: match.hostId === reconnectedPeerId,
                }
            }
        });
    }
}

// Function to notify peers about a created match
export function notifyMatchCreated(match: Match, connectedPeers: Map<string, ClientProfile>): void {
    for (const peerId of match.peerIds) {
        const peer = connectedPeers.get(peerId)?.rtcClient;
        if (peer) {
            peer.send<DataPacketWrapper>({
                type: MessageType.DATA, packet: {
                    type: MessageType.MATCH_CREATED,
                    matchCreated: {
                        matchId: match.matchId,
                        peerIds: match.peerIds,
                        isHost: match.hostId === peerId
                    }
                }
            });
        }
    }
}
