import { generateProposalId } from '../__mocks__/test-utils';

describe('Helper Functions', () => {
  describe('generateProposalId', () => {
    it('should generate a unique proposal ID with the correct format', () => {
      // Mock Date.now to return a consistent value for testing
      const originalDateNow = Date.now;
      const mockTimestamp = 1234567890;
      Date.now = jest.fn(() => mockTimestamp);

      const initiatorId = 'peer1';
      const targetPeerIds = ['peer2', 'peer3'];
      
      const result = generateProposalId(initiatorId, targetPeerIds);
      
      // Check format: proposal_timestamp_initiatorId_targetId1_targetId2
      expect(result).toBe(`proposal_${mockTimestamp}_peer1_peer2_peer3`);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should work with a single target peer', () => {
      const originalDateNow = Date.now;
      const mockTimestamp = 1234567890;
      Date.now = jest.fn(() => mockTimestamp);

      const initiatorId = 'peer1';
      const targetPeerIds = ['peer2'];
      
      const result = generateProposalId(initiatorId, targetPeerIds);
      
      expect(result).toBe(`proposal_${mockTimestamp}_peer1_peer2`);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });
});
