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
| **SPACE** | Jump (on ground) / Swim stroke (in water) |
| **↓ / S** (hold) | Dive underwater |
| **SHIFT** | Burst — powerful upward launch, uses a charge |
| **1 / 2 / 3** | Select ability or upgrade in menus |
| **R** | Restart after death |
| **ESC / P** | Pause / resume (also pauses automatically when you switch tabs) |
| **Q** | Quit to title (while paused) |
| **A** | Achievements screen (title or death screen) |
| **Left tap** | Jump / Swim (mobile) |
| **Right tap** | Burst (mobile) |
| **DIVE button** (hold) | Dive (mobile) |

### The basics

- The duck runs right automatically — your job is to keep it alive
- **Jump and swim** over enemies and obstacles
- **Burst** launches you high and **kills any enemy on contact** — use it offensively and to escape
- **Ducks float** — in water the duck bobs at the surface, and floating there slowly heals it (+8 HP every 2 seconds)
- **Hold ↓ to dive** — dive for underwater fish or to slip under sharks and the Kraken's tentacles, but watch the **air bubbles** above your head: run out and the duck starts drowning (−8 HP every half second) until it surfaces. No healing underwater.
- **Lava burns** — touching it costs a big chunk of HP and bounces you back up, so land on a platform before you touch it again
- **Falling off the sky** is instant death
- Entering the Volcanic Waste or Sky Kingdom always starts you on a safe ledge
- **A boss guards the end of every biome** — beat it to move on
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
| Deep Lungs | Hold your breath twice as long |
| Hearty Duck | +25 max HP and restore 25 HP |

### Starting abilities

At the start of each run, choose one of three randomly offered ducks. Three are available from the start; the rest are unlocked by achievements:

| Duck | Ability | Unlocked by |
|---|---|---|
| **Standard Duck** | +1 burst charge to start | — |
| **Tough Duck** | +25 max HP, take only 15 damage per hit | — |
| **Water Duck** | Start with Healing Waters and Deep Lungs | — |
| **Swift Duck** | +0.8 base speed, lower gravity | Half Mile (reach 500m) |
| **Storm Duck** | Start with 3 burst charges | Giant Slayer (defeat a boss) |
| **Lucky Duck** | Start with Fish Magnet and a Bubble Shield | Frostbite (reach the Arctic) |
| **Phoenix Duck** | Once per run, rise from death with half HP | Hot Feet (reach the Volcanic Waste) |

---

## Game Features

### 5 Biomes
The world changes as you run further, each with unique visuals, enemies, and hazards:

| Distance | Biome | Hazard |
|---|---|---|
| 0m | Ocean Shore | Water floor, sharks, gators |
| 1500m | Deep Swamp | Murky water, eels, pufferfish |
| 3000m | Arctic Tundra | Ice floor, walruses, seagulls |
| 4500m | Volcanic Waste | Lava floor (burns for 30 HP and bounces you up), crabs, salamanders |
| 6000m | Sky Kingdom | No floor — fall = death, aerial enemies |

### 5 Bosses
Each biome ends with a boss that blocks the way forward:

| Boss | Where | Signature attacks |
|---|---|---|
| **King Kraken** | Ocean Shore (1350m) | Tentacles rising from the water, ink lobs |
| **Bog Tyrant** | Deep Swamp (2850m) | Charges across the screen, mud lobs |
| **Frost Yeti** | Arctic Tundra (4350m) | Falling icicles, snowballs |
| **Magma Drake** | Volcanic Waste (5850m) | Fireball sprays, lava geysers |
| **Storm Serpent** | Sky Kingdom (7300m) | Lightning strikes, charges |

- Dangerous columns flash a **red warning zone** first — dodge vertically (go high for things rising from below, stay low for things falling from above)
- After its attack cycle the boss swoops down **dazed** — **stomp** on it or **burst** into it
- Bosses get **enraged** at 2/3 and 1/3 health, attacking faster and harder
- Feathers drop during the fight so you never run out of bursts
- Reward: +30 HP, +1 burst, +15 fish

### Endless laps
Beat the Storm Serpent and the world loops back to the Ocean Shore — **Lap 2** and beyond bring faster enemies, tighter spacing and tougher bosses.

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
- Each run is independent — die and start fresh with a new duck
- Achievements unlock new ducks for future runs
- Upgrade choices are randomised every run
- Speed increases gradually the further you go
- Best distance, run count, and achievements persist via localStorage

### 13 Achievements
Unlocked across runs, shown as toast notifications, and browsable on the achievements screen (press **A**):

First Splash · Half Mile · Marathon Duck · Swamp Things · Frostbite · Hot Feet · Sky Duck · Bully · Power Up · Untouchable · Giant Slayer · Legend of the Pond · Second Wind

### Polish
- Parallax backgrounds (3 layers per biome)
- Particle system — water splashes, feathers on impact, explosions, burst trails, biome ambients (snow, embers, bubbles, wisps)
- Screen shake and a red flash on every hit
- 3-frame duck wing animation
- 5 biome-specific music themes plus a boss theme (different scales and tempos)
- 10 sound effects procedurally generated with Web Audio API
- Full mobile/touch support

---

## Technical Details

- **Technology:** Pure HTML5 Canvas + vanilla JavaScript + CSS
- **Size:** Single `duckrunendless.html` file, ~3,200 lines
- **Dependencies:** None
- **Build tools:** None
- **Created with:** Claude via Claude Code (game design and all six build phases), originally prototyped with Google Gemini 3 Pro

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
