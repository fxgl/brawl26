using ME.ECS;
using UnityEngine;

namespace Game.Features.Players.Systems
{
#pragma warning disable
    using Game.Components;
    using Game.Modules;
    using Game.Systems;
    using Game.Markers;
    using Components;
    using Modules;
    using Systems;
    using Markers;

#pragma warning restore

#if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
#endif
    public sealed class PlayerMovementSystem : ISystem, IAdvanceTick
    {
        public World world { get; set; }
        // Static flag to enable/disable logging
        public static bool EnableLogs = false;

        private Filter filter;
        private PlayersFeature playersFeature;

        // Debug visualization settings
        private const float DEBUG_LINE_DURATION = 0.1f;
        private const float DEBUG_DIRECTION_SCALE = 2.0f;

        void ISystemBase.OnConstruct()
        {
            // Create filter to get player entities with position and input
            this.filter = Filter.Create("Filter-PlayerMovement")
                .With<PlayerTag>()
                .With<PositionComponent>()
                .With<VelocityComponent>()
                .With<InputComponent>()
                .Push();

            this.playersFeature = this.world.GetFeature<PlayersFeature>();
        }

        void ISystemBase.OnDeconstruct()
        {
        }

                void IAdvanceTick.AdvanceTick(in float deltaTime)
        {
            // Process movement for all players with input

            foreach (var entity in this.filter)
            {
                // Get current input and position
                var input = entity.Read<InputComponent>();
                var position = entity.Read<PositionComponent>();
                var rotation = entity.Read<RotationComponent>();

                if (EnableLogs)
                    Debug.Log(
                        $"Entity {entity.id}: Processing movement with input: {input.moveDirection}, current position: {position.value}");

                // Calculate new velocity based on input
                Vector3 moveDirection = new Vector3(input.moveDirection.x, 0f, input.moveDirection.y);
                if (input.attackPressed)
                {
                    
                        // Get combat feature for projectile attacks
                        var combatFeature = this.world.GetFeature<CombatFeature>();
                        if (combatFeature != null)
                        {
                            var attackDirection =  rotation.value*Vector3.forward;
                            // Fire projectile in attack direction
                            var projectile = combatFeature.SpawnProjectile(
                                entity, 
                                position.value + attackDirection, // Spawn in front of player
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

                 if (moveDirection.sqrMagnitude > float.Epsilon)
                {
                    Vector3 velocity = moveDirection * this.playersFeature.moveSpeed;

                    if (EnableLogs)
                        Debug.Log(
                            $"Entity {entity.id}: Move direction: {moveDirection}, calculated velocity: {velocity}");

                    // Apply velocity
                    entity.Set(new VelocityComponent { value = velocity });

                    // Calculate new position
                    Vector3 newPosition = position.value + velocity * deltaTime;
                    if (EnableLogs)
                        Debug.Log($"Entity {entity.id}: New position: {newPosition} (delta: {velocity * deltaTime})");
                    entity.Set(new PositionComponent { value = newPosition });

                    // Handle rotation (face movement direction)

                    Quaternion targetRotation = Quaternion.LookRotation(moveDirection, Vector3.up);
                    if (EnableLogs)
                        Debug.Log(
                            $"Entity {entity.id}: Updating rotation to face direction: {moveDirection}, rotation: {targetRotation}");
                    entity.Set(new RotationComponent { value = targetRotation });

                    // Draw debug visualization
                    DrawDebugVisualization(position.value, newPosition, moveDirection, entity.id);
                }

                entity.Remove<InputComponent>();
            }
        }

        private void DrawDebugVisualization(Vector3 currentPosition, Vector3 newPosition, Vector3 moveDirection,
            int entityId)
        {
            // Draw current position marker (cross)
            Debug.DrawRay(currentPosition + Vector3.up * 0.1f, Vector3.up * 0.5f, Color.yellow, DEBUG_LINE_DURATION);
            Debug.DrawRay(currentPosition + Vector3.up * 0.35f, Vector3.right * 0.2f, Color.yellow,
                DEBUG_LINE_DURATION);
            Debug.DrawRay(currentPosition + Vector3.up * 0.35f, Vector3.left * 0.2f, Color.yellow, DEBUG_LINE_DURATION);
            Debug.DrawRay(currentPosition + Vector3.up * 0.35f, Vector3.forward * 0.2f, Color.yellow,
                DEBUG_LINE_DURATION);
            Debug.DrawRay(currentPosition + Vector3.up * 0.35f, Vector3.back * 0.2f, Color.yellow, DEBUG_LINE_DURATION);

            // Draw movement path
            Debug.DrawLine(currentPosition, newPosition, Color.green, DEBUG_LINE_DURATION);

            // Draw direction vector
            if (moveDirection.sqrMagnitude > 0.1f)
            {
                // Draw movement direction
                Debug.DrawRay(newPosition, moveDirection.normalized * DEBUG_DIRECTION_SCALE, Color.blue,
                    DEBUG_LINE_DURATION);

                // Draw forward direction after rotation
                Vector3 forward = Quaternion.LookRotation(moveDirection, Vector3.up) * Vector3.forward;
                Debug.DrawRay(newPosition, forward * DEBUG_DIRECTION_SCALE * 0.8f, Color.red, DEBUG_LINE_DURATION);

                // Draw right vector to show orientation
                Vector3 right = Quaternion.LookRotation(moveDirection, Vector3.up) * Vector3.right;
                Debug.DrawRay(newPosition, right * DEBUG_DIRECTION_SCALE * 0.4f, Color.magenta, DEBUG_LINE_DURATION);
            }

            // Draw entity ID indicator
            Debug.DrawLine(newPosition, newPosition + Vector3.up * 1.0f, Color.white, DEBUG_LINE_DURATION);
        }
#if UNITY_EDITOR
        [UnityEditor.MenuItem("Game/Debug/Player Movement System/Toggle Logs")]
        public static void ToggleLogs()
        {
            EnableLogs = !EnableLogs;
            Debug.Log($"Player Movement System logs are now {(EnableLogs ? "enabled" : "disabled")}");
        }
#endif
    }
}