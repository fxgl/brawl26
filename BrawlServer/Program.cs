using System;
using System.Reflection;
using System.Threading.Tasks;
using BrawlServer.Network;
using BrawlServer.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace BrawlServer
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Starting Brawl gRPC Server...");
            Console.WriteLine($"Server version: {Assembly.GetExecutingAssembly().GetName().Version}");
            
            // Parse command line arguments
            int port = 50051;
            if (args.Length > 0 && int.TryParse(args[0], out int customPort))
            {
                port = customPort;
            }
            
            // Create and start the web host directly
            var builder = WebApplication.CreateBuilder(args);
            
            // Add services to the container
            builder.Services.AddGrpc();
            builder.Services.AddSingleton<GrpcTransporter>();
            builder.Services.AddSingleton<BrawlService>();
            
            // Configure Kestrel
            builder.WebHost.ConfigureKestrel(options =>
            {
                // Setup a HTTP/2 endpoint without TLS
                options.ListenAnyIP(port, listenOptions =>
                {
                    listenOptions.Protocols = HttpProtocols.Http2;
                });
            });
            
            var app = builder.Build();
            
            // Configure the HTTP request pipeline
            app.UseRouting();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGrpcService<BrawlService>();
            });
            
            // Log server startup
            Console.WriteLine("Services configured, starting server...");
            Console.WriteLine($"Listening on port {port}");
            
            try
            {
                // Run the app
                await app.RunAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Fatal error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}