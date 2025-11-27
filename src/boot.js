// Boot module: load Three.js, expose it as a global, then start the app.
// Keeping the import here ensures the team uses a single global THREE instance.
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import init from "./main.js";

// Expose the library globally so `src/main.js` (and other modules) can use it.
globalThis.THREE = THREE;
globalThis.PointerLockControls = PointerLockControls;

// Check if Ammo.js was initialized by index.html
if (typeof globalThis.Ammo !== "undefined" && globalThis.Ammo !== null) {
  console.log("Ammo.js physics engine ready");
  // Start the app with physics support
  init().catch((err) => {
    console.error("Failed to initialize the scene:", err);
  });
} else {
  // If Ammo is not available, start without physics
  console.warn("Ammo.js not found. Starting without physics support.");
  init().catch((err) => {
    console.error("Failed to initialize the scene:", err);
  });
}
