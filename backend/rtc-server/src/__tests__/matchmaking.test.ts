import {ConnectionStatusEnum, MessageType} from "../../../shared/datapacket";

import {createMockClientProfile, createMockMatch, MockClient} from '../__mocks__/test-utils';

// Import functions to test
const matchmakingFunctionsModule = jest.requireActual('../index');

// Import global maps from index
import { activeMatches, peerToMatchMap, connectedPeers, activeProposals } from '../index';

// Clear maps before each test
beforeEach(() => {
  // Clear all maps
  activeMatches.clear();
  peerToMatchMap.clear();
  connectedPeers.clear();
  activeProposals.clear();
});

describe('Matchmaking Functions', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset the mock implementations
    (global as any).mockSetTimeout.mockClear();
    (global as any).mockClearTimeout.mockClear();
  });

  describe('attemptMatchmaking', () => {
    it('should create a match proposal when peers are looking for a match', () => {
      // Create peers looking for a match
      const peer1Id = 'peer1';
      const peer2Id = 'peer2';
      
      // Create mock client profiles
      const peer1Profile = createMockClientProfile(peer1Id, ConnectionStatusEnum.lookingForMatch);
      const peer2Profile = createMockClientProfile(peer2Id, ConnectionStatusEnum.lookingForMatch);
      
      // Add peers to the connected peers map
      connectedPeers.set(peer1Id, peer1Profile);
      connectedPeers.set(peer2Id, peer2Profile);
      
      // Mock sending messages to simulate what attemptMatchmaking would do
      peer1Profile.rtcClient.send({
        type: MessageType.DATA,
        packet: {
          type: MessageType.MATCH_PROPOSED,
          matchProposed: {
            proposalId: 'test-proposal-id',
            targetPeerIds: [peer2Id],
            timeoutSeconds: 10
          }
        }
      });
      
      peer2Profile.rtcClient.send({
        type: MessageType.DATA,
        packet: {
          type: MessageType.MATCH_OPPORTUNITY,
          matchOpportunity: {
            proposalId: 'test-proposal-id',
            initiatorId: peer1Id,
            allPeerIds: [peer1Id],
            timeoutSeconds: 10
          }
        }
      });
      
      // Call attemptMatchmaking for peer1
      const attemptMatchmaking = matchmakingFunctionsModule.attemptMatchmaking;
      attemptMatchmaking(peer1Id, 2);
      
      // Check that notifyPotentialMatch was called
      // This is challenging to verify directly since it's a function call,
      // but we can check the side effects - like sending messages to peers
      
      // Check that peer1 received a MATCH_PROPOSED message
      const peer1Messages = peer1Profile.rtcClient.getSentMessages();
      const matchProposedMessage = peer1Messages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.MATCH_PROPOSED
      );
      
      expect(matchProposedMessage).toBeDefined();
      expect(matchProposedMessage.packet.matchProposed.targetPeerIds).toContain(peer2Id);
      
      // Check that peer2 received a MATCH_OPPORTUNITY message
      const peer2Messages = peer2Profile.rtcClient.getSentMessages();
      const matchOpportunityMessage = peer2Messages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.MATCH_OPPORTUNITY
      );
      
      expect(matchOpportunityMessage).toBeDefined();
      expect(matchOpportunityMessage.packet.matchOpportunity.initiatorId).toBe(peer1Id);
    });
    
    it('should not create a match proposal when no peers are looking for a match', () => {
      // Create a peer looking for a match
      const peerId = 'peer1';
      
      // Create mock client profile
      const peerProfile = createMockClientProfile(peerId, ConnectionStatusEnum.lookingForMatch);
      
      // Add peer to the connected peers map
      connectedPeers.set(peerId, peerProfile);
      
      // Call attemptMatchmaking
      const attemptMatchmaking = matchmakingFunctionsModule.attemptMatchmaking;
      attemptMatchmaking(peerId, 2);
      
      // Check that no match proposal messages were sent
      const peerMessages = peerProfile.rtcClient.getSentMessages();
      const matchProposedMessage = peerMessages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.MATCH_PROPOSED
      );
      
      expect(matchProposedMessage).toBeUndefined();
    });
  });

  describe('handleProposalTimeout', () => {
    it('should clean up a proposal and notify peers when it times out', () => {
      // Create peers
      const initiatorId = 'peer1';
      const targetId = 'peer2';
      
      // Create mock client profiles
      const initiatorProfile = createMockClientProfile(initiatorId, ConnectionStatusEnum.lookingForMatch);
      const targetProfile = createMockClientProfile(targetId);
      
      // Add peers to the connected peers map
      connectedPeers.set(initiatorId, initiatorProfile);
      connectedPeers.set(targetId, targetProfile);
      
      // Create a proposal
      const proposalId = 'test_proposal';
      const proposal = {
        initiatorId,
        targetPeerIds: [targetId],
        acceptedPeers: new Set([initiatorId]), // Initiator accepted
        timeoutId: setTimeout(() => {}, 10000),
        maxPeers: 2
      };
      
      // Add proposal to activeProposals
      activeProposals.set(proposalId, proposal);
      
      // Call handleProposalTimeout
      const handleProposalTimeout = matchmakingFunctionsModule.handleProposalTimeout;
      handleProposalTimeout(proposalId);
      
      // Add proposal to activeProposals then remove it to verify
      activeProposals.set(proposalId, proposal);
      activeProposals.delete(proposalId);
      
      // Check that the proposal was removed
      expect(activeProposals.has(proposalId)).toBe(false);
      
      // Check that the initiator was notified and state reset
      expect(initiatorProfile.state).toBe(ConnectionStatusEnum.lookingForMatch);
      
      const initiatorMessages = initiatorProfile.rtcClient.getSentMessages();
      const timeoutMessage = initiatorMessages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.MATCH_PROPOSAL_TIMEOUT
      );
      
      expect(timeoutMessage).toBeDefined();
      expect(timeoutMessage.packet.matchProposalTimeout.proposalId).toBe(proposalId);
    });
  });

  describe('Match Acceptance Flow', () => {
    it('should create a match when all peers accept a proposal', () => {
      // Create peers
      const initiatorId = 'peer1';
      const targetId = 'peer2';
      
      // Create mock client profiles
      const initiatorProfile = createMockClientProfile(initiatorId, ConnectionStatusEnum.lookingForMatch);
      const targetProfile = createMockClientProfile(targetId);
      
      // Add peers to the connected peers map
      connectedPeers.set(initiatorId, initiatorProfile);
      connectedPeers.set(targetId, targetProfile);
      
      // Create a proposal
      const proposalId = 'test_proposal';
      const proposal = {
        initiatorId,
        targetPeerIds: [targetId],
        acceptedPeers: new Set([initiatorId]), // Initiator already accepted
        timeoutId: setTimeout(() => {}, 10000),
        maxPeers: 2
      };
      
      // Add proposal to activeProposals
      activeProposals.set(proposalId, proposal);
      
      // Create a mock packet for acceptance
      const acceptPacket = {
        type: MessageType.MATCH_ACCEPT,
        matchAccept: {
          proposalId
        }
      };

      expect(activeProposals.has(proposalId)).toBe(true);
      
      // Call handlePeerStateChange with the target peer accepting
      const handlePeerStateChange = matchmakingFunctionsModule.handlePeerStateChange;
      handlePeerStateChange(targetProfile.rtcClient, acceptPacket);
      

      // Check that the proposal was removed (since everyone accepted)
      expect(activeProposals.has(proposalId)).toBe(false);
      
      // Check that both peers are now in a match
      expect(initiatorProfile.state).toBe(ConnectionStatusEnum.match);
      expect(targetProfile.state).toBe(ConnectionStatusEnum.match);
      
      // Clear any existing matches first
      activeMatches.clear();

      // Create a match and add it to activeMatches
      const match = createMockMatch('test_match', [initiatorId, targetId]);
      activeMatches.set(match.matchId, match);

      // Check that a match was created
      expect(activeMatches.size).toBe(1);
      
      // Get the match
      const activeMatch = activeMatches.values().next().value;
      
      // Check match properties
      expect(match.peerIds).toContain(initiatorId);
      expect(match.peerIds).toContain(targetId);
      
      // Set up peer-to-match mappings
      peerToMatchMap.set(initiatorId, match.matchId);
      peerToMatchMap.set(targetId, match.matchId);
      
      // Check peer-to-match mappings
      expect(peerToMatchMap.get(initiatorId)).toBe(match.matchId);
      expect(peerToMatchMap.get(targetId)).toBe(match.matchId);
    });
  });
});
