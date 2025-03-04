using UnityEngine;

#region Namespaces
namespace Game.Generator.Systems {} namespace Game.Generator.Components {} namespace Game.Generator.Modules {} namespace Game.Generator.Features {} namespace Game.Generator.Markers {} namespace Game.Generator.Views {}
#endregion

namespace Game.Generator {
    
    using TState = GameState;
    using Game.Modules;
    using Game.Features;
    using ME.ECS;
    using ME.ECS.Views.Providers;
    using Game.Generator.Modules;
    
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    [DefaultExecutionOrder(-1000)]
    public sealed class GameInitializer : InitializerBase {

        private World world;
        public float tickTime = 0.033f;
        public uint inputTicks = 3;
        public int entitiesCapacity = 200;
        
        [Header("Features")]
        public PlayersFeature playersFeature;
        public CombatFeature combatFeature;

        public void OnDrawGizmos() {
            if (this.world != null) {
                this.world.OnDrawGizmos();
            }
        }

        public void Update() {
            if (this.world == null) {
                // Initialize world
                WorldUtilities.CreateWorld<TState>(ref this.world, this.tickTime);
                {
                    #if FPS_MODULE_SUPPORT
                    //this.world.AddModule<FPSModule>();
                    #endif
                    this.world.AddModule<StatesHistoryModule>();
                    this.world.GetModule<StatesHistoryModule>().SetTicksForInput(this.inputTicks);
                    this.world.AddModule<NetworkModule>();
                    
                    // Create new state
                    this.world.SetState<TState>(WorldUtilities.CreateState<TState>());
                    
                    // Set world seed
                    this.world.SetSeed(1u);
                    
                    ComponentsInitializer.DoInit();
                    this.world.SetEntitiesCapacity(this.entitiesCapacity);
                    
                    // Initialize world
                    this.Initialize(this.world);
                    
                    // Add BrawlGame features
                    if (this.playersFeature != null) {
                        this.world.AddFeature(this.playersFeature);
                    }
                    
                    if (this.combatFeature != null) {
                        this.world.AddFeature(this.combatFeature);
                    }
                }
            }

            if (this.world != null && this.world.IsLoading() == false && this.world.IsLoaded() == false) {
                this.world.SetWorldThread(System.Threading.Thread.CurrentThread);
                this.world.Load(() => {
                    // Save initialization state
                   // this.world.SaveResetState<TState>();
                });
            }

            if (this.world != null && this.world.IsLoaded() == true) {
                var dt = Time.deltaTime;
               // this.world.PreUpdate(dt);
                this.world.Update(dt);
            }
        }

        public void LateUpdate() {
            if (this.world != null && this.world.IsLoaded() == true) {
                this.world.LateUpdate(Time.deltaTime);
            }
        }

        public void OnDestroy() {
            if (this.world == null || this.world.isActive == false) return;
            
            this.DeInitializeFeatures(this.world);
            // Release world
            WorldUtilities.ReleaseWorld<TState>(ref this.world);
        }
    }
    
}

namespace ME.ECS {
    
    public static partial class ComponentsInitializer {

        public static void InitTypeId() {
            
            ComponentsInitializer.InitTypeIdPartial();
            
        }
        
        static partial void InitTypeIdPartial();
        
        public static void DoInit() {
            
            ComponentsInitializer.Init(Worlds.current.GetState(), ref Worlds.currentWorld.GetNoStateData());
            
        }

        static partial void Init(State state, ref World.NoState noState);

    }

}