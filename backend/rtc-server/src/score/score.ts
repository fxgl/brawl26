import {  MessageType, DataPacketWrapper, Scores } from  "../../../shared/datapacket";
import {ClientProfile, Match} from '../types';

// Submit a score for a peer in a match
export function submitScore(
    peerId: string, 
    matchId: string, 
    scores: Scores,
    activeMatches: Map<string, Match>
): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    // Add the score to the results array
    match.results.push(scores);
}

// Notify all peers that a score was submitted
export function notifyScoreSubmitted(
    submitterId: string, 
    matchId: string, 
    scores: Scores,
    activeMatches: Map<string, Match>,
    connectedPeers: Map<string, ClientProfile>
): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    for (const peerId of match.peerIds) {
        if (connectedPeers.has(peerId)) {
            const peer = connectedPeers.get(peerId);
            if (peer) {
                peer.rtcClient.send<DataPacketWrapper>({
                    type: MessageType.DATA, packet: {
                        type: MessageType.SCORE_SUBMITTED,
                        scoreSubmitted: {
                            peerId: submitterId,
                            scores: scores
                        }
                    }
                });
            }
        }
    }
}
