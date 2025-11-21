export default function init() {
	// Try to reuse a global THREE instance set by index.html.
	// This avoids re-downloading the library in browser environments.
	const globalThree = (typeof globalThis !== 'undefined' && globalThis.THREE) ? globalThis.THREE : null;

	return Promise.resolve((() => {
		// Require a global THREE instance for the game. 
        // If it's missing, throw a clear error so the developer adds the browser import that sets `window.THREE`.
		if (!globalThree) {
			throw new Error('Missing global THREE. Ensure index.html imports Three.js and sets `window.THREE` before calling init()');
		}
		const lib = globalThree;

		// Destructure the specific classes we need from the module for clarity.
		const { Scene, PerspectiveCamera, WebGLRenderer, Color, GridHelper } = lib;

		// `container` is the HTML element where the renderer's canvas is appended.
		// `index.html` should include `<div id="scene-container">` to show the renderer.
		const container = document.getElementById('scene-container');

		// Create a scene in Three.jsand set a background color.
		const scene = new Scene();
		scene.background = new Color(0x000000);

		// Add a simple grid so there's some visuals to see when loading the page.
        // This should be removed after adding actual models to the scene.
		const grid = new GridHelper(10, 10); // size 10, 10 divisions
		grid.position.y = 0; // place grid at world origin
		scene.add(grid);

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
		const renderer = new WebGLRenderer();
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
		container.appendChild(renderer.domElement);

		// `onResize` keeps the camera projection and renderer size in sync with the container when the window is resized.
		function onResize() {
			camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		}

		// Listen for resize events on the global scope so the canvas adapts.
		globalThis.addEventListener('resize', onResize);

		// Main render loop. Scene is empty by default; other modules should add objects to `scene`.
		function animate() {
			renderer.render(scene, camera);
			requestAnimationFrame(animate);
		}

		// Start the render loop.
		animate();

		// Return the core objects so callers can add models, lights, controls, etc.
		return { scene, camera, renderer, container, THREE: lib };
	})());
}