import RigidBody from "./physics/RigidBody.js";
import { initWorldPhysics } from "./physics/worldInit.js";
import { MobileControls } from "./mobileControls.js";
import { InputManager } from "./systems/InputManager.js";
import {
  Camera as CameraConfig,
  Colors,
  darkThemePreference,
  InventoryDisplay,
  Lighting,
  Movement,
  Physics as PhysicsConfig,
  Renderer as RendererConfig,
} from "./config/gameConstants.js";

// F3: langauge changing
import { getStrings, initI18n } from "./language.js";

//============== START SCREEN & HUD ================//

const startOverlay = document.createElement("div");
startOverlay.id = "startOverlay";
startOverlay.style.background = "rgba(0, 0, 0, 0.8)";
startOverlay.style.color = "white";
startOverlay.style.zIndex = "10000";
document.body.appendChild(startOverlay);

const langText = document.createElement("div");
langText.id = "lang-text";
startOverlay.appendChild(langText);

const startButton = document.createElement("button");
startButton.id = "myButton";
startOverlay.appendChild(startButton);

// Initialize i18n
initI18n({ startOverlay, langText, startButton });

const playerHUD = document.createElement("div");
playerHUD.id = "playerHUD";
playerHUD.style.position = "fixed";
const oxygenText = document.createElement("div");
oxygenText.id = "oxygenText";
playerHUD.style.position = "absolute";
playerHUD.style.top = "30%";
playerHUD.style.left = "15%";
oxygenText.innerHTML = `Oxygen Level: 100%`;

//============OXYGEN MANAGER CLASS================//
class OxygenManager {
  constructor() {
    this.oxygenLevel = 100000;
    this.canBreathe = true;
  }
  oxygenLevel;
  consumeOxygen(amount) {
    this.oxygenLevel -= amount;
    oxygenText.innerHTML = `Oxygen Level: ` + this.oxygenLevel.toFixed(2);
    playerHUD.appendChild(oxygenText);
  }

  gainOxygen(amount) {
    this.oxygenLevel += amount;
  }
  getOxygenLevel() {
    return this.oxygenLevel;
  }

  setOxygenLevel(level) {
    return this.oxygenLevel = level;
  }
}
const playerOxygen = new OxygenManager();

startButton.addEventListener("click", () => {
  document.body.removeChild(startOverlay);
  document.body.appendChild(playerHUD);
  playerOxygen.setOxygenLevel(100);
  playerHUD.appendChild(oxygenText);
  console.log(darkThemePreference);
});
export default function init() {
  // Try to reuse a global THREE instance set by index.html.
  // This avoids re-downloading the library in browser environments.
  const globalThree = (typeof globalThis !== "undefined" && globalThis.THREE)
    ? globalThis.THREE
    : null;

  return Promise.resolve((() => {
    // Require a global THREE instance for the game.
    // If it's missing, throw a clear error so the developer adds the browser import that sets `window.THREE`.
    if (!globalThree) {
      throw new Error(
        "Missing global THREE. Ensure index.html imports Three.js and sets `window.THREE` before calling init()",
      );
    }
    const lib = globalThree;

    // init Ammo.js physics world
    const {
      physicsWorld,
      dispatcher,
      rigidBodies,
    } = initWorldPhysics(globalThis.Ammo);

    // Destructure the specific classes we need from the module for clarity.
    const {
      Scene,
      PerspectiveCamera,
      WebGLRenderer,
      Color,
      GridHelper,
      BoxGeometry,
      SphereGeometry,
      PlaneGeometry,
      MeshStandardMaterial,
      Mesh,
      DirectionalLight,
      AmbientLight,
      Vector3,
    } = lib;

    // =============== OBJECT TYPE CONSTANTS =============== //
    const ObjectType = {
      PICKABLE: "pickable", // Can be picked up and stored in inventory
      COLOR_BUTTON: "colorButton", // Changes color of held items
      DOOR: "door", // Switches between rooms
    };

    // =============== MESH/OBJ HELPER FUNCTIONS =============== //
    // These helpers work with both regular Mesh objects and Group objects (OBJ models)
    const MeshHelpers = {
      // Get material color from mesh or first child mesh in group
      getColor: (object) => {
        if (object.material) return object.material.color;
        let childColor = null;
        object.traverse((child) => {
          if (child.isMesh && child.material && !childColor) {
            childColor = child.material.color;
          }
        });
        return childColor;
      },

      // Set color on mesh or all child meshes in group
      setColor: (object, colorHex) => {
        if (object.material) {
          object.material.color.setHex(colorHex);
        } else {
          object.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.color.setHex(colorHex);
            }
          });
        }
      },

      // Get geometry type (for determining physics shape)
      getGeometryType: (object) => {
        if (object.geometry) return object.geometry.type;
        let geometryType = null;
        object.traverse((child) => {
          if (child.isMesh && child.geometry && !geometryType) {
            geometryType = child.geometry.type;
          }
        });
        return geometryType;
      },
    };

    // Helper functions for object types
    const ObjectHelpers = {
      makePickable: (mesh) => {
        mesh.userData.objectType = ObjectType.PICKABLE;
      },
      makeColorButton: (mesh, color) => {
        mesh.userData.objectType = ObjectType.COLOR_BUTTON;
        mesh.userData.buttonColor = color;
      },
      makeDoor: (mesh, targetRoom) => {
        mesh.userData.objectType = ObjectType.DOOR;
        mesh.userData.doorTarget = targetRoom;
      },
      isPickable: (mesh) => mesh.userData?.objectType === ObjectType.PICKABLE,
      isColorButton: (mesh) =>
        mesh.userData?.objectType === ObjectType.COLOR_BUTTON,
      isDoor: (mesh) => mesh.userData?.objectType === ObjectType.DOOR,
    };

    // `container` is the HTML element where the renderer's canvas is appended.
    // `index.html` should include `<div id="scene-container">` to show the renderer.
    const container = document.getElementById("scene-container");

    // =============== ROOMS SYSTEM =============== //
    // Create separate scenes for each room
    const scenes = {
      room1: new Scene(),
      room2: new Scene(),
      room3: new Scene(),
    };
    let currentRoom = "room1";
    let currentScene = scenes.room1;

    // Set background colors for each scene

    function backgroundTheme() {
      if (darkThemePreference) {
        return `${import.meta.env.BASE_URL}assets/spaceDark.png`;
      } else {
        return `${import.meta.env.BASE_URL}assets/space.png`;
      }
    }
    const loaderBG = new lib.TextureLoader();
    loaderBG.load(
      backgroundTheme(),
      (tex) => {
        // ensure correct color space if available
        if (lib.sRGBEncoding) tex.encoding = lib.sRGBEncoding;
        scenes.room1.background = tex;
      },
      undefined,
      (err) => console.error("Failed to load scene background:", err),
    );
    //nes.room1.background = "/assets/2k_stars_milky_way.jpg";
    scenes.room2.background = new Color(Colors.FOREST_GREEN);
    scenes.room3.background = new Color(Colors.GRAY);

    function colorTheme() {
      if (darkThemePreference) {
        return Colors.LIGHT_RED;
      } else {
        return Colors.WHITE;
      }
    }

    // Add lighting to each scene
    function addLightingToScene(scene) {
      // Ambient light provides soft overall illumination
      const ambientLight = new AmbientLight(
        colorTheme(),
        Lighting.AMBIENT_INTENSITY,
      );
      scene.add(ambientLight);

      // Directional light simulates sunlight
      const directionalLight = new DirectionalLight(
        colorTheme(),
        Lighting.DIRECTIONAL_INTENSITY,
      );
      directionalLight.position.set(
        Lighting.DIRECTIONAL_POSITION.x,
        Lighting.DIRECTIONAL_POSITION.y,
        Lighting.DIRECTIONAL_POSITION.z,
      );
      directionalLight.castShadow = true;
      scene.add(directionalLight);
    }

    // Add lighting to all scenes
    addLightingToScene(scenes.room1);
    addLightingToScene(scenes.room2);
    addLightingToScene(scenes.room3);

    // Add grid to room1 for visual reference
    const grid1 = new GridHelper(10, 10);
    grid1.position.y = 0;
    scenes.room1.add(grid1);

    // =============== ROOM 1 =============== //
    const room1FloorGeo = new PlaneGeometry(10, 10);
    const room1FloorMat = new MeshStandardMaterial({
      color: Colors.GRAY,
      roughness: 0.9,
      metalness: 0.1,
    });
    const room1Floor = new Mesh(room1FloorGeo, room1FloorMat);
    room1Floor.rotation.x = -Math.PI / 2;
    room1Floor.position.set(0, 0, 0);
    room1Floor.receiveShadow = true;
    scenes.room1.add(room1Floor);

    // Back wall
    const room1BackWallGeo = new PlaneGeometry(10, 5);
    const room1WindowTopGeo = new PlaneGeometry(10, 1.5);
    const room1BackWallMat = new MeshStandardMaterial({
      color: Colors.WALL_PURPLE,
      roughness: 0.8,
      metalness: 0.1,
    });

    let canvas = document.createElement("canvas");
    //canvas and context for wall text
    function createWallText(text) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#58586eff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      return canvas;
    }
    // Create texture from canvas
    const texture = new lib.CanvasTexture(canvas);
    const wallWithTextMat = new MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });

    const strings = getStrings();
    canvas = createWallText(strings.fuelTypeLabel);

    const room1BackWall = new Mesh(room1BackWallGeo, room1BackWallMat);
    room1BackWall.position.set(0, 2.5, -5);
    scenes.room1.add(room1BackWall);

    const room1LeftWall = new Mesh(room1BackWallGeo, wallWithTextMat);
    room1LeftWall.position.set(-5, 2.5, 0);
    room1LeftWall.rotation.y = Math.PI / 2;
    scenes.room1.add(room1LeftWall);

    // Right wall (mirror of left wall)
    const room1RightWallTop = new Mesh(room1WindowTopGeo, room1BackWallMat);
    room1RightWallTop.position.set(5, 0.75, 0);
    room1RightWallTop.rotation.y = Math.PI / -2;
    scenes.room1.add(room1RightWallTop);
    const room1RightWallBottom = new Mesh(room1WindowTopGeo, room1BackWallMat);
    room1RightWallBottom.position.set(5, 4.25, 0);
    room1RightWallBottom.rotation.y = Math.PI / -2;
    scenes.room1.add(room1RightWallBottom);

    // Ceiling
    const room1CeilingGeo = new PlaneGeometry(10, 10);
    const room1CeilingMat = new MeshStandardMaterial({
      color: Colors.WALL_PURPLE,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Front wall (opposite of back wall)
    const room1FrontWall = new Mesh(room1BackWallGeo, room1BackWallMat);
    room1FrontWall.position.set(0, 2.5, 5);
    room1FrontWall.rotation.y = Math.PI;
    scenes.room1.add(room1FrontWall);

    const room1Ceiling = new Mesh(room1CeilingGeo, room1CeilingMat);
    room1Ceiling.position.set(0, 5, 0);
    room1Ceiling.rotation.x = Math.PI / 2;
    scenes.room1.add(room1Ceiling);

    // Door from Room 1 -> Room 2
    const doorGeo = new BoxGeometry(1.5, 3, 0.2);
    const doorMat = new MeshStandardMaterial({
      color: Colors.DOOR_BLUE,
      roughness: 0.6,
      metalness: 0.2,
    });

    const doorRoom1To2 = new Mesh(doorGeo, doorMat);
    doorRoom1To2.position.set(0, 1.5, -4.9);
    ObjectHelpers.makeDoor(doorRoom1To2, "room2");
    scenes.room1.add(doorRoom1To2);

    // Create clickable sphere with physics
    const sphereGeometry = new SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new MeshStandardMaterial({
      color: Colors.YELLOW,
      emissive: Colors.EMISSIVE_YELLOW,
      roughness: 0.3,
      metalness: 0.7,
    });

    const clickableSphere = new Mesh(sphereGeometry, sphereMaterial);
    clickableSphere.position.set(0, 2, 0); // Start above ground
    clickableSphere.castShadow = true;
    ObjectHelpers.makePickable(clickableSphere);
    scenes.room1.add(clickableSphere);

    // Add physics body for sphere
    let sphereRigidBody = null;
    if (physicsWorld) {
      sphereRigidBody = new RigidBody();
      sphereRigidBody.createSphere(5, { x: 0, y: 2, z: 0 }, 0.5);
      sphereRigidBody.setFriction(PhysicsConfig.OBJECT_FRICTION);
      sphereRigidBody.setRestitution(PhysicsConfig.SPHERE_RESTITUTION);
      physicsWorld.addRigidBody(sphereRigidBody.body_);
      rigidBodies.push({ mesh: clickableSphere, rigidBody: sphereRigidBody });
      console.log("Sphere physics body added at y=2, mass=5");
    }

    // =============== ROOM 2 =============== //
    // Add a simple grid so there's some visuals to see when loading the page.
    // This should be removed after adding actual models to the scene.
    const grid2 = new GridHelper(10, 10); // size 10, 10 divisions
    grid2.position.y = 0; // place grid at world origin
    scenes.room2.add(grid2);

    // Create a ground plane
    const groundGeometry = new PlaneGeometry(20, 20);
    const groundMaterial = new MeshStandardMaterial({
      color: Colors.FOREST_GREEN,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    scenes.room2.add(ground);

    // Create physics body for the ground (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbGround = new RigidBody();
      // Create horizontal ground: wide in X and Z, thin in Y (no rotation needed)
      // Position at y=0, size is 20x1x20 (the y=1 makes it 0.5 units thick centered at y=0)
      rbGround.createBox(0, { x: 0, y: 0, z: 0 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 20,
        y: 0,
        z: 20,
      });
      rbGround.setFriction(1.0);
      rbGround.setRestitution(0.2);
      physicsWorld.addRigidBody(rbGround.body_);
      console.log("Ground physics body: box at y=0, size 20x1x20 (unrotated)");
    }

    // Door to go from Room 2 -> Room 1 (behind the player)
    const doorRoom2To1 = doorRoom1To2.clone();
    doorRoom2To1.position.set(0, 1.5, 9);
    ObjectHelpers.makeDoor(doorRoom2To1, "room1");
    scenes.room2.add(doorRoom2To1);

    // Create a wall plane
    const wallGeometry = new PlaneGeometry(20, 10);
    const wallMaterial = new MeshStandardMaterial({
      color: Colors.WALL_GRAY,
      roughness: 0.8,
      metalness: 0.2,
    });

    const canvas2 = document.createElement("canvas");
    const ctx2 = canvas2.getContext("2d");
    ctx2.fillStyle = "#58586eff";
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
    ctx2.fillStyle = "#ffffff";
    ctx2.font = "bold 20px Arial";
    ctx2.textAlign = "center";
    ctx2.fillText(`Throw Fuel Container at Depot`, canvas.width / 2, 50);

    // Create texture from canvas
    const texture2 = new lib.CanvasTexture(canvas2);
    const wallWithTextMat2 = new MeshStandardMaterial({
      map: texture2,
      roughness: 0.8,
      metalness: 0.1,
    });

    const wall = new Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 0, -10); // Position wall at back, centered at ground
    wall.receiveShadow = true;
    scenes.room2.add(wall);

    const room2LeftWall = new Mesh(wallGeometry, wallWithTextMat2);
    room2LeftWall.position.set(-10, 0, 0);
    room2LeftWall.rotation.y = Math.PI / 2;
    scenes.room2.add(room2LeftWall);

    // Right wall (mirror of left wall)
    const room2RightWall = new Mesh(wallGeometry, room1BackWallMat);
    room2RightWall.position.set(10, 0, 0);
    room2RightWall.rotation.y = Math.PI / -2;
    scenes.room2.add(room2RightWall);

    // Ceiling
    const room2CeilingGeo = new PlaneGeometry(20, 20);
    const room2CeilingMat = new MeshStandardMaterial({
      color: Colors.WALL_PURPLE,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Front wall (opposite of back wall)
    const room2FrontWall = new Mesh(wallGeometry, room1BackWallMat);
    room2FrontWall.position.set(0, 0, 10);
    room2FrontWall.rotation.y = Math.PI;
    scenes.room2.add(room2FrontWall);

    const room2Ceiling = new Mesh(room2CeilingGeo, room2CeilingMat);
    room2Ceiling.position.set(0, 5, 0);
    room2Ceiling.rotation.x = Math.PI / 2;
    scenes.room2.add(room2Ceiling);

    // Create physics body for the wall (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbWall = new RigidBody();
      // Create vertical wall: wide in X and Y, thin in Z
      // Position at z=-10, y=0 (centered at ground), size is 20x20x1 (thin in Z direction)
      rbWall.createBox(0, { x: 0, y: 0, z: -10 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 20,
        y: 20,
        z: 5,
      });
      rbWall.setFriction(PhysicsConfig.WALL_FRICTION);
      rbWall.setRestitution(PhysicsConfig.WALL_RESTITUTION);
      physicsWorld.addRigidBody(rbWall.body_);
      rigidBodies.push({ mesh: wall, rigidBody: rbWall });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }

    // Create a wall plane
    const targetGeometry = new PlaneGeometry(2, 2);
    const targetMaterial = new MeshStandardMaterial({
      color: 0xff0000, // red
      roughness: 0.8,
      metalness: 0.2,
    });

    const targetWall = new Mesh(targetGeometry, targetMaterial);
    targetWall.position.set(0, 2, -9.9); // Position target lower (bottom at ground level)
    targetWall.receiveShadow = true;
    scenes.room2.add(targetWall);
    // Create physics body for the wall (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbtargetWall = new RigidBody();
      // Create vertical target: 5x5 plane, positioned so bottom edge is at ground (y=0)
      // Center at y=2.5 so it spans from y=0 to y=5
      rbtargetWall.createBox(10000, { x: 0, y: 2.5, z: -9.9 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 5,
        y: 5,
        z: 1,
      });
      rbtargetWall.setFriction(PhysicsConfig.WALL_FRICTION);
      rbtargetWall.setRestitution(PhysicsConfig.WALL_RESTITUTION);
      physicsWorld.addRigidBody(rbtargetWall.body_);
      rigidBodies.push({ mesh: targetWall, rigidBody: rbtargetWall });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }
    // Create some cube objects for the environment
    // Load custom OBJ model instead of basic box geometry
    let redCube = null; // Declare in outer scope
    const loader = new globalThis.OBJLoader();

    loader.load(
      `${import.meta.env.BASE_URL}assets/spacecube.obj`,
      // Success callback - called when model loads
      (object) => {
        // The loaded OBJ becomes the redCube
        redCube = object;

        // Scale up the model by 50%
        redCube.scale.set(1.5, 1.5, 1.5);

        // Apply material to all meshes in the loaded object
        redCube.traverse((child) => {
          if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: Colors.WHITE });
            child.castShadow = true;
            // Set userData on each child mesh so raycasting can detect it
            child.userData.objectType = ObjectType.PICKABLE;
            // Store reference to parent so pickup system can find the rigidBody
            child.userData.parentObject = redCube;
          }
        });

        // Set initial position
        redCube.position.set(-5, 5, 5);
        ObjectHelpers.makePickable(redCube); // Also set on parent
        scenes.room2.add(redCube);

        if (physicsWorld) {
          // Calculate bounding box from the actual model to get exact dimensions
          const bbox = new lib.Box3().setFromObject(redCube);
          const size = new Vector3();
          bbox.getSize(size);

          // Get center of the bounding box (this is where physics box should be)
          const center = new Vector3();
          bbox.getCenter(center);

          // Calculate offset between object position and geometry center
          const offset = new Vector3().subVectors(center, redCube.position);

          // Adjust visual position so geometry center aligns with physics center
          redCube.position.sub(offset);

          const rbredCube = new RigidBody();
          // Physics box at desired spawn position
          rbredCube.createBox(10, {
            x: -5,
            y: 5,
            z: 5,
          }, {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          }, {
            x: size.x / 2, // Half-extents from actual model
            y: size.y / 2,
            z: size.z / 2,
          });
          console.log("Physics box size:", size.x, size.y, size.z);
          console.log("Visual position:", redCube.position);
          console.log("Physics center:", center);
          rbredCube.setFriction(PhysicsConfig.OBJECT_FRICTION);
          rbredCube.setRestitution(PhysicsConfig.CUBE_RESTITUTION);
          physicsWorld.addRigidBody(rbredCube.body_);

          // Ensure the body is active and responds to gravity
          rbredCube.body_.setActivationState(1); // ACTIVE_TAG
          rbredCube.body_.activate(true);

          rigidBodies.push({ mesh: redCube, rigidBody: rbredCube });
          console.log(
            "Custom OBJ model loaded and physics body added at y=5, mass=10",
          );
        }
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + "% loaded");
      },
      // Error callback
      (error) => {
        console.error("Error loading OBJ model:", error);
      },
    );

    let oxCanister = null; // Declare in outer scope

    loader.load(
      `${import.meta.env.BASE_URL}assets/canister.obj`,
      // Success callback - called when model loads
      (object) => {
        // The loaded OBJ becomes the redCube
        oxCanister = object;

        // Scale up the model by 50%
        oxCanister.scale.set(2, 2, 2);

        // Apply material to all meshes in the loaded object
        oxCanister.traverse((child) => {
          if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: Colors.WHITE });
            child.castShadow = true;
            // Set userData on each child mesh so raycasting can detect it
            child.userData.objectType = ObjectType.PICKABLE;
            // Store reference to parent so pickup system can find the rigidBody
            child.userData.parentObject = oxCanister;
          }
        });

        // Set initial position
        oxCanister.position.set(8, 5, -7);
        ObjectHelpers.makePickable(oxCanister); // Also set on parent
        scenes.room2.add(oxCanister);

        if (physicsWorld) {
          // Calculate bounding box from the actual model to get exact dimensions
          const bbox = new lib.Box3().setFromObject(oxCanister);
          const size = new Vector3();
          bbox.getSize(size);

          // Get center of the bounding box (this is where physics box should be)
          const center = new Vector3();
          bbox.getCenter(center);

          // Calculate offset between object position and geometry center
          const offset = new Vector3().subVectors(center, oxCanister.position);

          // Adjust visual position so geometry center aligns with physics center
          oxCanister.position.sub(offset);

          const rboxCanister = new RigidBody();
          // Physics box at desired spawn position
          rboxCanister.createBox(10, {
            x: 8,
            y: 5,
            z: -7,
          }, {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          }, {
            x: size.x / 2, // Half-extents from actual model
            y: size.y / 2,
            z: size.z / 2,
          });
          console.log("Physics box size:", size.x, size.y, size.z);
          console.log("Visual position:", oxCanister.position);
          console.log("Physics center:", center);
          rboxCanister.setFriction(PhysicsConfig.OBJECT_FRICTION);
          rboxCanister.setRestitution(PhysicsConfig.CUBE_RESTITUTION);
          physicsWorld.addRigidBody(rboxCanister.body_);

          // Ensure the body is active and responds to gravity
          rboxCanister.body_.setActivationState(1); // ACTIVE_TAG
          rboxCanister.body_.activate(true);

          rigidBodies.push({ mesh: oxCanister, rigidBody: rboxCanister });
          console.log(
            "Custom OBJ model loaded and physics body added at y=5, mass=10",
          );
        }
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + "% loaded");
      },
      // Error callback
      (error) => {
        console.error("Error loading OBJ model:", error);
      },
    );

    // =============== ROOM 3 =============== //
    // Add a simple grid so there's some visuals to see when loading the page.
    // This should be removed after adding actual models to the scene.
    const grid3 = new GridHelper(10, 10); // size 10, 10 divisions
    grid3.position.y = 0; // place grid at world origin
    scenes.room3.add(grid3);

    // Create a ground plane
    const ground2 = new Mesh(groundGeometry, groundMaterial);
    ground2.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground2.position.y = 0;
    ground2.receiveShadow = true;
    scenes.room3.add(ground2);

    // Create physics body for the ground (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbGround = new RigidBody();
      // Create horizontal ground: wide in X and Z, thin in Y (no rotation needed)
      // Position at y=0, size is 20x1x20 (the y=1 makes it 0.5 units thick centered at y=0)
      rbGround.createBox(0, { x: 0, y: 0, z: 0 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 20,
        y: 0,
        z: 20,
      });
      rbGround.setFriction(1.0);
      rbGround.setRestitution(0.2);
      physicsWorld.addRigidBody(rbGround.body_);
      console.log("Ground physics body: box at y=0, size 20x1x20 (unrotated)");
    }

    // Door to go from Room 3 -> Room 2 (behind the player)
    const doorRoom3To2 = doorRoom1To2.clone();
    doorRoom3To2.position.set(0, 1.5, 20);
    ObjectHelpers.makeDoor(doorRoom3To2, "room2");
    scenes.room3.add(doorRoom3To2);

    // Create victory button in room 3
    const victoryButtonGeo = new BoxGeometry(2, 2, 0.3);
    const victoryButtonMat = new MeshStandardMaterial({
      color: 0xFFD700, // Gold
      emissive: 0x886600,
      roughness: 0.4,
      metalness: 0.8,
    });
    const victoryButton = new Mesh(victoryButtonGeo, victoryButtonMat);
    victoryButton.position.set(0, 1, -9.5);
    victoryButton.userData.isVictoryButton = true;
    scenes.room3.add(victoryButton);

    // Create a wall plane
    const wall2 = new Mesh(wallGeometry, wallMaterial);
    wall2.position.set(0, 0, -10); // Position wall at back, centered at ground
    wall2.receiveShadow = true;
    scenes.room3.add(wall2);

    // Create physics body for the wall (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbWall = new RigidBody();
      // Create vertical wall: wide in X and Y, thin in Z
      // Position at z=-10, y=0 (centered at ground), size is 20x20x1 (thin in Z direction)
      rbWall.createBox(0, { x: 0, y: 0, z: -10 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 20,
        y: 20,
        z: 5,
      });
      rbWall.setFriction(PhysicsConfig.WALL_FRICTION);
      rbWall.setRestitution(PhysicsConfig.WALL_RESTITUTION);
      physicsWorld.addRigidBody(rbWall.body_);
      rigidBodies.push({ mesh: wall, rigidBody: rbWall });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }

    // Create a wall plane
    /*const targetWall2 = new Mesh(targetGeometry, targetMaterial);
    targetWall2.position.set(0, 2.5, -9.9); // Position target lower (bottom at ground level)
    targetWall2.receiveShadow = true;
    // Create physics body for the wall (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbtargetWall2 = new RigidBody();
      // Create vertical target: 5x5 plane, positioned so bottom edge is at ground (y=0)
      // Center at y=2.5 so it spans from y=0 to y=5
      rbtargetWall2.createBox(1, { x: 0, y: 2.5, z: -9.9 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 5,
        y: 5,
        z: 1,
      });
      rbtargetWall2.setFriction(1.0);
      rbtargetWall2.setRestitution(0.2);
      physicsWorld.addRigidBody(rbtargetWall2.body_);
      rigidBodies.push({ mesh: targetWall2, rigidBody: rbtargetWall2 });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }
    rooms.room3.add(targetWall2);*/
    // =============== Color Buttons =============== //
    // Create small cube buttons for changing colors
    const buttonGeometry = new BoxGeometry(0.5, 0.5, 0.5);

    // Red color button
    const redButtonMaterial = new MeshStandardMaterial({
      color: Colors.RED,
      emissive: Colors.EMISSIVE_RED,
    });
    const redButton = new Mesh(buttonGeometry, redButtonMaterial);
    redButton.position.set(-5, 1, -3);
    ObjectHelpers.makeColorButton(redButton, Colors.RED);
    scenes.room1.add(redButton);

    // Green color button
    const greenButtonMaterial = new MeshStandardMaterial({
      color: Colors.GREEN,
      emissive: Colors.EMISSIVE_GREEN,
    });
    const greenButton = new Mesh(buttonGeometry, greenButtonMaterial);
    greenButton.position.set(-5, 1, -1);
    ObjectHelpers.makeColorButton(greenButton, Colors.GREEN);
    scenes.room1.add(greenButton);

    // Blue color button
    const blueButtonMaterial = new MeshStandardMaterial({
      color: Colors.BLUE,
      emissive: Colors.EMISSIVE_BLUE,
    });
    const blueButton = new Mesh(buttonGeometry, blueButtonMaterial);
    blueButton.position.set(-5, 1, 1);
    ObjectHelpers.makeColorButton(blueButton, Colors.BLUE);
    scenes.room1.add(blueButton);

    // Yellow color button
    const yellowButtonMaterial = new MeshStandardMaterial({
      color: Colors.YELLOW,
      emissive: Colors.EMISSIVE_YELLOW,
    });
    const yellowButton = new Mesh(buttonGeometry, yellowButtonMaterial);
    yellowButton.position.set(-5, 1, 3);
    ObjectHelpers.makeColorButton(yellowButton, Colors.YELLOW);
    scenes.room1.add(yellowButton);

    // =============== Inventory and movement system =============== //
    const inventory = {
      heldItems: [], // Array of held objects {mesh, rigidBody}
      currentItemIndex: 0, // Index of currently displayed item
    };

    const moveSpeed = Movement.SPEED;

    // Create a perspective camera. The aspect ratio is from the container's size so the view matches the canvas dimensions.
    const camera = new PerspectiveCamera(
      CameraConfig.FOV,
      container.clientWidth / Math.max(container.clientHeight, 1),
      CameraConfig.NEAR_PLANE,
      CameraConfig.FAR_PLANE,
    );
    // camera.position.set(0, 1.6, 5); // initial camera position (x,y,z)

    // ============== ROOM SWITCHING HELPER ==============
    function switchRoom(nextRoom) {
      console.log("Switching to room:", nextRoom);
      if (!scenes[nextRoom]) return;

      currentRoom = nextRoom;
      currentScene = scenes[nextRoom];

      if (currentRoom === "room1") {
        camera.position.set(
          0,
          CameraConfig.INITIAL_HEIGHT,
          CameraConfig.INITIAL_DISTANCE,
        );
        playerOxygen.canBreathe = false;
      } else if (currentRoom === "room2") {
        camera.position.set(
          0,
          CameraConfig.INITIAL_HEIGHT,
          CameraConfig.ROOM2_INITIAL_DISTANCE,
        );
        playerOxygen.canBreathe = true;
      } else if (currentRoom === "room3") {
        camera.position.set(0, CameraConfig.INITIAL_HEIGHT, 11);
        playerOxygen.canBreathe = true;
      }
    }

    // Game starts in room1
    switchRoom("room1");

    // Create the WebGL renderer with safe defaults and fallback to WebGL1.
    // Some macOS environments (or sandboxed browsers) fail to get a WebGL2 context.
    // Proactively test WebGL context availability before constructing Three's renderer
    const testCanvas = document.createElement("canvas");
    const canWebGL2 = !!testCanvas.getContext("webgl2");
    const canWebGL1 = !!testCanvas.getContext("webgl");

    let renderer;
    if (canWebGL2 || canWebGL1) {
      try {
        renderer = new WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          stencil: false,
          depth: true,
        });
      } catch (err) {
        console.error("WebGLRenderer creation failed.", err);
        // Try WebGL1Renderer only if available in current THREE build
        if (globalThree && globalThree.WebGL1Renderer) {
          try {
            renderer = new globalThree.WebGL1Renderer({
              antialias: false,
              alpha: false,
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
              stencil: false,
              depth: true,
            });
          } catch (err1) {
            console.error("WebGL1Renderer creation failed.", err1);
          }
        }
      }
    }

    if (!renderer) {
      const msg =
        "WebGL context could not be created. On macOS, ensure Hardware Acceleration is enabled in your browser and try a Chromium-based browser. If running in a sandboxed environment, open the page directly outside the sandbox.";
      console.error(msg);
      const fallback = document.getElementById("webgl-error");
      if (fallback) fallback.textContent = msg;
      throw new Error(msg);
    }

    // Configure renderer and attach canvas
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(
      Math.min(
        globalThis.devicePixelRatio || 1,
        RendererConfig.MAX_PIXEL_RATIO,
      ),
    );
    renderer.shadowMap.enabled = true; // Enable shadows
    container.appendChild(renderer.domElement);

    // =============== MOBILE CONTROLS INITIALIZATION =============== //
    // Initialize mobile controls (virtual joystick + action buttons)
    // Only create on touch-enabled mobile devices
    // Check for actual mobile devices, not just touch capability
    // Windows laptops with touchscreens should use desktop controls
    const isActualMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWindows = /Windows/i.test(navigator.userAgent);
    const isMac = /Macintosh/i.test(navigator.userAgent);

    // Only enable mobile controls on actual mobile devices, not Windows/Mac with touch
    const isMobileDevice = isActualMobile && !isWindows && !isMac;

    let mobileControls = null;
    if (isMobileDevice) {
      mobileControls = new MobileControls();
      console.log("Mobile controls enabled for touch device");
    } else {
      console.log("Desktop mode - using keyboard/mouse controls");
    }

    // =============== INPUT SYSTEM =============== //
    // Initialize InputManager to handle all input
    const inputManager = new InputManager(renderer, camera, mobileControls);

    // Camera look sensitivity (stored for use in animate loop)
    const euler = new lib.Euler(0, 0, 0, "YXZ");
    const mobileSensitivity = 0.002;
    const PI_2 = Math.PI / 2;

    // `onResize` keeps the camera projection and renderer size in sync with the container when the window is resized.
    function onResize() {
      camera.aspect = container.clientWidth /
        Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Listen for resize events on the global scope so the canvas adapts.
    globalThis.addEventListener("resize", onResize);

    // Set up click handlers for InputManager
    const _clickHandlers = {
      onDoorClick: (targetRoom) => {
        // Before switching, remove held items from current scene
        inventory.heldItems.forEach((item) => {
          currentScene.remove(item.mesh);
        });

        switchRoom(targetRoom);

        // After switching, add held items to new scene
        inventory.heldItems.forEach((item) => {
          currentScene.add(item.mesh);
        });
        console.log(inventory.heldItems.length);
      },
      onColorButtonClick: (newColor) => {
        if (inventory.heldItems.length > 0) {
          const currentItem = inventory.heldItems[inventory.currentItemIndex];
          if (
            (currentItem.mesh == redCube) ||
            (currentItem.mesh == clickableSphere)
          ) {
            MeshHelpers.setColor(currentItem.mesh, newColor);
            console.log(
              `Changed item ${inventory.currentItemIndex + 1} to color: #${
                newColor.toString(16).padStart(6, "0")
              }`,
            );
          }
        } else {
          console.log("No items in inventory to change color");
        }
      },
      onPickableClick: (obj) => {
        // For OBJ models with child meshes, check for parent reference
        const targetMesh = obj.userData.parentObject || obj;
        const itemData = rigidBodies.find((rb) => rb.mesh === targetMesh);
        if (itemData && physicsWorld) {
          physicsWorld.removeRigidBody(itemData.rigidBody.body_);
          if (inventory.heldItems.length === 0) {
            inventory.currentItemIndex = 0;
          }
          inventory.heldItems.push(itemData);
          console.log(
            `Picked up item! You now have ${inventory.heldItems.length} items. Press SPACE to throw.`,
          );
        }
      },
    };

    // Set up throw handler for InputManager
    inputManager.onThrowItem = () => {
      if (inventory.heldItems.length > 0 && physicsWorld) {
        const itemToThrow = inventory.heldItems.splice(
          inventory.currentItemIndex,
          1,
        )[0];

        if (
          inventory.currentItemIndex >= inventory.heldItems.length &&
          inventory.heldItems.length > 0
        ) {
          inventory.currentItemIndex = inventory.heldItems.length - 1;
        }

        const direction = new Vector3();
        camera.getWorldDirection(direction);

        const spawnPos = camera.position.clone().add(
          direction.clone().multiplyScalar(Movement.THROW_SPAWN_DISTANCE),
        );

        itemToThrow.mesh.position.copy(spawnPos);

        const newRb = new RigidBody();
        // Check if it's a sphere by looking at geometry (handles both Mesh and Group/OBJ)
        const isSphere =
          MeshHelpers.getGeometryType(itemToThrow.mesh) === "SphereGeometry";

        if (isSphere) {
          newRb.createSphere(
            5,
            { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
            0.5,
          );
        } else {
          // For cubes and OBJ models, use box collider
          newRb.createBox(
            5,
            { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
            { x: 0, y: 0, z: 0, w: 1 },
            { x: 0.5, y: 0.5, z: 0.5 }, // Match the physics size we used for the OBJ
          );
        }
        newRb.setFriction(PhysicsConfig.OBJECT_FRICTION);
        newRb.setRestitution(PhysicsConfig.SPHERE_RESTITUTION);
        physicsWorld.addRigidBody(newRb.body_);

        const idx = rigidBodies.findIndex(
          (rb) => rb.mesh === itemToThrow.mesh,
        );
        if (idx !== -1) {
          rigidBodies[idx].rigidBody = newRb;
        }

        const throwForce = direction.normalize().multiplyScalar(
          Movement.THROW_FORCE,
        );
        const ammoForce = new Ammo.btVector3(
          throwForce.x,
          throwForce.y,
          throwForce.z,
        );
        newRb.body_.applyCentralImpulse(ammoForce);
        Ammo.destroy(ammoForce);

        console.log(
          `Threw item! ${inventory.heldItems.length} items remaining.`,
        );
      }
    };

    // Set up scroll handler for InputManager
    inputManager.onScrollInventory = (deltaY) => {
      if (inventory.heldItems.length > 1) {
        if (deltaY > 0) {
          inventory.currentItemIndex = (inventory.currentItemIndex + 1) %
            inventory.heldItems.length;
        } else if (deltaY < 0) {
          inventory.currentItemIndex =
            (inventory.currentItemIndex - 1 + inventory.heldItems.length) %
            inventory.heldItems.length;
        }
        console.log(
          `Switched to item ${
            inventory.currentItemIndex + 1
          }/${inventory.heldItems.length}`,
        );
        console.log("LOOKKOOKOKOK");
        console.log(inventory.heldItems[inventory.currentItemIndex].rigidBody);
      }
    };

    // Main render loop with physics updates
    const clock = new lib.Clock();
    function animate() {
      const deltaTime = clock.getDelta();
      //============== OXYGEN SYSTEM =============== //
      if (playerOxygen.canBreathe === false) {
        playerOxygen.consumeOxygen(0.30);
      }
      if (playerOxygen.getOxygenLevel() <= 0) {
        const overlay = document.getElementById("loss-overlay");
        if (overlay) {
          overlay.style.display = "flex";
        }
      }
      //checks if holding canister then replenishes oxygen
      if (
        (inventory.heldItems[inventory.currentItemIndex]) &&
        inventory.heldItems[inventory.currentItemIndex].mesh == oxCanister
      ) {
        playerOxygen.gainOxygen(0.25);
        if (playerOxygen.canBreathe === true) {
          oxygenText.innerHTML = `Oxygen Level: ` +
            playerOxygen.oxygenLevel.toFixed(2);
        }
      }
      // Update physics world
      if (physicsWorld) {
        // Use fixed timestep for stable physics - cap deltaTime to prevent huge jumps
        const fixedTimeStep = PhysicsConfig.FIXED_TIMESTEP;
        const maxSubSteps = PhysicsConfig.MAX_SUBSTEPS;
        physicsWorld.stepSimulation(
          Math.min(deltaTime, PhysicsConfig.MAX_DELTATIME),
          maxSubSteps,
          fixedTimeStep,
        );

        // =============== MOBILE TOUCH LOOK (CAMERA ROTATION) =============== //
        // Handle mobile touch look (camera rotation from dragging on screen)
        // getLookDelta() returns touch movement since last frame, then resets to zero
        if (mobileControls) {
          const lookDelta = mobileControls.getLookDelta();
          if (lookDelta.x !== 0 || lookDelta.y !== 0) {
            // Apply touch drag to camera rotation
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= lookDelta.x * mobileSensitivity; // Horizontal rotation (yaw)
            euler.x -= lookDelta.y * mobileSensitivity; // Vertical rotation (pitch)
            // Clamp vertical rotation to prevent camera flipping
            euler.x = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, euler.x));
            camera.quaternion.setFromEuler(euler);
          }
        }

        // Check for collisions
        const numManifolds = dispatcher.getNumManifolds();
        const collidingPairs = new Set();

        for (let i = 0; i < numManifolds; i++) {
          const contactManifold = dispatcher.getManifoldByIndexInternal(i);
          const numContacts = contactManifold.getNumContacts();

          if (numContacts > 0) {
            const body0 = Ammo.castObject(
              contactManifold.getBody0(),
              Ammo.btRigidBody,
            );
            const body1 = Ammo.castObject(
              contactManifold.getBody1(),
              Ammo.btRigidBody,
            );

            // Check if there's actual contact (not just proximity)
            let hasContact = false;
            for (let j = 0; j < numContacts; j++) {
              const contactPoint = contactManifold.getContactPoint(j);
              const distance = contactPoint.getDistance();

              if (distance <= 0) {
                hasContact = true;
                break;
              }
            }

            if (hasContact) {
              // Find which meshes are colliding
              const obj0 = rigidBodies.find((rb) =>
                rb.rigidBody.body_ === body0
              );
              const obj1 = rigidBodies.find((rb) =>
                rb.rigidBody.body_ === body1
              );

              if (obj0 && obj1) {
                // Create unique pair key to avoid duplicate logs
                const pairKey = [obj0, obj1].sort().join("-");
                if (!collidingPairs.has(pairKey)) {
                  collidingPairs.add(pairKey);

                  // Check if sphere hit the target wall
                  if (
                    (obj0.mesh === clickableSphere &&
                      obj1.mesh === targetWall) ||
                    (obj1.mesh === clickableSphere && obj0.mesh === targetWall)
                  ) {
                    const messageElement = document.getElementById(
                      "target-message",
                    );
                    if (messageElement) {
                      messageElement.style.display = "block";
                      console.log("Congrats you hit the target!");
                      console.log(MeshHelpers.getColor(obj0.mesh));
                    }
                  }

                  if (
                    ((obj0.mesh === redCube &&
                      obj1.mesh === targetWall) ||
                      (obj1.mesh === redCube && obj0.mesh === targetWall))
                  ) {
                    const color0 = MeshHelpers.getColor(obj0.mesh);
                    const color1 = MeshHelpers.getColor(obj1.mesh);

                    if (
                      color0 && color1 && color0.getHex() === color1.getHex()
                    ) {
                      const messageElement = document.getElementById(
                        "target-message",
                      );
                      if (messageElement) {
                        messageElement.style.display = "block";
                        console.log("MATCHING COLOR!");
                      }
                      switchRoom("room3");
                      groundMaterial.color.setHex(0x0000FF);
                      wallMaterial.color.setHex(0x8F9779);
                      console.log(color0);
                      console.log(color1);
                    }
                  }

                  // You can add custom collision responses here
                  // For example: change color, play sound, apply forces, etc.
                }
              }
            }
          }
        }

        // Update Three.js mesh positions from physics bodies
        for (const obj of rigidBodies) {
          // Skip updating held items - they will be positioned relative to camera
          if (inventory.heldItems.some((item) => item.mesh === obj.mesh)) {
            continue;
          }

          const ms = obj.rigidBody.body_.getMotionState();
          if (ms) {
            ms.getWorldTransform(obj.rigidBody.transform_);
            const p = obj.rigidBody.transform_.getOrigin();
            const q = obj.rigidBody.transform_.getRotation();
            obj.mesh.position.set(p.x(), p.y(), p.z());
            obj.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
          }
        }
      }

      // =============== INPUT PROCESSING =============== //
      // Process click interactions (only for current scene)
      inputManager.processClickInteractions(
        currentScene,
        ObjectHelpers,
        _clickHandlers,
      );

      // Get camera look input and apply rotation
      const lookDelta = inputManager.getLookDelta(
        CameraConfig.LOOK_SENSITIVITY,
        0.003,
      );
      inputManager.applyLookRotation(
        lookDelta,
        CameraConfig.MAX_PITCH,
        CameraConfig.MIN_PITCH_OFFSET,
      );

      // =============== PLAYER MOVEMENT (KEYBOARD + MOBILE JOYSTICK) =============== //
      const moveDir = new Vector3();
      const movementInput = inputManager.getMovementInput();

      if (
        Math.abs(movementInput.x) > 0.01 || Math.abs(movementInput.y) > 0.01
      ) {
        const forward = new Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new Vector3();
        right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

        // Apply movement input (combined keyboard and joystick)
        moveDir.add(forward.clone().multiplyScalar(movementInput.y));
        moveDir.add(right.clone().multiplyScalar(movementInput.x));

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          camera.position.addScaledVector(moveDir, moveSpeed * deltaTime);
        }
      }

      // =============== MOBILE ACTION BUTTONS =============== //
      // Mobile buttons use the same handlers as keyboard/mouse
      if (inputManager.wasMobileButtonPressed("interact")) {
        // Simulate center screen click for mobile interact
        const centerRaycast = new globalThis.THREE.Raycaster();
        centerRaycast.setFromCamera(new Vector3(0, 0), camera);
        const intersects = centerRaycast.intersectObjects(
          currentScene.children,
          true,
        );

        for (const intersect of intersects) {
          const obj = intersect.object;
          if (ObjectHelpers.isDoor(obj)) {
            _clickHandlers.onDoorClick(obj.userData.doorTarget);
            break;
          }
          if (ObjectHelpers.isColorButton(obj)) {
            _clickHandlers.onColorButtonClick(obj.userData.buttonColor);
            break;
          }
          if (ObjectHelpers.isPickable(obj)) {
            _clickHandlers.onPickableClick(obj);
            break;
          }
          if (obj.userData.isVictoryButton) {
            const overlay = document.getElementById("victory-overlay");
            if (overlay) {
              overlay.style.display = "flex";
            }
            break;
          }
        }
      }

      // Throw button uses the same handler as spacebar
      if (inputManager.wasMobileButtonPressed("throw")) {
        if (inputManager.onThrowItem) {
          inputManager.onThrowItem();
        }
      }

      // Switch button uses the same handler as mouse wheel
      if (inputManager.wasMobileButtonPressed("switch")) {
        if (inputManager.onScrollInventory) {
          inputManager.onScrollInventory(1); // Positive delta = next item
        }
      }

      // Update held item position (only show currently selected item in bottom right of screen)
      if (inventory.heldItems.length > 0) {
        // Hide all inventory items first
        inventory.heldItems.forEach((item) => {
          item.mesh.visible = false;
        });

        // Only show and position the currently selected item
        const currentItem = inventory.heldItems[inventory.currentItemIndex];
        const heldMesh = currentItem.mesh;
        heldMesh.visible = true;

        // Get camera's forward, right, and up vectors
        const forward = new lib.Vector3();
        const right = new lib.Vector3();
        const up = new lib.Vector3(0, 1, 0);

        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        up.crossVectors(right, forward).normalize();

        // Position in bottom right: forward, right, and down based on config
        const offset = forward.clone().multiplyScalar(
          InventoryDisplay.FORWARD_DISTANCE,
        )
          .add(right.clone().multiplyScalar(InventoryDisplay.RIGHT_OFFSET))
          .add(up.clone().multiplyScalar(InventoryDisplay.DOWN_OFFSET));

        heldMesh.position.copy(camera.position).add(offset);

        // Make it rotate slightly to look held
        heldMesh.rotation.copy(camera.rotation);
      }

      renderer.render(currentScene, camera);
      requestAnimationFrame(animate);
    }

    // Start the render loop.
    animate();

    // Return the core objects so callers can add models, lights, controls, etc.
    return {
      scenes,
      currentScene,
      camera,
      renderer,
      container,
      physicsWorld,
      rigidBodies,
      THREE: lib,
    };
  })());
}
