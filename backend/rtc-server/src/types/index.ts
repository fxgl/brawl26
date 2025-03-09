import { IClient } from 'peer';
import {ConnectionStatusEnum,  Scores} from "../../../shared/datapacket";

// Client profile type
export interface ClientProfile {
    rtcClient: IClient;
    state: ConnectionStatusEnum;
}

// Global state maps - we'll export these from our main index.ts file
export interface GlobalState {
    activeMatches: Map<string, Match>;
    peerToMatchMap: Map<string, string>;
    connectedPeers: Map<string, ClientProfile>;
    activeProposals: Map<string, MatchProposal>;
}

// Structure to track match proposals
export interface MatchProposal {
    initiatorId: string;
    targetPeerIds: string[];
    acceptedPeers: Set<string>;
    timeoutId: NodeJS.Timeout;
    hostId: string;
    maxPeers: number;
}

export interface Match {
    matchId: string;
    peerIds: string[];
    hostId: string;
    startTime: number;
    timeoutId: NodeJS.Timeout;
    activeMembers: number;
    results: Scores[];
    finalScore: Scores; // The final agreed score (or null if no consensus)
}


// Re-export types from shared datapacket
export {
    ConnectionStatusEnum,
    Scores
}
