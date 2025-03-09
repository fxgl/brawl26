import { ConnectionStatusEnum, MessageType } from '../../../shared/datapacket';
import { createMockClientProfile, MockClient } from '../__mocks__/test-utils';

// Import functions to test
import { handlePeerConnection, handlePeerDisconnection } from '../peerConnection/peerConnection';

// Import global maps from index
import { activeMatches, peerToMatchMap, connectedPeers } from '../index';

// Clear maps before each test
beforeEach(() => {
  // Clear all maps
  activeMatches.clear();
  peerToMatchMap.clear();
  connectedPeers.clear();
});

describe('Peer Connection Handlers', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Peer Connection Event', () => {
    it('should add a peer to the connectedPeers map with "connected" status', () => {
      const clientId = 'test-peer';
      const client = new MockClient(clientId);
      
      // Call the handler function directly instead of using event handlers
      handlePeerConnection(client, connectedPeers, peerToMatchMap, activeMatches);
      
      // Check that the peer was added to the map
      expect(connectedPeers.has(clientId)).toBe(true);
      
      // Check the peer's status
      const peerProfile = connectedPeers.get(clientId);
      expect(peerProfile?.state).toBe(ConnectionStatusEnum.connected);
      
      // Check that a status update message was sent
      // Get all messages
      const messages = client.getSentMessages();
      
      // Find the STATUS_UPDATE message
      const statusMessage = messages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.STATUS_UPDATE
      );
      
      expect(statusMessage).toBeDefined();
      expect(statusMessage.packet.statusUpdate.statusTo).toBe(ConnectionStatusEnum.connected);
    });
    
    it('should reconnect a peer to an existing match if applicable', () => {
      const clientId = 'test-peer';
      const matchId = 'test-match';
      const client = new MockClient(clientId);
      
      // Set up a match mapping for this peer
      peerToMatchMap.set(clientId, matchId);
      
      // Create a mock match
      const match = {
        matchId,
        peerIds: [clientId, 'other-peer'],
        hostId: 'other-peer',
        activeMembers: 1
      };
      activeMatches.set(matchId, match);
      
      // Call the handler function directly
      handlePeerConnection(client, connectedPeers, peerToMatchMap, activeMatches);
      
      // Check that the peer was added to the map with match status
      expect(connectedPeers.has(clientId)).toBe(true);
      
      // Check the peer's status
      const peerProfile = connectedPeers.get(clientId);
      expect(peerProfile?.state).toBe(ConnectionStatusEnum.match);
      
      // Check that match.activeMembers was incremented
      expect(match.activeMembers).toBe(2);
      
      // Check that a match reconnection message was sent
      const messages = client.getSentMessages();
      
      // Find the MATCH_RECONNECTED message
      const reconnectMessage = messages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.MATCH_RECONNECTED
      );
      
      expect(reconnectMessage).toBeDefined();
      expect(reconnectMessage.packet.matchReconnected.matchId).toBe(matchId);
    });
  });

  describe('Peer Disconnect Event', () => {
    it('should remove a peer from connectedPeers when disconnected', () => {
      const clientId = 'test-peer';
      const client = new MockClient(clientId);
      
      // Add the peer to connectedPeers first
      connectedPeers.set(clientId, createMockClientProfile(clientId));
      
      // Call the handler function directly
      handlePeerDisconnection(client, connectedPeers, peerToMatchMap, activeMatches);
      
      // Check that the peer was removed
      expect(connectedPeers.has(clientId)).toBe(false);
    });
    
    it('should reduce activeMembers and notify other peers when a match participant disconnects', () => {
      const clientId = 'test-peer';
      const otherPeerId = 'other-peer';
      const matchId = 'test-match';
      const client = new MockClient(clientId);
      const otherClient = new MockClient(otherPeerId);
      
      // Create and add other peer to connectedPeers
      connectedPeers.set(otherPeerId, createMockClientProfile(otherPeerId));
      
      // Set up match mappings
      peerToMatchMap.set(clientId, matchId);
      peerToMatchMap.set(otherPeerId, matchId);
      
      // Create a mock match
      const match = {
        matchId,
        peerIds: [clientId, otherPeerId],
        hostId: clientId,
        activeMembers: 2
      };
      activeMatches.set(matchId, match);
      
      // Call the handler function directly
      handlePeerDisconnection(client, connectedPeers, peerToMatchMap, activeMatches);
      
      // Check that match.activeMembers was reduced
      expect(match.activeMembers).toBe(1);
      
      // Check that the other peer was notified
      const otherPeerProfile = connectedPeers.get(otherPeerId);
      const messages = otherPeerProfile?.rtcClient.getSentMessages();
      
      // Find the PEER_DISCONNECTED message
      const disconnectMessage = messages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.PEER_DISCONNECTED
      );
      
      expect(disconnectMessage).toBeDefined();
      expect(disconnectMessage.packet.peerDisconnected.peerId).toBe(clientId);
    });
    
    it('should assign a new host if the host disconnects', () => {
      const hostId = 'host-peer';
      const peerId = 'other-peer';
      const matchId = 'test-match';
      const hostClient = new MockClient(hostId);
      
      // Add the peer to connectedPeers
      connectedPeers.set(peerId, createMockClientProfile(peerId));
      
      // Set up match mappings
      peerToMatchMap.set(hostId, matchId);
      peerToMatchMap.set(peerId, matchId);
      
      // Create a mock match with host-peer as host
      const match = {
        matchId,
        peerIds: [hostId, peerId],
        hostId: hostId,
        activeMembers: 2
      };
      activeMatches.set(matchId, match);
      
      // Call the handler function directly
      handlePeerDisconnection(hostClient, connectedPeers, peerToMatchMap, activeMatches);
      
      // Check that a new host was assigned
      expect(match.hostId).toBe(peerId);
      
      // Check that the new host was notified
      const peerProfile = connectedPeers.get(peerId);
      const messages = peerProfile?.rtcClient.getSentMessages();

      // Find the HOST_ASSIGNED message
      const hostMessage = messages.find((msg: any) =>
        msg.type === MessageType.DATA && msg.packet.type === MessageType.HOST_ASSIGNED
      );

      expect(hostMessage).toBeDefined();
      expect(hostMessage.packet.hostAssigned.isHost).toBe(true);
    });
  });
});
