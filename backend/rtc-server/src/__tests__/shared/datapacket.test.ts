import { MessageType } from '../../../../shared/datapacket';

describe('DataPacket Types', () => {
  it('should define valid message types', () => {
    expect(MessageType.DATA).toBe('data');
    expect(MessageType.MATCH_CREATED).toBe('matchCreated');
  });
});
