// Message types enum
export enum MessageType {
    WELCOME = 'welcome',
    DATA = 'data',
    PEER_JOINED = 'peerJoined',
    PEER_LEFT = 'peerLeft',
    BROADCAST = 'broadcast',
    MESSAGE = 'message',
    SIGNAL = 'signal',
    SERVER_MESSAGE = 'serverMessage',
    // New message types for matchmaking
    LOOKING_FOR_MATCH = 'lookingForMatch',
    CANCEL_MATCH_SEARCH = 'cancelMatchSearch',
    LEAVE_MATCH = 'leaveMatch',  // Changed from CANCEL_MATCH
    MATCH_PROPOSED = 'matchProposed',
    MATCH_ACCEPTED = 'matchAccepted',
    MATCH_DECLINED = 'matchDeclined',
    MATCH_CREATED = 'matchCreated',
    PEER_LIST_UPDATE = 'peerListUpdate',
    CHAT_MESSAGE = 'chatMessage',
    STATUS_UPDATE = 'statusUpdate',
    SERVER_ERROR = 'server_error',
    GAME_INPUT = 'GAME_INPUT',
    GAME_STATE = 'GAME_STATE',
    GAME_START = 'GAME_START',
    MATCH_ENDED = "MATCH_ENDED",
    MATCH_RECONNECTED = "MATCH_RECONNECTED",
    PEER_RECONNECTED = "PEER_RECONNECTED",
    PEER_DISCONNECTED = "PEER_DISCONNECTED",
    // New message types for multi-peer matches
    HOST_ASSIGNED = "HOST_ASSIGNED",
    HOST_CHANGED = "HOST_CHANGED",
    PEER_LEFT_MATCH = "PEER_LEFT_MATCH",
    SUBMIT_SCORE = "SUBMIT_SCORE",
    SCORE_SUBMITTED = "SCORE_SUBMITTED",
    MATCH_OPPORTUNITY = "MATCH_OPPORTUNITY",
    MATCH_DECLINE = "MATCH_DECLINE",
    PEER_DECLINED_MATCH = "PEER_DECLINED_MATCH",
    PEER_ACCEPTED_MATCH = "PEER_ACCEPTED_MATCH",
    MATCH_ACCEPT = "MATCH_ACCEPT",
    MATCH_PROPOSAL_TIMEOUT = "MATCH_PROPOSAL_TIMEOUT"
}


export interface Scores
{
    result: Record<string, string>;
}



export enum ConnectionStatusEnum {
    idle,
    connecting,
    connected,
    lookingForMatch,
    cancellingMatch,
    approvingMath,
    match,
    startLookingForMatch,
    error,
    matchAccepting,
}

export interface PeerResult {
    peerId: string;
    scores: Scores; // null if peer left without submitting a score
}


// Game state interface
export interface GameState {
    leftPaddleY: number;
    rightPaddleY: number;
    ballX: number;
    ballY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    leftScore: number;
    rightScore: number;
    gameStarted: boolean;
    gameOver: boolean;
    winner: string | null;
}

export interface DataPacketChatMessage {
    fromPeerId: string,
    toPeerId?: string,
    message: string
}

export interface DataPacketMatchMakingParams {
    arena: string; // The game arena where the match is being proposed
    maxPeers?: number; // Maximum number of peers allowed in the match
}

// Peer result interface for match scoring
export interface PeerResult {
    peerId: string;
    score: number | null; // null if peer left without submitting a score
}

export interface MatchInformation {
    matchId?: string;
    peerIds: string[]; // All peers in the match
    isHost: boolean; // Whether this peer is the host
    matchDetails?: DataPacketMatchMakingParams; // Optional match configuration

}

// Unified DataPacket interface
export interface DataPacket {
    type: MessageType;
    from?: string;
    gameInput?: {
        data: any;
    };
    gameState?: {
        state: GameState;
    };
    gameStart?: {
        initialDirection: 'left' | 'right';
    };
    welcome?: {
        peerId: string;
        message: string;
        connectedPeers: string[];
    };
    serverError?: {
        message: string;
        stackTrace?: string[];
    }
    statusUpdate?: {
        statusFrom?: ConnectionStatusEnum;
        statusTo: ConnectionStatusEnum
    },
    chatMessage?: DataPacketChatMessage,
    peerJoined?: {
        peerId: string;
        connectedPeers: string[];
    };
    peerLeft?: {
        peerId: string;
        connectedPeers: string[];
    };
    matchEnded?: {
        reason: string;
        finalScore?: Scores; // The final agreed-upon score

    }
    broadcast?: {
        content: string;
    };
    message?: {
        content: string;
    };
    signal?: {
        target?: string;
        signal: string;
    };
    serverMessage?: {
        content: string;
    };
    // Updated fields for matchmaking
    lookingForMatch?: {
        params?: DataPacketMatchMakingParams; // Optional matchmaking preferences
        maxPeers?: number; // Maximum number of peers for this match
    };
    cancelMatchSearch?: {
        reason?: string;
    };
    matchAccept?:{
        proposalId: string;
    };
    matchProposed?: {
        proposalId: string;
        timeoutSeconds: number;
        targetPeerIds: string[]; // Now an array for multiple peers
        params?: DataPacketMatchMakingParams; // Optional match details

    };
    matchProposalTimeout?:{
        proposalId: string;
        message: string;
};
    matchAccepted?: {
        targetPeerIds: string[]; // Now an array for multiple peers
        maxPeers?: number; // Maximum number of peers for this match
    };
    matchDecline?: {
        proposalId: string;
        targetPeerIds: string[]; // Now an array for multiple peers
        maxPeers?: number; // Maximum number of peers for this match
    };
    peerDeclinedMatch?:{
        proposalId:string,
        peerId:string
    },
    peerAcceptedMatch?: {
        proposalId: string,
        hostPeerId: string,
        acceptedCount: number,
        totalCount: number
    },
    matchDeclined?: {
        targetPeerIds: string[]; // Now an array for multiple peers
        reason?: string;
    };
    // Updated from cancelMatch to leaveMatch
    leaveMatch?: {
        reason?: string;
        scores?: Scores; // Optional score when leaving match
    };
    matchCreated?: MatchInformation;
    peerListUpdate?: {
        connectedPeers: string[];
    };
    matchReconnected?: {
        matchId: string;
        peerIds: string[]; // All peers in the match
        isHost: boolean; // Whether this peer is the host
   
    };
    peerReconnected?: {
        peerId: string;
    };
    peerDisconnected?: {
        peerId: string;
    };
    // New fields for multi-peer matches
    hostAssigned?: {
        isHost: boolean;
    };
    hostChanged?: {
        newHostId: string;
    };
    peerLeftMatch?: {
        peerId: string;
    };
    submitScore?: {
        scores: Scores;
    };
    scoreSubmitted?: {
        peerId: string;
        scores: Scores;
    };
    matchOpportunity?: {
        proposalId: string;
        timeoutSeconds: number;
        initiatorId: string;
        allPeerIds: string[]; // All peers that would be in the match
    };
}

export interface DataPacketWrapper {
    type: string;
    packet: DataPacket;
}
