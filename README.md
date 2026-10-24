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

A side-scrolling kart-racing roguelite. The duck ditches the water, straps into a go-kart and races seven rivals across five biomes to the finish line, with a boss duel at the end of every zone.

## How to Play

### Controls

| Input | Action |
|---|---|
| **SPACE** | Jump / double jump |
| **SHIFT** | Boost: a burst of speed that rams through enemies, barriers and rivals (uses a charge) |
| **↓ / S** (hold, in the air) | Backflip |
| **1 / 2 / 3** | Pick a kart or an upgrade |
| **← / →** | Choose the Grand Prix level (kart pick screen, once unlocked) |
| **R / H** | Reroll upgrades / repair (at a pit stop, costs corn) |
| **ESC / P** | Pause / resume (also pauses when you switch tabs) |
| **Q** | Quit to title (paused or end screen) |
| **G** | Garage (title screen) |
| **A** | Achievements (title or end screen) |
| **Left / right tap** | Jump / boost (mobile), plus FLIP and pause buttons |

### The basics

- The kart drives itself. Your job is to keep it in one piece and get to the front.
- **Jump** barriers, potholes and ground enemies. Landing on an enemy or rival **stomps** it.
- **Boost** makes you a battering ram: while it lasts, you smash through enemies, barriers and rivals without taking damage.
- **Ramps** are ridden up and launch you off the lip. **Hold ↓** in the air to backflip. A clean landing pays corn, and a double flip also refills a boost. Landing **mid-flip** costs 20 HP.
- Every biome after the first has a **road hazard**: sand drifts slow you, oil slicks spin you out (no jumping), black ice speeds you up but weakens jumps, and zero-G strips let you float.
- **Corn** is spent at pit stops (rerolls, repairs) and banked at the end of every run for the **Garage**. **Hearts** restore HP, **fuel cans** add a boost.
- HP slowly regenerates while you're on the ground.

### Rivals

Seven rival ducks start ahead of you on a staggered grid after a 3-2-1 countdown. The HUD shows your position, and an arrow points to the next rival ahead. The two fastest rivals outpace an un-upgraded kart, so first place takes upgrades, boosts, or knocking rivals out by ramming or stomping them (+10 corn each). Watch out: a rival right behind you will try to boost-ram past.

### Zone bosses

220m before each biome change, and before the finish line, a boss blocks the road and the course stops counting down until it's beaten:

| Boss | Zone | Attacks |
|---|---|---|
| **Tractor Ted** | Country Road | Rolling hay bales, brake-checks, drums |
| **Sandstorm Sid** | Desert Highway | Rolling rocks, fire lobs |
| **Big Rig Rhonda** | City Streets | Oil drums, rolling tires, fire lobs |
| **Avalanche Al** | Mountain Pass | Snowballs, fire lobs, drums |
| **Captain Cosmos** | Space Highway | Plasma, lobs, drums, fast brake-checks |

Jump the rollers and the fire patches lobbed shots leave behind. When a boss flashes **!**, it brake-checks back under you: jump, land on it while it's dazed, or boost-ram it. Bosses speed up at 2/3 and 1/3 health. Each one pays +50 corn and +25 HP.

### Upgrades

Every **550m** a **Pit Stop** offers three random upgrades (owned ones aren't offered again). Spend run corn to **reroll** the cards or **repair** 40 HP.

| Upgrade | Effect |
|---|---|
| Suspension Springs | Double jump |
| Roll Cage | Absorb one hit; recharges 400m after breaking |
| Turbo Engine | +0.6 max speed |
| Off-Road Tires | Ramp launches go 30% higher |
| Nitro Tank | +1 boost charge (stacks) |
| Magnet Bumper | Auto-collect items within 130px |
| Exhaust Fire | Boosting blasts nearby enemies |
| Rocket Boost | Boost speed +2 and duration +50% |
| Monster Wheels | Bad landings deal no damage; +50% trick corn |
| Duck Armor | +25 max HP and restore 25 HP (stacks) |

### Karts

Pick one of three random karts at the start of each run. Three are available from the start, and the rest unlock with achievements:

| Kart | Ability | Unlocked by |
|---|---|---|
| **Speed Demon** | +0.8 base speed, lower gravity | — |
| **Tank Duck** | +25 max HP, 15 damage per hit | — |
| **Nitro Duck** | +2 boost charges | — |
| **Rally Duck** | Starts with Suspension Springs | Desert Drifter |
| **Mechanic Duck** | Starts with Roll Cage and Magnet Bumper | Street Racer |
| **Rocket Duck** | Starts with Rocket Boost and Exhaust Fire | Summit Seeker |
| **Stunt Duck** | Starts with Off-Road Tires and Monster Wheels | Stuntmaster |
| **Bruiser Duck** | 15 damage per hit, starts with a Roll Cage | Demolition Derby |
| **Golden Duck** | +2 boosts, Roll Cage, +25 max HP | Finish Line! |

### Garage

Corn from every run is banked. On the title screen, press **G** to buy permanent perks: **Reinforced Chassis** (+10 max HP per level), **Spare Nitro** (+1 starting boost), **Corn Scoop** (+25% corn) and **Pit Crew Pro** (one free reroll per pit stop and cheaper repairs).

### Grand Prix

Winning a Grand Prix unlocks the next one, up to GP9. Each level brings faster, denser enemies, tighter obstacles, tougher and quicker bosses, faster rivals, and +20% corn.

---

## Game Features

### 5 Biomes

| Distance | Biome | Hazard | Enemies |
|---|---|---|---|
| 0m | Country Road | — | Gator, Hawk, Turtle |
| 1200m | Desert Highway | Sand drifts | Snake, Vulture, Tumbleweed |
| 2500m | City Streets | Oil slicks | Taxi, Pigeon, Raccoon |
| 4000m | Mountain Pass | Black ice | Yeti, Eagle, Boulder |
| 5800m | Space Highway | Zero-G strips | UFO, Asteroid, Drone |

The finish line is at **8000m**.

### 18 Achievements

First Lap · Half Klick · Road Warrior · Desert Drifter · Street Racer · Summit Seeker · Star Duck · Road Bully · Pit Crew · Clean Run · Finish Line! · Stuntmaster · Demolition Derby · Podium Finish · Champion · Road Boss · Boss Rush · Grand Prix Legend

### Polish

- Parallax backgrounds (3+ layers per biome) and biome ambient particles
- Rideable ramps with kart tilt, backflips, and a shadow that shrinks as you rise
- Pixel-art upgrade icons, HUD chips, and per-kart paint jobs
- Speed lines, screen shake, biome transition flash, victory fireworks
- 5 biome music themes plus a boss theme, all generated with the Web Audio API
- Scales to fit any window, with full touch controls

---

## Technical Details

- **Technology:** Pure HTML5 Canvas + vanilla JavaScript + CSS
- **Size:** Single `duckster.html` file, ~4,100 lines
- **Dependencies:** None
- **Build tools:** None
- **Created with:** Claude Sonnet 4.6, overhauled with Claude Opus 5.5 via Claude Code

---

## Credits

Game concept and AI prompting by thewizster.

---

Enjoy the ride! 🏎️🦆
