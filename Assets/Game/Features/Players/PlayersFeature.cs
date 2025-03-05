using Game.Views;
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
    //[CreateAssetMenu(fileName = "PlayersFeature", menuName = "ME.ECS/Features/Players Feature", order = 0)]
    public sealed class PlayersFeature : Feature {
        
        public PlayerView playerView;
        private ViewId playerViewId;
        
        [Header("Player Settings")]
        public float moveSpeed = 5f;
        public float maxHealth = 100f;
        public float attackDamage = 10f;
        public float attackCooldown = 0.5f;
        
        [Header("Debug")]
        public bool enableLogs = true;
        
        // Reference to player prefab for view
        public GameObject playerPrefab;

        protected override void OnConstruct() {
            if (enableLogs) Debug.Log("[PlayersFeature] OnConstruct started");
            
            if (this.playerView == null) {
                Debug.LogError("[PlayersFeature] PlayerView is null! Please assign it in the inspector.");
                return;
            }
            
            this.playerViewId = this.world.RegisterViewSource(this.playerView);
            if (enableLogs) Debug.Log($"[PlayersFeature] Registered player view with ID: {this.playerViewId}");

            // Add player systems
            this.AddSystem<PlayerSpawnSystem>();
            this.AddSystem<PlayerInputSystem>();
            this.AddSystem<PlayerMovementSystem>();
            this.AddSystem<PlayerAttackSystem>();
            if (enableLogs) Debug.Log("[PlayersFeature] Added player systems");
            
            
        }

        protected override void OnDeconstruct() {
            if (enableLogs) Debug.Log("[PlayersFeature] OnDeconstruct called - cleaning up resources");
            // Clean up resources
        }
        
        // Public API for spawning players
        public Entity SpawnPlayer(int playerId) {
            if (enableLogs) Debug.Log($"[PlayersFeature] SpawnPlayer called for player ID: {playerId}");
            
            var entity = this.world.AddEntity();
            if (enableLogs) Debug.Log($"[PlayersFeature] Created entity: {entity}");
            
            // Add player components
            entity.Set(new PlayerTag());
            
            if (this.playerViewId<=0) {
                Debug.LogError("[PlayersFeature] Invalid playerViewId. Cannot instantiate view!");
            } else {
                entity.InstantiateView(this.playerViewId);
                if (enableLogs) Debug.Log($"[PlayersFeature] Instantiated view {playerViewId} for entity: {entity}");
            }
            
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
            
            // Add collision components
            var collisionFeature = this.world.GetFeature<Features.Collision.CollisionFeature>();
            float collisionRadius = 1.0f;
            int playerLayer = 0;
            
            if (collisionFeature != null) {
                collisionRadius = collisionFeature.defaultCollisionRadius;
                playerLayer = collisionFeature.playerLayer;
                
                // Player mask - collide with everything except other players
                int playerMask = ~(1 << playerLayer);
                entity.Set(new CollisionMaskComponent { mask = playerMask });
                entity.Set(new CollisionLayerComponent { layer = 1 });
            }
            
            entity.Set(new CollisionRadiusComponent { radius = collisionRadius });
            entity.Set(new SolidBodyTag());
            
            // Add to game state
            var state = this.world.GetState<GameState>();
            if (state == null) {
                Debug.LogError("[PlayersFeature] GameState is null! Cannot add player to state.");
            } else {
                state.players[playerId] = entity;
                if (enableLogs) Debug.Log($"[PlayersFeature] Added player {playerId} to game state");
            }
            
            if (enableLogs) Debug.Log($"[PlayersFeature] Player {playerId} spawned successfully with entity: {entity}");
            return entity;
        }
    }
}