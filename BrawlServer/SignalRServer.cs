using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

namespace BrawlServer
{
    public class GameHub : Hub
    {
        public async Task SendGameState(byte[] stateData)
        {
            await Clients.Others.SendAsync("ReceiveGameState", stateData);
        }
        
        public async Task SendRPC(byte[] rpcData)
        {
            await Clients.Others.SendAsync("ReceiveRPC", rpcData);
        }
        
        public override Task OnConnectedAsync()
        {
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
            return base.OnConnectedAsync();
        }
        
        public override Task OnDisconnectedAsync(Exception exception)
        {
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
            return base.OnDisconnectedAsync(exception);
        }
    }

    public class SignalRServer
    {
        public static void Start(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSignalR();
            
            var app = builder.Build();
            app.MapHub<GameHub>("/gameHub");
            
            Console.WriteLine("Starting SignalR server on http://localhost:5000/gameHub");
            app.Run("http://localhost:5000");
        }
    }
}