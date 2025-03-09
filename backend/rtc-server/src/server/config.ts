// Server configuration constants

// Server ports
export const PORT = process.env.PORT || 3000;
export const PEER_PORT = process.env.PEER_PORT || 9000;

// Match settings
export const MAX_PEERS_PER_MATCH = 2; // Default max peers per match, can be overridden

// Timeout settings (in milliseconds)
export const MATCH_TIMEOUT = 600000; // 10 minutes
export const PROPOSAL_TIMEOUT = 10000; // 10 seconds