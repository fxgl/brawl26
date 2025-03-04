# Installation and Setup Guide

This guide provides step-by-step instructions for setting up the Brawl Stars-like game prototype with ME.ECS and Photon.

## Prerequisites

- Unity 2021.3 LTS or newer
- Git installed on your system
- Basic knowledge of Unity and C#
- Photon account (free tier is sufficient for development)

## Step 1: Create a New Unity Project

1. Open Unity Hub
2. Click "New Project"
3. Select "3D Core" or "3D URP" template
4. Name your project (e.g., "BrawlStarsECS")
5. Choose a location for your project
6. Click "Create Project"

## Step 2: Install ME.ECS Framework

ME.ECS is installed as a Git submodule to ensure you can get updates easily.

### Using Git command line:

1. Open a terminal/command prompt
2. Navigate to your project's root folder
3. Run the following commands:

```bash
# Initialize git if not already initialized
git init

# Add ME.ECS as a submodule
git submodule add https://github.com/chromealex/ecs-submodule Assets/ME.ECS
```

### Alternative method (without Git):

1. Go to https://github.com/chromealex/ecs-submodule
2. Click "Code" -> "Download ZIP"
3. Extract the ZIP contents to `Assets/ME.ECS` in your Unity project

## Step 3: Configure ME.ECS

1. Open your Unity project
2. Wait for Unity to import the ME.ECS assets
3. In the Unity menu, go to `Window > ME.ECS > Initialize` to set up the framework
4. Follow the prompts in the initialization window

## Step 4: Install Photon PUN 2

1. Open the Unity Asset Store window (`Window > Asset Store`)
2. Search for "PUN 2 - FREE"
3. Download and import the package
4. Click "Import" to add Photon to your project

## Step 5: Configure Photon

1. After importing, the Photon Setup Wizard should appear automatically
   - If not, go to `Window > Photon Unity Networking > PUN Wizard`
2. Create a new Photon account or use an existing one
3. Create a new App ID or use an existing one
4. Enter your App ID in the setup wizard
5. Click "Setup Project"

## Step 6: Create Project Structure

Create the following folder structure in your Assets folder:

```
Assets/
  ├── ME.ECS/             # Already created in Step 2
  ├── Photon/             # Created during Photon import
  ├── Resources/          # For game resources
  │   └── Prefabs/        # For game prefabs
  ├── Scripts/            # Game scripts
  │   ├── Components/     # ECS components
  │   ├── Features/       # ECS features
  │   ├── Systems/        # ECS systems
  │   └── Network/        # Network integration
  └── Scenes/             # Unity scenes
      ├── MainMenu.unity  # Main menu scene
      └── Game.unity      # Main game scene
```

You can create this structure manually or use the following script:

```csharp
// CreateFolderStructure.cs
// Attach this to any GameObject in a temporary scene and run it once
using UnityEngine;
using UnityEditor;
using System.IO;

public class CreateFolderStructure : MonoBehaviour
{
    [ContextMenu("Create Folder Structure")]
    void CreateFolders()
    {
        string[] folders = new string[]
        {
            "Resources",
            "Resources/Prefabs",
            "Scripts",
            "Scripts/Components",
            "Scripts/Features",
            "Scripts/Systems",
            "Scripts/Network",
            "Scenes"
        };

        foreach (string folder in folders)
        {
            string fullPath = Path.Combine(Application.dataPath, folder);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
            }
        }
        
        AssetDatabase.Refresh();
        Debug.Log("Folder structure created successfully!");
    }
}
```

## Step 7: Create Core Setup Files

### 1. Create the initial game configuration:

Create a new C# script at `Scripts/GameConfig.cs`:

```csharp
using ME.ECS;
using UnityEngine;

namespace BrawlECS
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "BrawlECS/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Game Settings")]
        public int tickRate = 60;
        public float playerMoveSpeed = 5f;
        public float projectileSpeed = 10f;
        public float projectileLifetime = 3f;
        public int playerHealth = 100;
        public int projectileDamage = 20;
        
        [Header("Network Settings")]
        public string gameVersion = "0.1";
        public byte maxPlayersPerRoom = 4;
    }
}
```

### 2. Create the game initializer:

Create a new C# script at `Scripts/GameInitializer.cs`:

```csharp
using ME.ECS;
using Photon.Pun;
using UnityEngine;

namespace BrawlECS
{
    public class GameInitializer : MonoBehaviourPunCallbacks
    {
        public GameConfig config;
        private World world;
        private Systems systems;
        
        // Initialize on scene start
        private void Start()
        {
            if (config == null)
            {
                Debug.LogError("Game config not assigned to GameInitializer!");
                return;
            }
            
            // Initialize Photon
            if (!PhotonNetwork.IsConnected)
            {
                PhotonNetwork.ConnectUsingSettings();
                PhotonNetwork.GameVersion = config.gameVersion;
            }
            
            // Initialize ME.ECS world
            InitializeWorld();
        }
        
        private void InitializeWorld()
        {
            // Create a new world with simulation settings
            var worldSettings = new WorldSettings
            {
                worldName = "BrawlStarsGame",
                tickTime = 1f / config.tickRate
            };
            
            // Initialize world and systems
            world = World.Create(worldSettings);
            systems = new Systems(world);
            
            // Register features (will be implemented in Step 8)
            // systems.AddFeature(new CoreFeature(config));
            // systems.AddFeature(new PlayerFeature(config));
            // systems.AddFeature(new ProjectileFeature(config));
            // systems.AddFeature(new NetworkFeature(config));
            
            // Initialize and run systems
            systems.Initialize();
        }
        
        private void Update()
        {
            if (world != null && world.isActive == true)
            {
                world.Update(Time.deltaTime);
            }
        }
        
        private void OnDestroy()
        {
            if (world != null && world.isActive == true)
            {
                world.Dispose();
            }
        }
        
        // Photon callbacks
        public override void OnConnectedToMaster()
        {
            Debug.Log("Connected to Photon Master Server");
            PhotonNetwork.JoinLobby();
        }
        
        public override void OnJoinedLobby()
        {
            Debug.Log("Joined Photon Lobby");
            // Ready to join or create room
        }
    }
}
```

## Step 8: Create Initial Game Scene

1. Open Unity and create a new scene (`File > New Scene`)
2. Save the scene as `Game.unity` in the Scenes folder
3. Create an empty GameObject and name it "GameManager"
4. Add the `GameInitializer` script to it
5. Create a new GameConfig asset (`Assets > Create > BrawlECS > Game Config`)
6. Assign the GameConfig asset to the GameInitializer's config field

## Next Steps

After completing the basic setup, you can proceed to implement:

1. Core ECS components (as defined in the README)
2. Feature modules for players, projectiles, etc.
3. Game systems for movement, shooting, collision, etc.
4. Network integration between ME.ECS and Photon

Follow the README.md for more detailed implementation guidelines and code examples.
