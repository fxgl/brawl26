// Import modules
import { IClient, IMessage } from 'peer';
import { ConnectionStatusEnum, DataPacket, DataPacketWrapper, MessageType, Scores } from "../../shared/datapacket";
import {ClientProfile, Match, MatchProposal} from './types';
import { peerServer, server, startServer } from './server/server';
import { MAX_PEERS_PER_MATCH } from './server/config';
import { broadcastPeerUpdate, changeAndNotifyStatusChange, generateProposalId, notifyError } from './utils/helpers';
import { 
    assignNewHost, 
    calculateFinalScore, 
    createMatch as createMatchFn, 
    endMatch as endMatchFn, 
    leavePeerFromMatch,
    notifyMatchCreated, 
    notifyMatchReconnection
} from './match/match';
import { submitScore as submitScoreFn, notifyScoreSubmitted as notifyScoreSubmittedFn } from './score/score';
import { 
    attemptMatchmaking as attemptMatchmakingFn, 
    handleProposalTimeout as handleProposalTimeoutFn, 
    notifyPotentialMatch as notifyPotentialMatchFn 
} from './matchmaking/matchmaking';
import { 
    handlePeerConnection, 
    handlePeerDisconnection, 
    handlePeerMessage, 
    handlePeerStateChange as handlePeerStateChangeFn
} from './peerConnection/peerConnection';

// Global state maps - these need to be exported for tests
export const activeMatches: Map<string, Match> = new Map(); // matchId -> Match
export const peerToMatchMap: Map<string, string> = new Map(); // peerId -> matchId
export const connectedPeers: Map<string, ClientProfile> = new Map();
export const activeProposals: Map<string, MatchProposal> = new Map(); // proposalId -> MatchProposal

// For backward compatibility, re-export types
export { ClientProfile };

// Forward compatibility for existing tests
export { generateProposalId };

// Setup peer server event handlers
peerServer.on('connection', (client: IClient) => {
    handlePeerConnection(client, connectedPeers, peerToMatchMap, activeMatches);
    broadcastPeerUpdate(connectedPeers);
});

peerServer.on('disconnect', (client: IClient) => {
    handlePeerDisconnection(client, connectedPeers, peerToMatchMap, activeMatches);
    broadcastPeerUpdate(connectedPeers);
});

peerServer.on('message', (client: IClient, message: IMessage) => {
    handlePeerMessage(client, message, connectedPeers, activeMatches, peerToMatchMap, activeProposals);
});

peerServer.on('error', (error: Error) => {
    console.log(`PeerServer error: ${error.message}`);
});

// Export functions with backward compatibility wrapper
export function createMatch(peerIds: string[], maxPeers: number = MAX_PEERS_PER_MATCH): void {
    createMatchFn(peerIds, maxPeers, activeMatches, peerToMatchMap, connectedPeers);
}

export function endMatch(matchId: string): void {
    endMatchFn(matchId, activeMatches, peerToMatchMap, connectedPeers);
}



export function handlePeerStateChange(client: IClient, packet: DataPacket): void {
    handlePeerStateChangeFn(client, packet, connectedPeers, activeMatches, peerToMatchMap, activeProposals);
}

export function submitScore(peerId: string, matchId: string, scores: Scores): void {
    submitScoreFn(peerId, matchId, scores, activeMatches);
}

export function notifyScoreSubmitted(submitterId: string, matchId: string, scores: Scores): void {
    notifyScoreSubmittedFn(submitterId, matchId, scores, activeMatches, connectedPeers);
}

export function attemptMatchmaking(peerId: string, maxPeers: number): void {
    attemptMatchmakingFn(peerId, maxPeers, connectedPeers, activeMatches, peerToMatchMap, activeProposals);
}

export function notifyPotentialMatch(initiatorId: string, targetPeerIds: string[]): void {
    notifyPotentialMatchFn(initiatorId, targetPeerIds, connectedPeers, activeProposals);
}

export function handleProposalTimeout(proposalId: string): void {
    handleProposalTimeoutFn(proposalId, activeProposals, connectedPeers);
}

// Export for test compatibility
export { calculateFinalScore };

// Start the server if this file is directly executed
if (require.main === module) {
    startServer();
}
