using Game.Components;
using ME.ECS;

namespace Game.Features.Combat.Views {
    
    using ME.ECS.Views.Providers;
    
    public class BulletView : MonoBehaviourView {
        
        public override bool applyStateJob => true;

        public override void OnInitialize() {
            
        }
        
        public override void OnDeInitialize() {
            
        }
        
        public override void ApplyStateJob(UnityEngine.Jobs.TransformAccess transform, float deltaTime, bool immediately) {
            
        }
        
        public override void ApplyState(float deltaTime, bool immediately) {
            var position = this.entity.Read<PositionComponent>().value;
            var rotation = this.entity.Read<RotationComponent>().value;
    
    
            this.transform.position = position;
            this.transform.rotation = rotation;
        }
        
    }
    
}