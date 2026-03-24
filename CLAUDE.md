# CLAUDE.md — 8-Bit Duck Survival

This file documents the codebase structure, conventions, and development workflow for AI assistants contributing to this project.

## Project Overview

**8-Bit Duck Survival** is a retro-style browser game where a duck must navigate water and land while evading sharks and gators, surviving across increasingly difficult levels.

- **Tech stack**: Pure HTML5 Canvas + vanilla JavaScript + CSS, Web Audio API
- **Architecture**: Single-file application (`index.html`) — all HTML, CSS, and JavaScript in one file
- **Dependencies**: None — no npm, no build tools, no external libraries
- **Deployment**: GitHub Pages at https://thewizster.github.io/duckgame/
- **To play**: Open `index.html` in any modern browser — no server needed

## Repository Structure

```
duckgame/
├── index.html       # The entire game (HTML + CSS + JS, ~821 lines)
├── duckgame.jpg     # Reference sketch used during initial development
├── README.md        # Player-facing documentation
└── CLAUDE.md        # This file
```

There are no configuration files, build scripts, test suites, CI/CD pipelines, or dependency manifests.

## Development Workflow

### Running the game

```bash
# Open directly in a browser — no build or server required
open index.html           # macOS
xdg-open index.html       # Linux
start index.html          # Windows
```

### Making changes

1. Edit `index.html` directly — it is the single source of truth
2. Refresh the browser tab to see changes
3. Test manually by playing the game
4. Commit and push

### No build, lint, or test commands exist

There is no test suite. Quality assurance is done by manually playing the game after changes.

## Code Architecture

`index.html` is divided into three top-level sections: `<style>`, `<div>` (HTML UI), and `<script>`. All game logic is inside `<script>`. The script is structured top-to-bottom as follows:

| Lines (approx.) | Section | Description |
|-----------------|---------|-------------|
| 1–99            | HTML + CSS | Canvas container, HP bar, level display, burst charges UI |
| 100–244         | Audio Engine | `noteFreqs`, `playTone()`, `sfxJump/Burst/Die/Win()`, `startBackgroundMusic()` |
| 247–305         | Game State & Constants | Global state variables, physics constants, `duck` object, `enemy` object |
| 259–287         | High Score System | `loadHighScores()`, `saveHighScores()`, `isTopScore()`, `addHighScore()` |
| 307–352         | Enemy Initialization | Shark and gator setup with level-based speed scaling |
| 354–415         | Rendering Utilities | `drawPixelDuck()`, `drawPixelShark()`, `drawPixelGator()` |
| 417–528         | Physics & Collision | `updatePhysics()` — gravity, zone detection, AABB collision, HP logic |
| 530–734         | Draw Functions | `draw()` — background, water, platforms, sprites, HUD, state screens |
| 736–762         | Level & Game Management | `initLevel()`, `gameOver()`, win/loss transitions |
| 764–804         | Input Handling | `keydown` event listener, keyboard controls, mouse click |
| 806–817         | Game Loop | `loop()` via `requestAnimationFrame` |
| 819–821         | Bootstrap | `loadHighScores()` → `initLevel()` → `loop()` |

### Key objects and variables

```javascript
// Game state machine
gameState  // "START" | "PLAYING" | "WIN" | "ENTER_INITIALS" | "GAMEOVER"
level      // Current level number (starts at 1)
hp         // Player HP (0–100), persists across levels
maxHp      // Always 100
burstCharges  // Remaining burst uses, +1 per level completed
frameCount    // Increments every frame (~60/sec), used for timers

// Player
duck = { x, y, w:32, h:32, dy, dx:1.5, gravity:0.5, swimPower:-6, burstPower:-14, state }
// duck.state: 'ground' | 'water' | 'air'

// Enemies
enemy = { shark: { x, y, w, h, speed, dir }, gator: { x, y, w, h, speed, dir, canJump, jumpTimer } }
```

### Canvas coordinate system

- Canvas size: 800×500 px
- Water zone: Y 150–650 px horizontally, water surface at Y ≈ 370 px
- Left land: X 0–150 px
- Right land (win zone): X 650–800 px
- Win condition: duck reaches X > 670

## Coding Conventions

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `gameState`, `waterTime`, `burstCharges` |
| Constants | SCREAMING_SNAKE_CASE | `HP_GAIN_INTERVAL`, `COLLISION_DAMAGE` |
| Functions | camelCase verbs | `updatePhysics()`, `drawPixelDuck()`, `initLevel()` |
| Objects | lowercase nouns | `duck`, `enemy` |
| Classes | N/A — none used | — |

### Style

- **Indentation**: 4 spaces
- **Quotes**: Single quotes in JavaScript, double quotes in HTML attributes
- **Semicolons**: Used inconsistently — follow surrounding code
- **Programming style**: Imperative, procedural — direct state mutation, no functional patterns, no classes or modules
- **Comments**: Sparse; only add comments for non-obvious logic

### Anti-patterns to avoid

- Do not introduce external dependencies or a build system
- Do not split into multiple files — keep everything in `index.html`
- Do not add a framework (React, Vue, etc.)
- Do not add TypeScript or a transpiler
- Do not add automated tests (there is no test runner)

## Game Mechanics Reference

### Physics constants

```javascript
duck.gravity   = 0.5    // Applied every frame
duck.swimPower = -6     // dy on SPACE press (jump/swim)
duck.burstPower = -14   // dy on SHIFT press (burst flight)
duck.dx        = 1.5    // Constant horizontal drift right
```

### Health system

- Max HP: 100, starting HP: 100
- Damage per hit: 25 HP + 50px knockback
- Regen: +10 HP every 60 frames (~1 sec) while on water
- HP persists across levels (no reset between levels)
- `HP_GAIN_INTERVAL = 60` frames

### Level progression

- Complete a level: reach X > 670 → `level++`, `burstCharges++`
- Enemy shark speed: `1.0 + (level * 0.2)`, capped at 5
- Gators gain jump ability at `level > 1`
- No level cap

### High score system

- Stored in `localStorage` under key `'duckGameHighScores'`
- Top 5 records of `{ initials: string, level: number }`
- Triggered when `level > lowestTopScore` on game over
- Entry via arcade-style 3-letter initials (arrow keys + ENTER)

### Audio

- Background music: 8-note C-major loop with bassline using `setInterval`
- SFX: Procedurally generated with Web Audio API (square/sawtooth/sine waves)
- `audioCtx` is initialized on first user interaction (browser policy)
- `isMusicPlaying` guards against duplicate music loops

## Adding New Features — Guidelines

### Adding a new game mechanic

1. Define any new constants near the top of `<script>` with other constants (`HP_GAIN_INTERVAL`, etc.)
2. Add state variables near the existing state block (lines ~247–305)
3. Add logic to `updatePhysics()` for per-frame behavior
4. Add rendering to `draw()` for visual representation
5. Reset the mechanic in `initLevel()` if it should reset between levels

### Adding a new enemy

1. Add its properties to the `enemy` object
2. Add initialization in `initLevel()` or enemy setup section (~307–352)
3. Add `drawPixel<EnemyName>()` render function following the pattern of `drawPixelShark()`
4. Add collision detection in `updatePhysics()` following the shark/gator pattern
5. Call the draw function inside `draw()`

### Adding a new sound effect

1. Add a function `sfxName()` following the pattern of `sfxJump()`, `sfxBurst()`, etc.
2. Call it from the appropriate game event in `updatePhysics()` or input handler

### Modifying the UI

- The HP bar, level counter, and burst charges are HTML elements updated via `document.getElementById()`
- Canvas drawings (scoreboard, win/game-over screens) are in `draw()` using the canvas 2D context

## Git Conventions

Commit messages follow an imperative, descriptive style based on the project history:

```
Implement HP reward system with water-based regeneration and persistence
Add high score system with saving and displaying functionality
Update README with correct file name and enhanced play instructions
Enhanced audio engine (added high notes, safety checks, sound effects)
```

- One feature/fix per commit
- No ticket numbers or prefixes (no `feat:` / `fix:` / etc.)
- Describe *what* was done and *why* when relevant
