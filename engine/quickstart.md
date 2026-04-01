# Engine Quickstart Guide

A composable, zero-dependency TypeScript game engine for browser-based 2D games.
Canvas rendering, Web Audio synthesis, physics, particles, ECS, and more — use only what you need.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Hello World — Minimal Game](#hello-world--minimal-game)
3. [Scenes](#scenes)
4. [Input](#input)
5. [Rendering](#rendering)
6. [Pixel-Art Sprites](#pixel-art-sprites)
7. [Physics](#physics)
8. [Audio — Sound Effects](#audio--sound-effects)
9. [Audio — Music](#audio--music)
10. [Particles](#particles)
11. [Camera](#camera)
12. [Procedural World Generation](#procedural-world-generation)
13. [HUD and Toasts](#hud-and-toasts)
14. [Persistent Storage](#persistent-storage)
15. [Math Utilities](#math-utilities)
16. [Entity Component System (ECS)](#entity-component-system-ecs)
17. [Module Reference](#module-reference)

---

## Project Setup

The engine is pure TypeScript with zero runtime dependencies. You need a TypeScript compiler and a bundler that can resolve imports.

**Minimal `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": ".",
    "lib": ["ES2020", "DOM"]
  },
  "include": ["engine/**/*.ts", "src/**/*.ts"]
}
```

**HTML shell** (all you need to start):

```html
<!DOCTYPE html>
<html>
<head><title>My Game</title></head>
<body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; height:100vh;">
  <canvas id="game" style="image-rendering:pixelated;"></canvas>
  <script type="module" src="dist/main.js"></script>
</body>
</html>
```

---

## Hello World — Minimal Game

```ts
import { Engine, Scene } from '../engine';

const game: Scene = {
    name: 'game',

    enter(engine) {
        engine.renderer.clear('#1a1a2e');
    },

    update(engine, dt) {
        // Game logic runs here every frame
        // dt = seconds since last frame
    },

    draw(engine) {
        const r = engine.renderer;
        r.clear('#1a1a2e');
        r.fillText('Hello World!', 400, 250, '#ffe066', 'bold 32px Courier New', 'center');
    },
};

const engine = new Engine({ canvas: '#game', width: 800, height: 500 });
engine.scenes.add(game);
engine.scenes.switch('game');
engine.start();
```

That's it. The `Engine` creates and wires all subsystems automatically — renderer, audio, input, timer, and scene manager.

---

## Scenes

Scenes represent discrete game states: title screen, gameplay, pause menu, game over.

```ts
import { Engine, Scene } from '../engine';

const titleScene: Scene = {
    name: 'title',

    enter(engine) {
        // Called once when this scene becomes active
    },

    update(engine, dt) {
        if (engine.input.anyKeyPressed()) {
            engine.scenes.switch('gameplay');
        }
    },

    draw(engine) {
        engine.renderer.clear('#080818');
        engine.renderer.fillText('PRESS ANY KEY', 400, 250, '#fff', '18px Courier New', 'center');
    },

    exit(engine) {
        // Called when switching away from this scene
    },
};

const gameplayScene: Scene = {
    name: 'gameplay',
    enter(engine) { /* set up level */ },
    update(engine, dt) { /* game loop */ },
    draw(engine) { /* render world */ },
};

// Register and switch
engine.scenes.add(titleScene).add(gameplayScene);
engine.scenes.switch('title');
```

**Scene stacking** (overlays like pause menus):

```ts
// Push pauses the current scene and activates the new one
engine.scenes.push('pause');

// Pop exits the overlay and resumes the scene below
engine.scenes.pop();
```

---

## Input

The `InputManager` tracks keyboard, mouse, and touch state with frame-accurate pressed/held/released detection.

```ts
update(engine, dt) {
    const input = engine.input;

    // Direct key queries
    if (input.keyPressed('Space'))    jump();      // true only the frame it was pressed
    if (input.keyHeld('ArrowRight'))  moveRight();  // true every frame while held
    if (input.keyReleased('KeyX'))    stopFiring();

    // Mouse
    if (input.mousePressed(0)) shoot(input.mousePosition);

    // Touch
    if (input.touchStarted()) {
        for (const touch of input.getTouches()) {
            handleTouch(touch.position);
        }
    }
}
```

**Action bindings** — map game actions to multiple physical inputs:

```ts
enter(engine) {
    engine.input
        .bindAction('jump', ['Space', 'ArrowUp', 'KeyW'])
        .bindAction('burst', ['ShiftLeft', 'ShiftRight']);
}

update(engine, dt) {
    if (engine.input.actionPressed('jump'))  doJump();
    if (engine.input.actionPressed('burst')) doBurst();
}
```

---

## Rendering

The `Renderer` wraps the Canvas 2D API with convenience methods.

```ts
draw(engine) {
    const r = engine.renderer;

    // Background
    r.clear('#1a1a2e');
    r.fillGradientV(0, 0, 800, 500, '#2a6fc9', '#5c9fec');

    // Shapes
    r.fillRect(100, 200, 60, 40, '#8B4513');
    r.strokeRect(100, 200, 60, 40, '#a0622a', 2);
    r.fillCircle(400, 250, 20, '#f5c842');

    // Text
    r.fillText('Score: 1250', 10, 30, '#ffe066', 'bold 14px Courier New');
    r.fillTextShadow('GAME OVER', 400, 250, '#ff3333', '#880000', 3, 'bold 66px Courier New', 'center');

    // Animated wave line (water surface, lava, etc.)
    r.waveLine(0, 330, 800, 4, 0.038, engine.timer.frameCount, '#5ab4ff', 3);

    // Semi-transparent overlay
    r.overlay('rgba(0,0,0,0.5)');
}
```

---

## Pixel-Art Sprites

Define sprites as character grids — no image files needed.

```ts
import { SpriteBuilder, SpriteAnimation } from '../engine';

// Define a sprite with a character palette
const duckSprite = new SpriteBuilder(8, 7)
    .palette({ Y: '#f5c842', E: '#111111', O: '#e07820', W: '#ffffff', '.': '' })
    .row('..YYYY..')
    .row('.YYYYYY.')
    .row('YYEWYYYY')
    .row('YYYYYOOO')
    .row('.YYYYYY.')
    .row('..YYYY..')
    .row('.OO..OO.')
    .build(4);  // 4x scale → 32x28 pixel canvas

// Draw it
ctx.drawImage(duckSprite, x, y);
```

**Multi-line string syntax** (great for larger sprites):

```ts
const sharkSprite = new SpriteBuilder(10, 5)
    .palette({ G: '#808898', D: '#6a7280', W: '#ffffff', B: '#000', T: '#fff', '.': '' })
    .fromString(`
...DDD....
GGGGGGGGG.
GGGGGWBGG.
GGGGGGGGGG
.GG....GG.
`)
    .build(4);
```

**Animation:**

```ts
// Build frames for each animation state
const walkFrames = [frame1, frame2, frame3].map(img => ({ image: img, duration: 0.15 }));
const walkAnim = new SpriteAnimation(walkFrames);

// Or with uniform timing
const idleAnim = SpriteAnimation.uniform([idle1, idle2], 0.3);

// Update and draw
walkAnim.update(dt);
ctx.drawImage(walkAnim.image, x, y);
```

---

## Physics

The physics system handles gravity, velocity, AABB collision detection, and environmental zones.

```ts
import { PhysicsWorld, Body, Vector2 } from '../engine';

// Create the world
const physics = new PhysicsWorld();
physics.gravity = new Vector2(0, 450); // pixels/sec^2

// Create bodies
const player = new Body(150, 200, 32, 32, 'dynamic');
player.tag = 'player';
player.maxFallSpeed = 12;

const platform = new Body(100, 300, 200, 14, 'static');
platform.tag = 'platform';

physics.addBody(player);
physics.addBody(platform);

// Collision callbacks
physics.onCollision('player', 'enemy', (result) => {
    if (result.bodyA.velocity.y < -200) {
        // Player stomped the enemy
        killEnemy(result.bodyB);
    } else {
        takeDamage();
    }
});

// Environmental zones
physics.addZone({
    name: 'water',
    y: 330,              // zone starts below this Y
    gravityScale: 0.16,  // reduced gravity in water
    maxFallSpeed: 2,     // slow sinking
    damagePerSecond: 0,
    lethal: false,
});

physics.addZone({
    name: 'lava',
    y: 370,
    gravityScale: 1,
    maxFallSpeed: 12,
    damagePerSecond: 0,
    lethal: true,        // instant death on contact
});

// In update
function update(dt: number) {
    // Apply forces
    if (jumpPressed) player.impulse(new Vector2(0, -8));
    player.velocity = new Vector2(moveSpeed, player.velocity.y);

    // Step simulation
    physics.update(dt);
}
```

**Body types:**
- `'dynamic'` — affected by gravity and collisions (player, enemies)
- `'static'` — immovable (platforms, walls)
- `'kinematic'` — moves by velocity but ignores gravity (moving platforms)
- `'sensor'` — detects overlap but doesn't resolve (triggers, pickups)

**Collision layers** for filtering:

```ts
import { CollisionLayers } from '../engine';

player.layer = CollisionLayers.PLAYER;
player.mask = CollisionLayers.ENEMY | CollisionLayers.PLATFORM;

enemy.layer = CollisionLayers.ENEMY;
enemy.mask = CollisionLayers.PLAYER;
```

---

## Audio — Sound Effects

All audio is procedurally synthesised from oscillators — no audio files needed.

```ts
import { sfx, CommonSfx } from '../engine';

// Use pre-built common SFX
engine.audio.init();  // Must happen after a user gesture (click/keypress)
engine.audio.playSfx(CommonSfx.jump);
engine.audio.playSfx(CommonSfx.hit);
engine.audio.playSfx(CommonSfx.collect);
engine.audio.playSfx(CommonSfx.die);

// Available presets: jump, burst, hit, die, collect, upgrade,
//                    kill, heal, alert, menuSelect, menuConfirm
```

**Build custom SFX** with the fluent builder:

```ts
// Two-tone chirp (up)
const jumpSfx = sfx()
    .chirp(260, 360, 0.08, 'square', 0.10, 0.07)
    .build();

// Descending tones (death)
const deathSfx = sfx()
    .descending([380, 280, 200, 130, 90], 0.14, 'sawtooth', 0.11, 0.11)
    .build();

// Ascending arpeggio (power-up)
const powerUpSfx = sfx()
    .ascending([523, 659, 784, 1047], 0.11, 'square', 0.09, 0.09)
    .build();

// Layered chord hit
const impactSfx = sfx()
    .chord([140, 80], 0.18, 'sawtooth', 0.12)
    .build();

// Play it
engine.audio.playSfx(jumpSfx);
```

**Direct tone control** for one-off sounds:

```ts
engine.audio.beep(440, 0.1, 'square', 0.08);
engine.audio.sweep(800, 100, 0.3, 'sawtooth', 0.1);
engine.audio.noise(0.15, 0.06);  // White noise burst
engine.audio.arpeggio([262, 330, 392, 523], 0.1, 'square', 0.08);
```

**Volume controls:**

```ts
engine.audio.masterVolume = 0.8;  // 0–1
engine.audio.sfxVolume = 0.7;
engine.audio.musicVolume = 0.5;
engine.audio.toggleMute();
```

---

## Audio — Music

The `Sequencer` plays looping multi-track music themes built from note sequences.

```ts
import { Sequencer, track, theme, Notes } from '../engine';

const seq = new Sequencer(engine.audio);

// Define a theme with melody + bass tracks
const oceanTheme = theme([
    track(
        [Notes.C4, Notes.E4, Notes.G4, Notes.E4, Notes.C5, Notes.G4, Notes.E4, Notes.C4],
        { waveType: 'square', volume: 0.07 }
    ),
    track(
        [Notes.C3, null, Notes.G3, null, Notes.C3, null, Notes.E3, null],
        { waveType: 'triangle', volume: 0.05, octaveShift: -1 }
    ),
], 140, 'Ocean Shore');  // 140ms per step

// Play
seq.play(oceanTheme);

// Switch themes with crossfade
seq.crossfadeTo(swampTheme, 1.0);  // 1 second fade

// Stop
seq.stop();
```

**Music theory helpers:**

```ts
import { Notes, chord, Chords, Scales, scale, noteFreq } from '../engine';

Notes.C4;   // 261.63 Hz
Notes.A4;   // 440.00 Hz
Notes.Fs3;  // F#3 (sharps use "s" suffix)

// Build chords
chord(Notes.C4, Chords.major);      // [C4, E4, G4]
chord(Notes.A3, Chords.minor7);     // [A3, C4, E4, G4]

// Generate scales
scale(Notes.C4, Scales.pentatonicMinor, 2);  // two octaves

// Runtime lookup
noteFreq('C', 4);  // 261.63
```

---

## Particles

High-performance particle system with configurable emitters and presets.

```ts
import { ParticleSystem, ParticlePresets } from '../engine';

const particles = new ParticleSystem();

// Use presets
particles.emit(ParticlePresets.explosion(400, 300));
particles.emit(ParticlePresets.splash(200, 330, '#5ab4ff'));
particles.emit(ParticlePresets.feathers(150, 200));
particles.emit(ParticlePresets.collectGlow(350, 250));
particles.emit(ParticlePresets.burst(100, 180));

// Available presets: splash, explosion, feathers, collectGlow, burst, snow, ember

// Custom emitter
particles.emit({
    x: 400, y: 300,
    count: 20,
    speed: [1, 5],
    angle: [0, Math.PI * 2],
    life: [20, 40],
    colors: ['#ff6600', '#ffaa00', '#ffdd00'],
    size: [2, 5],
    gravity: 0.12,
    fadeOut: true,
    shrink: false,
});

// In update loop
particles.update();

// In draw
particles.draw(ctx);
// Or with camera offset
particles.drawWithOffset(ctx, cameraX, cameraY);
```

---

## Camera

Smooth-follow camera with deadzone, shake, zoom, and parallax support.

```ts
import { Camera, drawParallaxLayers } from '../engine';

const camera = new Camera(800, 500);
camera.followSmoothing = 5;
camera.deadzone = { width: 40, height: 20 };

// In update
camera.follow(new Vector2(player.x, player.y), dt);
camera.update(dt);

// Screen shake on damage
camera.shake(10, 0.3);  // 10px intensity, 0.3 seconds

// In draw — apply camera transform
camera.applyToContext(ctx);
// ... draw world objects ...
ctx.restore();

// Draw HUD after restoring (screen-space, not world-space)
hud.draw(ctx);
```

**Parallax backgrounds:**

```ts
const layers = [
    {
        speedX: 0.1,
        draw: (ctx, offsetX) => {
            // Distant clouds
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(offsetX % 800, 30, 90, 22);
        },
    },
    {
        speedX: 0.3,
        draw: (ctx, offsetX) => {
            // Midground hills
            ctx.fillStyle = '#3a7a22';
            ctx.fillRect(offsetX % 1000, 400, 1000, 100);
        },
    },
];

drawParallaxLayers(ctx, layers, camera);
```

**Coordinate conversion:**

```ts
const worldPos = camera.screenToWorld(input.mousePosition);
const screenPos = camera.worldToScreen(enemyPosition);
const visibleArea = camera.getViewRect();
if (camera.isVisible(enemyRect)) drawEnemy();
```

---

## Procedural World Generation

The `WorldGenerator` manages cursors that spawn objects ahead of the camera for endless/scrolling games.

```ts
import { WorldGenerator, cullBehind, Random } from '../engine';

const rng = new Random(42);  // Seeded for deterministic levels
const gen = new WorldGenerator(rng);

// Register generators
gen.register('platform', {
    spacing: [85, 180],
    startOffset: 400,
    generator: (cursorX) => ({
        x: cursorX,
        y: rng.between(180, 315),
        width: rng.between(80, 200),
        height: 14,
    }),
});

gen.register('enemy', {
    spacing: [360, 640],
    startOffset: 700,
    generator: (cursorX) => ({
        x: cursorX,
        type: rng.pick(['shark', 'gator', 'seagull']),
        speed: 1.2 + distance * 0.00008,
    }),
});

gen.register('collectible', {
    spacing: [170, 330],
    startOffset: 380,
    generator: (cursorX) => ({
        x: cursorX,
        type: rng.chance(0.78) ? 'fish' : 'heart',
        y: rng.between(200, 350),
    }),
});

// Each frame: advance generators and cull behind camera
const aheadX = cameraX + 950;
const newPlatforms   = gen.advance<Platform>('platform', aheadX);
const newEnemies     = gen.advance<Enemy>('enemy', aheadX);
const newCollectibles = gen.advance<Collectible>('collectible', aheadX);

platforms.push(...newPlatforms);
enemies.push(...newEnemies);
collectibles.push(...newCollectibles);

// Cull objects behind camera
platforms    = cullBehind(platforms, cameraX, 400);
enemies      = cullBehind(enemies, cameraX, 400);
collectibles = cullBehind(collectibles, cameraX, 400);
```

---

## HUD and Toasts

**HUD** — canvas-rendered health bars, counters, and icon rows (no DOM):

```ts
import { HUD, ToastManager } from '../engine';

const hud = new HUD();

// Health bar with colour thresholds
hud.addBar('hp', {
    x: 10, y: 10, width: 200, height: 20,
    fgColor: '#2ecc71',
    thresholds: [
        { percent: 30, color: '#e74c3c' },
        { percent: 60, color: '#f1c40f' },
    ],
    label: 'HP',
});

// Score counter
hud.addCounter('distance', { x: 700, y: 20, suffix: 'm', color: '#ffe066', align: 'right' });
hud.addCounter('score', { x: 400, y: 20, prefix: 'Score: ', align: 'center' });

// Burst charge icons
hud.addIconRow('bursts', { x: 10, y: 40, spacing: 4 });

// Update values each frame
hud.setBar('hp', player.hp, player.maxHp);
hud.setCounter('distance', Math.floor(distance / 10));
hud.setIcons('bursts', Array(player.burstCharges).fill('\u26A1'));

// Draw (after restoring camera transform — HUD is screen-space)
hud.draw(ctx);
```

**Toasts** — popup notifications:

```ts
const toasts = new ToastManager();

// Show notifications
toasts.show('Entering: Deep Swamp', undefined, 3.5);
toasts.show('ACHIEVEMENT: First Splash', 'Complete your first run', 4);

// Styled toast
toasts.showConfig({
    text: 'BOSS INCOMING',
    sub: 'Prepare yourself!',
    duration: 5,
    bgColor: 'rgba(80,0,0,0.92)',
    borderColor: '#ff3333',
    textColor: '#ff3333',
});

// Update and draw each frame
toasts.update(dt);
toasts.draw(ctx, 800);  // screenWidth
```

---

## Persistent Storage

Type-safe `localStorage` wrapper for saves, settings, and high scores.

```ts
import { GameStorage, HighScoreTable } from '../engine';

// Define your save data shape
interface MetaData {
    bestDistance: number;
    totalRuns: number;
    achievements: string[];
    settings: { musicVolume: number; sfxVolume: number };
}

const meta = new GameStorage<MetaData>('myGame_meta', {
    bestDistance: 0,
    totalRuns: 0,
    achievements: [],
    settings: { musicVolume: 1, sfxVolume: 1 },
});

// Read
console.log(meta.data.bestDistance);

// Write
meta.data.bestDistance = 1500;
meta.data.totalRuns++;
meta.save();

// Shorthand: update and auto-save
meta.update({ bestDistance: 2000 });

// Reset to defaults
meta.reset();
```

**High score table:**

```ts
const scores = new HighScoreTable('myGame_scores', 5);  // top 5

if (scores.isTopScore(currentScore)) {
    scores.add('AAA', currentScore, { biome: 'Arctic' });
}

for (const entry of scores.entries) {
    console.log(`${entry.name}: ${entry.score}`);
}
```

---

## Math Utilities

**Vector2** — immutable 2D vector with full arithmetic:

```ts
import { Vector2 } from '../engine';

const pos = new Vector2(100, 200);
const vel = new Vector2(3, -8);
const next = pos.add(vel.mul(dt));
const dist = pos.distanceTo(target);
const dir = target.sub(pos).normalize();
const reflected = vel.reflect(surfaceNormal);
const lerped = Vector2.lerp(a, b, 0.5);

// Static constants
Vector2.ZERO;   // (0, 0)
Vector2.UP;     // (0, -1)
Vector2.RIGHT;  // (1, 0)
```

**Rect** — axis-aligned bounding box:

```ts
import { Rect } from '../engine';

const box = new Rect(100, 200, 32, 32);
box.overlaps(other);
box.containsPoint(new Vector2(110, 210));
const hit = box.overlapsWithInset(enemy, 4);  // shrink by 4px per side
```

**Random** — seeded PRNG for deterministic generation:

```ts
import { Random, random } from '../engine';

// Global non-deterministic instance
random.between(1, 10);
random.int(0, 5);
random.chance(0.3);  // 30% true
random.pick(['shark', 'gator', 'eel']);
random.shuffle(array);
random.angle();      // 0 to 2*PI
random.gaussian();   // normal distribution

// Seeded for replays
const rng = new Random(42);
rng.between(0, 100);  // always same sequence for seed 42
```

**Timer and Cooldown:**

```ts
import { Cooldown } from '../engine';

const fireCooldown = new Cooldown(0.25);  // 250ms between shots

// In update
fireCooldown.tick(dt);
if (input.actionPressed('fire') && fireCooldown.ready) {
    fireCooldown.trigger();
    shootBullet();
}
```

---

## Entity Component System (ECS)

For games that need flexible entity composition over rigid class hierarchies.

```ts
import { Component, Entity, System, EcsWorld } from '../engine';

// Define components (pure data)
class Position extends Component {
    x = 0;
    y = 0;
}

class Velocity extends Component {
    dx = 0;
    dy = 0;
}

class Health extends Component {
    hp = 100;
    maxHp = 100;
}

// Define systems (logic)
class MovementSystem extends System {
    name = 'movement';
    priority = 10;

    update(world: EcsWorld, dt: number): void {
        for (const entity of world.query(Position, Velocity)) {
            const pos = entity.get(Position)!;
            const vel = entity.get(Velocity)!;
            pos.x += vel.dx * dt;
            pos.y += vel.dy * dt;
        }
    }
}

// Wire it up
const world = new EcsWorld();
world.addSystem(new MovementSystem());

// Spawn entities
const player = world.spawn('player');
player.add(new Position()).add(new Velocity()).add(new Health());

const enemy = world.spawn('enemy');
enemy.add(new Position()).add(new Velocity()).add(new Health());

// In update
world.update(dt);
```

The ECS is optional — you can use plain objects and arrays if your game is simple enough.

---

## Module Reference

Every module works independently. Import only what you need.

| Module | Key Exports | Purpose |
|--------|-------------|---------|
| **Core** | `Engine`, `EventBus`, `SceneManager`, `Timer`, `Cooldown` | Game loop, scenes, events, timing |
| **Math** | `Vector2`, `Rect`, `Random` | Geometry, collision rects, seeded RNG |
| **Audio** | `AudioEngine`, `Sequencer`, `SfxBuilder`, `sfx`, `CommonSfx`, `Notes` | Procedural audio synthesis and music |
| **Input** | `InputManager` | Keyboard, mouse, touch, action bindings |
| **Renderer** | `Renderer`, `Camera`, `SpriteBuilder`, `SpriteAnimation` | Canvas 2D drawing, camera, pixel art |
| **Physics** | `Body`, `PhysicsWorld`, `SpatialGrid`, `CollisionLayers` | Gravity, AABB collision, zones |
| **ECS** | `Entity`, `Component`, `System`, `EcsWorld` | Entity component system |
| **Particles** | `ParticleSystem`, `ParticlePresets` | Configurable particle effects |
| **UI** | `HUD`, `ToastManager` | Canvas HUD elements, notifications |
| **World** | `WorldGenerator`, `ObjectPool`, `cullBehind`, `scrollWrap` | Procedural generation, pooling |
| **Storage** | `GameStorage`, `HighScoreTable` | localStorage persistence |

All exports are available from the root barrel:

```ts
import { Engine, Scene, Body, PhysicsWorld, sfx, Notes, ... } from '../engine';
```

---

## Putting It All Together

Here is a skeleton showing how the modules compose into a complete game loop:

```ts
import {
    Engine, Scene, Body, PhysicsWorld, Vector2,
    ParticleSystem, ParticlePresets, Sequencer, track, theme, Notes,
    CommonSfx, sfx, Camera, HUD, ToastManager,
    WorldGenerator, cullBehind, Random,
    SpriteBuilder, GameStorage, HighScoreTable,
} from '../engine';

// Persistent data
const meta = new GameStorage<{ bestScore: number }>('mygame', { bestScore: 0 });
const scores = new HighScoreTable('mygame_scores', 5);

// Subsystems
const physics = new PhysicsWorld();
const particles = new ParticleSystem();
const camera = new Camera(800, 500);
const hud = new HUD();
const toasts = new ToastManager();
const rng = new Random();
const gen = new WorldGenerator(rng);

let sequencer: Sequencer;

const gameplay: Scene = {
    name: 'gameplay',

    enter(engine) {
        sequencer = new Sequencer(engine.audio);

        engine.input
            .bindAction('jump', ['Space', 'ArrowUp'])
            .bindAction('burst', ['ShiftLeft', 'ShiftRight']);

        hud.addBar('hp', { x: 10, y: 10, width: 200, height: 16, fgColor: '#2ecc71' });
        hud.addCounter('score', { x: 400, y: 20, align: 'center', color: '#ffe066' });

        physics.gravity = new Vector2(0, 450);
        // ... set up player body, platforms, enemies, zones ...
    },

    update(engine, dt) {
        const input = engine.input;

        if (input.actionPressed('jump'))  playerJump();
        if (input.actionPressed('burst')) playerBurst();

        physics.update(dt);
        particles.update();
        camera.follow(new Vector2(player.x, player.y), dt);
        camera.update(dt);
        toasts.update(dt);

        // Generate world ahead, cull behind
        const ahead = camera.position.x + 950;
        platforms.push(...gen.advance('platform', ahead));
        platforms = cullBehind(platforms, camera.position.x);

        hud.setBar('hp', player.hp, player.maxHp);
        hud.setCounter('score', Math.floor(distance));
    },

    draw(engine) {
        const r = engine.renderer;
        const ctx = r.ctx;

        r.clear('#1a1a2e');

        // World-space drawing
        camera.applyToContext(ctx);
        drawPlatforms(r);
        drawEnemies(r);
        drawPlayer(r);
        particles.draw(ctx);
        ctx.restore();

        // Screen-space HUD
        hud.draw(ctx);
        toasts.draw(ctx, 800);
    },
};

const engine = new Engine({ canvas: '#game', width: 800, height: 500 });
engine.scenes.add(gameplay);
engine.scenes.switch('gameplay');
engine.start();
```

Every subsystem is optional. Building a simple game? Use just `Engine`, `Scene`, and `InputManager`. Building an endless runner? Add `PhysicsWorld`, `WorldGenerator`, `Camera`, and `ParticleSystem`. The engine scales with your game's complexity.
