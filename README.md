# Duck Games

Two browser games starring the same pixel duck — no frameworks, no dependencies, no build step. Created with AI assistance to showcase what modern AI-assisted development can produce from a blank canvas.

## Play

**Live on GitHub Pages:** https://thewizster.github.io/duckgame/

Open `index.html` to choose a game, or jump straight to one:

| File | Game |
|---|---|
| `index.html` | Game select hub |
| `duckrunendless.html` | Duck Run: Endless |
| `duckster.html` | Duckster: Road Rage |

**Offline:** Download the repo, open `index.html`, pick a game. That's it.

---

# Duck Run: Endless

An infinite side-scrolling roguelite runner.

---

## How to Play

### Controls

| Input | Action |
|---|---|
| **SPACE** | Jump (on ground) / Swim (in water) |
| **SHIFT** | Burst — powerful upward launch, uses a charge |
| **1 / 2 / 3** | Select ability or upgrade in menus |
| **R** | Restart after death |
| **Left tap** | Jump / Swim (mobile) |
| **Right tap** | Burst (mobile) |

### The basics

- The duck runs right automatically — your job is to keep it alive
- **Jump and swim** over enemies and obstacles
- **Burst** launches you high and **kills any enemy on contact** — use it offensively and to escape
- **Water heals** — floating in water slowly restores HP
- **Falling into lava** is instant death; **falling off the sky** is too
- Die and your run ends, but your best distance and achievements are saved

### Upgrades

Every **600 metres** the game pauses and offers you **3 random upgrades** — pick one:

| Upgrade | Effect |
|---|---|
| Double Jump | Jump once more while airborne |
| Bubble Shield | Absorb one hit before recharging |
| Tailwind | +0.5 max speed |
| Healing Waters | 2× HP regen in water |
| Power Feathers | +1 burst charge |
| Fish Magnet | Auto-collect fish within 120px |
| Spike Feathers | Burst kills refund a burst charge |
| Soaring Wings | Burst power +3 |
| Sea Legs | Platforms appear wider |
| Hearty Duck | +25 max HP and restore 25 HP |

### Starting abilities

At the start of each run, choose one of three randomly offered abilities:

- **Standard Duck** — +1 burst charge to start
- **Tough Duck** — +25 max HP, take only 15 damage per hit
- **Swift Duck** — +0.8 base speed, lower gravity
- **Water Duck** — start with Healing Waters active
- **Storm Duck** — start with 3 burst charges

---

## Game Features

### 5 Biomes
The world changes as you run further, each with unique visuals, enemies, and hazards:

| Distance | Biome | Hazard |
|---|---|---|
| 0m | Ocean Shore | Water floor, sharks, gators |
| 1500m | Deep Swamp | Murky water, eels, pufferfish |
| 3000m | Arctic Tundra | Ice floor, walruses, seagulls |
| 4500m | Volcanic Waste | Lava floor (instant kill), crabs, salamanders |
| 6000m | Sky Kingdom | No floor — fall = death, aerial enemies |

### 8 Enemy Types

- **Shark** — horizontal patrol at water surface
- **Gator** — patrol + occasional jumps
- **Pufferfish** — inflates every few seconds; only dangerous when inflated
- **Eel** — sinusoidal swooping movement in water
- **Seagull** — dives toward your position when close
- **Crab** — slow patrol with sudden fast shuffles
- **Walrus** — fast sliding patrol on ice
- **Salamander** — floor patrol leaving ember trails

### Roguelite progression
- Each run is independent — die and start fresh with a new ability
- Upgrade choices are randomised every run
- Speed increases gradually the further you go
- Best distance, run count, and achievements persist via localStorage

### 10 Achievements
Unlocked across runs and shown as toast notifications:

First Splash · Half Mile · Marathon Duck · Swamp Things · Frostbite · Hot Feet · Sky Duck · Bully · Power Up · Untouchable

### Polish
- Parallax backgrounds (3 layers per biome)
- Particle system — water splashes, feathers on impact, explosions, burst trails, biome ambients (snow, embers, bubbles, wisps)
- Screen shake on every hit
- 3-frame duck wing animation
- 5 biome-specific music themes (different scales and tempos)
- 10 sound effects procedurally generated with Web Audio API
- Full mobile/touch support

---

## Technical Details

- **Technology:** Pure HTML5 Canvas + vanilla JavaScript + CSS
- **Size:** Single `index.html` file, ~2200 lines
- **Dependencies:** None
- **Build tools:** None
- **Created with:** Claude Opus 4 (game design and all four build phases), originally prototyped with Google Gemini 3 Pro

---

## Credits

Game concept and AI prompting by thewizster.

---

Enjoy the run! 🦆

---

# Duckster: Road Rage

An infinite side-scrolling racing roguelite. The duck ditches the water and straps into a go-kart.

## How to Play

### Controls

| Input | Action |
|---|---|
| **SPACE** | Jump / double jump |
| **SHIFT** | Boost — short speed burst, uses a charge |
| **1 / 2 / 3** | Select ability or upgrade in menus |
| **R** | Restart after a wipeout |
| **Left tap** | Jump (mobile) |
| **Right tap** | Boost (mobile) |

### The basics

- The kart drives right automatically — your job is to keep it on the road
- **Jump** over obstacles and onto enemies — landing on an enemy from above stomps it
- **Boost** for a burst of speed to blast through tight spots or escape danger
- **Ramps** launch the kart into the air — land cleanly or take damage
- **Collect corn and breadcrumbs** to rack up points; **hearts** restore HP; **fuel cans** add a boost charge
- Wipe out and your run ends, but your best distance and achievements are saved

### Upgrades

Every **1000px** the game pauses for a **Pit Stop** — pick one of three random upgrades:

| Upgrade | Effect |
|---|---|
| Suspension Springs | Double jump while airborne |
| Roll Cage | Absorb one hit before recharging |
| Turbo Engine | +0.6 max speed |
| Off-Road Tires | Ignore hard-landing damage |
| Nitro Tank | +1 boost charge |
| Magnet Bumper | Auto-collect items within 120px |
| Exhaust Fire | Boost leaves a damaging fire trail |
| Rocket Boost | Boost adds extra power |
| Monster Wheels | Big wheels negate hard-landing damage |
| Duck Armor | +25 max HP and restore 25 HP |

### Starting abilities

At the start of each run, choose one of three randomly offered abilities:

- **Speed Demon** — higher top speed, lower gravity
- **Tank Duck** — +30 max HP, take only 15 damage per hit
- **Nitro Duck** — start with 2 boost charges
- **Rally Duck** — starts with Off-Road Tires and Suspension Springs
- **Mechanic Duck** — start with Roll Cage already active

---

## Game Features

### 5 Biomes
The world changes as you race further:

| Distance | Biome | Feel |
|---|---|---|
| 0m | Country Road | Rolling hills, clouds, fences |
| 12000px | Desert Highway | Dunes, cacti, heat shimmer |
| 25000px | City Streets | Skyline, streetlights, rain |
| 40000px | Mountain Pass | Snow peaks, pine trees, blizzard |
| 58000px | Space Highway | Stars, nebula, planets |

### 15 Enemy Types
Gator · Hawk · Turtle · Snake · Vulture · Tumbleweed · Taxi · Pigeon · Raccoon · Yeti · Eagle · Boulder · UFO · Asteroid · Drone

Each enemy type is introduced by biome, with stomp-kill mechanics for enemies that can be jumped on.

### Roguelite progression
- Each run is independent — wipe out and start fresh with a new ability
- Upgrade choices are randomised every run
- Speed increases gradually the further you go
- Best distance, run count, and achievements persist via localStorage

### 11 Achievements
Unlocked across runs and shown as toast notifications:

First Lap · Half Mile · Marathon Duck · Reach the Desert · Reach the City · Reach the Mountains · Reach Space · Road Warrior · Pit Crew · Untouchable · Finish Line

### Polish
- Parallax backgrounds (3+ layers per biome)
- Particle system — tire dust, rocket flames, boost exhaust, sparks, biome ambients (dust, rain, snow, stars)
- Dynamic kart shadow that shrinks as you go airborne
- Speed lines during boost
- Biome transition flash
- Screen shake on every hit
- Distance milestone toasts (500m, 1km, 2km…)
- Victory fireworks on the win screen
- 5 biome-specific music themes
- 11 sound effects procedurally generated with Web Audio API
- Full mobile/touch support

---

## Technical Details

- **Technology:** Pure HTML5 Canvas + vanilla JavaScript + CSS
- **Size:** Single `duckster.html` file, ~2900 lines
- **Dependencies:** None
- **Build tools:** None
- **Created with:** Claude Sonnet 4.6

---

## Credits

Game concept and AI prompting by thewizster.

---

Enjoy the ride! 🏎️🦆
