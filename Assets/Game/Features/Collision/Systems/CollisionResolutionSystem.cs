using ME.ECS;
using UnityEngine;

namespace Game.Features.Collision.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class CollisionResolutionSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter projectilesFilter;
        private Filter collisionsFilter;
        private CollisionFeature feature;
        
        void ISystemBase.OnConstruct() {
            this.projectilesFilter = Filter.Create("Filter-Projectiles-Collision")
                .With<ProjectileTag>()
                .With<PositionComponent>()
                .Push();
            this.collisionsFilter = Filter.Create("Collision-Events")
                .With<CollisionEventComponent>()
                .Push();  
            this.feature = this.world.GetFeature<CollisionFeature>();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            foreach (var entity in this.collisionsFilter)
            {
                var collision = entity.Get<CollisionEventComponent>();
                var entity1 = collision.entity1;
                var entity2 = collision.entity2;
                
                // Check if either entity is a projectile
                bool entity1IsProjectile = entity1.Has<ProjectileTag>();
                bool entity2IsProjectile = entity2.Has<ProjectileTag>();
                
                // Case 1: Projectile collision with something
                if (entity1IsProjectile || entity2IsProjectile) {
                    // Get the projectile and the target
                    var projectile = entity1IsProjectile ? entity1 : entity2;
                    var target = entity1IsProjectile ? entity2 : entity1;
                    
                    // Check if target is damageable
                    if (target.Has<DamageableTag>() && target.Has<HealthComponent>()) {
                        // Check if projectile has attack component
                        if (projectile.Has<AttackComponent>()) {
                            // Get damage amount
                            float damage = projectile.Read<AttackComponent>().damage;
                            
                            // Apply damage to target
                            var health = target.Read<HealthComponent>();
                            health.current -= damage;
                            target.Set(health);
                            
                            Debug.Log($"Collision resolution: Projectile hit target: Damage={damage}, RemainingHealth={health.current}");
                        }
                    }
                    
                    // Destroy the projectile
                    projectile.Destroy();
                }
                // Case 2: Both entities are solid bodies
                else if (entity1.Has<SolidBodyTag>() && entity2.Has<SolidBodyTag>()) {
                    // Implement physical collision resolution
                    ResolvePhysicalCollision(entity1, entity2, collision.normal, collision.penetrationDepth);
                }
                entity.Destroy();
            }
        }
        
        private void ResolvePhysicalCollision(Entity entityA, Entity entityB, Vector3 normal, float penetrationDepth) {
            // Skip if either entity is destroyed
            if (entityA.IsAlive() == false || entityB.IsAlive() == false) return;
            
            // Physical resolution only works for entities with position
            if (!entityA.Has<PositionComponent>() || !entityB.Has<PositionComponent>()) return;
            
            // Get positions
            var posA = entityA.Read<PositionComponent>();
            var posB = entityB.Read<PositionComponent>();
            
            // Simple position correction
            // Calculate separation vector based on penetration depth
            Vector3 separationVector = normal * penetrationDepth;
            
            // Apply separation to both objects (half each)
            posA.value -= separationVector * 0.5f;
            posB.value += separationVector * 0.5f;
            
            // Apply position changes
            entityA.Set(posA);
            entityB.Set(posB);
            
            // Adjust velocity if entities have it
            if (entityA.Has<VelocityComponent>() && entityB.Has<VelocityComponent>()) {
                var velA = entityA.Read<VelocityComponent>();
                var velB = entityB.Read<VelocityComponent>();
                
                // Simple bounce effect
                float restitution = 0.5f; // Bouncy factor (0 = no bounce, 1 = perfect bounce)
                
                // Project velocities onto collision normal
                float velAlongNormalA = Vector3.Dot(velA.value, normal);
                float velAlongNormalB = Vector3.Dot(velB.value, normal);
                
                // Only resolve if objects are moving toward each other
                if (velAlongNormalA - velAlongNormalB < 0f) {
                    // Simplified impulse calculation
                    Vector3 impulse = normal * (-(1f + restitution) * (velAlongNormalA - velAlongNormalB));
                    
                    // Apply impulse to velocities (assuming equal mass)
                    velA.value += impulse * 0.5f;
                    velB.value -= impulse * 0.5f;
                    
                    // Apply velocity changes
                    entityA.Set(velA);
                    entityB.Set(velB);
                }
            }
        }
    }
}