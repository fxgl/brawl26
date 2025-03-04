# Brawl Stars-like Game Prototype

A competitive multiplayer top-down shooter prototype built with Unity, using [ME.ECS](https://github.com/chromealex/ecs) architecture and Photon Networking. This prototype focuses on the core battle gameplay mechanics - character movement and shooting.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technical Architecture](#technical-architecture)
- [Development Roadmap](#development-roadmap)
- [ECS Implementation Details](#ecs-implementation-details)
- [Networking Implementation Details](#networking-implementation-details)
- [Game Systems](#game-systems)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🎮 Project Overview

This prototype aims to recreate the core battle mechanics of Brawl Stars, focusing on:

- Competitive multiplayer arena combat
- Top-down shooter gameplay
- Simple character movement and aiming mechanics
- Basic projectile shooting system
- Network synchronization via Photon

### Core Game Loop

1. Players join a match lobby
2. Players are spawned in the arena
3. Players navigate the arena, aim, and shoot at opponents
4. Last player standing wins

### MVP Features

- **Player Movement**: Top-down joystick-style movement
- **Shooting Mechanics**: Tap/click to shoot in a direction
- **Basic Arena**: Simple battleground with minimal obstacles
- **Multiplayer**: 2-4 player matches using Photon networking
- **Match Flow**: Basic lobby, match start, and win conditions

## 🏗️ Technical Architecture

### ME.ECS Framework

We're using the [ME.ECS](https://github.com/chromealex/ecs) framework by chromealex, which provides:

- Efficient Entity-Component-System architecture
- Automatic game state rollbacks for networking 
- Deterministic logic for consistent multiplayer experiences
- Memory-optimized data structures
- Built-in network state synchronization

ME.ECS (Make Ecs) is a high-performance entity component system framework that offers:

- **Full Game State Rollbacks**: Automatically handles state rewinds and resimulation for networking
- **Deterministic Gameplay**: Ensures consistent gameplay across all clients
- **Memory Pooling**: Efficient memory management with pooling techniques
- **Markers & Filters**: Advanced entity querying and filtering
- **Component Storage**: Optimized data-oriented storage for components
- **Tick-based Simulation**: Fixed timestep system for predictable simulation
- **World Management**: Support for multiple worlds and state isolation
- **Network Synchronization**: Built-in tools for networking
- **Modular Architecture**: Extensible framework with modular design

### Photon Networking

Photon PUN 2 will handle the networking layer for this prototype:

- Room-based matchmaking
- Client-server architecture with authoritative design
- Event synchronization
- State management
- Low-latency communication

## 📅 Development Roadmap

### Phase 1: Core Setup (1 week)

- [x] Project initialization
- [ ] ME.ECS integration and setup
  - [ ] Install ME.ECS as git submodule
  - [ ] Setup ECS world configuration
  - [ ] Setup initial feature modules
- [ ] Photon PUN 2 integration
  - [ ] Install Photon PUN 2 from Asset Store
  - [ ] Setup AppID and basic configuration
  - [ ] Create initial connection handling
- [ ] Basic project architecture
  - [ ] Entity definitions
  - [ ] Component structures
  - [ ] System organization

### Phase 2: Single Player Mechanics (2 weeks)

- [ ] Core ECS implementation
  - [ ] Define base components
  - [ ] Create feature module structure
  - [ ] Implement basic systems
- [ ] Player controller
  - [ ] Input system
  - [ ] Movement system
  - [ ] Camera follow system
- [ ] Combat system
  - [ ] Shooting mechanics
  - [ ] Projectile system
  - [ ] Collision detection
  - [ ] Health and damage system
- [ ] Simple test arena
  - [ ] Basic level layout
  - [ ] Obstacle components
  - [ ] Boundary handling

### Phase 3: Multiplayer Implementation (2 weeks)

- [ ] Network module
  - [ ] Integrate ME.ECS with Photon
  - [ ] Implement network serialization
  - [ ] Setup network message queue
- [ ] Multiplayer management
  - [ ] Room creation and joining
  - [ ] Player spawning
  - [ ] Match start/end synchronization
- [ ] Input synchronization
  - [ ] Client prediction
  - [ ] Server reconciliation
  - [ ] Input buffering
- [ ] Entity synchronization
  - [ ] Transform sync
  - [ ] Projectile sync
  - [ ] State synchronization

### Phase 4: Polish & Testing (1 week)

- [ ] UI implementation
  - [ ] Player health display
  - [ ] Match status UI
  - [ ] Simple lobby interface
- [ ] Visual feedback
  - [ ] Basic visual effects for shooting
  - [ ] Hit feedback
  - [ ] Simple character animations
- [ ] Performance optimization
  - [ ] Memory usage optimization
  - [ ] Network traffic optimization
- [ ] Bug fixing and testing
  - [ ] Network stress testing
  - [ ] Edge case handling

## 🧩 ECS Implementation Details

### Entity Types

1. **Player Entity**
   - Represents a player character in the game
   - Contains components for movement, shooting, health, etc.

2. **Projectile Entity**
   - Represents bullets/projectiles shot by players
   - Contains components for movement, collision, damage

3. **Obstacle Entity**
   - Represents static obstacles in the game arena
   - Contains components for collision and visual representation

### Components

```csharp
// Identity components
public struct PlayerTag : IComponent {}
public struct ProjectileTag : IComponent {}
public struct ObstacleTag : IComponent {}

// Transform components
public struct PositionComponent : IComponent {
    public Vector3 value;
}

public struct RotationComponent : IComponent {
    public Quaternion value;
}

public struct ScaleComponent : IComponent {
    public Vector3 value;
}

// Physics components
public struct VelocityComponent : IComponent {
    public Vector3 value;
}

public struct ColliderComponent : IComponent {
    public float radius;  // Using simple circle colliders for prototype
}

// Player-specific components
public struct HealthComponent : IComponent {
    public int current;
    public int maximum;
}

public struct InputComponent : IComponent {
    public Vector2 movement;
    public Vector2 aim;
    public bool shooting;
}

public struct PlayerStatsComponent : IComponent {
    public float moveSpeed;
    public float fireRate;
    public int damage;
}

// Projectile-specific components
public struct ProjectileComponent : IComponent {
    public int damage;
    public float speed;
    public float lifetime;
    public float currentLifetime;
}

public struct OwnerComponent : IComponent {
    public int ownerEntityId;
}

// Network-specific components
public struct NetworkIdComponent : IComponent {
    public int photonViewId;
}

public struct NetworkOwnerComponent : IComponent {
    public bool isMine;
}
```

### Feature Modules

ME.ECS uses a feature module system to organize game logic. For our prototype, we'll define the following feature modules:

```csharp
public class PlayerFeature : Feature {
    protected override void OnConstruct() {
        // Player movement
        AddSystem<PlayerInputSystem>();
        AddSystem<PlayerMovementSystem>();
        
        // Player combat
        AddSystem<PlayerAimSystem>();
        AddSystem<PlayerShootingSystem>();
        
        // Player state
        AddSystem<PlayerHealthSystem>();
    }
}

public class ProjectileFeature : Feature {
    protected override void OnConstruct() {
        AddSystem<ProjectileMovementSystem>();
        AddSystem<ProjectileLifetimeSystem>();
        AddSystem<ProjectileCollisionSystem>();
    }
}

public class NetworkFeature : Feature {
    protected override void OnConstruct() {
        AddSystem<NetworkPlayerSpawnSystem>();
        AddSystem<NetworkSyncSystem>();
        AddSystem<NetworkEventSystem>();
    }
}
```

### Systems

#### Core Systems

1. **InitializationSystem**
   - Initializes the game world and core entities
   - Sets up initial game state

2. **SimulationSystem**
   - Manages overall simulation step timing
   - Handles fixed timestep updates

#### Player Systems

1. **PlayerInputSystem**
   - Captures and processes raw player input
   - Converts input to movement and aim vectors
   - Detects shooting inputs

```csharp
public class PlayerInputSystem : ISystem {
    public World world { get; set; }
    
    private Filter filter;
    
    public void OnConstruct() {
        // Get player entities that have input and network owner components
        this.filter = Filter.Create("Filter-PlayerInput")
            .With<PlayerTag>()
            .With<InputComponent>()
            .With<NetworkOwnerComponent>()
            .Push();
    }
    
    public void OnDeconstruct() {}
    
    public void OnUpdate(float deltaTime) {
        // Process only entities owned by this client
        foreach (var entity in this.filter) {
            ref var networkOwner = ref entity.Get<NetworkOwnerComponent>();
            
            // Only process inputs for entities owned by this client
            if (networkOwner.isMine == true) {
                ref var input = ref entity.Get<InputComponent>();
                
                // Get input from Unity's input system
                input.movement = new Vector2(
                    UnityEngine.Input.GetAxis("Horizontal"),
                    UnityEngine.Input.GetAxis("Vertical")
                ).normalized;
                
                // Get mouse position for aiming
                Vector3 mousePos = Camera.main.ScreenToWorldPoint(UnityEngine.Input.mousePosition);
                ref var pos = ref entity.Get<PositionComponent>();
                Vector2 direction = new Vector2(mousePos.x - pos.value.x, mousePos.y - pos.value.y).normalized;
                input.aim = direction;
                
                // Detect shooting input
                input.shooting = UnityEngine.Input.GetMouseButton(0);
            }
        }
    }
}
```

2. **PlayerMovementSystem**
   - Updates player position based on input
   - Handles collision with obstacles
   - Applies movement constraints

```csharp
public class PlayerMovementSystem : ISystem {
    public World world { get; set; }
    
    private Filter playerFilter;
    private Filter obstacleFilter;
    
    public void OnConstruct() {
        this.playerFilter = Filter.Create("Filter-PlayerMovement")
            .With<PlayerTag>()
            .With<PositionComponent>()
            .With<VelocityComponent>()
            .With<InputComponent>()
            .With<PlayerStatsComponent>()
            .Push();
            
        this.obstacleFilter = Filter.Create("Filter-Obstacle")
            .With<ObstacleTag>()
            .With<PositionComponent>()
            .With<ColliderComponent>()
            .Push();
    }
    
    public void OnDeconstruct() {}
    
    public void OnUpdate(float deltaTime) {
        foreach (var entity in this.playerFilter) {
            ref var input = ref entity.Get<InputComponent>();
            ref var position = ref entity.Get<PositionComponent>();
            ref var velocity = ref entity.Get<VelocityComponent>();
            ref var stats = ref entity.Get<PlayerStatsComponent>();
            
            // Apply input to velocity
            Vector3 targetVelocity = new Vector3(input.movement.x, input.movement.y, 0) * stats.moveSpeed;
            velocity.value = targetVelocity;
            
            // Apply velocity to position
            Vector3 newPosition = position.value + velocity.value * deltaTime;
            
            // Check collision with obstacles
            bool collision = false;
            ref var playerCollider = ref entity.Get<ColliderComponent>();
            
            foreach (var obstacle in this.obstacleFilter) {
                ref var obstaclePos = ref obstacle.Get<PositionComponent>();
                ref var obstacleCollider = ref obstacle.Get<ColliderComponent>();
                
                float distance = Vector3.Distance(newPosition, obstaclePos.value);
                float minDistance = playerCollider.radius + obstacleCollider.radius;
                
                if (distance < minDistance) {
                    collision = true;
                    break;
                }
            }
            
            // Update position if no collision
            if (!collision) {
                position.value = newPosition;
            }
            
            // Update rotation based on aim direction
            if (input.aim.sqrMagnitude > 0) {
                ref var rotation = ref entity.Get<RotationComponent>();
                float angle = Mathf.Atan2(input.aim.y, input.aim.x) * Mathf.Rad2Deg;
                rotation.value = Quaternion.Euler(0, 0, angle);
            }
        }
    }
}
```

3. **PlayerShootingSystem**
   - Handles shooting cooldown and rate of fire
   - Creates projectile entities when player shoots
   - Sets projectile properties (damage, speed, etc.)

4. **PlayerHealthSystem**
   - Tracks player health and handles damage
   - Processes player elimination
   - Manages respawn logic (if applicable)

#### Projectile Systems

1. **ProjectileMovementSystem**
   - Updates projectile positions based on velocity
   - Applies projectile physics

2. **ProjectileLifetimeSystem**
   - Tracks projectile lifetime
   - Destroys projectiles after set duration

3. **ProjectileCollisionSystem**
   - Detects collisions between projectiles and players/obstacles
   - Applies damage to hit entities
   - Handles projectile destruction on impact

#### Networking Systems

1. **NetworkSyncSystem**
   - Synchronizes game state with Photon
   - Handles state serialization/deserialization

2. **NetworkEventSystem**
   - Processes network events (player join/leave)
   - Handles match state events

## 🔌 Networking Implementation Details

### ME.ECS and Photon Integration

ME.ECS provides deterministic simulation with rollback capability, which is crucial for networked games. We'll integrate it with Photon using the following approach:

1. **Network Module**
   - Create a custom ME.ECS module that interfaces with Photon
   - Handle serialization of game state for network transmission
   - Manage client-server communication

2. **State Synchronization**
   - Use ME.ECS's built-in state management for rollbacks
   - Sync only essential data (inputs, random seeds) over the network
   - Leverage determinism to ensure consistent state across clients

3. **Input Handling**
   - Collect and buffer local player inputs
   - Transmit inputs to other clients via Photon events
   - Apply remote inputs in correct simulation ticks

### Network Architecture

We'll implement a client-authoritative model with server validation, where:

1. Each client owns their player entity and processes inputs locally
2. Input commands are sent to all clients via Photon
3. All clients simulate the game deterministically based on the same inputs
4. ME.ECS handles state rollbacks when late inputs arrive

```csharp
// Example Photon-ME.ECS bridge
public class PhotonNetworkModule : INetworkModule {
    private PhotonView photonView;
    private Queue<NetworkCommand> commandQueue = new Queue<NetworkCommand>();
    
    public void OnConstruct(World world) {
        // Initialize Photon components
        photonView = FindObjectOfType<PhotonView>();
        
        // Register Photon callbacks
        PhotonNetwork.NetworkingClient.EventReceived += OnNetworkEvent;
    }
    
    public void OnDeconstruct() {
        PhotonNetwork.NetworkingClient.EventReceived -= OnNetworkEvent;
    }
    
    // Send command to network
    public void SendCommand(NetworkCommand command) {
        byte[] data = SerializeCommand(command);
        
        // Use Photon RaiseEvent to send to all clients
        RaiseEventOptions options = new RaiseEventOptions { Receivers = ReceiverGroup.All };
        PhotonNetwork.RaiseEvent(NetEventCode.GameCommand, data, options, SendOptions.SendReliable);
    }
    
    // Process received network events
    private void OnNetworkEvent(EventData eventData) {
        if (eventData.Code == NetEventCode.GameCommand) {
            byte[] data = (byte[])eventData.CustomData;
            NetworkCommand command = DeserializeCommand(data);
            
            // Add to command queue for processing in simulation
            commandQueue.Enqueue(command);
        }
    }
    
    // Process queued commands during simulation
    public void ProcessCommands(World world) {
        while (commandQueue.Count > 0) {
            var command = commandQueue.Dequeue();
            ApplyCommand(world, command);
        }
    }
    
    // Apply a command to the world state
    private void ApplyCommand(World world, NetworkCommand command) {
        // Process command based on type
        switch (command.type) {
            case CommandType.PlayerInput:
                ApplyInputCommand(world, command);
                break;
            case CommandType.PlayerSpawn:
                SpawnPlayer(world, command);
                break;
            // Other command types...
        }
    }
}
```

## 🔧 Installation & Setup

### Prerequisites

- Unity 2021.3 LTS or newer
- Git (for submodule installation)
- Photon PUN 2 (from Asset Store)

### Installation Steps

1. Create a new Unity project
2. Add the ME.ECS framework:
   ```bash
   git submodule add https://github.com/chromealex/ecs-submodule Assets/ME.ECS
   ```

3. Install Photon PUN 2 from the Unity Asset Store

4. Configure Photon:
   - Register at https://www.photonengine.com and get your AppID
   - Set up PUN using the AppID in the Photon setup wizard

5. Setup initial project structure:
   ```
   Assets/
     ├── ME.ECS/               # ECS submodule
     ├── Photon/               # Photon PUN 2 assets
     ├── Resources/            # Game resources
     ├── Scripts/              # Game scripts
     │   ├── Components/       # ECS components
     │   ├── Features/         # ECS features
     │   ├── Systems/          # ECS systems
     │   ├── Network/          # Network integration
     │   └── Initializer.cs    # Game initialization
     └── Scenes/               # Unity scenes
   ```

## 📁 Project Structure

### Core Files

- **Initializer.cs**: Main game initialization script
- **GameFeature.cs**: Root feature containing all sub-features
- **NetworkBridge.cs**: Bridge between ME.ECS and Photon

### Component Organization

Components are organized into logical groups:
- **Identity Components**: Tags and identifiers
- **Transform Components**: Position, rotation, scale
- **Physics Components**: Velocity, colliders
- **Player Components**: Health, input, stats
- **Projectile Components**: Damage, lifetime
- **Network Components**: Sync and ownership

### Systems Organization

Systems are grouped by feature modules:
- **Core Systems**: Initialization, simulation
- **Player Systems**: Input, movement, combat
- **Projectile Systems**: Movement, collision
- **Network Systems**: Sync, events

## 👥 Contributing

### Code Style Guidelines

- Use namespaces to organize code
- Follow ME.ECS patterns for components and systems
- Document public methods and interfaces

### Version Control

- Use feature branches for new features
- Create pull requests for significant changes
- Tag releases with semantic versioning

### Testing

- Test network functionality with multiple clients
- Verify determinism by comparing game states
- Check performance with profiling tools