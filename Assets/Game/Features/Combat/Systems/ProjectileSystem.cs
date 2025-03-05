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
        private CombatFeature combatFeature;
        private Features.Collision.CollisionFeature collisionFeature;
        
        private float projectileLifetime;
        
        void ISystemBase.OnConstruct() {
            // Create filter for projectiles
            this.projectileFilter = Filter.Create("Filter-Projectiles")
                .With<ProjectileTag>()
                .With<PositionComponent>()
                .With<VelocityComponent>()
                .With<AttackComponent>()
                .Push();
                
            this.combatFeature = this.world.GetFeature<CombatFeature>();
            this.projectileLifetime = this.combatFeature.projectileLifetime;
            
            // Get collision feature
            this.collisionFeature = this.world.GetFeature<Features.Collision.CollisionFeature>();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Update all projectiles
            foreach (var entity in this.projectileFilter) {
                // Get components
                var position = entity.Read<PositionComponent>();
                var velocity = entity.Read<VelocityComponent>();
                var attack = entity.Read<AttackComponent>();
                
                // Update lifetime
                attack.lastAttackTime += deltaTime;
                entity.Set(attack);
                
                // Check if projectile has expired
                if (attack.lastAttackTime >= this.projectileLifetime) {
                    // Destroy projectile if it's been alive too long
                    entity.Destroy();
                    continue;
                }
                
                // Move projectile
                Vector3 newPosition = position.value + velocity.value * deltaTime;
                entity.Set(new PositionComponent { value = newPosition });
                
                // Ensure projectile has a collision radius component
                if (!entity.Has<CollisionRadiusComponent>()) {
                    entity.Set(new CollisionRadiusComponent { 
                        radius = this.collisionFeature != null ? 
                                 this.collisionFeature.defaultCollisionRadius : 
                                 0.5f 
                    });
                }
                
                // Ensure projectile has layer setup for collision filtering
                if (!entity.Has<CollisionLayerComponent>() && this.collisionFeature != null) {
                    entity.Set(new CollisionLayerComponent { 
                        layer = this.collisionFeature.projectileLayer 
                    });
                }
            }
        }
    }
}