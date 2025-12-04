// InputManager: Consolidates all input handling (keyboard, mouse, mobile)
// Manages input state and provides clean interface for game logic

export class InputManager {
  constructor(renderer, camera, mobileControls = null) {
    this.renderer = renderer;
    this.camera = camera;
    this.mobileControls = mobileControls;

    // Movement state
    this.moveState = {
      forward: false,
      back: false,
      left: false,
      right: false,
    };

    // Mouse look state
    this.isDragging = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.euler = new globalThis.THREE.Euler(0, 0, 0, "YXZ");

    // Raycasting for click detection
    this.raycaster = new globalThis.THREE.Raycaster();
    this.mouse = new globalThis.THREE.Vector2();

    // Click handlers (will be set by game logic)
    this.onDoorClick = null;
    this.onColorButtonClick = null;
    this.onPickableClick = null;

    // Action handlers
    this.onThrowItem = null;
    this.onScrollInventory = null;

    // Bind methods to maintain context
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseClick = this._onMouseClick.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onWindowBlur = this._onWindowBlur.bind(this);

    this._setupEventListeners();
  }

  // =============== SETUP ===============
  _setupEventListeners() {
    // Mouse look controls
    this.renderer.domElement.addEventListener("mousedown", this._onMouseDown);
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup", this._onMouseUp);
    this.renderer.domElement.addEventListener(
      "contextmenu",
      this._onContextMenu,
    );

    // Mouse leave detection - stop dragging when cursor exits window
    this.renderer.domElement.addEventListener("mouseleave", this._onMouseLeave);
    document.addEventListener("mouseleave", this._onMouseLeave);

    // Window blur detection - stop all actions when window loses focus
    globalThis.addEventListener("blur", this._onWindowBlur);

    // Click interactions
    this.renderer.domElement.addEventListener("click", this._onMouseClick);

    // Keyboard controls
    globalThis.addEventListener("keydown", this._onKeyDown);
    globalThis.addEventListener("keyup", this._onKeyUp);

    // Mouse wheel for inventory
    this.renderer.domElement.addEventListener("wheel", this._onMouseWheel, {
      passive: false,
    });
  }

  // =============== MOUSE LOOK CONTROLS ===============
  _onMouseDown(event) {
    if (event.button === 2) {
      // Right mouse button
      this.isDragging = true;
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
    }
  }

  _onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMouseX;
    const deltaY = event.clientY - this.previousMouseY;

    this.previousMouseX = event.clientX;
    this.previousMouseY = event.clientY;

    // Apply look rotation (will be called from update)
    this._pendingLookDelta = { x: deltaX, y: deltaY };
  }

  _onMouseUp(event) {
    if (event.button === 2) {
      this.isDragging = false;
    }
  }

  _onContextMenu(event) {
    event.preventDefault();
  }

  _onMouseLeave() {
    // Stop dragging when mouse leaves the window
    if (this.isDragging) {
      this.isDragging = false;
      this._pendingLookDelta = null;
    }
  }

  _onWindowBlur() {
    // Reset all input states when window loses focus
    this.isDragging = false;
    this._pendingLookDelta = null;

    // Reset all movement keys
    this.moveState.forward = false;
    this.moveState.back = false;
    this.moveState.left = false;
    this.moveState.right = false;
  }

  // =============== CLICK INTERACTIONS ===============
  _onMouseClick(event) {
    if (event.button !== 0) return; // Only left-click

    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Store click info for game logic to handle
    this._pendingClick = {
      raycaster: this.raycaster,
      mouse: this.mouse,
    };
  }

  // =============== KEYBOARD CONTROLS ===============
  _onKeyDown(event) {
    switch (event.code) {
      case "KeyW":
        this.moveState.forward = true;
        break;
      case "KeyS":
        this.moveState.back = true;
        break;
      case "KeyA":
        this.moveState.left = true;
        break;
      case "KeyD":
        this.moveState.right = true;
        break;
      case "Space":
        if (this.onThrowItem) {
          this.onThrowItem();
        }
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.moveState.forward = false;
        break;
      case "KeyS":
        this.moveState.back = false;
        break;
      case "KeyA":
        this.moveState.left = false;
        break;
      case "KeyD":
        this.moveState.right = false;
        break;
    }
  }

  // =============== MOUSE WHEEL ===============
  _onMouseWheel(event) {
    if (this.onScrollInventory) {
      this.onScrollInventory(event.deltaY);
      event.preventDefault();
    }
  }

  // =============== PUBLIC API ===============

  // Get movement input (combines keyboard and mobile joystick)
  getMovementInput() {
    const keyboardMove = {
      x: (this.moveState.right ? 1 : 0) - (this.moveState.left ? 1 : 0),
      y: (this.moveState.forward ? 1 : 0) - (this.moveState.back ? 1 : 0),
    };

    const joystickMove = this.mobileControls
      ? this.mobileControls.getMovement()
      : { x: 0, y: 0 };

    return {
      x: keyboardMove.x || joystickMove.x,
      y: keyboardMove.y || joystickMove.y,
    };
  }

  // Get camera look delta (combines mouse drag and mobile touch)
  getLookDelta(sensitivity, mobileSensitivity) {
    const delta = { x: 0, y: 0 };

    // Desktop mouse look
    if (this._pendingLookDelta) {
      delta.x = this._pendingLookDelta.x * sensitivity;
      delta.y = this._pendingLookDelta.y * sensitivity;
      this._pendingLookDelta = null;
    }

    // Mobile touch look
    if (this.mobileControls) {
      const mobileDelta = this.mobileControls.getLookDelta();
      delta.x += mobileDelta.x * mobileSensitivity;
      delta.y += mobileDelta.y * mobileSensitivity;
    }

    return delta;
  }

  // Apply look rotation to camera
  applyLookRotation(delta, maxPitch, minPitchOffset) {
    if (delta.x === 0 && delta.y === 0) return;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= delta.x;
    this.euler.x -= delta.y;
    this.euler.x = Math.max(
      -maxPitch + minPitchOffset,
      Math.min(maxPitch - minPitchOffset, this.euler.x),
    );
    this.camera.quaternion.setFromEuler(this.euler);
  }

  // Process click interactions with scene objects
  processClickInteractions(scene, objectHelpers, handlers) {
    if (!this._pendingClick) return;

    const intersects = this._pendingClick.raycaster.intersectObjects(
      scene.children,
      true,
    );

    for (const intersect of intersects) {
      const obj = intersect.object;

      // Handle door clicks
      if (objectHelpers.isDoor(obj)) {
        if (handlers.onDoorClick) {
          handlers.onDoorClick(obj.userData.doorTarget);
        }
        this._pendingClick = null;
        return;
      }

      // Handle color button clicks
      if (objectHelpers.isColorButton(obj)) {
        if (handlers.onColorButtonClick) {
          handlers.onColorButtonClick(obj.userData.buttonColor);
        }
        this._pendingClick = null;
        return;
      }

      // Handle pickable item clicks
      if (objectHelpers.isPickable(obj)) {
        if (handlers.onPickableClick) {
          handlers.onPickableClick(obj);
        }
        this._pendingClick = null;
        return;
      }

      // Handle victory button clicks
      if (obj.userData.isVictoryButton) {
        const overlay = document.getElementById("victory-overlay");
        if (overlay) {
          overlay.style.display = "flex";
        }
        this._pendingClick = null;
        return;
      }
    }

    this._pendingClick = null;
  }

  // Check if mobile button was pressed
  wasMobileButtonPressed(buttonName) {
    return this.mobileControls
      ? this.mobileControls.wasButtonPressed(buttonName)
      : false;
  }

  // =============== CLEANUP ===============
  dispose() {
    // Remove all event listeners
    this.renderer.domElement.removeEventListener(
      "mousedown",
      this._onMouseDown,
    );
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup", this._onMouseUp);
    this.renderer.domElement.removeEventListener(
      "contextmenu",
      this._onContextMenu,
    );
    this.renderer.domElement.removeEventListener("click", this._onMouseClick);
    globalThis.removeEventListener("keydown", this._onKeyDown);
    globalThis.removeEventListener("keyup", this._onKeyUp);
    this.renderer.domElement.removeEventListener("wheel", this._onMouseWheel);
  }
}
