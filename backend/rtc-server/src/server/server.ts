import express from 'express';
import cors from 'cors';
import http from 'http';
import { PeerServer } from 'peer';
import { PORT, PEER_PORT } from './config';

// Initialize Express app
export const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
export const server = http.createServer(app);

// Initialize PeerServer
export const peerServer = PeerServer({
    port: Number(PEER_PORT),
    path: '/peerjs',
    host: 'localhost',
    key: 'fxbrawl',
});

// Function to start the server
export function startServer() {
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        console.log(`PeerServer running on port ${PEER_PORT}`);
    });
}