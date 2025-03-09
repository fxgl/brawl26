import { ConnectionStatusEnum, DataPacketWrapper, Match, MatchProposal, MessageType } from  "../../../shared/datapacket";
import { ClientProfile } from '../types';
import { changeAndNotifyStatusChange, generateProposalId } from '../utils/helpers';
import { MAX_PEERS_PER_MATCH, PROPOSAL_TIMEOUT } from '../server/config';
// Import removed to avoid circular dependencies - createMatch is used from index.ts

// Function to attempt matchmaking for a peer looking for a match
export function attemptMatchmaking(
    peerId: string, 
    maxPeers: number,
    connectedPeers: Map<string, ClientProfile>,
    activeMatches: Map<string, Match>,
    peerToMatchMap: Map<string, string>,
    activeProposals: Map<string, MatchProposal>
): void {
    const clientProfile = connectedPeers.get(peerId);
    if (!clientProfile || clientProfile.state !== ConnectionStatusEnum.lookingForMatch) return;

    // Collect all peers who are looking for a match
    const availablePeers: string[] = [];

    for (const [id, profile] of connectedPeers.entries()) {
        if (id !== peerId && profile.state === ConnectionStatusEnum.lookingForMatch) {
            availablePeers.push(id);

            // If we have enough peers to form a match, stop collecting
            if (availablePeers.length >= maxPeers - 1) {
                break;
            }
        }
    }

    // If we have at least one other peer, propose a match
    if (availablePeers.length > 0) {
        notifyPotentialMatch(
            peerId, 
            availablePeers, 
            connectedPeers, 
            activeProposals
        );
    }
}

export function notifyPotentialMatch(
    initiatorId: string, 
    targetPeerIds: string[],
    connectedPeers: Map<string, ClientProfile>,
    activeProposals: Map<string, MatchProposal>
): void {
    const initiator = connectedPeers.get(initiatorId)?.rtcClient;
    if (!initiator) return;

    // Create a unique proposal ID
    const proposalId = generateProposalId(initiatorId, targetPeerIds);

    // Create a timeout for this proposal (10 seconds)
    const timeoutId = setTimeout(() => {
        handleProposalTimeout(
            proposalId, 
            activeProposals, 
            connectedPeers
        );
    }, PROPOSAL_TIMEOUT);

    // Create and store the proposal
    const proposal: MatchProposal = {
        initiatorId,
        targetPeerIds,
        acceptedPeers: new Set([initiatorId]), // Initiator automatically accepts
        timeoutId,
        maxPeers: MAX_PEERS_PER_MATCH // Default, can be overridden
    };

    activeProposals.set(proposalId, proposal);

    // Send match proposal to initiator
    initiator.send<DataPacketWrapper>({
        type: MessageType.DATA, packet: {
            type: MessageType.MATCH_PROPOSED,
            matchProposed: {
                proposalId,
                targetPeerIds,
                timeoutSeconds: 10
            }
        }
    });

    // Notify target peers about the match opportunity
    for (const targetId of targetPeerIds) {
        const targetPeer = connectedPeers.get(targetId)?.rtcClient;
        if (targetPeer) {
            targetPeer.send<DataPacketWrapper>({
                type: MessageType.DATA, packet: {
                    type: MessageType.MATCH_OPPORTUNITY,
                    matchOpportunity: {
                        proposalId,
                        initiatorId,
                        allPeerIds: [initiatorId, ...targetPeerIds.filter(id => id !== targetId)],
                        timeoutSeconds: 10
                    }
                }
            });
        }
    }
}

// Handle proposal timeout
export function handleProposalTimeout(
    proposalId: string,
    activeProposals: Map<string, MatchProposal>,
    connectedPeers: Map<string, ClientProfile>
): void {
    const proposal = activeProposals.get(proposalId);
    if (!proposal) return;

    // Get all peers in the proposal
    const allPeerIds = [proposal.initiatorId, ...proposal.targetPeerIds];

    // Send timeout notifications to all peers
    for (const peerId of allPeerIds) {
        const peer = connectedPeers.get(peerId);
        if (peer) {
            // If they accepted, set back to lookingForMatch
            if (proposal.acceptedPeers.has(peerId)) {
                changeAndNotifyStatusChange(peer, ConnectionStatusEnum.lookingForMatch);

                // Notify about timeout
                peer.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.MATCH_PROPOSAL_TIMEOUT,
                        matchProposalTimeout: {
                            proposalId,
                            message: "Match proposal timed out. You've been returned to looking for match."
                        }
                    }
                });
            } else {
                // Non-accepted peers get a different message but stay in their current state
                peer.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.MATCH_PROPOSAL_TIMEOUT,
                        matchProposalTimeout: {
                            proposalId,
                            message: "Match proposal timed out. No action needed."
                        }
                    }
                });
            }
        }
    }

    // Clean up the proposal
    activeProposals.delete(proposalId);
}
