using ME.ECS;
using UnityEngine;

namespace Game.Features.Players.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class PlayerSpawnSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private PlayersFeature feature;
        private GameState gameState;
        private float playerSpawnTimer;
        private float playerSpawnInterval = 2f;
        
        void ISystemBase.OnConstruct() {
            this.feature = this.world.GetFeature<PlayersFeature>();
            this.gameState = this.world.GetState<GameState>();
            this.playerSpawnTimer = 0f;
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // This is just a test/demo implementation
            // In a real game, player spawning would be triggered by network/join events
            
            // Don't spawn players if game is at max capacity
            if (this.gameState.players.Count >= this.gameState.maxPlayers) return;
            
            // Timer to periodically spawn test players
            this.playerSpawnTimer += deltaTime;
            if (this.playerSpawnTimer >= this.playerSpawnInterval) {
                this.playerSpawnTimer = 0f;
                
                // Generate new player ID (would come from network in real implementation)
                int playerId = this.gameState.players.Count + 1;
                
                // Spawn the player through the feature
                var playerEntity = this.feature.SpawnPlayer(playerId);
                
                // Set initial position (random position for testing)
                Vector3 randomPosition = new Vector3(
                    Random.Range(-5f, 5f),
                    0f,
                    Random.Range(-5f, 5f)
                );
                playerEntity.Set(new PositionComponent { value = randomPosition });
                
                Debug.Log($"Spawned player with ID: {playerId} {playerEntity} {playerEntity.Get<PositionComponent>().value}");
            }
        }
    }
}