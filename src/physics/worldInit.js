// Initialize Ammo.js physics world + return core objects

export function initWorldPhysics(AmmoGlobal) {
  if (typeof AmmoGlobal === "undefined") {
    console.error("Ammo is not defined! Physics will not work.");
    return {
      physicsWorld: null,
      dispatcher: null,
      rigidBodies: [],
    };
  }

  console.log("Initializing Ammo.js physics world...");

  // Set up the physics world configuration
  const collisionConfiguration = new AmmoGlobal
    .btDefaultCollisionConfiguration();
  const dispatcher = new AmmoGlobal.btCollisionDispatcher(
    collisionConfiguration,
  );
  const overlappingPairCache = new AmmoGlobal.btDbvtBroadphase();
  const solver = new AmmoGlobal.btSequentialImpulseConstraintSolver();

  // Create the physics world
  const physicsWorld = new AmmoGlobal.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration,
  );

  // Set gravity (x, y, z) - y is up/down
  physicsWorld.setGravity(new AmmoGlobal.btVector3(0, -9.8, 0));
  console.log("Physics world created successfully with gravity: (0, -9.8, 0)");

  const rigidBodies = [];

  return {
    physicsWorld,
    dispatcher,
    rigidBodies,
  };
}
