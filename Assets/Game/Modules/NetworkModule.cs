using UnityEngine;

namespace Game.Modules {
    
    using TState = GameState;
    
    /// <summary>
    /// We need to implement our own NetworkModule class without any logic just to catch your State type into ECS.Network
    /// You can use some overrides to setup history config for your project
    /// </summary>
    #if ECS_COMPILE_IL2CPP_OPTIONS
    [Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.NullChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.ArrayBoundsChecks, false),
     Unity.IL2CPP.CompilerServices.Il2CppSetOptionAttribute(Unity.IL2CPP.CompilerServices.Option.DivideByZeroChecks, false)]
    #endif
    public sealed class NetworkModule : ME.ECS.Network.NetworkModule<TState> {

        protected override int GetRPCOrder() {

            // Order all RPC packages by world id
            return this.world.id;

        }

        protected override ME.ECS.Network.NetworkType GetNetworkType() {
            
            // Initialize network with RunLocal and SendToNet
            return ME.ECS.Network.NetworkType.SendToNet | ME.ECS.Network.NetworkType.RunLocal;
            
        }

        protected override void OnInitialize()
        {

            // GameObject.FindObjectsOfType<UnityNetcode>();
            // UnityNetcode.QuerySupport( (supportStatus) =>
            // {
            // } );

            // TODO: Set your transport layer and serializer
            // var instance = (ME.ECS.Network.INetworkModuleBase)this;
            // instance.SetTransporter(new CustomTransport()); // ITransporter
            // instance.SetSerializer(new CustomSerializer()); // ISerializer

        }

    }
    
}