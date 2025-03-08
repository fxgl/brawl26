// Message types enum
export var MessageType;
(function (MessageType) {
    MessageType["WELCOME"] = "welcome";
    MessageType["DATA"] = "data";
    MessageType["PEER_JOINED"] = "peerJoined";
    MessageType["PEER_LEFT"] = "peerLeft";
    MessageType["BROADCAST"] = "broadcast";
    MessageType["MESSAGE"] = "message";
    MessageType["SIGNAL"] = "signal";
    MessageType["SERVER_MESSAGE"] = "serverMessage";
    // New message types for matchmaking
    MessageType["LOOKING_FOR_MATCH"] = "lookingForMatch";
    MessageType["CANCEL_MATCH_SEARCH"] = "cancelMatchSearch";
    MessageType["MATCH_PROPOSED"] = "matchProposed";
    MessageType["MATCH_ACCEPTED"] = "matchAccepted";
    MessageType["MATCH_DECLINED"] = "matchDeclined";
    MessageType["MATCH_CREATED"] = "matchCreated";
    MessageType["PEER_LIST_UPDATE"] = "peerListUpdate";
    MessageType["CHAT_MESSAGE"] = "chatMessage";
    MessageType["STATUS_UPDATE"] = "statusUpdate";
    MessageType["SERVER_ERROR"] = "server_error";
})(MessageType || (MessageType = {}));
export var ConnectionStatusEnum;
(function (ConnectionStatusEnum) {
    ConnectionStatusEnum[ConnectionStatusEnum["idle"] = 0] = "idle";
    ConnectionStatusEnum[ConnectionStatusEnum["connecting"] = 1] = "connecting";
    ConnectionStatusEnum[ConnectionStatusEnum["connected"] = 2] = "connected";
    ConnectionStatusEnum[ConnectionStatusEnum["lookingForMatch"] = 3] = "lookingForMatch";
    ConnectionStatusEnum[ConnectionStatusEnum["cancellingMatch"] = 4] = "cancellingMatch";
    ConnectionStatusEnum[ConnectionStatusEnum["approvingMath"] = 5] = "approvingMath";
    ConnectionStatusEnum[ConnectionStatusEnum["match"] = 6] = "match";
})(ConnectionStatusEnum || (ConnectionStatusEnum = {}));
