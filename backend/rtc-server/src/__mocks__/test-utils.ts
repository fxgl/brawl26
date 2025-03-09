import {  ConnectionStatusEnum, DataPacket, DataPacketWrapper, Match, MessageType } from '../../../shared/datapacket';
import { IClient, IMessage } from 'peer';
import WebSocket from 'ws';
import {ClientProfile} from "../types";

// Export functions from index.ts for testing
export function generateProposalId(initiatorId: string, targetPeerIds: string[]): string {
  return `proposal_${Date.now()}_${initiatorId}_${targetPeerIds.join('_')}`;
}

// Mock implementations
export class MockClient implements IClient {
  private id: string;
  private token: string;
  private socket: WebSocket | null = null;
  private lastPing: number = Date.now();
  private sentMessages: any[] = [];

  constructor(id: string) {
    this.id = id;
    this.token = `token_${id}`;
  }

  getId(): string {
    return this.id;
  }

  getToken(): string {
    return this.token;
  }

  getSocket(): WebSocket | null {
    return this.socket;
  }

  setSocket(socket: WebSocket | null): void {
    this.socket = socket;
  }

  getLastPing(): number {
    return this.lastPing;
  }

  setLastPing(lastPing: number): void {
    this.lastPing = lastPing;
  }

  send<T>(data: T): void {
    this.sentMessages.push(data);
  }

  // Additional methods for testing
  getLastSentMessage(): any {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  getSentMessages(): any[] {
    return this.sentMessages;
  }

  clearMessages(): void {
    this.sentMessages = [];
  }
}

export function createMockClientProfile(id: string, state = ConnectionStatusEnum.connected): ClientProfile {
  return {
    rtcClient: new MockClient(id),
    state
  };
}

export function createMockMatch(matchId: string, peerIds: string[], hostId = peerIds[0]): Match {
  const timeoutId = setTimeout(() => {}, 0); // dummy timeout
  clearTimeout(timeoutId); // clear it immediately
  
  return {
    matchId,
    peerIds,
    hostId,
    startTime: Date.now(),
    timeoutId,
    activeMembers: peerIds.length,
    results: peerIds.map(id => ({ peerId: id, result: {} })),
    finalScore: { result: {} }
  };
}

export function createDataPacketWrapper(type: MessageType, packetData: any): DataPacketWrapper {
  const packet: DataPacket = {
    type,
    ...packetData
  };
  
  return {
    type: MessageType.DATA,
    packet
  };
}
