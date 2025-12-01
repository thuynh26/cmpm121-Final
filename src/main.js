import RigidBody from "./physics/RigidBody.js";
import { initWorldPhysics } from "./physics/worldInit.js";

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
      Raycaster,
      Vector2,
      Euler,
      Vector3,
      Clock,
    } = lib;

    // `container` is the HTML element where the renderer's canvas is appended.
    // `index.html` should include `<div id="scene-container">` to show the renderer.
    const container = document.getElementById("scene-container");

    // Create a scene in Three.jsand set a background color.
    const scene = new Scene();
    scene.background = new Color(0x87CEEB); // Sky blue background

    // Add lighting to the scene
    // Ambient light provides soft overall illumination
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light simulates sunlight
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // =============== ROOMS SYSTEM =============== //
    const rooms = {
      room1: new lib.Group(), // the starting room
      room2: new lib.Group(),
    };
    let currentRoom = "room1";

    scene.add(rooms.room1);
    rooms.room1.visible = true;

    scene.add(rooms.room2);
    rooms.room2.visible = false;

    // =============== ROOM 1 =============== //
    const room1FloorGeo = new PlaneGeometry(10, 10);
    const room1FloorMat = new MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9,
      metalness: 0.1,
    });
    const room1Floor = new Mesh(room1FloorGeo, room1FloorMat);
    room1Floor.rotation.x = -Math.PI / 2;
    room1Floor.position.set(0, 0, 0);
    room1Floor.receiveShadow = true;
    rooms.room1.add(room1Floor);

    // Back wall
    const room1BackWallGeo = new PlaneGeometry(10, 5);
    const room1BackWallMat = new MeshStandardMaterial({
      color: 0x8888aa,
      roughness: 0.8,
      metalness: 0.1,
    });
    const room1BackWall = new Mesh(room1BackWallGeo, room1BackWallMat);
    room1BackWall.position.set(0, 2.5, -5);
    rooms.room1.add(room1BackWall);

    // Door from Room 1 -> Room 2
    const doorGeo = new BoxGeometry(1.5, 3, 0.2);
    const doorMat = new MeshStandardMaterial({
      color: 0x3366ff,
      roughness: 0.6,
      metalness: 0.2,
    });

    const doorRoom1To2 = new Mesh(doorGeo, doorMat);
    doorRoom1To2.position.set(0, 1.5, -4.9);
    doorRoom1To2.userData.isDoor = true;
    doorRoom1To2.userData.doorTarget = "room2";
    rooms.room1.add(doorRoom1To2);

    // =============== ROOM 2 =============== //
    // Add a simple grid so there's some visuals to see when loading the page.
    // This should be removed after adding actual models to the scene.
    const grid = new GridHelper(10, 10); // size 10, 10 divisions
    grid.position.y = 0; // place grid at world origin
    rooms.room2.add(grid);

    // Create a ground plane
    const groundGeometry = new PlaneGeometry(20, 20);
    const groundMaterial = new MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    rooms.room2.add(ground);

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
    doorRoom2To1.userData.isDoor = true;
    doorRoom2To1.userData.doorTarget = "room1";
    rooms.room2.add(doorRoom2To1);

    // Create a wall plane
    const wallGeometry = new PlaneGeometry(20, 20);
    const wallMaterial = new MeshStandardMaterial({
      color: 0x6b6b6b, // Wall gray
      roughness: 0.8,
      metalness: 0.2,
    });
    const wall = new Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 0, -10); // Position wall at back, centered at ground
    wall.receiveShadow = true;
    rooms.room2.add(wall);

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
      rbWall.setFriction(1.0);
      rbWall.setRestitution(0.2);
      physicsWorld.addRigidBody(rbWall.body_);
      rigidBodies.push({ mesh: wall, rigidBody: rbWall });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }

    // Create a wall plane
    const targetGeometry = new PlaneGeometry(5, 5);
    const targetMaterial = new MeshStandardMaterial({
      color: 0xf01b0c, // Wall gray
      roughness: 0.8,
      metalness: 0.2,
    });

    const targetWall = new Mesh(targetGeometry, targetMaterial);
    targetWall.position.set(0, 2.5, -9.9); // Position target lower (bottom at ground level)
    targetWall.receiveShadow = true;
    rooms.room2.add(targetWall);
    // Create physics body for the wall (mass 0 = static/immovable object)
    if (physicsWorld) {
      const rbtargetWall = new RigidBody();
      // Create vertical target: 5x5 plane, positioned so bottom edge is at ground (y=0)
      // Center at y=2.5 so it spans from y=0 to y=5
      rbtargetWall.createBox(0, { x: 0, y: 2.5, z: -9.9 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 5,
        y: 5,
        z: 1,
      });
      rbtargetWall.setFriction(1.0);
      rbtargetWall.setRestitution(0.2);
      physicsWorld.addRigidBody(rbtargetWall.body_);
      rigidBodies.push({ mesh: targetWall, rigidBody: rbtargetWall });
      console.log("Wall physics body: box at z=-10, size 20x20x1 (vertical)");
    }
    // Create some cube objects for the environment
    const cubeGeometry = new BoxGeometry(1, 1, 1);

    // Red cube
    const redCubeMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    const redCube = new Mesh(cubeGeometry, redCubeMaterial);
    redCube.position.set(-2, 5, 0); // Set initial position to match physics body
    redCube.castShadow = true;
    rooms.room2.add(redCube);

    if (physicsWorld) {
      const rbredCube = new RigidBody();
      rbredCube.createBox(10, { x: -2, y: 5, z: 0 }, {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      }, {
        x: 1,
        y: 1,
        z: 1,
      });
      rbredCube.setFriction(0.5);
      rbredCube.setRestitution(0.7);
      physicsWorld.addRigidBody(rbredCube.body_);
      rigidBodies.push({ mesh: redCube, rigidBody: rbredCube });
      console.log("Cube physics body added at y=5, mass=10");
    }

    // Create clickable sphere with physics
    const sphereGeometry = new SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0x444400,
      roughness: 0.3,
      metalness: 0.7,
    });
    const clickableSphere = new Mesh(sphereGeometry, sphereMaterial);
    clickableSphere.position.set(0, 2, 0); // Start above ground
    clickableSphere.castShadow = true;
    clickableSphere.userData.clickable = true;
    rooms.room2.add(clickableSphere);

    // Add physics body for sphere
    let sphereRigidBody = null;
    if (physicsWorld) {
      sphereRigidBody = new RigidBody();
      sphereRigidBody.createSphere(5, { x: 0, y: 2, z: 0 }, 0.5);
      sphereRigidBody.setFriction(0.5);
      sphereRigidBody.setRestitution(0.6);
      physicsWorld.addRigidBody(sphereRigidBody.body_);
      rigidBodies.push({ mesh: clickableSphere, rigidBody: sphereRigidBody });
      console.log("Sphere physics body added at y=2, mass=5");
    }

    // =============== Inventory and movement system =============== //
    const inventory = {
      heldItem: null, // Reference to held object {mesh, rigidBody}
    };

    const moveState = {
      forward: false,
      back: false,
      left: false,
      right: false,
    };
    const moveSpeed = 5;

    // Create a perspective camera. The aspect ratio is from the container's size so the view matches the canvas dimensions.
    const camera = new PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000,
    );
    // camera.position.set(0, 1.6, 5); // initial camera position (x,y,z)

    // ============== ROOM SWITCHING HELPER ==============
    function switchRoom(nextRoom) {
      if (!rooms[nextRoom]) return;

      rooms[currentRoom].visible = false;
      currentRoom = nextRoom;
      rooms[currentRoom].visible = true;

      if (currentRoom === "room1") {
        camera.position.set(0, 1.6, 5);
      } else if (currentRoom === "room2") {
        camera.position.set(0, 1.6, 8);
      }
    }

    // Game starts in in room1
    switchRoom("room1");

    // Create the WebGL renderer, set its size and pixel ratio, then attach
    // the renderer's canvas to the container element in index.html.
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; // Enable shadows
    container.appendChild(renderer.domElement);

    // Manual camera look controls (right-click drag to look around)
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    const euler = new lib.Euler(0, 0, 0, "YXZ");
    const PI_2 = Math.PI / 2;
    const sensitivity = 0.002;

    function onMouseDown(event) {
      if (event.button === 2) { // Right mouse button
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
      }
    }

    function onMouseMove(event) {
      if (!isDragging) return;

      const deltaX = event.clientX - previousMouseX;
      const deltaY = event.clientY - previousMouseY;

      previousMouseX = event.clientX;
      previousMouseY = event.clientY;

      euler.setFromQuaternion(camera.quaternion);
      euler.y -= deltaX * sensitivity;
      euler.x -= deltaY * sensitivity;
      euler.x = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, euler.x));
      camera.quaternion.setFromEuler(euler);
    }

    function onMouseUp(event) {
      if (event.button === 2) {
        isDragging = false;
      }
    }

    // Prevent context menu on right-click
    renderer.domElement.addEventListener(
      "contextmenu",
      (e) => e.preventDefault(),
    );

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // `onResize` keeps the camera projection and renderer size in sync with the container when the window is resized.
    function onResize() {
      camera.aspect = container.clientWidth /
        Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Listen for resize events on the global scope so the canvas adapts.
    globalThis.addEventListener("resize", onResize);

    // Set up raycasting for click detection
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    // Handle mouse clicks for picking up items
    function onMouseClick(event) {
      if (event.button !== 0) return; // Only left-click

      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const intersect of intersects) {
        const obj = intersect.object;

        // FOR DOOR (to switch rooms)
        if (obj.userData && obj.userData.isDoor && obj.userData.doorTarget) {
          switchRoom(obj.userData.doorTarget);
          return;
        }

        // FOR SPHERE (picking up)
        if (obj.userData && obj.userData.clickable && !inventory.heldItem) {
          const held = rigidBodies.find((rb) => rb.mesh === obj);
          if (held && physicsWorld) {
            physicsWorld.removeRigidBody(held.rigidBody.body_);
            inventory.heldItem = held;
            console.log("Picked up sphere! Press SPACE to throw it.");
          }
          return;
        }
      }
    }

    // Handle keyboard input for throwing and movement
    function onKeyDown(event) {
      switch (event.code) {
        case "KeyW":
          moveState.forward = true;
          break;
        case "KeyS":
          moveState.back = true;
          break;
        case "KeyA":
          moveState.left = true;
          break;
        case "KeyD":
          moveState.right = true;
          break;
        case "Space":
          // Throw sphere if holding one
          if (inventory.heldItem && physicsWorld) {
            const direction = new Vector3();
            camera.getWorldDirection(direction);

            const spawnPos = camera.position.clone().add(
              direction.clone().multiplyScalar(2),
            );

            // Update mesh position
            inventory.heldItem.mesh.position.copy(spawnPos);

            // New rigid body
            const newRb = new RigidBody();
            newRb.createSphere(
              5,
              { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
              0.5,
            );
            newRb.setFriction(0.5);
            newRb.setRestitution(0.6);
            physicsWorld.addRigidBody(newRb.body_);

            const idx = rigidBodies.findIndex(
              (rb) => rb.mesh === inventory.heldItem.mesh,
            );
            if (idx !== -1) {
              rigidBodies[idx].rigidBody = newRb;
            }

            const throwForce = direction.normalize().multiplyScalar(1000);
            const ammoForce = new Ammo.btVector3(
              throwForce.x,
              throwForce.y,
              throwForce.z,
            );
            newRb.body_.applyCentralImpulse(ammoForce);
            Ammo.destroy(ammoForce);

            console.log("Threw sphere!");
            inventory.heldItem = null;
          }
          break;
      }
    }

    function onKeyUp(event) {
      switch (event.code) {
        case "KeyW":
          moveState.forward = false;
          break;
        case "KeyS":
          moveState.back = false;
          break;
        case "KeyA":
          moveState.left = false;
          break;
        case "KeyD":
          moveState.right = false;
          break;
      }
    }

    renderer.domElement.addEventListener("click", onMouseClick);
    globalThis.addEventListener("keydown", onKeyDown);
    globalThis.addEventListener("keyup", onKeyUp);

    // Main render loop with physics updates
    const clock = new lib.Clock();

    function animate() {
      const deltaTime = clock.getDelta();

      // Update physics world
      if (physicsWorld) {
        // Use fixed timestep for stable physics - cap deltaTime to prevent huge jumps
        const fixedTimeStep = 1.0 / 60.0; // 60 FPS physics
        const maxSubSteps = 10;
        physicsWorld.stepSimulation(
          Math.min(deltaTime, 0.1),
          maxSubSteps,
          fixedTimeStep,
        );

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
                  console.log("Collision: cube and ground are touching");

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
          // Skip updating held item - it will be positioned relative to camera
          if (inventory.heldItem && obj.mesh === inventory.heldItem.mesh) {
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

      // Player movement
      const moveDir = new Vector3();

      if (
        moveState.forward || moveState.back ||
        moveState.left || moveState.right
      ) {
        const forward = new Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new Vector3();
        right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

        if (moveState.forward) moveDir.add(forward);
        if (moveState.back) moveDir.sub(forward);
        if (moveState.left) moveDir.sub(right);
        if (moveState.right) moveDir.add(right);

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          camera.position.addScaledVector(moveDir, moveSpeed * deltaTime);
        }
      }

      // Update held item position (bottom right of screen)
      if (inventory.heldItem) {
        const heldMesh = inventory.heldItem.mesh;

        // Get camera's forward, right, and up vectors
        const forward = new lib.Vector3();
        const right = new lib.Vector3();
        const up = new lib.Vector3(0, 1, 0);

        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        up.crossVectors(right, forward).normalize();

        // Position in bottom right: forward 1.5 units, right 0.8 units, down 0.6 units
        const offset = forward.multiplyScalar(1.5)
          .add(right.multiplyScalar(0.8))
          .add(up.multiplyScalar(-0.6));

        heldMesh.position.copy(camera.position).add(offset);

        // Make it rotate slightly to look held
        heldMesh.rotation.copy(camera.rotation);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    // Start the render loop.
    animate();

    // Return the core objects so callers can add models, lights, controls, etc.
    return {
      scene,
      camera,
      renderer,
      container,
      physicsWorld,
      rigidBodies,
      THREE: lib,
    };
  })());
}
