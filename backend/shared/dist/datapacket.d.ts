export declare enum MessageType {
    WELCOME = "welcome",
    DATA = "data",
    PEER_JOINED = "peerJoined",
    PEER_LEFT = "peerLeft",
    BROADCAST = "broadcast",
    MESSAGE = "message",
    SIGNAL = "signal",
    SERVER_MESSAGE = "serverMessage",
    LOOKING_FOR_MATCH = "lookingForMatch",
    CANCEL_MATCH_SEARCH = "cancelMatchSearch",
    LEAVE_MATCH = "leaveMatch",// Changed from CANCEL_MATCH
    MATCH_PROPOSED = "matchProposed",
    MATCH_ACCEPTED = "matchAccepted",
    MATCH_DECLINED = "matchDeclined",
    MATCH_CREATED = "matchCreated",
    PEER_LIST_UPDATE = "peerListUpdate",
    CHAT_MESSAGE = "chatMessage",
    STATUS_UPDATE = "statusUpdate",
    SERVER_ERROR = "server_error",
    GAME_INPUT = "GAME_INPUT",
    GAME_STATE = "GAME_STATE",
    GAME_START = "GAME_START",
    MATCH_ENDED = "MATCH_ENDED",
    MATCH_RECONNECTED = "MATCH_RECONNECTED",
    PEER_RECONNECTED = "PEER_RECONNECTED",
    PEER_DISCONNECTED = "PEER_DISCONNECTED",
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
export interface Scores {
    result: Record<string, string>;
}
export declare enum ConnectionStatusEnum {
    idle = 0,
    connecting = 1,
    connected = 2,
    lookingForMatch = 3,
    cancellingMatch = 4,
    approvingMath = 5,
    match = 6,
    startLookingForMatch = 7,
    error = 8,
    matchAccepting = 9
}
export interface PeerResult {
    peerId: string;
    scores: Scores;
}
export interface Match {
    matchId: string;
    peerIds: string[];
    hostId: string;
    startTime: number;
    timeoutId: NodeJS.Timeout;
    activeMembers: number;
    results: Scores[];
    finalScore: Scores;
}
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
    fromPeerId: string;
    toPeerId?: string;
    message: string;
}
export interface DataPacketMatchMakingParams {
    arena: string;
    maxPeers?: number;
}
export interface PeerResult {
    peerId: string;
    score: number | null;
}
export interface MatchInformation {
    matchId?: string;
    peerIds: string[];
    isHost: boolean;
    matchDetails?: DataPacketMatchMakingParams;
}
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
    };
    statusUpdate?: {
        statusFrom?: ConnectionStatusEnum;
        statusTo: ConnectionStatusEnum;
    };
    chatMessage?: DataPacketChatMessage;
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
        finalScore?: Scores;
    };
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
    lookingForMatch?: {
        params?: DataPacketMatchMakingParams;
        maxPeers?: number;
    };
    cancelMatchSearch?: {
        reason?: string;
    };
    matchAccept?: {
        proposalId: string;
    };
    matchProposed?: {
        proposalId: string;
        timeoutSeconds: number;
        targetPeerIds: string[];
        params?: DataPacketMatchMakingParams;
    };
    matchProposalTimeout?: {
        proposalId: string;
        message: string;
    };
    matchAccepted?: {
        targetPeerIds: string[];
        maxPeers?: number;
    };
    matchDecline?: {
        proposalId: string;
        targetPeerIds: string[];
        maxPeers?: number;
    };
    peerDeclinedMatch?: {
        proposalId: string;
        peerId: string;
    };
    peerAcceptedMatch?: {
        proposalId: string;
        peerId: string;
        acceptedCount: number;
        totalCount: number;
    };
    matchDeclined?: {
        targetPeerIds: string[];
        reason?: string;
    };
    leaveMatch?: {
        reason?: string;
        scores?: Scores;
    };
    matchCreated?: MatchInformation;
    peerListUpdate?: {
        connectedPeers: string[];
    };
    matchReconnected?: {
        matchId: string;
        peerIds: string[];
        isHost: boolean;
    };
    peerReconnected?: {
        peerId: string;
    };
    peerDisconnected?: {
        peerId: string;
    };
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
        allPeerIds: string[];
    };
}
export interface DataPacketWrapper {
    type: string;
    packet: DataPacket;
}
//# sourceMappingURL=datapacket.d.ts.map