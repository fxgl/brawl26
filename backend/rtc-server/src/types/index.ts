import { IClient } from 'peer';
import {ConnectionStatusEnum, Match, MatchProposal, Scores} from "../../../shared/datapacket";

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

// Re-export types from shared datapacket
export {
    ConnectionStatusEnum,
    Match,
    MatchProposal,
    Scores
}
