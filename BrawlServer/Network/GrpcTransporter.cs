using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Grpc.Core;

namespace BrawlServer.Network
{
    public class GrpcTransporter
    {
        private readonly ConcurrentDictionary<int, PlayerConnection> _connections = new();
        private readonly ConcurrentQueue<byte[]> _receivedQueue = new();
        private readonly ConcurrentQueue<byte[]> _systemQueue = new();
        private int _sentCount;
        private int _sentBytesCount;
        private int _receivedCount;
        private int _receivedBytesCount;
        
        // Event handlers for client messages
        public delegate void MessageReceivedHandler(int playerId, byte[] data);
        public event MessageReceivedHandler? OnMessageReceived;
        
        public GrpcTransporter()
        {
            Console.WriteLine("GrpcTransporter initialized");
        }
        
        // Register a player connection
        public void RegisterConnection(int playerId, PlayerConnection connection)
        {
            _connections.TryAdd(playerId, connection);
            Console.WriteLine($"Player {playerId} connection registered");
        }
        
        // Remove a player connection
        public void RemoveConnection(int playerId)
        {
            _connections.TryRemove(playerId, out _);
            Console.WriteLine($"Player {playerId} connection removed");
        }
        
        // Send data to all connected clients
        public void SendToAll(byte[] bytes, bool isSystem = false)
        {
            // Broadcast to all connected clients
            Task.Run(() => Broadcast(bytes, isSystem));
            
            _sentBytesCount += bytes.Length;
            _sentCount++;
        }
        
        // Send data to a specific client
        public async Task SendToClient(int playerId, byte[] bytes, bool isSystem = false)
        {
            if (!_connections.TryGetValue(playerId, out var connection))
            {
                Console.WriteLine($"Cannot send to player {playerId}: not connected");
                return;
            }
            
            // Convert to server message
            var message = new Proto.ServerMessage
            {
                // Wrap the raw bytes in a GameEvent message
                GameEvent = new Proto.GameEvent
                {
                    EventType = isSystem ? 0 : 1, // 0 for system, 1 for regular event
                    EventData = Google.Protobuf.ByteString.CopyFrom(bytes)
                }
            };
            
            try
            {
                await connection.SendMessage(message);
                _sentBytesCount += bytes.Length;
                _sentCount++;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending message to player {playerId}: {ex.Message}");
            }
        }
        
        private async Task Broadcast(byte[] bytes, bool isSystem)
        {
            // Convert to server message
            var message = new Proto.ServerMessage
            {
                // Wrap the raw bytes in a GameEvent message
                GameEvent = new Proto.GameEvent
                {
                    EventType = isSystem ? 0 : 1, // 0 for system, 1 for regular event
                    EventData = Google.Protobuf.ByteString.CopyFrom(bytes)
                }
            };
            
            // Send to all connected players
            var tasks = new List<Task>();
            foreach (var connection in _connections.Values)
            {
                tasks.Add(connection.SendMessage(message));
            }
            
            try
            {
                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error broadcasting message: {ex.Message}");
            }
        }
        
        // Process received data from a client
        public void ProcessReceivedData(int playerId, byte[] bytes)
        {
            _receivedBytesCount += bytes.Length;
            _receivedCount++;
            
            // Trigger event for message processing
            OnMessageReceived?.Invoke(playerId, bytes);
        }
        
        // Check connection status
        public bool IsConnected()
        {
            return _connections.Count > 0;
        }
        
        // Get number of connected players
        public int GetPlayerCount()
        {
            return _connections.Count;
        }
        
        // Stats methods for monitoring
        public int GetEventsSentCount() => _sentCount;
        public int GetEventsBytesSentCount() => _sentBytesCount;
        public int GetEventsReceivedCount() => _receivedCount;
        public int GetEventsBytesReceivedCount() => _receivedBytesCount;
    }
    
    // Helper class to manage individual client connections
    public class PlayerConnection
    {
        private readonly IServerStreamWriter<Proto.ServerMessage> _stream;
        private readonly object _lock = new object();
        
        public PlayerConnection(IServerStreamWriter<Proto.ServerMessage> stream)
        {
            _stream = stream;
        }
        
        public Task SendMessage(Proto.ServerMessage message)
        {
            try
            {
                // Write to the stream - no lock needed as gRPC writer handles concurrent access
                Task task = _stream.WriteAsync(message);
                return task;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending message to client: {ex.Message}");
                throw;
            }
        }
    }
}