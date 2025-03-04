# BrawlECS Game Development Guidelines

## Build Commands
- Open in Unity to build and run
- Unity editor: Play mode to test in-editor
- To run a single test: Select specific test in Unity Test Runner window

## Code Style Guidelines
- Use **ME.ECS** framework patterns for all game logic
- Components implemented as structs with IComponent interface
- Systems grouped in logical Features (PlayerFeature, NetworkFeature)
- Use namespaces for code organization
- Naming conventions:
  - Components: PascalCase, descriptive (PositionComponent, HealthComponent)
  - Systems: PascalCase, action-oriented (MovementSystem, DamageSystem)
  - Features: PascalCase, module-focused (CombatFeature, UIFeature)
- Document public methods and classes
- Error handling through ME.ECS exception patterns

## Project Organization
- Components/ - All component definitions
- Systems/ - System implementations
- Features/ - Feature groupings of systems
- Markers/ - Network and event markers
- Views/ - Visual representations

## Memory Management
- Minimize GC allocations in game logic
- Use ME.ECS pooling system for recycling entities