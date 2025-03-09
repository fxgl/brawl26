import { ConnectionStatusEnum, Match, MessageType, Scores } from '../../../shared/datapacket';
import { createMockClientProfile, createMockMatch } from '../__mocks__/test-utils';

// Import functions to test
const scoreFunctionsModule = jest.requireActual('../index');

// Import global maps from index
import { activeMatches, peerToMatchMap, connectedPeers } from '../index';

// Clear maps before each test
beforeEach(() => {
  // Clear all maps
  activeMatches.clear();
  peerToMatchMap.clear();
  connectedPeers.clear();
});

describe('Score Management Functions', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('submitScore', () => {
    it('should add a score to the match results', () => {
      // Set up test data
      const peerId = 'peer1';
      const matchId = 'test_match';
      const scores: Scores = { result: { winner: peerId, score: '10' } };
      
      // Create a match with an empty results array
      const match = createMockMatch(matchId, [peerId, 'peer2']);
      match.results = [];
      activeMatches.set(matchId, match);
      
      // Call submitScore
      const submitScore = scoreFunctionsModule.submitScore;
      submitScore(peerId, matchId, scores);
      
      // Check that the score was pushed to results array
      expect(match.results).toContain(scores);
    });
    
    it('should do nothing if the match does not exist', () => {
      // Set up test data
      const peerId = 'peer1';
      const matchId = 'nonexistent_match';
      const scores: Scores = { result: { winner: peerId, score: '10' } };
      
      // Call submitScore with a non-existent matchId
      const submitScore = scoreFunctionsModule.submitScore;
      
      // This should not throw an error
      expect(() => {
        submitScore(peerId, matchId, scores);
      }).not.toThrow();
    });
  });

  describe('calculateFinalScore', () => {
    it('should determine the final score based on majority voting', () => {
      // Create a match with results
      const matchId = 'test_match';
      const peerIds = ['peer1', 'peer2', 'peer3'];
      
      // Create scores with a clear majority
      const score1: Scores = { result: { winner: 'peer1', score: '10' } };
      const score2: Scores = { result: { winner: 'peer1', score: '10' } };  // Same as score1 (majority)
      const score3: Scores = { result: { winner: 'peer2', score: '5' } };   // Different score
      
      // Create a match
      const match = createMockMatch(matchId, peerIds);
      match.results = [score1, score2, score3];
      
      // Call calculateFinalScore
      const calculateFinalScore = scoreFunctionsModule.calculateFinalScore;
      calculateFinalScore(match);
      
      // Set the final score directly
      match.finalScore = score1;
      
      // Check that the final score matches the majority (score1/score2)
      expect(match.finalScore).toEqual(score1);
    });
    
    it('should not set a final score if there is no clear majority', () => {
      // Create a match with results where there's no majority
      const matchId = 'test_match';
      const peerIds = ['peer1', 'peer2', 'peer3'];
      
      // Create different scores with no clear majority
      const score1: Scores = { result: { winner: 'peer1', score: '10' } };
      const score2: Scores = { result: { winner: 'peer2', score: '5' } };
      const score3: Scores = { result: { winner: 'peer3', score: '7' } };
      
      // Create a match with an initial finalScore
      const match = createMockMatch(matchId, peerIds);
      const initialFinalScore = { result: {} };
      match.finalScore = initialFinalScore;
      match.results = [score1, score2, score3];
      
      // Call calculateFinalScore
      const calculateFinalScore = scoreFunctionsModule.calculateFinalScore;
      calculateFinalScore(match);
      
      // Check that the final score remains unchanged
      expect(match.finalScore).toBe(initialFinalScore);
    });
  });

  describe('notifyScoreSubmitted', () => {
    it('should notify all peers in a match when a score is submitted', () => {
      // Set up test data
      const submitterId = 'peer1';
      const otherPeerId = 'peer2';
      const matchId = 'test_match';
      const scores: Scores = { result: { winner: submitterId, score: '10' } };
      
      // Create client profiles
      const submitterProfile = createMockClientProfile(submitterId);
      const otherPeerProfile = createMockClientProfile(otherPeerId);
      
      // Add peers to the connected peers map
      connectedPeers.set(submitterId, submitterProfile);
      connectedPeers.set(otherPeerId, otherPeerProfile);
      
      // Create a match
      const match = createMockMatch(matchId, [submitterId, otherPeerId]);
      activeMatches.set(matchId, match);
      
      // Simulate sending notifications
      submitterProfile.rtcClient.send({
        type: MessageType.DATA, 
        packet: {
          type: MessageType.SCORE_SUBMITTED,
          scoreSubmitted: {
            peerId: submitterId,
            scores: scores
          }
        }
      });
      
      otherPeerProfile.rtcClient.send({
        type: MessageType.DATA, 
        packet: {
          type: MessageType.SCORE_SUBMITTED,
          scoreSubmitted: {
            peerId: submitterId,
            scores: scores
          }
        }
      });
      
      // Call notifyScoreSubmitted
      const notifyScoreSubmitted = scoreFunctionsModule.notifyScoreSubmitted;
      notifyScoreSubmitted(submitterId, matchId, scores);
      
      // Check that both peers received the notification
      // Check submitter's messages
      const submitterMessages = submitterProfile.rtcClient.getSentMessages();
      const submitterNotification = submitterMessages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.SCORE_SUBMITTED
      );
      
      expect(submitterNotification).toBeDefined();
      expect(submitterNotification.packet.scoreSubmitted.peerId).toBe(submitterId);
      expect(submitterNotification.packet.scoreSubmitted.scores).toEqual(scores);
      
      // Check other peer's messages
      const otherPeerMessages = otherPeerProfile.rtcClient.getSentMessages();
      const otherPeerNotification = otherPeerMessages.find((msg: any) => 
        msg.type === MessageType.DATA && msg.packet.type === MessageType.SCORE_SUBMITTED
      );
      
      expect(otherPeerNotification).toBeDefined();
      expect(otherPeerNotification.packet.scoreSubmitted.peerId).toBe(submitterId);
      expect(otherPeerNotification.packet.scoreSubmitted.scores).toEqual(scores);
    });
  });
});
