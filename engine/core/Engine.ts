import { Timer } from './Timer';
import { EventBus } from './EventBus';
import { SceneManager } from './Scene';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../renderer/Renderer';
import { AudioEngine } from '../audio/AudioEngine';

/**
 * Core engine events emitted on the global event bus.
 */
export interface EngineEvents {
    'engine:start': undefined;
    'engine:stop': undefined;
    'engine:pause': undefined;
    'engine:resume': undefined;
    'engine:preUpdate': { dt: number };
    'engine:postUpdate': { dt: number };
    'engine:preDraw': undefined;
    'engine:postDraw': undefined;
}

export interface EngineConfig {
    /** Canvas element or CSS selector */
    canvas: HTMLCanvasElement | string;
    /** Canvas logical width */
    width?: number;
    /** Canvas logical height */
    height?: number;
    /** Background color (CSS) for automatic clear */
    clearColor?: string;
    /** Fixed physics timestep in seconds (0 = variable) */
    fixedStep?: number;
    /** Whether to auto-start the loop on creation */
    autoStart?: boolean;
}

/**
 * The Engine is the central hub that owns the game loop and all subsystems.
 * It wires together rendering, audio, input, scenes, and timing so game
 * code only needs to implement Scene interfaces.
 *
 * ```ts
 * const engine = new Engine({ canvas: '#game', width: 800, height: 500 });
 * engine.scenes.add(myTitleScene).add(myPlayScene);
 * engine.scenes.switch('title');
 * engine.start();
 * ```
 */
export class Engine {
    readonly timer: Timer;
    readonly events: EventBus<EngineEvents>;
    readonly scenes: SceneManager;
    readonly input: InputManager;
    readonly renderer: Renderer;
    readonly audio: AudioEngine;
    readonly canvas: HTMLCanvasElement;
    readonly width: number;
    readonly height: number;

    private running = false;
    private paused = false;
    private rafId = 0;
    private readonly clearColor: string;

    /** Arbitrary per-game shared state — scenes can read/write freely. */
    state: Record<string, unknown> = {};

    constructor(config: EngineConfig) {
        const canvas = typeof config.canvas === 'string'
            ? document.querySelector<HTMLCanvasElement>(config.canvas)
            : config.canvas;
        if (!canvas) throw new Error('Canvas element not found');

        this.canvas = canvas;
        this.width = config.width ?? canvas.width;
        this.height = config.height ?? canvas.height;
        canvas.width = this.width;
        canvas.height = this.height;
        this.clearColor = config.clearColor ?? '';

        this.timer = new Timer();
        if (config.fixedStep) this.timer.fixedStep = config.fixedStep;

        this.events = new EventBus();
        this.scenes = new SceneManager(this);
        this.input = new InputManager(canvas);
        this.renderer = new Renderer(canvas);
        this.audio = new AudioEngine();

        if (config.autoStart) this.start();
    }

    /** Start the game loop. */
    start(): void {
        if (this.running) return;
        this.running = true;
        this.events.emit('engine:start', undefined);
        this.rafId = requestAnimationFrame(this.loop);
    }

    /** Stop the game loop entirely. */
    stop(): void {
        this.running = false;
        cancelAnimationFrame(this.rafId);
        this.events.emit('engine:stop', undefined);
    }

    /** Pause the loop (rendering continues, update does not). */
    pause(): void {
        if (this.paused) return;
        this.paused = true;
        this.events.emit('engine:pause', undefined);
    }

    /** Resume from pause. */
    resume(): void {
        if (!this.paused) return;
        this.paused = false;
        this.events.emit('engine:resume', undefined);
    }

    get isPaused(): boolean { return this.paused; }
    get isRunning(): boolean { return this.running; }

    private loop = (timestamp: number): void => {
        if (!this.running) return;
        this.rafId = requestAnimationFrame(this.loop);

        this.timer.tick(timestamp);
        const dt = this.timer.dt;

        // Update phase
        if (!this.paused) {
            this.events.emit('engine:preUpdate', { dt });

            if (this.timer.fixedStep > 0) {
                this.timer.tickFixed(() => {
                    this.scenes.update(this.timer.fixedStep);
                });
            } else {
                this.scenes.update(dt);
            }

            this.events.emit('engine:postUpdate', { dt });
        }

        // Draw phase
        this.events.emit('engine:preDraw', undefined);

        if (this.clearColor) {
            this.renderer.clear(this.clearColor);
        }
        this.scenes.draw();

        this.events.emit('engine:postDraw', undefined);

        // End-of-frame input bookkeeping
        this.input.endFrame();
    };
}
