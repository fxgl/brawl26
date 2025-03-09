import { create } from 'zustand';

import {peerService} from "../utils/peerService.ts";
import {ConnectionStatusEnum, DataPacket, MessageType, Scores} from "../../../../shared/datapacket.ts";


interface AppState {
  peerConnectOpened: boolean;
  setPeerConnectOpened: (opened: boolean) => void;
  connectionStatus: ConnectionStatusEnum;
  setConnectionStatus: (status:ConnectionStatusEnum) => void;
  lookForServer: () => void;
  stopLookForServer: () => void;
  peerList: string[];
  setPeerList: (peers:string[])=> void;
  matchAccepted:(peers:string[])=> void;
  remotePeerIds: string[];
  setRemotePeerIds: (peer:string[]) => void;
  acceptMatch: (proposalId: string)=> void;

  quitMatch:  (reason: string,scores:Scores)=>void;
}

export const useAppStore = create<AppState>((set) => ({
  peerConnectOpened: false,
  setPeerConnectOpened: (opened) => set({ peerConnectOpened: opened }),
  connectionStatus: ConnectionStatusEnum.idle,
  setConnectionStatus: (status:ConnectionStatusEnum) => set({ connectionStatus: status }),
  lookForServer: async () => {
    set({ connectionStatus: ConnectionStatusEnum.startLookingForMatch });
    const looking: DataPacket = {type: MessageType.LOOKING_FOR_MATCH, lookingForMatch: {}};
    await peerService.sendServer(looking);
  },
  stopLookForServer: async () => {
    set({ connectionStatus: ConnectionStatusEnum.cancellingMatch });
    const looking: DataPacket = {type: MessageType.CANCEL_MATCH_SEARCH, cancelMatchSearch: {}};
    await peerService.sendServer(looking);
  },
  matchAccepted: async (peers:string[]) => {
    const packet: DataPacket = {type: MessageType.MATCH_ACCEPTED, matchAccepted: {targetPeerIds: peers}};
    await peerService.sendServer(packet);
  },
  peerList: [],
  setPeerList: (peers:string[])=> set({ peerList: peers }),
  remotePeerIds: [],
  setRemotePeerIds: (peer:string[])=>set({remotePeerIds: peer}),
  quitMatch:  async (reason: string,scores:Scores) => {
    const packet: DataPacket = {type: MessageType.LEAVE_MATCH, leaveMatch: {reason: reason,scores:scores}};
    await peerService.sendServer(packet);
  },
  acceptMatch: async (proposalId:string)=>{
    const packet: DataPacket = {type: MessageType.MATCH_ACCEPT, matchAccept: {proposalId:proposalId}};
    await peerService.sendServer(packet);
  }

}));
