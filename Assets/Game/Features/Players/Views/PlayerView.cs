using ME.ECS;
using ME.ECS.Views.Providers;
using UnityEngine;

namespace Game.Views {

    using Components;
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public class PlayerView : MonoBehaviourView {

        // [Header("View References")]
        // public Transform modelTransform;
        // public MeshRenderer meshRenderer;
        // public GameObject attackEffect;
        //
        // private Material defaultMaterial;
        // private Vector3 lastPosition;
        // private float damageAnimTimer;
        
        // public void OnInitialize() {
        //     // Store default material for color changes
        //     if (meshRenderer != null) {
        //         defaultMaterial = meshRenderer.material;
        //     }
        //     
        //     // Turn off attack effect by default
        //     if (attackEffect != null) {
        //         attackEffect.SetActive(false);
        //     }
        // }
        //
        // public void ApplyState() {
        //     var entity = this.entity;
        //     
        //     // Handle position/rotation update
        //     if (entity.Has<PositionComponent>()) {
        //         var position = entity.Read<PositionComponent>().value;
        //         this.transform.position = position;
        //         lastPosition = position;
        //     }
        //     
        //     if (entity.Has<RotationComponent>()) {
        //         var rotation = entity.Read<RotationComponent>().value;
        //         this.transform.rotation = rotation;
        //     }
        //     
        //     // Handle health visuals
        //     if (entity.Has<HealthComponent>() && meshRenderer != null) {
        //         var health = entity.Read<HealthComponent>();
        //         float healthPercent = health.current / health.max;
        //         
        //         // Visual feedback for damage
        //         if (damageAnimTimer > 0) {
        //             damageAnimTimer -= Time.deltaTime;
        //             meshRenderer.material.color = Color.red;
        //         } else {
        //             // Color based on health
        //             meshRenderer.material.color = Color.Lerp(Color.red, Color.green, healthPercent);
        //         }
        //     }
        //     
        //     // Handle attack visuals
        //     if (entity.Has<AttackComponent>() && 
        //         entity.Has<InputComponent>() &&
        //         attackEffect != null) {
        //             
        //         var input = entity.Read<InputComponent>();
        //         
        //         // Show attack effect when attack button is pressed
        //         if (input.attackPressed) {
        //             StartAttackAnimation();
        //         }
        //     }
        // }
        //
        // private void StartAttackAnimation() {
        //     // Show attack effect
        //     if (attackEffect != null) {
        //         attackEffect.SetActive(true);
        //         
        //         // Hide after short delay
        //         // In a real implementation, you might use Timers or animation events
        //         CancelInvoke("HideAttackEffect");
        //         Invoke("HideAttackEffect", 0.2f);
        //     }
        // }
        //
        // private void HideAttackEffect() {
        //     if (attackEffect != null) {
        //         attackEffect.SetActive(false);
        //     }
        // }
        //
        // public void TakeDamage() {
        //     // Visual feedback when taking damage
        //     damageAnimTimer = 0.2f;
        // }
        
        public override bool applyStateJob => true;

        public override void OnInitialize() {
            
        }
        
        public override void OnDeInitialize() {
            
        }
        
        public override void ApplyStateJob(UnityEngine.Jobs.TransformAccess transform, float deltaTime, bool immediately) {
            
        }
        
        public override void ApplyState(float deltaTime, bool immediately)
        {

            this.transform.position = this.entity.Read<PositionComponent>().value;
            this.transform.rotation = this.entity.Read<RotationComponent>().value;

        }

    }
}