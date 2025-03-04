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
    public sealed class ProjectileSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter projectileFilter;
        private Filter damageableFilter;
        private CombatFeature combatFeature;
        
        private float projectileLifetime;
        
        void ISystemBase.OnConstruct() {
            // Create filter for projectiles
            this.projectileFilter = Filter.Create("Filter-Projectiles")
                .With<ProjectileTag>()
                .With<PositionComponent>()
                .With<VelocityComponent>()
                .With<AttackComponent>()
                .Push();
                
            // Filter for damageable entities
            this.damageableFilter = Filter.Create("Filter-Damageable")
                .With<DamageableTag>()
                .With<HealthComponent>()
                .With<PositionComponent>()
                .Push();
                
            this.combatFeature = this.world.GetFeature<CombatFeature>();
            this.projectileLifetime = this.combatFeature.projectileLifetime;
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Update all projectiles
            foreach (var entity in this.projectileFilter) {
                // Get components
                var position = entity.Read<PositionComponent>();
                var velocity = entity.Read<VelocityComponent>();
                var owner = entity.Read<ProjectileOwnerComponent>().owner;
                var attack = entity.Read<AttackComponent>();
                
                // Update lifetime
                attack.lastAttackTime += deltaTime;
                
                // Check if projectile has expired
                if (attack.lastAttackTime >= this.projectileLifetime) {
                    // Destroy projectile if it's been alive too long
                    entity.Destroy();
                    continue;
                }
                
                // Move projectile
                Vector3 newPosition = position.value + velocity.value * deltaTime;
                entity.Set(new PositionComponent { value = newPosition });
                
                // Check for collisions
                float hitRadius = 0.5f; // Collision radius
                
                foreach (var targetEntity in this.damageableFilter) {
                    // Skip owner
                    if (targetEntity == owner) continue;
                    
                    var targetPos = targetEntity.Read<PositionComponent>();
                    float distance = Vector3.Distance(newPosition, targetPos.value);
                    
                    // Check if hit
                    if (distance < hitRadius) {
                        // Apply damage to target
                        var health = targetEntity.Read<HealthComponent>();
                        health.current -= attack.damage;
                        targetEntity.Set(health);
                        
                        Debug.Log($"Projectile hit target: Damage={attack.damage}, RemainingHealth={health.current}");
                        
                        // Destroy projectile after hit
                        entity.Destroy();
                        break;
                    }
                }
            }
        }
    }
}