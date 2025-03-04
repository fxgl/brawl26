using ME.ECS;
using UnityEngine;

namespace Game.Components {

    // Player components
    public struct PlayerTag : IStructComponent {}
    
    public struct PlayerIdComponent : IStructComponent {
        public int id;
    }
    
    public struct HealthComponent : IStructComponent {
        public float current;
        public float max;
    }
    
    // Transform components
    public struct PositionComponent : IStructComponent {
        public Vector3 value;
    }
    
    public struct RotationComponent : IStructComponent {
        public Quaternion value;
    }
    
    public struct VelocityComponent : IStructComponent {
        public Vector3 value;
    }
    
    // Combat components
    public struct AttackComponent : IStructComponent {
        public float damage;
        public float cooldown;
        public float lastAttackTime;
    }
    
    public struct DamageableTag : IStructComponent {}
    
    // Projectile components
    public struct ProjectileTag : IStructComponent {}
    
    public struct ProjectileOwnerComponent : IStructComponent {
        public Entity owner;
    }
    
    // Input components
    public struct InputComponent : IStructComponent {
        public Vector2 moveDirection;
        public bool attackPressed;
    }
}