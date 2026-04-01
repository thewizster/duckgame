/**
 * 🎮 Duck Engine — A composable, zero-dependency TypeScript game engine
 *
 * Built for browser-based 2D games with Canvas rendering, Web Audio synthesis,
 * and modular architecture. Every subsystem works independently — use only
 * what you need.
 *
 * Quick start:
 * ```ts
 * import { Engine, Scene, Notes, sfx, ParticleSystem } from '@engine';
 *
 * const engine = new Engine({ canvas: '#game', width: 800, height: 500 });
 * engine.scenes.add(myScene);
 * engine.scenes.switch('gameplay');
 * engine.start();
 * ```
 */

// Core
export { Engine } from './core/Engine';
export type { EngineConfig, EngineEvents } from './core/Engine';
export { EventBus } from './core/EventBus';
export type { EventHandler } from './core/EventBus';
export { SceneManager } from './core/Scene';
export type { Scene } from './core/Scene';
export { Timer, Cooldown } from './core/Timer';

// Math
export { Vector2 } from './math/Vector2';
export { Rect } from './math/Rect';
export { Random, random } from './math/Random';

// Audio
export { AudioEngine } from './audio/AudioEngine';
export { Sequencer, track, theme } from './audio/Sequencer';
export { SfxBuilder, sfx, CommonSfx } from './audio/SfxBuilder';
export { Notes, noteFreq, midiToFreq, chord, Chords, Scales, scale } from './audio/Notes';
export type {
    WaveType,
    Envelope,
    ToneOptions,
    SequencerNote,
    SequencerTrack,
    MusicTheme,
    SoundEffect,
    EffectConfig,
} from './audio/types';

// Input
export { InputManager } from './input/InputManager';
export type { MouseState, TouchPoint } from './input/InputManager';

// Renderer
export { Renderer } from './renderer/Renderer';
export { Camera, drawParallaxLayers } from './renderer/Camera';
export type { ParallaxLayer } from './renderer/Camera';
export { SpriteBuilder, SpriteAnimation, extractFrames } from './renderer/SpriteBuilder';
export type { SpriteFrame } from './renderer/SpriteBuilder';

// Physics
export { Body, CollisionLayers } from './physics/Body';
export type { BodyType } from './physics/Body';
export {
    testCollision,
    resolveCollision,
    rectsOverlap,
    sweepAABB,
    rayVsRect,
    SpatialGrid,
} from './physics/Collision';
export type { CollisionResult } from './physics/Collision';
export { PhysicsWorld } from './physics/PhysicsWorld';
export type { CollisionCallback, PhysicsZone } from './physics/PhysicsWorld';

// ECS
export { Component } from './ecs/Component';
export type { ComponentClass } from './ecs/Component';
export { Entity } from './ecs/Entity';
export { System } from './ecs/System';
export { EcsWorld } from './ecs/EcsWorld';

// Particles
export { ParticleSystem, ParticlePresets } from './particles/ParticleSystem';
export type { EmitterConfig } from './particles/ParticleSystem';

// UI
export { ToastManager } from './ui/Toast';
export type { ToastConfig } from './ui/Toast';
export { HUD } from './ui/HUD';
export type { BarConfig, CounterConfig, IconRowConfig } from './ui/HUD';

// World Generation
export { ObjectPool } from './world/ObjectPool';
export { WorldGenerator, cullBehind, scrollWrap } from './world/ProceduralGenerator';
export type { GeneratorRule } from './world/ProceduralGenerator';

// Storage
export { GameStorage, HighScoreTable } from './storage/Storage';
export type { HighScoreEntry } from './storage/Storage';
