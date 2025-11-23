// Boot module: load Three.js, expose it as a global, then start the app.
// Keeping the import here ensures the team uses a single global THREE instance.
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import init from "./main.js";

// Expose the library globally so `src/main.js` (and other modules) can use it.
globalThis.THREE = THREE;
globalThis.PointerLockControls = PointerLockControls;

// Initialize Ammo.js first, then start the app
// Ammo() is a function that returns a promise when the physics engine is ready
if (typeof Ammo === "function") {
  Ammo().then((AmmoLib) => {
    // Expose Ammo globally so it can be used throughout the app
    globalThis.Ammo = AmmoLib;
    console.log("Ammo.js physics engine initialized");

    // Now start the app after Ammo is ready
    return init();
  }).catch((err) => {
    console.error("Failed to initialize Ammo.js or the scene:", err);
  });
} else {
  // If Ammo is not available, start without physics
  console.warn("Ammo.js not found. Starting without physics support.");
  init().catch((err) => {
    console.error("Failed to initialize the scene:", err);
  });
}
