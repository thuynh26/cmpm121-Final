# Plan

## Fullfill F1 Requirements

### Your team must deploy a small game prototype satisfying the following requirements:

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
