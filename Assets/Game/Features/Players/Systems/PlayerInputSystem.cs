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
    public sealed class PlayerInputSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter filter;
        private int localPlayerId = 1; // Default local player ID
        
        void ISystemBase.OnConstruct() {
            // Create filter to get player entities
            this.filter = Filter.Create("Filter-PlayerInput")
                .With<PlayerTag>()
                .With<PlayerIdComponent>()
                .Push();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // In a real game, this would receive input from network module
            // For this example, just handle local input and apply to the local player
            
            // For testing, use basic input axes
            Vector2 movementInput = new Vector2(
                Input.GetAxis("Horizontal"),
                Input.GetAxis("Vertical")
            );
            
            bool attackButton = Input.GetButton("Jump");
            if (attackButton || movementInput.sqrMagnitude > 0.1f)
            {
                
                // Find local player entity and apply input
                foreach (var entity in this.filter)
                {
                    var playerId = entity.Read<PlayerIdComponent>().id;

                    // Only process input for local player
                    if (playerId == this.localPlayerId)
                    {
                        var input = new InputComponent
                        {
                            moveDirection = movementInput,
                            attackPressed = attackButton
                        };
                        // Apply input component
                        entity.Set(input);
                       // Debug.Log($"Input received: {localPlayerId} - Movement: {movementInput}, Attack: {attackButton}");


                        break; // Found local player, no need to continue

                    }
                }
            }
        }
    }
}