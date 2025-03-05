using UnityEngine;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR.Client;

namespace Game.Modules {
    
    /// <summary>
    /// SignalR transporter for ME.ECS NetworkModule
    /// </summary>
    public class SignalRTransporter : ME.ECS.Network.ITransporter {

        private HubConnection connection;
        private readonly Queue<byte[]> receivedStateQueue = new Queue<byte[]>();
        private readonly Queue<byte[]> receivedRPCQueue = new Queue<byte[]>();
        private readonly object stateLock = new object();
        private readonly object rpcLock = new object();
        private bool isConnected = false;
        private readonly string hubUrl;

        public SignalRTransporter(string url = "http://localhost:5000/gameHub") {
            this.hubUrl = url;
        }

        void ME.ECS.Network.ITransporter.Send(byte[] bytes) {
            SendRPC(bytes);
        }

        void ME.ECS.Network.ITransporter.SendSystem(byte[] bytes) {
            SendGameState(bytes);
        }

        byte[] ME.ECS.Network.ITransporter.Receive() {
            lock (rpcLock) {
                if (receivedRPCQueue.Count > 0) {
                    return receivedRPCQueue.Dequeue();
                }
            }
            return null;
        }

        byte[] ME.ECS.Network.ITransporter.ReceiveSystem() {
            lock (stateLock) {
                if (receivedStateQueue.Count > 0) {
                    return receivedStateQueue.Dequeue();
                }
            }
            return null;
        }

        async void ME.ECS.Network.ITransporter.Connect() {
            if (isConnected) return;

            try {
                connection = new HubConnectionBuilder()
                    .WithUrl(hubUrl)
                    .WithAutomaticReconnect()
                    .Build();

                // Register handlers for receiving messages
                connection.On<byte[]>("ReceiveGameState", (data) => {
                    lock (stateLock) {
                        receivedStateQueue.Enqueue(data);
                    }
                });

                connection.On<byte[]>("ReceiveRPC", (data) => {
                    lock (rpcLock) {
                        receivedRPCQueue.Enqueue(data);
                    }
                });

                // Start the connection
                await connection.StartAsync();
                isConnected = true;
                Debug.Log("Connected to SignalR hub.");
            }
            catch (System.Exception ex) {
                Debug.LogError($"Failed to connect to SignalR hub: {ex.Message}");
            }
        }

        void ME.ECS.Network.ITransporter.Disconnect() {
            if (connection != null) {
                connection.StopAsync().ContinueWith(task => {
                    isConnected = false;
                    Debug.Log("Disconnected from SignalR hub.");
                });
            }
        }

        private async void SendGameState(byte[] data) {
            if (connection != null && isConnected) {
                try {
                    await connection.InvokeAsync("SendGameState", data);
                }
                catch (System.Exception ex) {
                    Debug.LogError($"Error sending game state: {ex.Message}");
                }
            }
        }

        private async void SendRPC(byte[] data) {
            if (connection != null && isConnected) {
                try {
                    await connection.InvokeAsync("SendRPC", data);
                }
                catch (System.Exception ex) {
                    Debug.LogError($"Error sending RPC: {ex.Message}");
                }
            }
        }
    }
}