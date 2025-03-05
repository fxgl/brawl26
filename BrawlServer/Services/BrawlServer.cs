using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace BrawlServer.Services
{
    public class BrawlServer : IHostedService
    {
        private readonly BrawlService _service;
        private readonly int _port;
        private IHost _host;
        
        public BrawlServer(BrawlService service, int port = 50051)
        {
            _service = service;
            _port = port;
        }
        
        // Start the server when the hosting service starts
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            // Create and configure the gRPC server using ASP.NET
            _host = Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder()
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.ConfigureKestrel(options =>
                    {
                        // Setup a HTTP/2 endpoint without TLS for development
                        options.ListenAnyIP(_port, listenOptions =>
                        {
                            listenOptions.Protocols = HttpProtocols.Http2;
                        });
                    });
                    
                    webBuilder.ConfigureServices(services =>
                    {
                        services.AddGrpc();
                        services.AddSingleton(_service);
                    });
                    
                    webBuilder.Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapGrpcService<BrawlService>();
                        });
                    });
                })
                .Build();
                
            await _host.StartAsync(cancellationToken);
            Console.WriteLine($"gRPC server listening on port {_port}");
        }
        
        // Gracefully shut down the server when the hosting service stops
        public async Task StopAsync(CancellationToken cancellationToken)
        {
            await _host.StopAsync(cancellationToken);
            Console.WriteLine("gRPC server stopped");
        }
    }
}