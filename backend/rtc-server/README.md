# WebRTC Server with PeerJS

A WebRTC signaling server built with Express.js and PeerJS that creates a "lobby" peer and allows clients to connect and communicate through it.

## Features

- Express.js server with PeerJS integration
- Server creates a "lobby" peer that clients can connect to
- Hook events for peer connections, disconnections, and data transfers
- Real-time communication between all connected peers
- RESTful API endpoints for server interaction

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Running the server

```bash
# Start the server in production mode
npm start

# Start the server in development mode with auto-reload
npm run dev
```

By default, the Express server runs on port 3000 and the PeerJS server runs on port 9000.

### Environment Variables

- `PORT`: Express server port (default: 3000)
- `PEER_PORT`: PeerJS server port (default: 9000)

## API Endpoints

- `GET /`: Check server status
- `GET /api/peers`: Get list of connected peers
- `POST /api/broadcast`: Send a message from the server to all connected peers

## Testing with Client Example

Open the `client-example.html` file in a browser to test the WebRTC communication:

1. Click "Connect to Lobby" to connect to the server
2. Send messages to all other connected peers
3. Watch for real-time updates as other peers join or leave

## Lobby Peer Features

The server creates a special "lobby" peer that:

1. Acts as a central connection point for all clients
2. Tracks all connected peers
3. Broadcasts messages between peers
4. Sends notifications when peers join or leave
5. Provides welcome messages with connection details

## Message Types

- `welcome`: Initial message sent when a peer connects to the lobby
- `peerJoined`: Notification when a new peer joins
- `peerLeft`: Notification when a peer disconnects
- `message`: Message from a peer to be broadcast to others
- `serverMessage`: Message from the server to all connected peers

## Client-Side Implementation

To connect to the lobby from a client application:

```javascript
// Create a peer
const peer = new Peer('client-id', {
  host: 'localhost',
  port: 9000,
  path: '/rtc'
});

// Connect to the lobby
const conn = peer.connect('lobby');

// Handle data from the lobby
conn.on('data', (data) => {
  console.log('Received data:', data);
});

// Send data to the lobby
conn.send({
  type: 'broadcast',
  content: 'Hello, everyone!'
});
```