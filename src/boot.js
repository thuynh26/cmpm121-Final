// Boot module: load Three.js, expose it as a global, then start the app.
// Keeping the import here ensures the team uses a single global THREE instance.
import * as THREE from 'three';
import init from './main.js';

// Expose the library globally so `src/main.js` (and other modules) can use it.
globalThis.THREE = THREE;

// Start the app. `init()` returns a Promise that resolves with the core objects.
init().catch((err) => {
	// Log any startup errors to the console for debugging.
	console.error('Failed to initialize the scene:', err);
});