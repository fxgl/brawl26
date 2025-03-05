using System;

namespace BrawlServer
{
    class SignalRConsoleApp
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Starting Brawl SignalR Server...");
            SignalRServer.Start(args);
        }
    }
}