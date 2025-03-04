using ME.ECS;
using UnityEngine;

namespace Game.Features.Players.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers; using Game.Features;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class PlayerAttackSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter playerFilter;
        private Filter damageableFilter;
        
        void ISystemBase.OnConstruct() {
            // Filter for players with attack capability
            this.playerFilter = Filter.Create("Filter-PlayerAttack")
                .With<PlayerTag>()
                .With<AttackComponent>()
                .With<PositionComponent>()
                .With<RotationComponent>()
                .With<InputComponent>()
                .Push();
                
            // Filter for damageable entities
            this.damageableFilter = Filter.Create("Filter-Damageable")
                .With<DamageableTag>()
                .With<HealthComponent>()
                .With<PositionComponent>()
                .Push();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Process attack input for all players
            foreach (var entity in this.playerFilter) {
                var input = entity.Read<InputComponent>();
                var attack = entity.Read<AttackComponent>();
                
                // Update attack cooldown
                float currentTime = this.world.GetCurrentTick() * deltaTime;
                
                // Check if player is trying to attack and if attack is off cooldown
                if (input.attackPressed && (currentTime - attack.lastAttackTime >= attack.cooldown)) {
                    // Get player position and facing direction
                    var position = entity.Read<PositionComponent>();
                    var rotation = entity.Read<RotationComponent>();
                    Vector3 attackDirection = rotation.value * Vector3.forward;
                    
                    // Update last attack time
                    attack.lastAttackTime = currentTime;
                    entity.Set(attack);
                    
                    // Get combat feature for projectile attacks
                    var combatFeature = this.world.GetFeature<CombatFeature>();
                    if (combatFeature != null) {
                        // Fire projectile in attack direction
                        combatFeature.SpawnProjectile(
                            entity, 
                            position.value + attackDirection * 1.0f, // Spawn in front of player
                            attackDirection
                        );
                    }
                    
                    // Find potential targets in attack range
                    float attackRange = 2.0f; // Set attack range
                    
                    // For each damageable entity, check if in range and apply damage
                    foreach (var targetEntity in this.damageableFilter) {
                        // Don't damage self
                        if (targetEntity == entity) continue;
                        
                        var targetPos = targetEntity.Read<PositionComponent>();
                        float distance = Vector3.Distance(position.value, targetPos.value);
                        
                        // Check if target is in attack range and in forward direction
                        if (distance <= attackRange) {
                            Vector3 directionToTarget = (targetPos.value - position.value).normalized;
                            float dotProduct = Vector3.Dot(attackDirection, directionToTarget);
                            
                            // If target is in front of player (within ~60 degree cone)
                            if (dotProduct > 0.5f) {
                                // Apply damage to target
                                var health = targetEntity.Read<HealthComponent>();
                                health.current -= attack.damage;
                                targetEntity.Set(health);
                                
                                Debug.Log($"Player attacked target: Damage={attack.damage}, RemainingHealth={health.current}");
                            }
                        }
                    }
                }
            }
        }
    }
}