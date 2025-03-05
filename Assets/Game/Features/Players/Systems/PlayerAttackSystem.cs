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
        private PlayersFeature playersFeature;
        
        // Add static property for enabling/disabling logs
        private static bool EnableLogs = false;
        
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
                
            // Get players feature for attack settings
            this.playersFeature = this.world.GetFeature<PlayersFeature>();
            
            if (EnableLogs) Debug.Log("PlayerAttackSystem constructed");
        }
        
        void ISystemBase.OnDeconstruct() {
            if (EnableLogs) Debug.Log("PlayerAttackSystem deconstructed");
        }
        
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
                    
                    if (EnableLogs) {
                        string playerId = entity.Has<PlayerIdComponent>() ? 
                            entity.Read<PlayerIdComponent>().id.ToString() : 
                            entity.id.ToString();
                        Debug.Log($"Player {playerId} initiated attack at time {currentTime:F2}");
                    }
                    
                    // Check if we should use projectile attack
                    bool useProjectileAttack = this.playersFeature != null ? 
                                              this.playersFeature.useProjectileAttack : 
                                              true;
                                              
                    if (useProjectileAttack) {
                        // Get combat feature for projectile attacks
                        var combatFeature = this.world.GetFeature<CombatFeature>();
                        if (combatFeature != null) {
                            // Fire projectile in attack direction
                            var projectile = combatFeature.SpawnProjectile(
                                entity, 
                                position.value + attackDirection * 1.0f, // Spawn in front of player
                                attackDirection
                            );
                            
                            // Ensure the projectile has collision components
                            var collisionFeature = this.world.GetFeature<Features.Collision.CollisionFeature>();
                            if (collisionFeature != null && !projectile.Has<CollisionRadiusComponent>()) {
                                projectile.Set(new CollisionRadiusComponent { 
                                    radius = collisionFeature.defaultCollisionRadius 
                                });
                                
                                projectile.Set(new CollisionLayerComponent { 
                                    layer = collisionFeature.projectileLayer 
                                });
                                
                                // Set up mask to collide with everything except owner's layer
                                if (entity.Has<CollisionLayerComponent>()) {
                                    int ownerLayer = entity.Read<CollisionLayerComponent>().layer;
                                    int mask = ~(1 << ownerLayer);
                                    projectile.Set(new CollisionMaskComponent { mask = mask });
                                }
                            }
                            
                            if (EnableLogs) {
                                string playerId = entity.Has<PlayerIdComponent>() ? 
                                    entity.Read<PlayerIdComponent>().id.ToString() : 
                                    entity.id.ToString();
                                Debug.Log($"Player {playerId} fired projectile from position {position.value}, direction {attackDirection}");
                            }
                        }
                        else if (EnableLogs) {
                            Debug.LogWarning("Combat feature not found, cannot spawn projectile");
                        }
                    }
                    else {
                        // Use melee attack instead
                        if (EnableLogs) Debug.Log($"Performing melee attack from position {position.value}, direction {attackDirection}");
                        PerformMeleeAttack(entity, position.value, attackDirection, attack.damage);
                    }
                }
            }
        }
        
        private void PerformMeleeAttack(Entity attacker, Vector3 attackerPos, Vector3 attackDirection, float damage) {
            // Get melee attack range
            float attackRange = this.playersFeature != null ? 
                              this.playersFeature.meleeAttackRange : 
                              2.0f;
            
            if (EnableLogs) Debug.Log($"Melee attack with range {attackRange}, damage {damage}");
            
            int targetsInRange = 0;
            int targetsHit = 0;
            
            // For each damageable entity, check if in range and apply damage
            foreach (var targetEntity in this.damageableFilter) {
                // Don't damage self
                if (targetEntity == attacker) continue;
                
                var targetPos = targetEntity.Read<PositionComponent>();
                float distance = Vector3.Distance(attackerPos, targetPos.value);
                
                // Check if target is in attack range and in forward direction
                if (distance <= attackRange) {
                    targetsInRange++;
                    Vector3 directionToTarget = (targetPos.value - attackerPos).normalized;
                    float dotProduct = Vector3.Dot(attackDirection, directionToTarget);
                    
                    // If target is in front of player (within ~60 degree cone)
                    if (dotProduct > 0.5f) {
                        // Apply damage to target
                        var health = targetEntity.Read<HealthComponent>();
                        health.current -= damage;
                        targetEntity.Set(health);
                        
                        targetsHit++;
                        
                        if (EnableLogs) {
                            string targetId = targetEntity.Has<PlayerIdComponent>() ? 
                                targetEntity.Read<PlayerIdComponent>().id.ToString() : 
                                targetEntity.id.ToString();
                            Debug.Log($"Melee attack hit target {targetId}: Damage={damage}, RemainingHealth={health.current}");
                        }
                    }
                    else if (EnableLogs) {
                        Debug.Log($"Target in range but not in attack cone (dot product: {dotProduct})");
                    }
                }
            }
            
            if (EnableLogs) Debug.Log($"Melee attack summary: {targetsInRange} targets in range, {targetsHit} targets hit");
        }
        
#if UNITY_EDITOR
        [UnityEditor.MenuItem("Game/Debug/Player Attack System/Toggle Logs")]
        public static void ToggleLogs()
        {
            EnableLogs = !EnableLogs;
            Debug.Log($"Player Attack System logs are now {(EnableLogs ? "enabled" : "disabled")}");
        }
#endif
    }
}