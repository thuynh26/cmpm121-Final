# Final Project

## F1 Devlog Entry - 11/14/2025

## Introducing the Team

- **Tool Lead:** Joshua
- **Engine Lead:** Elijah
- **Design Lead:** Brody
- **Test Lead:** Tina

## Tools and materials

### Engine

- For our engine, we plan to use the Baseline web browser. We decided to use this platform since our team is unfamiliar with other engines/platforms to develop games without integrated 3D graphics and all of our established skills in javaScript already.
- **three.js** is a 3D library for JavaScript that utilizes the WebGL API. It handles scenes, rendering, objects, loaders for 3D models, and animations. This will be needed to utilize 3D objects that we make and to display them properly.
- **ammo.js** is a library for projectile collisions in 3D space. It handles physics simulation with gravity and mass, collision detection between objects, and rigid body dynamics. and can define joints, hinges, and other physical constraints between objects. We will use this to help with physics in 3 dimensions.

### Language

- For the language, we will be using JavaScript.
- CSS & HTML for testing and possibly UI elements.

### Tools

- **Blender** or **BlockBench** can be used to create 3D assets to be used in the game, and will be rendered with the help of three.js. BlockBench also has tools for texturing and is easier to pick up.
- Texturing and creating 2D assets can be done through readily available art programs like **Photoshop**, **Gimp**, **Krita**, etc.
- **Github Co-Pilot** can be used to help maintain code readability & formating, while also being helpful for code autocomplete and comments.
- **Deno** will be used to help with testing the game (using `deno task dev`) and will also help with formatting (`deno task fmt`).

### Generative AI

- Allowed uses: GitHub Copilot (in moderation).
- Grey Area: Using it to help write specific functions or help spot code smells. Using it to suggest project overview and step-by-step planning.
- Restricted uses: Generative art or assets. Designing core game mechanics and level design. Using it for writing large blocks of code.
- AI can be used as an assistant to better our workflow but cannot be used to overly design, code, and structure our game.

## Outlook

Our outlook for this project is to build a small space themed point and click escape room game that uses 3D physics as a core puzzle mechanic. The player will be able move between rooms, interact with objects, and manage an inventory of items that matter across scenes. A key goal is to design at least one physics based puzzle where the player must throw or launch objects in 3D space (under gravity and collisions from Ammo.js) to hit specific targets or trigger mechanisms. We expect the hardest and riskiest part to be getting all the moving parts to work together smoothly: managing multiple scenes/rooms, interactive objects, and a physics puzzle, all while keeping performance reasonable in the browser. Overall scope management is something we have to keep in mind as well and focus on implementing the small areas that we can reliably build, test, release multiple times.

## F1 Devlog Entry - 11/20/2025

- _from collabarative session at noon with Joshua & Elijah_

- The repository has been initialized with all the files and libaries that we will need to start creating our game. The files that will contain most of our code are here:
  - `index.html`: Created this file and included a title, group member names, and a scene container for the **Three.js** canvas.
  - `boot.js`: Contains any imports and will also import assets in the future.
  - `main.js`: Created a simple scene using **Three.js** with a static camera and no objects. This can be a starting point for the team to figure out how to use **Three.js** and to continue making progress on the game.

## F1 Devlog Entry - 11/21/2025

- _from collabarative session at noon with Joshua & Brody & Tina_

- Ammo.js has been imported and RigidBody class has been created to implement 3d game physics.

### 3D Environment Setup

- **3D Scene Objects**: Added a basic 3D environment with multiple objects to the scene:
  - Green ground plane (20x20 units) positioned below the grid.
  - Red cube positioned at (-2, 0.5, 0).
  - Additional placeholder objects for environment building
  - Grid helper for spatial reference.

### Lighting System

- **Ambient Light**: Soft overall illumination (60% intensity) for base visibility.
- **Directional Light**: Sunlight simulation positioned at (5, 10, 7.5) with shadow casting enabled.
- **Shadows**: Enabled shadow mapping in the WebGL renderer for realistic depth.
- **Background**: Changed scene background from black to sky blue (0x87CEEB).

### Physics Integration (Ammo.js)

- **Physics World Initialization**:
  - Created `btDiscreteDynamicsWorld` with proper collision detection and constraint solver.
  - Set gravity to -9.8 m/s² (realistic Earth gravity).
  - Asynchronous initialization in `boot.js` ensures Ammo.js loads before app starts.
- **RigidBody Class**: Created wrapper class with methods for:
  - `createBox()`: Create box-shaped physics bodies with configurable mass, position, rotation (quaternion), and size.
  - `createSphere()`: Create sphere-shaped physics bodies.
  - `setFriction()`, `setRestitution()`, `setRollingFriction()`: Physics material properties.
- **Ground Physics Body**:
  - Static rigid body (mass = 0) positioned at y = -1 with proper quaternion rotation.
  - Synchronized with visual mesh for accurate collision detection
- **Physics Loop**: Animation loop now steps physics simulation and syncs Three.js mesh transforms with physics body transforms.

### Camera Controls (OrbitControls)

- **OrbitControls Import**: Added from `three/examples/jsm/controls/OrbitControls.js`
- **Features**:
  - Left-click drag to rotate camera around the scene.
  - Right-click drag to pan.
  - Scroll wheel to zoom (constrained between 2-20 units).
  - Smooth damping enabled for natural camera movement.
  - Control updates integrated into animation loop.

### Technical Improvements

- **Antialiasing**: Enabled for smoother visual rendering.
- **Material System**: Using `MeshStandardMaterial` for physically-based rendering with roughness and metalness properties.
- **Dev Container**: Added `.devcontainer/devcontainer.json` for auto installing DENO.

## F1 Team REFLECTION

Looking back at our F1 progress, most of our effort went into the foundation work of getting `three.js` and `ammo.js` up and working with each other. As well as setting our our post-push automations and getting a working render of a simple 3D scene with working physics in the browser. Our original idea was a pinball game with portals as the main physics mechanic. We are realizng that the idea was exciting but also quite vague and technically difficult to pull off. During F1, we realized that it didn’t naturally give us a strong point and click adventure game play loop. Going forward, we need to redefine our game idea and anchor our physics ideas inside a more structured and comprehensive game loop.

## F2 Devlog Entry - 11/22/2025

### Point-and-Click Controls

- **Manual Camera System**: Custom first-person look controls with right-click drag (no WASD movement).
- **Camera Position**: Fixed at (0, 1.6, 3) with Euler angle rotation and vertical clamping (±89°).
- **Mouse Sensitivity**: 0.002 with proper delta tracking to prevent snapping issues.

### Interactive Object System

- **Clickable Sphere**: Yellow emissive sphere (0.5 radius) at (0, 2, 0) with physics (mass=5).
- **Raycasting**: Left-click detection converts screen coordinates to world ray for object intersection.
- **Inventory System**: Pick up items (left-click), hold reference, throw with SPACE key.

### Inventory & Physics Mechanics

- **Pickup**: Left-click removes object from physics world and stores in inventory (1 item max).
- **Held Item Display**: Item positioned in bottom-right of camera view, follows look direction.
- **Throw**: SPACE spawns item 2 units ahead, recreates physics body, applies 1000-unit impulse in camera direction.

### Physics Implementation

- **Collision Detection**: Contact manifold system with distance checks and Set-based deduplication
- **Fixed Timestep**: 60 FPS physics (1/60s) with 10 max substeps, delta capped at 0.1s
- **Static Objects**: Ground plane (20x20 at y=0) and vertical wall (20x20 at z=-10)
- **Body Activation**: All bodies set to DISABLE_DEACTIVATION to ensure continuous collision detection

### Environment

- **Ground**: Horizontal green plane (20x20) with static physics body
- **Wall**: Vertical gray plane at z=-10, centered at y=0, aligned with collision box (20x20x1)
- **Red Cube**: Dynamic object (mass=10) for testing physics interactions
- **Lighting**: Ambient (60%) + directional light with shadows

## F2 Devlog Entry - 11/28/2025

### Physic based puzzle

- In Room 2, players can pick up objects ( the red cube or the sphere) and then throw them using SPACE and change the objects color.
- One key element is a red target wall; when the thrown object hits the target under certain correct conditions, it progresses by unlocking the next room.

### Skill based puzzle success/failure

- The puzzle outcome depends on how the player aims, positions, and changes their item.
- To succeed, the player must:
  - (1) select or recolor the correct item using the color buttons
  - (2) aim and throw it so that it physically strikes the target wall. Missing the target or using the wrong color will fail to trigger the progress condition.

### Moving between scenes

- We have a simple room system with three rooms: `room1`, `room2`, and `room3`.
- Only the current room’s group is visible at a time. Door meshes in each room are tagged via `userData` as doors with a `doorTarget` field. When the player raycasts and clicks on a door, the `switchRoom()` function hides the current room, shows the target room, and repositions the camera to a starting position.

### Conclusive Ending

- Right now, when the puzzle is satisfied, a simple win message appears on the website

### Additional implementations

- Inventory: players can scroll the mouse wheel to cycle between muliple items (previously could only hold one).
- Movement: player can use WASD to move around scene.

## F2 Team REFLECTION

As we implemented the F2 requirements, we've been able to clarify our scope and idea of our game. After F1, we knew that a pinball game idea was exciting but too vague and technically demanding for our timeline, and it was difficult to naturally intertwine it with point and click game play. As we implemented the F2 requirements, we found that our physics work, inventory implementation and use of multiple rooms would work really well for an escape room -esque game experience. That naturally led us to design a physics based puzzle where the player must pick up an item and then throw it accurately to hit a target that unlocks the path to the next room. This satisfies the requirement for a skill based physics puzzle that influences progress and can additionally be expanded on as the game grows. From here, we need to work on level designs, refactoring our code, and polishing our logic systems.

## F3 Devlog Entry - 12/2/2025

### mobile device controls

- Now the game will check what kind of device is being used (touch screen / desktop) and will change the control scheme to match. The desktop controls are unchanged, but mobile users can now move with a joystick and change their view by sliding their finger on the screen. They also may interact with, switch, and throw held items using three buttons.

### Refactored Scene creation and interaction

- **Separate Scenes Per Room**: Each room now has its own independent `Scene` object instead of using visibility toggles on groups within a single scene. This ensures complete isolation between rooms.
- **Scene-Based Raycasting**: Click interactions and object detection now only check the current active scene, preventing players from interacting with objects in rooms they cannot see.
- **Inventory Transfer System**: When switching rooms, held items are properly removed from the old scene and added to the new scene, ensuring they remain visible and functional across room transitions.
- **Input Management Fix**: Added mouse leave/blur detection to prevent infinite action loops when the cursor exits the window during mouse interactions.
