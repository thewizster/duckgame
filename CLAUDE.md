# CLAUDE.md — Duck Games

This file documents the codebase structure, conventions, and development workflow for AI assistants contributing to this project.

## Project Overview

This repo hosts two single-file browser games starring the same pixel duck, plus a hub page to pick one:

- `index.html`: game-select hub (static page linking to both games)
- `duckrunendless.html`: **Duck Run: Endless**, documented in detail below
- `duckster.html`: **Duckster: Road Rage**, a separate go-kart racing roguelite with the same single-file approach (its own code, not covered here)

Each game page ends with a fixed "← choose a game" link back to the hub.

**Duck Run: Endless** is an infinite side-scrolling roguelite runner. The duck auto-runs right through five procedurally generated biomes, each ending in a boss fight; after the last boss the world loops back with higher difficulty. Upgrades, achievements, and unlockable starting ducks give runs depth and replay value.

The project is a showcase of what an AI-built, single-file, fully offline browser game can be.

- **Tech stack**: Pure HTML5 Canvas + vanilla JavaScript + CSS, Web Audio API
- **Architecture**: Each game is a single file (`duckrunendless.html` is ~3,200 lines): all HTML, CSS, and JavaScript in one file
- **Dependencies**: None — no npm, no build tools, no external libraries, no network requests
- **Deployment**: GitHub Pages at https://thewizster.github.io/duckgame/
- **To play**: Open `index.html` (hub) or `duckrunendless.html` directly in any modern browser — no server needed

## Repository Structure

```
duckgame/
├── index.html            # Game-select hub
├── duckrunendless.html   # Duck Run: Endless (HTML + CSS + JS)
├── duckster.html         # Duckster: Road Rage (HTML + CSS + JS)
├── duckgame.jpg          # Reference sketch used during initial development
├── README.md             # Player-facing documentation for both games
├── CLAUDE.md             # This file
└── .gitignore            # Ignores .claude/
```

There are no configuration files, build scripts, test suites, CI/CD pipelines, or dependency manifests.

## Development Workflow

1. Edit `duckrunendless.html` directly — it is the single source of truth for Duck Run
2. Refresh the browser tab to see changes
3. Verify (see below), then commit and push

### Verifying changes

There is no test suite. Useful checks:

```bash
# JS syntax check
node -e "const h=require('fs').readFileSync('duckrunendless.html','utf8');new Function(h.match(/<script>([\s\S]*)<\/script>/)[1]);console.log('ok')"
```

For behavioural checks, drive the game headlessly with Playwright (Chromium is pre-installed in cloud sessions; the module lives at `/opt/node-tools/node_modules/playwright`). Global `let`/`var`/`function` names are reachable via `page.evaluate('...')`, so tests can jump straight to a state, e.g. `duck.worldX = 200 + bossTriggerPx(2) + 10` to summon the Frost Yeti, or `while (boss) { boss.invuln = 0; hitBoss(); }` to finish a boss. Always collect `pageerror` events and finish by playing the game manually.

**Very large single edits have timed out in the past** — make changes in several focused edits rather than rewriting the whole file at once.

## Code Architecture

In `duckrunendless.html`, everything lives in one `<script>` block, organised into sections marked `// ==================== NAME ====================`. In order:

| Section | Contents |
|---|---|
| CANVAS SETUP / AUDIO ENGINE | `playTone()`, note table `N`, `BIOME_MUSIC` (index 5 = boss theme), `startMusic()/stopMusic()`, `sfx*()` functions |
| CONSTANTS | Physics (`GRAVITY`, `JUMP_POWER`, `BURST_POWER`, `SWIM_POWER`), speeds, `HIT_DAMAGE`, floor heights, `UPGRADE_EVERY_PX`, generation distances |
| BIOME / UPGRADE / ACHIEVEMENT DEFINITIONS | `BIOMES`, `UPGRADE_DEFS`, `ACHIEVEMENT_DEFS` data tables |
| UPGRADE ICONS | `ICON_PALETTE`, `ICON_ART` (8×8 pixel maps), `drawPixelIcon()`, `ICON_URLS` (pre-rendered data URLs for the HTML HUD) |
| STARTING ABILITY POOL | `ABILITY_POOL` (each entry has `unlock`: achievement id or null), `unlockedAbilities()`, `abilityUnlockedBy()` |
| META-PROGRESSION | `loadMeta()`, `saveMeta()`, `hasAchievement()`, `unlockAchievement()` (localStorage key `duckrun_meta`) |
| GAME STATE / UTILITY | Global state, the `duck` object, world arrays, helpers (`shuffleArray`, `wrapText`, `distMeters`, `biomeLabel`) |
| PARTICLE SYSTEM | `spawnParticle()` + effect helpers, ambient biome particles |
| BACKGROUND RENDERING | Per-biome parallax skies, `drawEnvironmentFloor()` (water/lava/ice/void) |
| PLATFORM GENERATION & DRAWING | `generatePlatforms()`, `cullPlatforms()`, `drawPlatforms()` |
| SPRITE DRAWING | `drawDuck()`, `_draw<Enemy>()` per enemy type, `drawEnemies()` |
| COLLECTIBLES | Generation, drawing, pickup/magnet logic (fish, hearts, feathers) |
| ENEMY SPAWNING / UPDATE | `spawnEnemies()` (scaled by lap), `updateEnemies()` (AI + collision), `hurtDuck(amount, drowning)` — the single place damage is applied (`drowning` bypasses shield/invincibility and knockback) |
| DUCK WATER FX | `drawDuckWaterFX()` — underwater tint and the air-bubble meter above the duck |
| BOSS SYSTEM / BOSS DRAWING | `BOSS_DEFS`, `COL_TYPES`, `checkBossTrigger()`, `spawnBoss()`, `updateBoss()` state machine, `hitBoss()`, `defeatBoss()`, `drawBoss*()` |
| PHYSICS | `updatePhysics()` — movement, gravity/buoyancy/diving, platforms, floors, breath and drowning, surface regen, Phoenix rebirth, death, triggers |
| HUD / BIOME TRANSITION / ACHIEVEMENTS | `updateHUD()` (HTML overlay), `checkBiomeTransition()`, `checkAchievements()` |
| RUN MANAGEMENT | `startRun()` (resets all run state), `gameOver()` |
| UPGRADE / ABILITY SELECTION, INPUT ACTIONS | `triggerUpgrade()`, `applyUpgrade()`, `selectAbility()`, `doJump()`, `doBurst()` |
| DRAW: screens | Title, ability pick, upgrade, death, toasts, pause overlay, achievements screen |
| UI BUTTONS | `drawButton()` registers clickable rects in `uiButtons` (rebuilt each frame) |
| STATE CHANGES | `openAchievements()`, `pauseGame()`, `resumeGame()`, `quitToTitle()` |
| INPUT | Keyboard, canvas click (buttons are hit-tested first), touch buttons |
| FIT TO SCREEN | `fitToScreen()` scales the whole 806×506 game container to the window (max 1.5×), leaving room for the hub link |
| GAME LOOP / BOOTSTRAP | `loop()` — per-state update + draw via `requestAnimationFrame` |

### State machine

```
TITLE ──any key──▶ ABILITY_PICK ──1/2/3──▶ PLAYING ⇄ UPGRADE (every 600m)
  │                                           ⇅ ESC/P
  └─A─▶ ACHIEVEMENTS ◀─A─ DEAD ◀──death──   PAUSED ──Q──▶ TITLE
```

`ACHIEVEMENTS` returns to whichever screen opened it (`achReturnState`).

### World and coordinates

- Canvas: 800×500. The duck is always drawn at screen X = `DUCK_SCREEN_X` (150).
- World objects (platforms, enemies, collectibles, boss column hazards) store `worldX`; screen X = `worldX - cameraX`, with `cameraX = duck.worldX - 150`.
- The boss and its projectiles live in **screen space** (`boss.x`, `bossShots[].x`).
- `distancePx` is world pixels travelled; metres = `distancePx / 10`. `BIOMES[].startDist` is in metres.
- Biome and boss positions are measured from `lapStartPx`, so they repeat each lap.

### Key objects

```javascript
duck = { worldX, y, w:32, h:32, dy, speed, state /* 'air'|'ground'|'water' */, hp, maxHp,
         burstCharges, invincible, shield, airJumps, maxAirJumps, swiftMode, phoenix, alive,
         breath, maxBreath, drownTimer, wasSubmerged }
boss = { idx, def, x, y, w, h, hp, maxHp, phase /* 0-2 */, state, timer, attackIdx, invuln, hitFlash }
// boss.state: intro → idle → (attack) → idle ... → swoop → dazed → return → idle; charges use windup → charging → return
meta = { bestDistance, totalRuns, achievements: [ids], diveHint }   // persisted
```

Run state (reset in `startRun()`): `fish`, `kills`, `distancePx`, `currentBiomeIdx`, `activeUpgrades`, `lap`, `lapStartPx`, `lapBosses`, `bossesBeaten`, `phoenixUsed`, world arrays.

## Game Mechanics Reference

- **Movement**: auto-run, speed rises from `BASE_SPEED` (2.5) to `MAX_SPEED` (6). SPACE jumps (ground) or swims (water); SHIFT bursts upward (uses a charge).
- **Combat**: a burst (`duck.dy < -7`) kills regular enemies on contact. Bosses take damage from bursts or from stomps while dazed.
- **Health**: 100 HP, 25 damage per hit (15 for Tough Duck), invincibility frames after a hit. Falling out of the Sky Kingdom is instant death.
- **Lava**: touching it calls `hurtDuck(LAVA_DAMAGE + lap * 5)` and always launches the duck with `LAVA_BOUNCE` (even while invincible), so it can't sit in the lava. The shield absorbs a touch as with any hit.
- **Biome entry**: when the new biome's floor is `lava` or `void`, `checkBiomeTransition()` adds a 640px ledge under the duck and lifts it onto it if needed, so the biome switch itself can never kill.
- **Water** (Ocean Shore and Deep Swamp): the duck is buoyant. A capped spring (`BUOYANCY`) pulls it to a float line with half its body underwater; drag is heavy underwater except on fast upward moves, so swim strokes and bursts still carry. Holding ↓/S (or the DIVE touch button, `touchDive`) applies `DIVE_FORCE` downward. When the head is under (`duck.y + 6 > floorY`), `duck.breath` drains (max `BREATH_MAX`, doubled by Deep Lungs); at 0 the duck takes `DROWN_DAMAGE` every `DROWN_INTERVAL` frames. HP regenerates **only while floating at the surface** (+8 every `HP_REGEN_INTERVAL` = 120 frames; Healing Waters halves the interval).
- **Biomes**: Ocean Shore 0m, Deep Swamp 1500m, Arctic Tundra 3000m, Volcanic Waste 4500m, Sky Kingdom 6000m (relative to the lap start).
- **Bosses**: triggered 150m before the next biome (Storm Serpent at 7300m). While a boss is alive, regular enemies stop spawning and the biome cannot change. Column attacks are placed where the duck will be when the warning ends and are dodged vertically.
- **Laps**: beating the Storm Serpent sets `lap++`. Each lap scales enemy speed and density (`lapMul = 1 + lap * 0.35`), adds +3 boss HP, and makes bosses attack faster.
- **Upgrades**: offered every 600m (`UPGRADE_EVERY_PX`), pick 1 of 3 from `UPGRADE_DEFS`.
- **Meta-progression**: achievements are saved permanently; ducks in `ABILITY_POOL` with an `unlock` id appear only after that achievement is earned.

## Coding Conventions

| Type | Convention | Example |
|---|---|---|
| Variables / functions | camelCase | `gameState`, `updateBoss()` |
| Constants | SCREAMING_SNAKE_CASE | `HIT_DAMAGE`, `BOSS_DEFS` |
| Section headers | `// ==================== NAME ====================` | |

- 4-space indentation, single quotes in JS, double quotes in HTML attributes
- Imperative, procedural style — global state, direct mutation, no classes or modules
- Most game code uses `var` and `function` declarations; keep new code consistent with the code around it
- Comments are sparse — only explain non-obvious logic

### Anti-patterns to avoid

- Do not introduce external dependencies, assets, fonts, or network requests (the game must run offline from one file)
- Do not split into multiple files or add a build system, framework, or TypeScript
- Do not apply damage anywhere except `hurtDuck()`, and reset any new per-run state in `startRun()`

## Adding Features — Guidelines

- **New enemy**: add a case to `spawnEnemies()` and `updateEnemies()`, add a `_draw<Name>()` sprite and a case in `drawEnemies()`, then list it in a biome's `enemies` array.
- **New boss**: add an entry to `BOSS_DEFS` (attack lists per phase use `shoot`, `spray`, `lob`, `charge`, or a `COL_TYPES` key), plus a `case` in `drawBoss()`. Triggers use `bossTriggerPx()`.
- **New upgrade**: add it to `UPGRADE_DEFS` (with a `short` HUD label) and draw an 8×8 icon for it in `ICON_ART`; apply one-off effects in `applyUpgrade()`; check ongoing effects with `activeUpgrades.indexOf(id) !== -1`. Upgrades appear as labelled chips in the HUD via `updateUpgradeChips()`.
- **New achievement or duck**: add to `ACHIEVEMENT_DEFS` and unlock it with `unlockAchievement(id)`. To gate a duck behind it, set that duck's `unlock` field.
- **New screen**: add a state, a draw function called from `loop()`, keyboard handling in the `keydown` listener, and clickable areas via `drawButton()`.

## Git Conventions

- Imperative, descriptive commit messages ("Add boss fights guarding each biome"), one feature or fix per commit
- No ticket numbers or prefixes (no `feat:` / `fix:`)
