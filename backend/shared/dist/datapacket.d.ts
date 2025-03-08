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
    MATCH_PROPOSED = "matchProposed",
    MATCH_ACCEPTED = "matchAccepted",
    MATCH_DECLINED = "matchDeclined",
    MATCH_CREATED = "matchCreated",
    PEER_LIST_UPDATE = "peerListUpdate",
    CHAT_MESSAGE = "chatMessage",
    STATUS_UPDATE = "statusUpdate",
    SERVER_ERROR = "server_error"
}
export declare enum ConnectionStatusEnum {
    idle = 0,
    connecting = 1,
    connected = 2,
    lookingForMatch = 3,
    cancellingMatch = 4,
    approvingMath = 5,
    match = 6
}
export interface DataPacketChatMessage {
    fromPeerId: string;
    toPeerId?: string;
    message: string;
}
export interface DataPacketMathMakingParams {
    arena: string;
}
export interface DataPacket {
    type: MessageType;
    from?: string;
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
        params?: DataPacketMathMakingParams;
    };
    cancelMatchSearch?: {
        reason?: string;
    };
    matchProposed?: {
        targetPeerId: string;
        params?: DataPacketMathMakingParams;
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
        matchDetails?: DataPacketMathMakingParams;
    };
    peerListUpdate?: {
        connectedPeers: string[];
    };
}
export interface DataPacketWrapper {
    type: string;
    packet: DataPacket;
}
//# sourceMappingURL=datapacket.d.ts.map