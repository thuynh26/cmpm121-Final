class RigidBody {
  constructor() {
  }

  setRestitution(val) {
    this.body_.setRestitution(val);
  }

  setFriction(val) {
    this.body_.setFriction(val);
  }

  setRollingFriction(val) {
    this.body_.setRollingFriction(val);
  }

  createBox(mass, pos, quat, size) {
    this.transform_ = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w),
    );
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    this.shape_ = new Ammo.btBoxShape(btSize);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape_.calculateLocalInertia(mass, this.inertia_);
    }

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
      mass,
      this.motionState_,
      this.shape_,
      this.inertia_,
    );
    this.body_ = new Ammo.btRigidBody(this.info_);

    Ammo.destroy(btSize);
  }

  createSphere(mass, pos, size) {
    this.transform_ = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    this.shape_ = new Ammo.btSphereShape(size);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape_.calculateLocalInertia(mass, this.inertia_);
    }

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
      mass,
      this.motionState_,
      this.shape_,
      this.inertia_,
    );
    this.body_ = new Ammo.btRigidBody(this.info_);
  }
}

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

    // Initialize Ammo.js physics world
    let physicsWorld = null;
    let dispatcher = null;
    const rigidBodies = [];

    if (typeof Ammo !== "undefined") {
      // Set up the physics world configuration
      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      const overlappingPairCache = new Ammo.btDbvtBroadphase();
      const solver = new Ammo.btSequentialImpulseConstraintSolver();

      // Create the physics world
      physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration,
      );

      // Set gravity (x, y, z) - y is up/down
      physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));
    }

    // Destructure the specific classes we need from the module for clarity.
    const {
      Scene,
      PerspectiveCamera,
      WebGLRenderer,
      Color,
      GridHelper,
      BoxGeometry,
      PlaneGeometry,
      MeshStandardMaterial,
      Mesh,
      DirectionalLight,
      AmbientLight,
    } = lib;

    // `container` is the HTML element where the renderer's canvas is appended.
    // `index.html` should include `<div id="scene-container">` to show the renderer.
    const container = document.getElementById("scene-container");

    // Create a scene in Three.jsand set a background color.
    const scene = new Scene();
    scene.background = new Color(0x87CEEB); // Sky blue background

    // Add a simple grid so there's some visuals to see when loading the page.
    // This should be removed after adding actual models to the scene.
    const grid = new GridHelper(10, 10); // size 10, 10 divisions
    grid.position.y = 0; // place grid at world origin
    scene.add(grid);

    // Add lighting to the scene
    // Ambient light provides soft overall illumination
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light simulates sunlight
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create a ground plane
    const groundGeometry = new PlaneGeometry(20, 20);
    const groundMaterial = new MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create physics body for the ground (mass 0 = static/immovable object)

    if (physicsWorld) {
      const rbGround = new RigidBody();
      rbGround.createBox(0, { x: 0, y: -1, z: 0 }, {
        x: -0.7071,
        y: 0,
        z: 0,
        w: 0.7071,
      }, {
        x: 20,
        y: 1,
        z: 20,
      });
      rbGround.setFriction(0.5);
      rbGround.setRestitution(0.3);
      physicsWorld.addRigidBody(rbGround.body_);
      rigidBodies.push({ mesh: ground, rigidBody: rbGround });
    }

    // Create some cube objects for the environment
    const cubeGeometry = new BoxGeometry(1, 1, 1);

    // Red cube
    const redCubeMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    const redCube = new Mesh(cubeGeometry, redCubeMaterial);
    redCube.castShadow = true;
    scene.add(redCube);

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
    }

    // Create a perspective camera. The aspect ratio is from the container's size so the view matches the canvas dimensions.
    const camera = new PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000,
    );
    camera.position.set(0, 1.6, 3); // camera position (x,y,z)

    // Create the WebGL renderer, set its size and pixel ratio, then attach
    // the renderer's canvas to the container element in index.html.
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; // Enable shadows
    container.appendChild(renderer.domElement);

    // Add OrbitControls for camera movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // smooth camera movement
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); // look at center
    controls.minDistance = 2; // minimum zoom distance
    controls.maxDistance = 20; // maximum zoom distance

    // `onResize` keeps the camera projection and renderer size in sync with the container when the window is resized.
    function onResize() {
      camera.aspect = container.clientWidth /
        Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Listen for resize events on the global scope so the canvas adapts.
    globalThis.addEventListener("resize", onResize);

    // Main render loop with physics updates
    const clock = new lib.Clock();

    function animate() {
      const deltaTime = clock.getDelta();

      // Update controls
      controls.update();

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

            // Log collision (you can add custom collision handling here)
            for (let j = 0; j < numContacts; j++) {
              const contactPoint = contactManifold.getContactPoint(j);
              const distance = contactPoint.getDistance();

              // Only process if objects are actually touching (distance <= 0)
              if (distance <= 0) {
                // Find which meshes are colliding
                const obj0 = rigidBodies.find((rb) =>
                  rb.rigidBody.body_ === body0
                );
                const obj1 = rigidBodies.find((rb) =>
                  rb.rigidBody.body_ === body1
                );

                if (obj0 && obj1) {
                  // You can add custom collision responses here
                  // For example: change color, play sound, apply forces, etc.
                  console.log(
                    "Collision detected between objects at distance:",
                    distance,
                  );
                }
              }
            }
          }
        }

        // Update Three.js mesh positions from physics bodies
        for (const obj of rigidBodies) {
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
