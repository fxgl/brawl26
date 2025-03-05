using ME.ECS;
using UnityEngine;

namespace Game.Features.Collision {
    
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class CollisionFeature : Feature {
        
        [Header("Collision Settings")]
        public int maxCollisionsPerFrame = 100;
        public float defaultCollisionRadius = 0.5f;
        
        [Header("Layer Settings")]
        public int playerLayer = 0;
        public int enemyLayer = 1;
        public int projectileLayer = 2;
        public int obstacleLayer = 3;
        
        protected override void OnConstruct() {
            
            // Add collision detection system
            this.AddSystem<Systems.CollisionDetectionSystem>();
            
            // Add collision resolution system
            this.AddSystem<Systems.CollisionResolutionSystem>();
        }
        
        protected override void OnDeconstruct() {}
        
    }
}