# Duck Games

Two browser games starring the same pixel duck. No frameworks, no dependencies, no build step: each game is one HTML file that runs offline. Built with AI assistance to show what AI-assisted development can produce from a blank canvas.

## Play

**Live on GitHub Pages:** https://thewizster.github.io/duckgame/

Open `index.html` to choose a game, or jump straight to one. To play offline, download the repo and open `index.html` in any modern browser.

| File | Game |
|---|---|
| `index.html` | Game select hub |
| `duckrunendless.html` | **Duck Run: Endless**: an endless roguelite runner through water, ice, lava and sky |
| `duckster.html` | **Duckster: Road Rage**: a kart-racing roguelite against seven rivals |

## For developers

- Each game is a single file of HTML, CSS and vanilla JavaScript (Canvas + Web Audio). Edit it and refresh the browser.
- Each game's tuning numbers live in the `CONSTANTS` section near the top of its script. The **Under the hood** notes below name the ones that matter.
- Progress is saved in `localStorage` (`duckrun_meta`, `duckster_meta`).
- [CLAUDE.md](CLAUDE.md) documents the code layout, conventions and how to test headlessly with Playwright.

---

# Duck Run: Endless

The duck runs right on its own through five biomes, each ending in a boss. Beat the last boss and the world loops around, harder. Pick upgrades along the way, earn achievements, and unlock new ducks for future runs.

## Controls

| Input | Action |
|---|---|
| **SPACE** / left tap | Jump (on ground), swim stroke (in water) |
| **↓ / S** (hold) / DIVE button | Dive underwater |
| **SHIFT** / right tap | Burst: a powerful upward launch that uses a charge |
| **1 / 2 / 3** | Pick a duck or an upgrade |
| **ESC / P** | Pause (also pauses when you switch tabs) |
| **Q** / **R** / **A** | Quit (paused), restart (after death), achievements (title or death screen) |

## How it plays

- **Burst** launches you high and **kills any enemy it touches**. Use it to attack and to escape.
- **Ducks float.** In water you bob at the surface, and floating there slowly heals you. That's the only place you heal.
- **Hold ↓ to dive** for underwater fish or to slip under sharks and tentacles, but watch the **air bubbles** over your head: when they run out you start drowning until you surface.
- **Lava** burns a big chunk of HP and bounces you back up. **Falling out of the Sky Kingdom** is instant death. Entering either biome always starts you on a safe ledge.
- **Every 600m** you pick one of three random upgrades.

<details>
<summary>Under the hood</summary>

- Speed ramps from `BASE_SPEED` 2.5 to `MAX_SPEED` 6 px/frame. Metres = world px / 10.
- All damage goes through `hurtDuck()`: `HIT_DAMAGE` 25 (15 for Tough Duck), followed by invincibility frames. Lava deals `LAVA_DAMAGE + lap × 5` and always applies `LAVA_BOUNCE`.
- Water: a capped buoyancy spring holds a float line with half the body submerged. `duck.breath` drains while the head is under, and at 0 the duck takes `DROWN_DAMAGE` every `DROWN_INTERVAL` frames. Surface regen is +8 HP every 120 frames (Healing Waters halves the interval).
- `UPGRADE_EVERY_PX` = 6000. The game advances one step per `requestAnimationFrame`, so it runs too fast on high-refresh displays. Duckster's fixed-timestep loop is the fix to port.

</details>

## Biomes and bosses

| From | Biome | Floor and enemies | Boss (where it appears) | Boss attacks |
|---|---|---|---|---|
| 0m | Ocean Shore | Water; sharks, gators | **King Kraken** (1350m) | Tentacles from the water, ink lobs |
| 1500m | Deep Swamp | Murky water; eels, pufferfish | **Bog Tyrant** (2850m) | Screen-wide charges, mud lobs |
| 3000m | Arctic Tundra | Ice; walruses, seagulls | **Frost Yeti** (4350m) | Falling icicles, snowballs |
| 4500m | Volcanic Waste | Lava; crabs, salamanders | **Magma Drake** (5850m) | Fireball sprays, lava geysers |
| 6000m | Sky Kingdom | No floor; aerial enemies | **Storm Serpent** (7300m) | Lightning strikes, charges |

Boss attacks that cover a column of the screen flash a **red warning** first. Dodge vertically: go high for things rising from below, stay low for things falling. After its attack cycle the boss swoops down **dazed**: stomp it or burst into it. Bosses get faster and harder at 2/3 and 1/3 health, and feathers drop during the fight so you never run out of bursts. A win pays +30 HP, +1 burst and +15 fish.

**Endless laps:** beating the Storm Serpent loops you back to the Ocean Shore on **Lap 2**, with faster enemies packed closer together and tougher bosses, and so on.

<details>
<summary>Under the hood</summary>

- Biome and boss positions are measured from `lapStartPx`, so they repeat every lap. Bosses trigger 150m before the next biome (`bossTriggerPx()`). While a boss is alive, regular enemies stop spawning and the biome can't change.
- Each lap scales enemy speed and density by `lapMul = 1 + lap × 0.35`, adds +3 boss HP, and shortens boss attack cooldowns.
- Bosses and their shots live in screen space. Everything else uses `worldX`.

</details>

## Upgrades and ducks

| Upgrade | Effect | | Upgrade | Effect |
|---|---|---|---|---|
| Double Jump | One extra jump in the air | | Fish Magnet | Auto-collect fish within 120px |
| Bubble Shield | Absorb one hit, then recharge | | Spike Feathers | Burst kills refund a charge |
| Tailwind | +0.5 max speed | | Soaring Wings | Burst power +3 |
| Healing Waters | 2× HP regen in water | | Sea Legs | Wider platforms |
| Power Feathers | +1 burst charge | | Deep Lungs | Hold your breath twice as long |
| Hearty Duck | +25 max HP and heal 25 | | | |

Each run starts by picking one of three random ducks. The first three are always available, and the others unlock through achievements:

| Duck | Ability | Unlocked by |
|---|---|---|
| **Standard Duck** | +1 burst charge | — |
| **Tough Duck** | +25 max HP, takes 15 damage per hit | — |
| **Water Duck** | Starts with Healing Waters and Deep Lungs | — |
| **Swift Duck** | +0.8 base speed, lower gravity | Half Mile (reach 500m) |
| **Storm Duck** | Starts with 3 burst charges | Giant Slayer (defeat a boss) |
| **Lucky Duck** | Starts with Fish Magnet and a Bubble Shield | Frostbite (reach the Arctic) |
| **Phoenix Duck** | Once per run, rise from death with half HP | Hot Feet (reach the Volcanic Waste) |

**13 achievements** (press **A** to browse): First Splash · Half Mile · Marathon Duck · Swamp Things · Frostbite · Hot Feet · Sky Duck · Bully · Power Up · Untouchable · Giant Slayer · Legend of the Pond · Second Wind. Your best distance, run count and achievements are saved between sessions.

**Polish:** three-layer parallax per biome, particles (splashes, feathers, explosions, snow, embers, bubbles), screen shake and hit flashes, five biome themes plus a boss theme, 10 procedurally generated sound effects, and full touch support.

---

# Duckster: Road Rage

The duck swaps water for wheels. Race seven rival ducks across five biomes to the finish line at 8000m, fighting a boss at the end of every zone. Win a Grand Prix to unlock a harder one, and bank corn to buy permanent upgrades in the garage.

## Controls

| Input | Action |
|---|---|
| **SPACE** / left tap | Jump / double jump |
| **SHIFT** / right tap | Boost: a burst of speed that rams through anything (uses a charge) |
| **↓ / S** (hold, in the air) / FLIP button | Backflip |
| **1 / 2 / 3** | Pick a kart or an upgrade |
| **← / →** | Choose the Grand Prix level (kart pick screen) |
| **R / H** | Reroll upgrades / repair (pit stop, costs corn) |
| **ESC / P** | Pause (also pauses when you switch tabs) |
| **Q** / **G** / **A** | Quit (paused or end screen), garage (title), achievements (title or end screen) |

## How it plays

- The kart drives itself. Your job is to keep it in one piece and get to the front.
- **Jump** barriers, potholes and ground enemies. Landing on an enemy or a rival **stomps** it.
- **Boost** turns you into a battering ram: while it lasts you take no damage and smash through enemies, barriers and rivals. Fuel cans on the road refill boosts.
- **Ramps** launch you into the air. **Hold ↓** to backflip: a clean landing pays corn, and a double flip or better also earns a boost. Land **mid-flip** and you lose 20 HP.
- Every biome after the first has a **road hazard**: sand slows you, oil spins you out so you can't jump, black ice speeds you up but weakens your jumps, and zero-G strips let you float (and flip a lot).
- HP slowly regenerates on the ground. Corn pays for pit stops during a run, and whatever is left is banked for the garage when the run ends, even if you quit.

<details>
<summary>Under the hood</summary>

- The game runs a fixed 60 steps per second (`STEP_MS`, at most `MAX_STEPS` catch-up steps), so it plays the same on any display. Speed ramps from `BASE_SPEED` 3 to `MAX_SPEED` 7 px/frame over the first ~1330m.
- A boost adds `BOOST_SPEED` 5 px/frame for 20 frames, about +10m. Rocket Boost raises that to +7 for 30 frames.
- All damage goes through `hurtKart()`, which does nothing while the kart is invincible or boosting. `HIT_DAMAGE` is 25, followed by 80 invincibility frames. Ground regen is 4 HP every 300 frames.
- Hazards: `surfaceMul()` gives sand ×0.6 and ice ×1.35. Oil sets `kart.spin` for 40 frames (no jumping, no slowdown). Zero-G multiplies gravity by 0.35. Rivals use the same `patchAt()` / `surfaceMul()`.
- Tricks: `FLIP_FRAMES` 28 per flip, `TRICK_CORN` 5 per flip. Two or more flips grant one boost per landing.
- `loadMeta()` repairs corrupt saves (wrong types, out-of-range GP and garage levels) instead of crashing.

</details>

## Rivals and how the race is paced

The seven rivals start ahead of you on a staggered grid. The HUD shows your position, and an arrow points to the next rival ahead. Knock rivals out by boost-ramming or stomping them (+10 corn each). A rival sitting just behind you will try to boost-ram you, so watch your mirrors.

**What pacing means for you:**

- **Within about 150m, it's a straight race.** Nobody gets a secret speed-up or slowdown, so every metre you gain with a boost or a clean line stays yours.
- **Fall far behind** and the leaders ease off so you can always catch up. **Pull far ahead** and the stragglers push to stay in sight, but never faster than your own kart, so a rival you've passed can only beat you if it's genuinely faster.
- **Hazards hit everyone.** Rivals crawl through sand and fly over ice just like you.
- **Each Grand Prix makes the field faster.** At GP1 the best rival only matches an un-upgraded kart. Higher up, the top rivals outrun you, and winning takes boosts, knockouts or upgrades.

| Grand Prix | What it takes to win |
|---|---|
| GP1 | Any boosting at all. A kart that never boosts still finishes around 3rd. |
| GP5 | Steady boosting (grab most fuel cans) plus a few knockouts, or a Turbo Engine. |
| GP9 | Nearly every fuel can, lots of knockouts, or a Turbo Engine. The podium is realistic, and first place has to be earned. |

<details>
<summary>Under the hood</summary>

`rivalSpeed()` paces each rival off the player's **un-upgraded** speed curve, so upgrades are a real edge:

```js
base = min(MAX_SPEED, BASE_SPEED + distancePx * SPEED_ACCEL)
pace = base * (skill + (gpLevel - 1) * RIVAL_PACE_GP)        // RIVAL_PACE_GP = 0.008
over = min(1, (|gap| - RIVAL_BAND_PX) / RIVAL_BAND_PX)       // RIVAL_BAND_PX = 1500 (150m)
if over <= 0:  pace                                          // inside the band: no rubber band
if ahead:      pace * (1 - RIVAL_EASE * over)                // RIVAL_EASE = 0.15
if behind:     max(pace, min(base, pace * (1 + RIVAL_PUSH * over)))   // RIVAL_PUSH = 0.10
```

- **Skill** at GP1: Coot Carla 1.00, Mallard Max 0.99, Swan Svetlana 0.97, Goose Gloria 0.95, Pelican Pete 0.94, Teal Terry 0.92, Loon Lars 0.90. Then the hazard multiplier applies, and an active rival boost adds `BOOST_SPEED × 0.8`.
- **Boost-rams:** a rival 4–26m behind has a 1.2% chance per frame to boost for 30 frames (600-frame cooldown). Contact deals `hurtKart(15)`.
- **During a boss duel** rivals move in lockstep with the kart (`kartAdvance`), so the race order holds.
- **Turbo Engine** adds `TURBO_BONUS` (0.4) to the kart's top speed. Rivals never get it, so it's kept modest: at +0.6 it won GP9 every time.
- **Tuning data** comes from a headless simulation that reads these constants from the file and runs 200 races per cell, with rival hazards and boost knockouts on. Each cell is the median finishing position:

  | Player | GP1 | GP5 | GP9 |
  |---|---|---|---|
  | No boosts | 3rd | 4th | 6th |
  | Casual (10 boosts) | 1st | 3rd | 4th |
  | Engaged (18 boosts) | 1st | 2nd (30% wins) | 4th (47% podium) |
  | Skilled (25 boosts) | 1st | 1st (78% wins) | 3rd (75% podium) |
  | Skilled + Turbo | 1st | 1st | 1st |

  Full races played by a bot in the real game agree, and show that knockouts matter a lot: even without jumping on purpose, landings off ramps stomp 3–6 rivals per race.

</details>

## Zone bosses

220m before each biome change, and before the finish line, a boss blocks the road. The distance counter freezes until you beat it.

| Boss | Zone | Attacks |
|---|---|---|
| **Tractor Ted** | Country Road | Rolling hay bales, brake-checks, drums |
| **Sandstorm Sid** | Desert Highway | Rolling rocks, fire lobs |
| **Big Rig Rhonda** | City Streets | Oil drums, rolling tires, fire lobs |
| **Avalanche Al** | Mountain Pass | Snowballs, fire lobs, drums |
| **Captain Cosmos** | Space Highway | Plasma, lobs, drums, fast brake-checks |

Jump the rollers, and the fire patches that lobbed shots leave behind. When a boss flashes **!**, it brake-checks back under you: jump, land on it while it's dazed, or boost-ram it. Bosses speed up at 2/3 and 1/3 health. Each one pays +50 corn and +25 HP.

<details>
<summary>Under the hood</summary>

`bossTriggerPx(i)` is the next biome's start (or `VICTORY_DIST`) minus 2200px. During the duel, `distancePx = kart.worldX - 200 - bossPx` stands still while `bossPx` accumulates, so biome changes, pit stops and the finish line all wait. Boss HP is `def.hp + 2` per GP level above 1. Attacks are `roll`, `lob` (lands as a `fire` patch), `drop` (a `drum` barrier) and `brake`.

</details>

## Pit stops, karts and the garage

**Every 550m** a pit stop offers three random upgrades. Upgrades you own aren't offered again, except the stacking ones. You can spend run corn to **reroll** the cards or **repair** 40 HP.

| Upgrade | Effect | | Upgrade | Effect |
|---|---|---|---|---|
| Suspension Springs | Double jump | | Magnet Bumper | Auto-collect items within 130px |
| Roll Cage | Absorb one hit; recharges 400m after breaking | | Exhaust Fire | Boosting blasts nearby enemies |
| Turbo Engine | +0.4 max speed | | Rocket Boost | Boost speed +2, duration +50% |
| Off-Road Tires | Ramp launches go 30% higher | | Monster Wheels | No damage from bad landings; +50% trick corn |
| Nitro Tank | +1 boost charge (stacks) | | Duck Armor | +25 max HP and heal 25 (stacks) |

Each run starts by picking one of three random karts. The first three are always available, and the others unlock through achievements:

| Kart | Ability | Unlocked by |
|---|---|---|
| **Speed Demon** | +0.8 base speed, lower gravity | — |
| **Tank Duck** | +25 max HP, takes 15 damage per hit | — |
| **Nitro Duck** | +2 boost charges | — |
| **Rally Duck** | Starts with Suspension Springs | Desert Drifter |
| **Mechanic Duck** | Starts with Roll Cage and Magnet Bumper | Street Racer |
| **Rocket Duck** | Starts with Rocket Boost and Exhaust Fire | Summit Seeker |
| **Stunt Duck** | Starts with Off-Road Tires and Monster Wheels | Stuntmaster |
| **Bruiser Duck** | Takes 15 damage per hit, starts with a Roll Cage | Demolition Derby |
| **Golden Duck** | +2 boosts, Roll Cage, +25 max HP | Finish Line! |

**Garage:** banked corn buys permanent perks on the title screen (press **G**): **Reinforced Chassis** (+10 max HP per level), **Spare Nitro** (+1 starting boost per level), **Corn Scoop** (+25% corn per level) and **Pit Crew Pro** (first reroll at each pit stop is free, cheaper repairs).

**Grand Prix:** winning a Grand Prix unlocks the next one, up to GP9. Each level brings faster, denser enemies, obstacles closer together, tougher and quicker bosses, faster rivals, and +20% corn.

<details>
<summary>Under the hood</summary>

- `UPGRADE_EVERY_PX` is 5500. Upgrades marked `stack:true` in `UPGRADE_DEFS` can be offered again. Rerolls cost 15 corn, +10 each time. Repairs cost 20 corn (12 with Pit Crew Pro).
- Garage perk prices are in `GARAGE_DEFS[].costs`, and the level is capped at the number of prices.
- Per GP level above 1: enemies ×`gpMul()` (+25%), obstacle gaps ÷(1 + 0.12), boss HP +2, rival skill +`RIVAL_PACE_GP`, corn +20% (in `addCorn()`).

</details>

## Biomes and achievements

| From | Biome | Road hazard | Enemies |
|---|---|---|---|
| 0m | Country Road | — | Gator, Hawk, Turtle |
| 1200m | Desert Highway | Sand drifts | Snake, Vulture, Tumbleweed |
| 2500m | City Streets | Oil slicks | Taxi, Pigeon, Raccoon |
| 4000m | Mountain Pass | Black ice | Yeti, Eagle, Boulder |
| 5800m | Space Highway | Zero-G strips | UFO, Asteroid, Drone |

**18 achievements:** First Lap · Half Klick · Road Warrior · Desert Drifter · Street Racer · Summit Seeker · Star Duck · Road Bully · Pit Crew · Clean Run · Finish Line! · Stuntmaster · Demolition Derby · Podium Finish · Champion · Road Boss · Boss Rush · Grand Prix Legend

**Polish:** parallax backgrounds and ambient particles per biome, kart tilt on ramps, a shadow that shrinks as you rise, pixel-art upgrade icons and HUD chips, paint jobs for every kart, speed lines, screen shake, victory fireworks, five biome themes plus a boss theme, and a layout that scales to any window with full touch controls.

---

## History

- **Nov 2025:** Duck Run starts as a single-page runner, prototyped with Google Gemini 3 Pro from a hand-drawn sketch (`duckgame.jpg`). Five rounds of prompting added music and sound effects.
- **Dec 2025:** A saved high-score table, then HP and regeneration in water (#1).
- **Mar 2026:** The project moves to Claude Code. CLAUDE.md (#2), procedural floating-log platforms with enemy scaling (#3), then a full rebuild as the roguelite **Duck Run: Endless** (#5), designed and built by Claude in six phases. **Duckster** arrives as a second game, first an endless kart runner built with Claude Sonnet 4.6 (#7).
- **Oct 2026:** Duck Run gains bosses, laps, water and breath, and unlockable ducks (#9, #10). A Forge AI review gate is added to pull requests (#11). Duckster is rebuilt into a full race with rivals, zone bosses, ramps and tricks, road hazards, a garage and Grand Prix levels, using Claude Opus 5.5 (#13). Follow-up fixes (#12): a fixed 60 Hz timestep, rival pacing and hazards, corrupt-save handling, and banking corn when you quit.

## Credits

Game concept and AI prompting by thewizster. Code by AI: Google Gemini 3 Pro (original prototype), then Claude via Claude Code.

Enjoy the run, and the ride! 🦆🏎️
