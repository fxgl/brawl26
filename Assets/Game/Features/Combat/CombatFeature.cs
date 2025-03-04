using ME.ECS;
using ME.ECS.Views.Providers;
using UnityEngine;

namespace Game.Features {

    using Components; using Modules; using Systems; using Features; using Markers;
    using Combat.Components; using Combat.Modules; using Combat.Systems; using Combat.Markers;
    
    namespace Combat.Components {}
    namespace Combat.Modules {}
    namespace Combat.Systems {}
    namespace Combat.Markers {}
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class CombatFeature : Feature {
        
        [Header("Combat Settings")]
        public float damageMultiplier = 1.0f;
        public float projectileSpeed = 10f;
        public float projectileLifetime = 5f;
        
        // Reference to projectile prefab for view
        public GameObject projectilePrefab;

        protected override void OnConstruct() {
            // Add combat systems
            this.AddSystem<ProjectileSystem>();
            this.AddSystem<DamageSystem>();
            
            // Register projectile view
            if (projectilePrefab != null) {
                this.world.RegisterViewSource( this.projectilePrefab);
            }
        }

        protected override void OnDeconstruct() {
            // Clean up resources
        }
        
        // Public API for spawning projectiles
        public Entity SpawnProjectile(Entity owner, Vector3 position, Vector3 direction) {
            var entity = this.world.AddEntity();
            
            // Add projectile components
            entity.Set(new ProjectileTag());
            entity.Set(new ProjectileOwnerComponent { owner = owner });
            
            // Set transform components
            entity.Set(new PositionComponent { value = position });
            entity.Set(new RotationComponent { value = Quaternion.LookRotation(direction) });
            entity.Set(new VelocityComponent { value = direction.normalized * this.projectileSpeed });
            
            // Add damage component
            float damage = 0f;
            if (owner != Entity.Empty && owner.Has<AttackComponent>()) {
                damage = owner.Read<AttackComponent>().damage;
            }
            
            entity.Set(new AttackComponent { 
                damage = damage * this.damageMultiplier,
                cooldown = 0f,
                lastAttackTime = 0f
            });
            
            return entity;
        }
    }
}