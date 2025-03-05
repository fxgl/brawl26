using ME.ECS;
using UnityEngine;

namespace Game.Features.Collision.Markers {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    public struct CollisionEventComponent : IComponent {
        public Entity entity1;
        public Entity entity2;
        public Vector3 contactPoint;
        public Vector3 normal;
        public float penetrationDepth;
    }
}