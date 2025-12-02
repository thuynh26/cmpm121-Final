// Mobile controls module: virtual joystick and action buttons
// Provides touch-based movement (WASD equivalent) and action buttons

export class MobileControls {
  constructor() {
    // Movement state from joystick (normalized -1 to 1)
    this.movement = { x: 0, y: 0 };

    // Button states
    this.buttons = {
      interact: false,
      throw: false,
      switch: false,
    };

    // Touch tracking
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickRadius = 50; // max distance from center

    // Camera look tracking (for touch drag)
    this.lookTouchId = null;
    this.lookActive = false;
    this.previousTouchX = 0;
    this.previousTouchY = 0;
    this.lookDelta = { x: 0, y: 0 };

    // DOM elements
    this.container = null;
    this.joystickBase = null;
    this.joystickHandle = null;
    this.buttonElements = {};

    this._createUI();
    this._setupEventListeners();
  }

  // Create the virtual joystick and buttons in the DOM
  _createUI() {
    // Main container for mobile controls
    this.container = document.createElement("div");
    this.container.id = "mobile-controls";
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    // Touch area for camera look (covers whole screen except UI elements)
    const lookArea = document.createElement("div");
    lookArea.id = "look-area";
    lookArea.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      touch-action: none;
    `;

    // Prevent mouse events on look area - only use touch events
    lookArea.addEventListener("mousedown", (e) => e.stopPropagation());
    lookArea.addEventListener("click", (e) => e.stopPropagation());

    this.container.appendChild(lookArea);

    // Joystick container (bottom left)
    const joystickContainer = document.createElement("div");
    joystickContainer.id = "joystick-container";
    joystickContainer.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 40px;
      width: 120px;
      height: 120px;
      pointer-events: auto;
    `;

    // Joystick base (outer circle)
    this.joystickBase = document.createElement("div");
    this.joystickBase.id = "joystick-base";
    this.joystickBase.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      border: 3px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;

    // Joystick handle (inner circle)
    this.joystickHandle = document.createElement("div");
    this.joystickHandle.id = "joystick-handle";
    this.joystickHandle.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease-out;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    `;

    joystickContainer.appendChild(this.joystickBase);
    joystickContainer.appendChild(this.joystickHandle);
    this.container.appendChild(joystickContainer);

    // Action buttons container (bottom right)
    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "action-buttons";
    buttonsContainer.style.cssText = `
      position: absolute;
      bottom: 40px;
      right: 40px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
    `;

    // Create the three action buttons
    const buttonConfigs = [
      { id: "interact", label: "Interact", color: "#4CAF50" },
      { id: "throw", label: "Throw", color: "#FF5722" },
      { id: "switch", label: "Switch", color: "#2196F3" },
    ];

    buttonConfigs.forEach(({ id, label, color }) => {
      const button = document.createElement("button");
      button.id = `btn-${id}`;
      button.textContent = label;
      button.style.cssText = `
        width: 100px;
        height: 50px;
        background: ${color};
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.1s;
        touch-action: none;
        user-select: none;
      `;
      this.buttonElements[id] = button;
      buttonsContainer.appendChild(button);
    });

    this.container.appendChild(buttonsContainer);

    // Create crosshair for aiming (always visible, centered on screen)
    const crosshair = document.createElement("div");
    crosshair.id = "crosshair";
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      pointer-events: none;
      z-index: 2000;
    `;

    // Horizontal line of crosshair
    const crosshairH = document.createElement("div");
    crosshairH.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-50%);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    `;

    // Vertical line of crosshair
    const crosshairV = document.createElement("div");
    crosshairV.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      width: 2px;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(-50%);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    `;

    // Center dot
    const crosshairDot = document.createElement("div");
    crosshairDot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
    `;

    crosshair.appendChild(crosshairH);
    crosshair.appendChild(crosshairV);
    crosshair.appendChild(crosshairDot);
    this.container.appendChild(crosshair);

    document.body.appendChild(this.container);

    // Hide touch controls by default on desktop (but crosshair stays visible)
    if (!this._isTouchDevice()) {
      joystickContainer.style.display = "none";
      buttonsContainer.style.display = "none";
      lookArea.style.pointerEvents = "none"; // Disable look area on desktop
    }
  }

  // Check if device supports touch
  _isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  // Setup event listeners for joystick and buttons
  _setupEventListeners() {
    // Camera look touch events (on the look area)
    const lookArea = this.container.querySelector("#look-area");
    lookArea.addEventListener("touchstart", (e) => this._onLookStart(e), {
      passive: false,
    });
    lookArea.addEventListener("touchmove", (e) => this._onLookMove(e), {
      passive: false,
    });
    lookArea.addEventListener("touchend", (e) => this._onLookEnd(e), {
      passive: false,
    });
    lookArea.addEventListener("touchcancel", (e) => this._onLookEnd(e), {
      passive: false,
    });

    // Joystick touch events
    this.joystickBase.addEventListener(
      "touchstart",
      (e) => this._onJoystickStart(e),
      { passive: false },
    );
    this.joystickBase.addEventListener(
      "touchmove",
      (e) => this._onJoystickMove(e),
      { passive: false },
    );
    this.joystickBase.addEventListener(
      "touchend",
      (e) => this._onJoystickEnd(e),
      { passive: false },
    );
    this.joystickBase.addEventListener(
      "touchcancel",
      (e) => this._onJoystickEnd(e),
      { passive: false },
    );

    // Button events (support both touch and mouse for testing)
    Object.keys(this.buttonElements).forEach((key) => {
      const button = this.buttonElements[key];

      // Touch events
      button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this._onButtonPress(key, true);
      }, { passive: false });

      button.addEventListener("touchend", (e) => {
        e.preventDefault();
        this._onButtonPress(key, false);
      }, { passive: false });

      // Mouse events (for desktop testing)
      button.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this._onButtonPress(key, true);
      });

      button.addEventListener("mouseup", (e) => {
        e.preventDefault();
        this._onButtonPress(key, false);
      });
    });
  }

  // Camera look touch start
  _onLookStart(e) {
    // Ignore if touch started on joystick or buttons
    if (
      e.target.closest("#joystick-container") ||
      e.target.closest("#action-buttons")
    ) {
      return;
    }

    // Only use the first touch for looking
    if (this.lookTouchId === null && e.touches.length > 0) {
      const touch = e.touches[0];
      this.lookTouchId = touch.identifier;
      this.lookActive = true;
      this.previousTouchX = touch.clientX;
      this.previousTouchY = touch.clientY;
      this.lookDelta = { x: 0, y: 0 };
    }
  }

  // Camera look touch move
  _onLookMove(e) {
    if (!this.lookActive) return;

    const touch = Array.from(e.touches).find((t) =>
      t.identifier === this.lookTouchId
    );
    if (touch) {
      e.preventDefault();
      const deltaX = touch.clientX - this.previousTouchX;
      const deltaY = touch.clientY - this.previousTouchY;

      this.lookDelta.x = deltaX;
      this.lookDelta.y = deltaY;

      this.previousTouchX = touch.clientX;
      this.previousTouchY = touch.clientY;
    }
  }

  // Camera look touch end
  _onLookEnd(e) {
    const ended = Array.from(e.changedTouches).some((t) =>
      t.identifier === this.lookTouchId
    );

    if (ended) {
      this.lookActive = false;
      this.lookTouchId = null;
      this.lookDelta = { x: 0, y: 0 };
    }
  }

  // Joystick touch start
  _onJoystickStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.joystickTouchId = touch.identifier;
    this.joystickActive = true;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    this._updateJoystick(touch.clientX, touch.clientY);
  }

  // Joystick touch move
  _onJoystickMove(e) {
    e.preventDefault();
    if (!this.joystickActive) return;

    const touch = Array.from(e.touches).find((t) =>
      t.identifier === this.joystickTouchId
    );
    if (touch) {
      this._updateJoystick(touch.clientX, touch.clientY);
    }
  }

  // Joystick touch end
  _onJoystickEnd(e) {
    e.preventDefault();
    const ended = Array.from(e.changedTouches).some((t) =>
      t.identifier === this.joystickTouchId
    );

    if (ended || e.touches.length === 0) {
      this.joystickActive = false;
      this.joystickTouchId = null;
      this.movement = { x: 0, y: 0 };

      // Reset handle to center
      this.joystickHandle.style.transform = "translate(-50%, -50%)";
    }
  }

  // Update joystick position and movement values
  _updateJoystick(touchX, touchY) {
    const dx = touchX - this.joystickCenter.x;
    const dy = touchY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to joystick radius
    const clampedDistance = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDistance;
    const clampedY = Math.sin(angle) * clampedDistance;

    // Update handle position
    this.joystickHandle.style.transform =
      `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

    // Normalize movement values (-1 to 1)
    this.movement.x = clampedX / this.joystickRadius;
    this.movement.y = clampedY / this.joystickRadius;
  }

  // Handle button press/release
  _onButtonPress(buttonId, pressed) {
    this.buttons[buttonId] = pressed;

    // Visual feedback
    const button = this.buttonElements[buttonId];
    if (pressed) {
      button.style.transform = "scale(0.95)";
      button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
    } else {
      button.style.transform = "scale(1)";
      button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    }
  }

  // Get current movement vector (for WASD equivalent)
  // Returns { x: left/right, y: forward/backward }
  getMovement() {
    return {
      x: this.movement.x, // positive = right, negative = left
      y: -this.movement.y, // positive = forward, negative = backward (inverted Y)
    };
  }

  // Get camera look delta (for touch drag camera control)
  // Returns { x: horizontal rotation, y: vertical rotation }
  // Call this each frame and reset after reading
  getLookDelta() {
    const delta = { ...this.lookDelta };
    this.lookDelta = { x: 0, y: 0 }; // Reset after reading
    return delta;
  }

  // Check if a button was just pressed (one-shot, resets after reading)
  wasButtonPressed(buttonId) {
    if (this.buttons[buttonId] && !this.buttons[`${buttonId}_consumed`]) {
      this.buttons[`${buttonId}_consumed`] = true;
      return true;
    }
    if (!this.buttons[buttonId]) {
      this.buttons[`${buttonId}_consumed`] = false;
    }
    return false;
  }

  // Check if a button is currently held down
  isButtonHeld(buttonId) {
    return this.buttons[buttonId];
  }

  // Show/hide controls (useful for menu screens, etc.)
  show() {
    this.container.style.display = "block";
  }

  hide() {
    this.container.style.display = "none";
  }

  // Cleanup
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
