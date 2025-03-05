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

        // Static property to control logging
       static bool  EnableLogs = false;

        // Helper method for conditional logging
        private void LogMessage(string message) {
            if (EnableLogs) {
                Debug.Log(message);
            }
        }

        public PlayerView()
        {
            LogMessage($"[PlayerView] Constructor - Entity: {this.entity.id}");
        }
        public override bool applyStateJob => true;

        public override void OnInitialize() {
            LogMessage($"[PlayerView] OnInitialize - Entity: {this.entity.id}");
        }
        
        public override void OnDeInitialize() {
            LogMessage($"[PlayerView] OnDeInitialize - Entity: {this.entity.id}");
        }
        
        public override void ApplyStateJob(UnityEngine.Jobs.TransformAccess transform, float deltaTime, bool immediately) {
         // LogMessage($"[PlayerView] ApplyStateJob - Entity: {this.entity.id} - DeltaTime: {deltaTime}, Immediately: {immediately}");
        }
        
        public override void ApplyState(float deltaTime, bool immediately)
        {
            var position = this.entity.Read<PositionComponent>().value;
            var rotation = this.entity.Read<RotationComponent>().value;
    
            LogMessage($"[PlayerView] ApplyState - Entity: {this.entity.id} - Position: {position}, Rotation: {rotation}");
            LogMessage($"[PlayerView] ApplyState - DeltaTime: {deltaTime}, Immediately: {immediately}");
    
            if (this.transform.position != position)
            {
                LogMessage($"[PlayerView] Position changed from {this.transform.position} to {position}");
            }
    
            if (this.transform.rotation != rotation)
            {
                LogMessage($"[PlayerView] Rotation changed from {this.transform.rotation} to {rotation}");
            }
    
            this.transform.position = position;
            this.transform.rotation = rotation;
    
            LogMessage($"[PlayerView] ApplyState completed - Current Transform: pos={this.transform.position}, rot={this.transform.rotation}");
        }

        // Add menu items to toggle logging
        #if UNITY_EDITOR
        [UnityEditor.MenuItem("ME.ECS/Debug/PlayerView/Enable Logs")]
        public static void EnablePlayerViewLogs() {
            EnableLogs = true;
            Debug.Log("PlayerView logs enabled");
        }

        [UnityEditor.MenuItem("ME.ECS/Debug/PlayerView/Disable Logs")]
        public static void DisablePlayerViewLogs() {
            EnableLogs = false;
            Debug.Log("PlayerView logs disabled");
        }
        #endif
    }
}