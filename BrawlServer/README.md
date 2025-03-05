# BrawlServer - Simple gRPC Game Server

A simple C# console server application that uses gRPC to relay game messages between clients for multiplayer gaming.

## Overview

This server provides a simple relay mechanism for game clients to communicate with each other via gRPC. It:

- Accepts connections from game clients
- Assigns player IDs to connected clients
- Relays input and action messages between clients
- Handles player connect/disconnect events
- Provides latency measurement via ping/pong messages

## Project Structure

- `Program.cs` - Main entry point for the server
- `Proto/brawl.proto` - Protocol buffer definitions for gRPC
- `Network/` - Network-related classes:
  - `GrpcTransporter.cs` - Core message relay system
- `Services/` - gRPC service implementations:
  - `BrawlService.cs` - Handles client connections and messages
  - `BrawlServer.cs` - Manages the gRPC server

## Getting Started

### Prerequisites

- .NET 6.0 SDK or later

### Building

```bash
cd BrawlServer
dotnet build
```

### Running

```bash
dotnet run
```

By default, the server listens on port 50051. You can specify a different port as a command-line argument:

```bash
dotnet run -- 8080
```

## Key Features

- **Bidirectional Streaming** - Efficient real-time communication between server and clients
- **Simple Message Relay** - Forwards messages between connected clients
- **Input Processing** - Handles player inputs and broadcasts to other clients
- **Connection Management** - Tracks player connections and handles reconnection
- **Ping/Pong Mechanism** - Allows clients to measure network latency

## Protocol

The server uses a simple protocol defined in `brawl.proto`:

- **ConnectRequest/Response** - Initial connection handshake
- **ClientMessage** - Messages from client to server (inputs, actions, pings)
- **ServerMessage** - Messages from server to client (state updates, events, pongs)

### Message Flow

1. Client connects and receives a player ID
2. Client establishes a bidirectional streaming session
3. Client sends inputs and actions to the server
4. Server relays these messages to other connected clients
5. All game logic is handled by clients

## Client Integration

To connect to this server from a client:
1. Generate client-side code from the `brawl.proto` file
2. Create a client connection to the server
3. Establish a bidirectional streaming session
4. Send player inputs and actions
5. Process received messages from other players

## Future Improvements

- Add authentication and security measures
- Support for multiple game rooms
- Optional server validation for anti-cheat
- Message compression for bandwidth optimization
- Web client support

## License

See the LICENSE file for details.