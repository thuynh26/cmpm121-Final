# Plan

## Fullfill F1 Requirements

### Your team must deploy a small game prototype satisfying the following requirements

- [ ]It is built using a platform (i.e. engine, framework, language) that does not already provide support for 3D rendering and physics simulation.
- [ ]It uses a third-party 3D rendering library.
- [ ]It uses a third-party physics simulation library.
- [ ]The playable prototype presents the player with a simple physics-based puzzle.
  1. create invisible clickable zones so that the player can travel just by looking around clicking on their screen (google maps movement)
  2. Make a physics puzzle that is shooting a ball into hoop a failable due to missing but will respawn ball if failed

- [ ]The player is able to exert some control over the simulation in a way that allows them to succeed or fail at the puzzle.
- [ ]The game detects success or failure and reports this back to the player using the game's graphics.
- [ ]The codebase for the prototype must include some before-commit automation that helps developers, examples:
  Linting
  Autoformatting
  Blocking commits for code that does not pass typechecking or other build tests
- [ ]The codebase for the prototype must include some post-push automation that helps developers, examples:
  Automatic packaging and deployment to GitHub Pages or Itch.io
  Automatic screenshot generation using a headless browser
  Automatic interaction testing where a fixed sequence of input is executed to ensure the game reaches an expected state

Code Refactoring Plan for main.js

## Current State Analysis

- **Total Lines**: ~1,168 lines
- **Main Function Size**: 1,163 lines (God Function)
- **Existing Modules**: `RigidBody.js`, `worldInit.js`, `mobileControls.js`

---

## Code Smells Identified

### 1. **God Function** (Critical)

- The `init()` function does everything: scene setup, physics, room creation, input handling, game loop
- **Impact**: Hard to test, maintain, and understand

### 2. **Magic Numbers** (High Priority)

```javascript
// Examples found:
camera.position.set(0, 1.6, 5);
moveSpeed = 5;
new PerspectiveCamera(60, aspect, 0.1, 1000);
throwForce.multiplyScalar(200);
inventory.currentItemIndex = (index + 1) % length;
```

- **Impact**: Unclear meaning, hard to tune game balance

### 3. **Duplicate Code** (Medium Priority)

- Room creation logic repeated 3 times (room1, room2, room3)
- Door creation duplicated
- Physics body creation patterns repeated
- Color button creation repeated 4 times
- Collision checking logic duplicated

### 4. **Long Parameter Lists** (Medium)

```javascript
rbGround.createBox(0, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, {
  x: 20,
  y: 0,
  z: 20,
});
```

- **Impact**: Hard to remember parameter order

### 5. **Feature Envy** (Medium)

- `main.js` directly manipulates physics body internals
- Tight coupling with `RigidBody` implementation details

### 6. **Primitive Obsession** (Low-Medium)

```javascript
const inventory = { heldItems: [], currentItemIndex: 0 };
const moveState = { forward: false, back: false, left: false, right: false };
```

- **Impact**: No encapsulation of behavior

### 7. **Dead Code** (Low Priority)

```javascript
const sceneThree = new Scene(); // Created but unused
// Commented out targetWall2 code (lines 400-425)
```

### 8. **Inconsistent Naming** (Low Priority)

- `sceneTwo` vs `sceneThree`
- `isDoor` userData vs `objectType` pattern
- Mixed conventions for object creation

### 9. **Mixed Concerns** (High Priority)

- Game loop handles: physics, input, movement, inventory display, rendering
- Event handlers inline with setup code
- No separation between initialization and runtime logic

### 10. **Tight Coupling** (High Priority)

- Direct references to specific objects: `clickableSphere`, `targetWall`, `redCube`
- Hard to add/remove game objects without editing multiple places

---

## Refactoring Strategy

### Phase 1: Extract Constants (Low Risk, High Value)

**Goal**: Replace magic numbers with named constants

**Code Smells Addressed**: Magic Numbers

**Estimated Lines Saved**: ~0 (adds documentation value)

---

### Phase 2: Extract Room System (Medium Risk, High Value)

**Goal**: Move room creation and management to dedicated module

**Files to create**:

- `src/systems/RoomManager.js`

**Responsibilities**:

- Room creation and switching
- Room-specific object management
- Camera positioning per room

**Code Smells Addressed**: Duplicate Code, God Function, Mixed Concerns

**Estimated Lines Saved**: ~200-250 lines from main.js

---

### Phase 3: Extract Input System (Low Risk, High Value)

**Goal**: Consolidate all input handling (keyboard, mouse, mobile)

**Files to create**:

- `src/systems/InputManager.js`

**Responsibilities**:

- Keyboard state management
- Mouse click/look handling
- Integration with MobileControls
- Event listener management

**Code Smells Addressed**: God Function, Mixed Concerns, Duplicate Code

**Estimated Lines Saved**: ~150-200 lines from main.js

---

### Phase 4: Extract Inventory System (Low Risk, High Value)

**Goal**: Encapsulate inventory logic and rendering

**Files to create**:

- `src/systems/InventoryManager.js`

**Responsibilities**:

- Item storage and selection
- Item pickup/throw logic
- Inventory display/visibility
- Scroll wheel cycling

**Code Smells Addressed**: Primitive Obsession, God Function, Mixed Concerns

**Estimated Lines Saved**: ~100-150 lines from main.js

---

### Phase 5: Extract Object Factory (Medium Risk, Medium Value)

**Goal**: Centralize game object creation

**Files to create**:

- `src/factories/GameObjectFactory.js`

**Responsibilities**:

- Create pickable objects (spheres, cubes)
- Create color buttons with physics
- Create doors
- Create walls/floors
- Attach physics bodies automatically

**Code Smells Addressed**: Duplicate Code, Long Parameter Lists, Tight Coupling

**Estimated Lines Saved**: ~150-200 lines from main.js

---

### Phase 6: Extract Collision System (Medium Risk, Medium Value)

**Goal**: Handle collision detection and response

**Files to create**:

- `src/systems/CollisionManager.js`

**Responsibilities**:

- Collision detection loop
- Collision callbacks/handlers
- Game-specific collision rules (sphere + target wall)

**Code Smells Addressed**: Duplicate Code, God Function, Tight Coupling

**Estimated Lines Saved**: ~100-120 lines from main.js

---

### Phase 7: Extract Camera Controller (Low Risk, Medium Value)

**Goal**: Manage camera movement and look controls

**Files to create**:

- `src/systems/CameraController.js`

**Responsibilities**:

- Camera movement (WASD)
- Look controls (mouse drag)
- Joystick integration
- Camera positioning

**Code Smells Addressed**: God Function, Mixed Concerns

**Estimated Lines Saved**: ~80-100 lines from main.js

---

### Phase 8: Clean Up Dead Code (Low Risk, Low Value)

**Goal**: Remove unused/commented code

**Actions**:

- Remove `sceneThree`
- Remove commented `targetWall2`
- Remove unused variables

**Code Smells Addressed**: Dead Code

**Estimated Lines Saved**: ~30-50 lines from main.js

---

### Phase 9: Extract Game Loop (Medium Risk, High Value)

**Goal**: Separate game loop concerns

**Files to create**:

- `src/systems/GameLoop.js`

**Responsibilities**:

- Animation frame management
- Delta time calculation
- Update orchestration (physics → input → render)
- System coordination

**Code Smells Addressed**: God Function, Mixed Concerns

**Estimated Lines Saved**: ~100-150 lines from main.js

## Implementation Order (Recommended)

1. **Phase 1** - Constants (1 hour)
2. **Phase 3** - Input System (2 hours)
3. **Phase 4** - Inventory System (2 hours)
4. **Phase 7** - Camera Controller (1.5 hours)
5. **Phase 5** - Object Factory (2.5 hours)
6. **Phase 2** - Room Manager (3 hours)
7. **Phase 6** - Collision System (2 hours)
8. **Phase 9** - Game Loop (2 hours)
9. **Phase 8** - Dead Code Cleanup (0.5 hours)

**Total Estimated Time**: 16.5 hours

---

## Expected Results

### Before

- `main.js`: 1,168 lines
- Total files: 5

### After

- `main.js`: ~150-200 lines (85% reduction)
- Total files: 13
- Better testability
- Easier to add new features
- Clear separation of concerns
- Reusable components

---

## Testing Strategy

After each phase:

1. Run the game and verify functionality
2. Test input controls (keyboard, mouse, mobile)
3. Test room switching
4. Test inventory pickup/throw
5. Test collision detection
6. Check for console errors

---

## Risk Assessment

- **Low Risk**: Phases 1, 3, 4, 7, 8 (pure extraction, no logic changes)
- **Medium Risk**: Phases 2, 5, 6, 9 (some logic reorganization)
- **High Risk**: None (incremental approach mitigates risk)

---

## Notes

- Keep mobile controls as-is (already well-modularized)
- Keep physics system as-is (already modular)
- Each phase should be a separate commit
- Test thoroughly between phases
- Can stop at any phase if time-constrained
