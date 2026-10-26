import type { Engine } from './Engine';

/**
 * A Scene represents a discrete game state (title screen, gameplay, pause, etc.).
 * Scenes are managed by the Engine and receive lifecycle callbacks.
 *
 * Implement this interface and register scenes with `engine.scenes.add(...)`.
 */
export interface Scene {
    /** Unique name used to switch between scenes. */
    readonly name: string;

    /** Called once when the scene is first entered. */
    enter?(engine: Engine): void;

    /** Called every frame while this scene is active. */
    update?(engine: Engine, dt: number): void;

    /** Called every frame after update for rendering. */
    draw?(engine: Engine): void;

    /** Called when transitioning away from this scene. */
    exit?(engine: Engine): void;

    /** Called when the engine is paused while this scene is active. */
    pause?(engine: Engine): void;

    /** Called when the engine resumes from pause. */
    resume?(engine: Engine): void;
}

/**
 * Manages a set of named scenes and handles transitions between them.
 * Supports an optional scene stack for overlay/push-pop patterns.
 */
export class SceneManager {
    private scenes = new Map<string, Scene>();
    private stack: Scene[] = [];
    private _current: Scene | null = null;
    private engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    /** Register a scene. */
    add(scene: Scene): this {
        this.scenes.set(scene.name, scene);
        return this;
    }

    /** Remove a registered scene by name. */
    remove(name: string): this {
        this.scenes.delete(name);
        return this;
    }

    /** The currently active scene. */
    get current(): Scene | null {
        return this._current;
    }

    /** Switch to a named scene (replaces current, clears stack). */
    switch(name: string): void {
        const next = this.scenes.get(name);
        if (!next) throw new Error(`Scene "${name}" not registered`);

        // Exit everything on the stack
        for (let i = this.stack.length - 1; i >= 0; i--) {
            this.stack[i]!.exit?.(this.engine);
        }
        this.stack.length = 0;

        this._current?.exit?.(this.engine);
        this._current = next;
        next.enter?.(this.engine);
    }

    /** Push a scene on top (overlay). The previous scene is paused, not exited. */
    push(name: string): void {
        const next = this.scenes.get(name);
        if (!next) throw new Error(`Scene "${name}" not registered`);
        this._current?.pause?.(this.engine);
        if (this._current) this.stack.push(this._current);
        this._current = next;
        next.enter?.(this.engine);
    }

    /** Pop the current scene and resume the one below. */
    pop(): void {
        this._current?.exit?.(this.engine);
        this._current = this.stack.pop() ?? null;
        this._current?.resume?.(this.engine);
    }

    /** @internal — called by Engine each frame */
    update(dt: number): void {
        this._current?.update?.(this.engine, dt);
    }

    /** @internal — called by Engine each frame */
    draw(): void {
        this._current?.draw?.(this.engine);
    }
}
