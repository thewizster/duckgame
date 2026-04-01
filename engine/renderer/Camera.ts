import { Vector2 } from '../math/Vector2';
import { Rect } from '../math/Rect';

/**
 * 2D camera with smooth follow, screen shake, zoom, and viewport queries.
 *
 * The camera defines a rectangular viewport in world-space. The renderer
 * uses it to translate world coordinates to screen coordinates.
 *
 * ```ts
 * camera.follow(player.position, dt);
 * camera.shake(10, 0.3);
 * renderer.applyCamera(camera);
 * ```
 */
export class Camera {
    /** Camera center position in world-space */
    position: Vector2 = Vector2.ZERO;

    /** Zoom level (1 = no zoom, 2 = 2x magnification) */
    zoom: number = 1;

    /** Viewport size in logical pixels */
    readonly viewportWidth: number;
    readonly viewportHeight: number;

    /** Smoothing factor for follow (0 = instant, higher = slower). */
    followSmoothing: number = 5;

    /** Deadzone: camera won't move unless target is outside this rect (centered). */
    deadzone: { width: number; height: number } = { width: 0, height: 0 };

    // Shake state
    private shakeIntensity: number = 0;
    private shakeDuration: number = 0;
    private shakeElapsed: number = 0;
    private shakeOffset: Vector2 = Vector2.ZERO;

    // Bounds clamping
    private bounds: Rect | null = null;

    constructor(viewportWidth: number, viewportHeight: number) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    /**
     * Smoothly follow a target position.
     */
    follow(target: Vector2, dt: number): void {
        // Apply deadzone
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const halfDzW = this.deadzone.width / 2;
        const halfDzH = this.deadzone.height / 2;

        let moveX = 0;
        let moveY = 0;
        if (Math.abs(dx) > halfDzW) moveX = dx - Math.sign(dx) * halfDzW;
        if (Math.abs(dy) > halfDzH) moveY = dy - Math.sign(dy) * halfDzH;

        if (this.followSmoothing <= 0) {
            this.position = new Vector2(
                this.position.x + moveX,
                this.position.y + moveY,
            );
        } else {
            const t = 1 - Math.exp(-this.followSmoothing * dt);
            this.position = new Vector2(
                this.position.x + moveX * t,
                this.position.y + moveY * t,
            );
        }

        this.clampToBounds();
    }

    /** Snap camera directly to a position (no smoothing). */
    lookAt(target: Vector2): void {
        this.position = target;
        this.clampToBounds();
    }

    /**
     * Set world-space bounds the camera cannot leave.
     * Pass null to remove bounds.
     */
    setBounds(bounds: Rect | null): void {
        this.bounds = bounds;
    }

    /**
     * Trigger a screen shake effect.
     * @param intensity Maximum pixel displacement
     * @param duration Seconds
     */
    shake(intensity: number, duration: number): void {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeElapsed = 0;
    }

    /**
     * Update shake (call once per frame).
     */
    update(dt: number): void {
        if (this.shakeElapsed < this.shakeDuration) {
            this.shakeElapsed += dt;
            const t = 1 - this.shakeElapsed / this.shakeDuration;
            const mag = this.shakeIntensity * t;
            this.shakeOffset = new Vector2(
                (Math.random() - 0.5) * 2 * mag,
                (Math.random() - 0.5) * 2 * mag,
            );
        } else {
            this.shakeOffset = Vector2.ZERO;
        }
    }

    /** Whether the camera is currently shaking. */
    get isShaking(): boolean {
        return this.shakeElapsed < this.shakeDuration;
    }

    // ── Coordinate conversion ──────────────────────────────────

    /** Convert world-space position to screen-space. */
    worldToScreen(world: Vector2): Vector2 {
        const offset = this.shakeOffset;
        return new Vector2(
            (world.x - this.position.x) * this.zoom + this.viewportWidth / 2 + offset.x,
            (world.y - this.position.y) * this.zoom + this.viewportHeight / 2 + offset.y,
        );
    }

    /** Convert screen-space position to world-space. */
    screenToWorld(screen: Vector2): Vector2 {
        const offset = this.shakeOffset;
        return new Vector2(
            (screen.x - this.viewportWidth / 2 - offset.x) / this.zoom + this.position.x,
            (screen.y - this.viewportHeight / 2 - offset.y) / this.zoom + this.position.y,
        );
    }

    /** Get the world-space rectangle visible through the camera. */
    getViewRect(): Rect {
        const halfW = (this.viewportWidth / 2) / this.zoom;
        const halfH = (this.viewportHeight / 2) / this.zoom;
        return new Rect(
            this.position.x - halfW,
            this.position.y - halfH,
            halfW * 2,
            halfH * 2,
        );
    }

    /** Check if a world-space rect is visible on screen. */
    isVisible(rect: Rect): boolean {
        return this.getViewRect().overlaps(rect);
    }

    /**
     * Apply camera transform to a 2D canvas context.
     * Call before drawing world-space objects, and restore() after.
     */
    applyToContext(ctx: CanvasRenderingContext2D): void {
        const offset = this.shakeOffset;
        ctx.save();
        ctx.translate(
            this.viewportWidth / 2 + offset.x,
            this.viewportHeight / 2 + offset.y,
        );
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.position.x, -this.position.y);
    }

    private clampToBounds(): void {
        if (!this.bounds) return;
        const halfW = (this.viewportWidth / 2) / this.zoom;
        const halfH = (this.viewportHeight / 2) / this.zoom;
        const x = Math.max(this.bounds.left + halfW, Math.min(this.bounds.right - halfW, this.position.x));
        const y = Math.max(this.bounds.top + halfH, Math.min(this.bounds.bottom - halfH, this.position.y));
        this.position = new Vector2(x, y);
    }
}

/**
 * Parallax layer definition for background rendering.
 */
export interface ParallaxLayer {
    /** Draw callback receives the screen-space offset for this layer */
    draw: (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => void;
    /** Scroll speed multiplier relative to camera (0 = static, 1 = moves with world) */
    speedX: number;
    speedY?: number;
}

/**
 * Render a set of parallax layers using the camera position.
 */
export function drawParallaxLayers(
    ctx: CanvasRenderingContext2D,
    layers: ParallaxLayer[],
    camera: Camera,
): void {
    for (const layer of layers) {
        const offsetX = -camera.position.x * layer.speedX;
        const offsetY = -camera.position.y * (layer.speedY ?? 0);
        layer.draw(ctx, offsetX, offsetY);
    }
}
