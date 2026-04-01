/**
 * Frame-accurate game timer providing delta time, elapsed time,
 * frame counting, and cooldown / interval helpers.
 */
export class Timer {
    /** Seconds since last frame (capped to avoid spiral-of-death) */
    dt: number = 0;

    /** Uncapped delta in seconds */
    rawDt: number = 0;

    /** Total elapsed seconds since the timer started */
    elapsed: number = 0;

    /** Total frames ticked */
    frame: number = 0;

    /** Frames per second (smoothed) */
    fps: number = 60;

    /** Maximum allowed dt to prevent physics explosions (default 100 ms) */
    maxDt: number = 0.1;

    /** Fixed timestep for physics (0 = disabled, use variable dt) */
    fixedStep: number = 0;

    /** Accumulated time for fixed-step sub-ticks */
    private accumulator: number = 0;

    private lastTimestamp: number = 0;
    private fpsAccum: number = 0;
    private fpsFrames: number = 0;
    private started: boolean = false;

    /** Call once per requestAnimationFrame with the RAF timestamp. */
    tick(timestamp: number): void {
        if (!this.started) {
            this.lastTimestamp = timestamp;
            this.started = true;
        }

        this.rawDt = (timestamp - this.lastTimestamp) / 1000;
        this.dt = Math.min(this.rawDt, this.maxDt);
        this.elapsed += this.dt;
        this.frame++;
        this.lastTimestamp = timestamp;

        // FPS calculation (update once per second)
        this.fpsAccum += this.rawDt;
        this.fpsFrames++;
        if (this.fpsAccum >= 1) {
            this.fps = this.fpsFrames / this.fpsAccum;
            this.fpsAccum = 0;
            this.fpsFrames = 0;
        }
    }

    /**
     * Run a fixed-timestep callback as many times as needed to consume
     * the accumulated time. Returns the interpolation alpha (0–1) for
     * rendering between physics steps.
     */
    tickFixed(callback: (fixedDt: number) => void): number {
        if (this.fixedStep <= 0) {
            callback(this.dt);
            return 1;
        }
        this.accumulator += this.dt;
        while (this.accumulator >= this.fixedStep) {
            callback(this.fixedStep);
            this.accumulator -= this.fixedStep;
        }
        return this.accumulator / this.fixedStep;
    }

    /** Reset the timer to its initial state. */
    reset(): void {
        this.dt = 0;
        this.rawDt = 0;
        this.elapsed = 0;
        this.frame = 0;
        this.accumulator = 0;
        this.started = false;
    }

    /** Returns true every N frames. */
    everyFrames(n: number): boolean {
        return this.frame % n === 0;
    }

    /** Returns true every N seconds (approximate, frame-aligned). */
    everySeconds(n: number): boolean {
        const prev = this.elapsed - this.dt;
        return Math.floor(this.elapsed / n) > Math.floor(prev / n);
    }
}

/**
 * Simple cooldown tracker.
 * ```ts
 * const cd = new Cooldown(0.5); // 500ms cooldown
 * if (cd.ready(timer.elapsed)) { cd.trigger(timer.elapsed); fire(); }
 * ```
 */
export class Cooldown {
    private lastUsed: number = -Infinity;

    constructor(public duration: number) {}

    ready(now: number): boolean {
        return now - this.lastUsed >= this.duration;
    }

    trigger(now: number): void {
        this.lastUsed = now;
    }

    /** Remaining time until ready */
    remaining(now: number): number {
        return Math.max(0, this.duration - (now - this.lastUsed));
    }

    reset(): void {
        this.lastUsed = -Infinity;
    }
}
