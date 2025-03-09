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
    MessageType["LEAVE_MATCH"] = "leaveMatch";
    MessageType["MATCH_PROPOSED"] = "matchProposed";
    MessageType["MATCH_ACCEPTED"] = "matchAccepted";
    MessageType["MATCH_DECLINED"] = "matchDeclined";
    MessageType["MATCH_CREATED"] = "matchCreated";
    MessageType["PEER_LIST_UPDATE"] = "peerListUpdate";
    MessageType["CHAT_MESSAGE"] = "chatMessage";
    MessageType["STATUS_UPDATE"] = "statusUpdate";
    MessageType["SERVER_ERROR"] = "server_error";
    MessageType["GAME_INPUT"] = "GAME_INPUT";
    MessageType["GAME_STATE"] = "GAME_STATE";
    MessageType["GAME_START"] = "GAME_START";
    MessageType["MATCH_ENDED"] = "MATCH_ENDED";
    MessageType["MATCH_RECONNECTED"] = "MATCH_RECONNECTED";
    MessageType["PEER_RECONNECTED"] = "PEER_RECONNECTED";
    MessageType["PEER_DISCONNECTED"] = "PEER_DISCONNECTED";
    // New message types for multi-peer matches
    MessageType["HOST_ASSIGNED"] = "HOST_ASSIGNED";
    MessageType["HOST_CHANGED"] = "HOST_CHANGED";
    MessageType["PEER_LEFT_MATCH"] = "PEER_LEFT_MATCH";
    MessageType["SUBMIT_SCORE"] = "SUBMIT_SCORE";
    MessageType["SCORE_SUBMITTED"] = "SCORE_SUBMITTED";
    MessageType["MATCH_OPPORTUNITY"] = "MATCH_OPPORTUNITY";
    MessageType["MATCH_DECLINE"] = "MATCH_DECLINE";
    MessageType["PEER_DECLINED_MATCH"] = "PEER_DECLINED_MATCH";
    MessageType["PEER_ACCEPTED_MATCH"] = "PEER_ACCEPTED_MATCH";
    MessageType["MATCH_ACCEPT"] = "MATCH_ACCEPT";
    MessageType["MATCH_PROPOSAL_TIMEOUT"] = "MATCH_PROPOSAL_TIMEOUT";
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
    ConnectionStatusEnum[ConnectionStatusEnum["startLookingForMatch"] = 7] = "startLookingForMatch";
    ConnectionStatusEnum[ConnectionStatusEnum["error"] = 8] = "error";
    ConnectionStatusEnum[ConnectionStatusEnum["matchAccepting"] = 9] = "matchAccepting";
})(ConnectionStatusEnum || (ConnectionStatusEnum = {}));
