using ME.ECS;
using UnityEngine;

namespace Game.Features.Players.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class PlayerMovementSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter filter;
        private PlayersFeature playersFeature;
        
        void ISystemBase.OnConstruct() {
            // Create filter to get player entities with position and input
            this.filter = Filter.Create("Filter-PlayerMovement")
                .With<PlayerTag>()
                .With<PositionComponent>()
                .With<VelocityComponent>()
                .With<InputComponent>()
                .Push();
                
            this.playersFeature = this.world.GetFeature<PlayersFeature>();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Process movement for all players with input
            foreach (var entity in this.filter) {
                // Get current input and position
                var input = entity.Read<InputComponent>();
                var position = entity.Read<PositionComponent>();
                
                // Calculate new velocity based on input
                Vector3 moveDirection = new Vector3(input.moveDirection.x, 0f, input.moveDirection.y);
                Vector3 velocity = moveDirection * this.playersFeature.moveSpeed;
                
                // Apply velocity
                entity.Set(new VelocityComponent { value = velocity });
                
                // Calculate new position
                Vector3 newPosition = position.value + velocity * deltaTime;
                entity.Set(new PositionComponent { value = newPosition });
                
                // Handle rotation (face movement direction)
                if (moveDirection.sqrMagnitude > 0.1f) {
                    Quaternion targetRotation = Quaternion.LookRotation(moveDirection, Vector3.up);
                    entity.Set(new RotationComponent { value = targetRotation });
                }
            }
        }
    }
}