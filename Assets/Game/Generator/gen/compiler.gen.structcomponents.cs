namespace ME.ECS {

    public static partial class ComponentsInitializer {

        static partial void InitTypeIdPartial() {

            WorldUtilities.ResetTypeIds();

            CoreComponentsInitializer.InitTypeId();


            WorldUtilities.InitComponentTypeId<Game.Components.AttackComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.HealthComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.InputComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PlayerIdComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PositionComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.ProjectileOwnerComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.RotationComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.VelocityComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.DamageableTag>(true, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PlayerTag>(true, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.ProjectileTag>(true, true, true, false, false, false, false, false, false, false);

        }

        static partial void Init(State state, ref ME.ECS.World.NoState noState) {

            WorldUtilities.ResetTypeIds();

            CoreComponentsInitializer.InitTypeId();


            WorldUtilities.InitComponentTypeId<Game.Components.AttackComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.HealthComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.InputComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PlayerIdComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PositionComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.ProjectileOwnerComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.RotationComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.VelocityComponent>(false, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.DamageableTag>(true, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.PlayerTag>(true, true, true, false, false, false, false, false, false, false);
            WorldUtilities.InitComponentTypeId<Game.Components.ProjectileTag>(true, true, true, false, false, false, false, false, false, false);

            ComponentsInitializerWorld.Setup(ComponentsInitializerWorldGen.Init);
            CoreComponentsInitializer.Init(state, ref noState);


            state.structComponents.ValidateUnmanaged<Game.Components.AttackComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.HealthComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.InputComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.PlayerIdComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.PositionComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.ProjectileOwnerComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.RotationComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.VelocityComponent>(ref state.allocator, false);
            state.structComponents.ValidateUnmanaged<Game.Components.DamageableTag>(ref state.allocator, true);
            state.structComponents.ValidateUnmanaged<Game.Components.PlayerTag>(ref state.allocator, true);
            state.structComponents.ValidateUnmanaged<Game.Components.ProjectileTag>(ref state.allocator, true);

        }

    }

    public static class ComponentsInitializerWorldGen {

        public static void Init(Entity entity) {


            entity.ValidateDataUnmanaged<Game.Components.AttackComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.HealthComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.InputComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.PlayerIdComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.PositionComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.ProjectileOwnerComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.RotationComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.VelocityComponent>(false);
            entity.ValidateDataUnmanaged<Game.Components.DamageableTag>(true);
            entity.ValidateDataUnmanaged<Game.Components.PlayerTag>(true);
            entity.ValidateDataUnmanaged<Game.Components.ProjectileTag>(true);

        }

    }

}
