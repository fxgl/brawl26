using ME.ECS;
using ME.ECS.Views.Providers;
using UnityEngine;

namespace Game.Features {

    using Components; using Modules; using Systems; using Features; using Markers;
    using Players.Components; using Players.Modules; using Players.Systems; using Players.Markers;
    
    namespace Players.Components {}
    namespace Players.Modules {}
    namespace Players.Systems {}
    namespace Players.Markers {}
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class PlayersFeature : Feature {
        
        [Header("Player Settings")]
        public float moveSpeed = 5f;
        public float maxHealth = 100f;
        public float attackDamage = 10f;
        public float attackCooldown = 0.5f;
        
        // Reference to player prefab for view
        public GameObject playerPrefab;

        protected override void OnConstruct() {
            // Add player systems
            this.AddSystem<PlayerSpawnSystem>();
            this.AddSystem<PlayerInputSystem>();
            this.AddSystem<PlayerMovementSystem>();
            this.AddSystem<PlayerAttackSystem>();
            
            // Register player view
            if (playerPrefab != null) {
                // Register the player prefab for view instantiation
                this.world.RegisterViewSource(this.playerPrefab);
            }
        }

        protected override void OnDeconstruct() {
            // Clean up resources
        }
        
        // Public API for spawning players
        public Entity SpawnPlayer(int playerId) {
            var entity = this.world.AddEntity();
            
            // Add player components
            entity.Set(new PlayerTag());
            entity.Set(new PlayerIdComponent { id = playerId });
            entity.Set(new HealthComponent { current = this.maxHealth, max = this.maxHealth });
            
            // Add transform components
            entity.Set(new PositionComponent { value = Vector3.zero });
            entity.Set(new RotationComponent { value = Quaternion.identity });
            entity.Set(new VelocityComponent { value = Vector3.zero });
            
            // Add combat components
            entity.Set(new AttackComponent { 
                damage = this.attackDamage,
                cooldown = this.attackCooldown,
                lastAttackTime = 0f
            });
            entity.Set(new DamageableTag());
            
            // Add to game state
            var state = this.world.GetState<GameState>();
            state.players[playerId] = entity;
            
            return entity;
        }
    }
}