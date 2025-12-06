// Game configuration constants
// All magic numbers extracted from main.js for better maintainability

// =============== COLORS ===============
export const Colors = {
  SKY_BLUE: 0x87CEEB,
  GREEN: 0x00FF00,
  FOREST_GREEN: 0x228B22,
  GRAY: 0x444444,
  WALL_GRAY: 0x6b6b6b,
  WALL_PURPLE: 0x8888aa,
  DOOR_BLUE: 0x3366ff,
  RED: 0xff0000,
  LIGHT_RED: 0xFF7276,
  TARGET_RED: 0xf01b0c,
  YELLOW: 0xffff00,
  BLUE: 0x0000ff,
  WHITE: 0xffffff,
  EMISSIVE_RED: 0x440000,
  EMISSIVE_GREEN: 0x004400,
  EMISSIVE_BLUE: 0x000044,
  EMISSIVE_YELLOW: 0x444400,
};

// =============== CAMERA ===============
export const Camera = {
  FOV: 60,
  NEAR_PLANE: 0.1,
  FAR_PLANE: 1000,
  INITIAL_HEIGHT: 1.6,
  INITIAL_DISTANCE: 5,
  ROOM2_INITIAL_DISTANCE: 8,
  LOOK_SENSITIVITY: 0.004,
  MAX_PITCH: Math.PI / 2,
  MIN_PITCH_OFFSET: 0.01,
};

// =============== LIGHTING ===============
export const Lighting = {
  AMBIENT_INTENSITY: 0.6,
  DIRECTIONAL_INTENSITY: 0.8,
  DIRECTIONAL_POSITION: { x: 5, y: 10, z: 7.5 },
};

// =============== PHYSICS ===============
export const Physics = {
  FIXED_TIMESTEP: 1.0 / 60.0, // 60 FPS physics
  MAX_SUBSTEPS: 10,
  MAX_DELTATIME: 0.1,
  GROUND_FRICTION: 1.0,
  GROUND_RESTITUTION: 0.2,
  OBJECT_FRICTION: 0.5,
  SPHERE_RESTITUTION: 0.6,
  CUBE_RESTITUTION: 0.7,
  WALL_FRICTION: 1.0,
  WALL_RESTITUTION: 0.001,
};

// =============== MOVEMENT ===============
export const Movement = {
  SPEED: 5,
  THROW_FORCE: 200,
  THROW_SPAWN_DISTANCE: 2,
};

// =============== INVENTORY DISPLAY ===============
export const InventoryDisplay = {
  FORWARD_DISTANCE: 1.5,
  RIGHT_OFFSET: 0.8,
  DOWN_OFFSET: -0.6,
};

// =============== RENDERER ===============
export const Renderer = {
  MAX_PIXEL_RATIO: 2,
};

export const darkThemePreference =
  globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
