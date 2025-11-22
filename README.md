# Devlog Entry - 11/14/2025

## Introducing the Team
**Tool Lead:** Joshua
**Engine Lead:** Elijah 
**Design Lead:** Brody
**Test Lead:** Tina


## Tools and materials
### Engine:
- For our engine, we plan to use the Baseline web browser. We decided to use this platform since our team is unfamiliar with other engines/platforms to develop games without integrated 3D graphics and all of our established skills in javaScript already. 

### Language
- For the language, we will be using JavaScript 
- CSS & HTML for testing and possibly UI elements

### Tools: 
- **three.js** is a 3D library for JavaScript that utilizes the WebGL API. It handles scenes, rendering, objects, loaders for 3D models, and animations. This will be needed to utilize 3D objects that we make and to display them properly.
- **ammo.js** is a library for projectile collisions in 3D space. It handles physics simulation with gravity and mass, collision detection between objects, and rigid body dynamics. and can define joints, hinges, and other physical constraints between objects. We will use this to help with physics in 3 dimensions.
- **Blender** can be used to create 3D assets to be used in the game, and will be rendered with the help of three.js.
- Texturing can be done through readily available art programs like **Photoshop**, **Gimp**, **Krita**, etc.

### Generative AI: 
- Allowed uses: GitHub Copilot (in moderation). 
- Grey Area: Using it to help write specific functions or help spot code smells. Using it to suggest project overview and step-by-step planning.
- Restricted uses: Generative art or assets. Designing core game mechanics and level design. Using it for writing large blocks of code.
- AI can be used as an assistant to better our workflow but cannot be used to overly design, code, and structure our game. 

## Outlook
Our outlook for this project is to build a small point and click adventure game that uses 3D physics as a core puzzle mechanic. We are hoping to center the game around a pinball game with portals as our physics puzzle. We expect the hardest and riskiest part to be getting all the moving parts to work together smoothly: managing multiple scenes/rooms, interactive objects, and a physics puzzle, all while keeping performance reasonable in the browser. Overall scope management is something we have to keep in mind as well and focus on implementing the small areas that we can reliably build, test, release multiple times.

# Devlog Entry - 11/20/2025

## Progress Notes
*from collabarative session at noon with Joshua & Elijah*
- The repository has been initialized with all the files and libaries that we will need to start creating our game. The files that will contain most of our code are here:
    -  `index.html`: Created this file and included a title, group member names, and a scene container for the **Three.js** canvas.
    -  `boot.js`: Contains any imports and will also import assets in the future.
    -  `main.js`: Created a simple scene using **Three.js** with a static camera and no objects. This can be a starting point for the team to figure out how to use **Three.js** and to continue making progress on the game.
