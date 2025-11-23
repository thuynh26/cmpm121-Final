// Boot module: load Three.js, expose it as a global, then start the app.
// Keeping the import here ensures the team uses a single global THREE instance.
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import init from "./main.js";

// Expose the library globally so `src/main.js` (and other modules) can use it.
globalThis.THREE = THREE;
globalThis.PointerLockControls = PointerLockControls;

// Ammo.js is already initialized in index.html before this module loads
// Just start the app
console.log("Starting application with Ammo.js support");
init().catch((err) => {
  console.error("Failed to initialize the scene:", err);
});
