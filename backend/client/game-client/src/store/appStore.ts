import { create } from 'zustand';

import {peerService} from "../utils/peerService.ts";
import {ConnectionStatusEnum, DataPacket, MessageType} from "../../../../shared/datapacket.ts";


interface AppState {
  peerConnectOpened: boolean;
  setPeerConnectOpened: (opened: boolean) => void;
  connectionStatus: ConnectionStatusEnum;
  setConnectionStatus: (status:ConnectionStatusEnum) => void;
  lookForServer: () => void;
  stopLookForServer: () => void;
  peerList: string[];
  setPeerList: (peers:string[])=> void;
  matchAccepted: (peer:string)=> void;
  remotePeerId: string;
  setRemotePeerId: (peer:string) => void;
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
  matchAccepted: async (peer:string) => {
    const packet: DataPacket = {type: MessageType.MATCH_ACCEPTED, matchAccepted: {targetPeerId: peer}};
    await peerService.sendServer(packet);
  },
  peerList: [],
  setPeerList: (peers:string[])=> set({ peerList: peers }),
  remotePeerId: '',
  setRemotePeerId: (peer:string)=>set({remotePeerId: peer})
}));
