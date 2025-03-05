using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using BrawlServer.Network;
using BrawlServer.Proto;
using Google.Protobuf;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace BrawlServer.Services
{
    public class BrawlService : Proto.BrawlGame.BrawlGameBase
    {
        private readonly GrpcTransporter _transporter;
        private readonly ConcurrentDictionary<string, int> _clientToPlayerMap = new();
        private readonly ConcurrentDictionary<int, string> _playerToClientMap = new();
        private int _nextPlayerId = 1;
        
        // Maximum players allowed in a game
        private readonly int _maxPlayers = 2;
        
        public BrawlService(GrpcTransporter transporter)
        {
            _transporter = transporter;
            Console.WriteLine("BrawlService initialized");
        }
        
        // Handle client connection requests
        public override Task<ConnectResponse> Connect(ConnectRequest request, ServerCallContext context)
        {
            Console.WriteLine($"Connect request from client: {request.ClientId}, version: {request.ClientVersion}");
            
            // Check if we already have this client
            if (_clientToPlayerMap.TryGetValue(request.ClientId, out var existingPlayerId))
            {
                Console.WriteLine($"Reconnecting existing client {request.ClientId} as player {existingPlayerId}");
                return Task.FromResult(new ConnectResponse
                {
                    Success = true,
                    AssignedPlayerId = existingPlayerId
                });
            }
            
            // Check if we're full
            if (_clientToPlayerMap.Count >= _maxPlayers)
            {
                Console.WriteLine("Connection refused: Server is full");
                return Task.FromResult(new ConnectResponse
                {
                    Success = false,
                    Error = "Server is full"
                });
            }
            
            // Assign new player ID
            var playerId = _nextPlayerId++;
            
            // Store the mapping
            _clientToPlayerMap[request.ClientId] = playerId;
            _playerToClientMap[playerId] = request.ClientId;
            
            Console.WriteLine($"New client {request.ClientId} connected as player {playerId}");
            
            return Task.FromResult(new ConnectResponse
            {
                Success = true,
                AssignedPlayerId = playerId
            });
        }
        
        // Handle the main game session with bidirectional streaming
        public override async Task GameSession(
            IAsyncStreamReader<ClientMessage> requestStream,
            IServerStreamWriter<ServerMessage> responseStream,
            ServerCallContext context)
        {
            // Extract client ID from request headers
            var clientId = context.RequestHeaders.GetValue("client-id");
            if (string.IsNullOrEmpty(clientId) || !_clientToPlayerMap.TryGetValue(clientId, out var playerId))
            {
                Console.WriteLine("Unauthorized connection attempt");
                await responseStream.WriteAsync(new ServerMessage
                {
                    GameEvent = new GameEvent
                    {
                        EventType = (int)GameEventType.Error,
                        EventData = ByteString.CopyFromUtf8("Unauthorized connection")
                    }
                });
                return;
            }
            
            Console.WriteLine($"Starting game session for player {playerId}");
            
            // Create player connection
            var playerConnection = new PlayerConnection(responseStream);
            _transporter.RegisterConnection(playerId, playerConnection);
            
            try
            {
                // Notify other players about new connection
                var playerConnectedData = $"{{\"playerId\":{playerId}}}";
                _transporter.SendToAll(
                    System.Text.Encoding.UTF8.GetBytes(playerConnectedData), 
                    true
                );
                
                // Main processing loop for client messages
                while (await requestStream.MoveNext())
                {
                    var message = requestStream.Current;
                    
                    // Verify player ID matches
                    if (message.PlayerId != playerId)
                    {
                        Console.WriteLine($"Ignoring message with mismatched player ID: expected {playerId}, got {message.PlayerId}");
                        continue;
                    }
                    
                    // Process message based on type
                    switch (message.PayloadCase)
                    {
                        case ClientMessage.PayloadOneofCase.PlayerInput:
                            await ProcessPlayerInput(playerId, message.PlayerInput, message.Tick);
                            break;
                            
                        case ClientMessage.PayloadOneofCase.PlayerAction:
                            await ProcessPlayerAction(playerId, message.PlayerAction);
                            break;
                            
                        case ClientMessage.PayloadOneofCase.Ping:
                            await ProcessPing(responseStream, message.Ping);
                            break;
                            
                        default:
                            Console.WriteLine($"Unknown message type from player {playerId}");
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in game session for player {playerId}: {ex.Message}");
            }
            finally
            {
                // Clean up when client disconnects
                _transporter.RemoveConnection(playerId);
                
                // Notify other players about disconnection
                var playerDisconnectedData = $"{{\"playerId\":{playerId}}}";
                _transporter.SendToAll(
                    System.Text.Encoding.UTF8.GetBytes(playerDisconnectedData), 
                    true
                );
                
                // Keep the player mapping to allow reconnection
                Console.WriteLine($"Game session ended for player {playerId}");
            }
        }
        
        private async Task ProcessPlayerInput(int playerId, PlayerInput input, uint tick)
        {
            // Format as JSON for simplicity in this example
            var inputJson = $"{{\"type\":\"input\",\"playerId\":{playerId},\"moveX\":{input.MoveX},\"moveY\":{input.MoveY},\"attack\":{(input.AttackPressed ? "true" : "false")},\"tick\":{tick}}}";
            var inputBytes = System.Text.Encoding.UTF8.GetBytes(inputJson);
            
            // Broadcast to all other players
            foreach (var pid in _playerToClientMap.Keys)
            {
                if (pid != playerId) // Don't echo back to the sender
                {
                    await _transporter.SendToClient(pid, inputBytes);
                }
            }
            
            // Log input for debugging
            Console.WriteLine($"Received input from player {playerId}: Move({input.MoveX}, {input.MoveY}), Attack: {input.AttackPressed}, Tick: {tick}");
        }
        
        private async Task ProcessPlayerAction(int playerId, PlayerAction action)
        {
            // Handle special actions
            Console.WriteLine($"Received action from player {playerId}: ActionType={action.ActionType}, DataSize={action.ActionData.Length}");
            
            // Create simple wrapper around the action data
            var wrapper = new byte[action.ActionData.Length + 8]; // 8 bytes for header
            
            // Add action type and player ID as a simple header
            BitConverter.GetBytes(action.ActionType).CopyTo(wrapper, 0);
            BitConverter.GetBytes(playerId).CopyTo(wrapper, 4);
            
            // Copy the actual action data
            action.ActionData.ToByteArray().CopyTo(wrapper, 8);
            
            // Broadcast to all other players
            foreach (var pid in _playerToClientMap.Keys)
            {
                if (pid != playerId) // Don't echo back to the sender
                {
                    await _transporter.SendToClient(pid, wrapper);
                }
            }
        }
        
        private async Task ProcessPing(IServerStreamWriter<ServerMessage> stream, Ping ping)
        {
            // Reply with pong for latency measurement
            await stream.WriteAsync(new ServerMessage
            {
                Pong = new Pong
                {
                    ClientSentTime = ping.SentTime,
                    ServerSentTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                }
            });
        }
    }
    
    // Enum for game event types
    public enum GameEventType
    {
        Error = -1,
        System = 0,
        Regular = 1,
        PlayerConnected = 2,
        PlayerDisconnected = 3
    }
}