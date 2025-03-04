using ME.ECS;
using UnityEngine;

namespace Game.Features.Combat.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class DamageSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter damageableFilter;
        
        void ISystemBase.OnConstruct() {
            // Filter for entities with health
            this.damageableFilter = Filter.Create("Filter-HealthCheck")
                .With<HealthComponent>()
                .Push();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Check all entities with health to see if they should be destroyed
            foreach (var entity in this.damageableFilter) {
                var health = entity.Read<HealthComponent>();
                
                // Check if entity has died
                if (health.current <= 0) {
                    // Handle death based on entity type
                    if (entity.Has<PlayerTag>()) {
                        // For players, handle respawn or game over
                        HandlePlayerDeath(entity);
                    } else if (entity.Has<ProjectileTag>()) {
                        // For projectiles, just destroy
                        entity.Destroy();
                    } else {
                        // For other entities, destroy
                        entity.Destroy();
                    }
                }
            }
        }
        
        private void HandlePlayerDeath(in Entity playerEntity) {
            // Get player ID
            int playerId = playerEntity.Read<PlayerIdComponent>().id;
            
            Debug.Log($"Player {playerId} died!");
            
            // In a real game, this would handle respawn or game over logic
            // For this example, just reset health and respawn at a random position
            
            var health = playerEntity.Read<HealthComponent>();
            health.current = health.max;
            playerEntity.Set(health);
            
            // Random respawn position
            Vector3 respawnPos = new Vector3(
                Random.Range(-5f, 5f),
                0f,
                Random.Range(-5f, 5f)
            );
            playerEntity.Set(new PositionComponent { value = respawnPos });
            
            // Reset velocity
            playerEntity.Set(new VelocityComponent { value = Vector3.zero });
        }
    }
}