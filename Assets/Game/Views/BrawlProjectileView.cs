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
    public class BrawlProjectileView : MonoBehaviourView {

        [Header("View References")]
        public TrailRenderer trailRenderer;
        public ParticleSystem impactEffect;
        
        private bool isDestroying = false;
        
        public void OnInitialize() {
            // Reset state
            isDestroying = false;
            
            // Setup trail renderer if present
            if (trailRenderer != null) {
                trailRenderer.Clear();
                trailRenderer.enabled = true;
            }
        }
        
        public void ApplyState() {
            // Skip if already in destroying state
            if (isDestroying) return;
            
            var entity = this.entity;
            
            // Handle position/rotation update
            if (entity.Has<PositionComponent>()) {
                var position = entity.Read<PositionComponent>().value;
                this.transform.position = position;
            }
            
            if (entity.Has<RotationComponent>()) {
                var rotation = entity.Read<RotationComponent>().value;
                this.transform.rotation = rotation;
            }
            
            // Check if entity still exists in world
            if (entity.IsAlive() == false) {
                OnProjectileDestroyed();
            }
        }
        
        public void OnDeInitialize() {
            // Visual cleanup on entity removal
            OnProjectileDestroyed();
        }
        
        private void OnProjectileDestroyed() {
            if (isDestroying) return;
            isDestroying = true;
            
            // Show impact effect if available
            if (impactEffect != null) {
                impactEffect.Play();
            }
            
            // Disable trail
            if (trailRenderer != null) {
                trailRenderer.enabled = false;
            }
            
            // Hide renderer but keep effects playing
            var renderers = GetComponentsInChildren<Renderer>();
            foreach (var renderer in renderers) {
                if (!(renderer is TrailRenderer) && !(renderer is ParticleSystemRenderer)) {
                    renderer.enabled = false;
                }
            }
        }
    }
}