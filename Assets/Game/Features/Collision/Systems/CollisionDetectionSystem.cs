using ME.ECS;
using UnityEngine;

namespace Game.Features.Collision.Systems {

    #pragma warning disable
    using Game.Components; using Game.Modules; using Game.Systems; using Game.Markers;
    using Components; using Modules; using Systems; using Markers;
    #pragma warning restore
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class CollisionDetectionSystem : ISystem, IAdvanceTick {
        
        public World world { get; set; }
        
        private Filter collidersFilter;
        private CollisionFeature feature;
        
        void ISystemBase.OnConstruct() {
            this.collidersFilter = Filter.Create("Filter-Colliders")
                .With<PositionComponent>()
                .With<CollisionRadiusComponent>()
                .Push();
                
            this.feature = this.world.GetFeature<CollisionFeature>();
        }
        
        void ISystemBase.OnDeconstruct() {}
        
        void IAdvanceTick.AdvanceTick(in float deltaTime) {
            // Get all entities with colliders
            var entities = new System.Collections.Generic.List<Entity>(100);
            foreach (var entity in this.collidersFilter) {
                entities.Add(entity);
            }
            
            // Check each pair only once
            for (int i = 0; i < entities.Count; i++) {
                var entityA = entities[i];
                var posA = entityA.Read<PositionComponent>().value;
                var radiusA = entityA.Read<CollisionRadiusComponent>().radius;
                
                // Check layer filtering if components exist
                int layerA = 1; // Default layer
                int maskA = -1; // Default mask (collide with everything)
                
                if (entityA.Has<CollisionLayerComponent>()) {
                    layerA = entityA.Read<CollisionLayerComponent>().layer;
                }
                
                if (entityA.Has<CollisionMaskComponent>()) {
                    maskA = entityA.Read<CollisionMaskComponent>().mask;
                }
                
                // Check against all other entities
                for (int j = i + 1; j < entities.Count; j++) {
                    var entityB = entities[j];
                    var posB = entityB.Read<PositionComponent>().value;
                    var radiusB = entityB.Read<CollisionRadiusComponent>().radius;
                    
                    // Check layer filtering if components exist
                    int layerB = 1; // Default layer
                    int maskB = -1; // Default mask (collide with everything)
                    
                    if (entityB.Has<CollisionLayerComponent>()) {
                        layerB = entityB.Read<CollisionLayerComponent>().layer;
                    }
                    
                    if (entityB.Has<CollisionMaskComponent>()) {
                        maskB = entityB.Read<CollisionMaskComponent>().mask;
                    }
                    
                    // Check if layers match masks
                    bool layerAinMaskB = (maskB & (1 << layerA)) != 0;
                    bool layerBinMaskA = (maskA & (1 << layerB)) != 0;
                    
                    if (!layerAinMaskB && !layerBinMaskA) {
                        continue; // Layers don't match masks, skip collision
                    }
                    
                    // Check distance between entities
                    float distance = Vector3.Distance(posA, posB);
                    float minDistance = radiusA + radiusB;
                    
                    if (distance < minDistance) {
                        // Collision detected!
                        Vector3 normal = Vector3.zero;
                        if (distance > 0.0001f) {
                            normal = (posB - posA).normalized;
                        } else {
                            normal = Vector3.up; // Default if exactly at same position
                        }
                        
                        Vector3 contactPoint = posA + normal * radiusA;
                        float penetrationDepth = minDistance - distance;
                        
                        
                        // Create collision marker event
                         var ent = this.world.AddEntity();
                        
                            ent.Set<CollisionEventComponent>(
                                new Markers.CollisionEventComponent
                                {
                                    entity1 = entityA,
                                    entity2 = entityB,
                                    contactPoint = contactPoint,
                                    normal = normal,
                                    penetrationDepth = penetrationDepth
                                
                            });
                            
                    }
                }
            }
        }
    }
}