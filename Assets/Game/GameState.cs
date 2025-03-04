using ME.ECS;
using System.Collections.Generic;

namespace Game {

    public class GameState : ME.ECS.State {
        // Dictionary to store player entities by ID
        public Dictionary<int, Entity> players;
        
        // Game state variables
        public float roundTime;
        public int maxPlayers;
        public bool gameInProgress;
        
        public void OnCreate() {
            this.players = new Dictionary<int, Entity>();
            this.roundTime = 0f;
            this.maxPlayers = 4;
            this.gameInProgress = false;
        }
        
        public override void CopyFrom(State other) {
            base.CopyFrom(other);
            
            var otherState = (GameState)other;
            
            if(otherState == null) return;
            
            // Copy collections
            this.players = new Dictionary<int, Entity>();
            foreach (var kvp in otherState.players) {
                this.players.Add(kvp.Key, kvp.Value);
            }
            
            // Copy primitive values
            this.roundTime = otherState.roundTime;
            this.maxPlayers = otherState.maxPlayers;
            this.gameInProgress = otherState.gameInProgress;
        }
        
        public override void OnRecycle() {
            base.OnRecycle();
            
            this.players.Clear();
            this.players = null;
            
            this.roundTime = 0f;
            this.maxPlayers = 0;
            this.gameInProgress = false;
        }
    }
}