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
}

export enum ConnectionStatusEnum {
    idle,
    connecting  ,
    connected,
    lookingForMatch,
    cancellingMatch,
    approvingMath,
    match,
    startLookingForMatch

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
    fromPeerId : string,
    toPeerId?: string,
    message: string
}
export interface DataPacketMathMakingParams {
    arena: string; // The game arena where the match is being proposed
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
    statusUpdate?:{
      statusFrom?: ConnectionStatusEnum;
      statusTo:ConnectionStatusEnum
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
    // New fields for matchmaking
    lookingForMatch?: {
        params?: DataPacketMathMakingParams; // Optional matchmaking preferences
    };
    cancelMatchSearch?: {
        reason?: string;
    };
    matchProposed?: {
        targetPeerId: string;
        params?: DataPacketMathMakingParams; // Optional match details
    };
    matchAccepted?: {
        targetPeerId: string;
    };
    matchDeclined?: {
        targetPeerId: string;
        reason?: string;
    };
    matchCreated?: {
        targetPeerId: string;
        matchDetails?: DataPacketMathMakingParams; // Optional match configuration
    };
    peerListUpdate?: {
        connectedPeers: string[];
    };
}

export interface DataPacketWrapper {
    type: string;
    packet: DataPacket;
}
