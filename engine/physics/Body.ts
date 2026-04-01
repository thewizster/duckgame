import { Vector2 } from '../math/Vector2';
import { Rect } from '../math/Rect';

/**
 * Types of physics bodies:
 * - `dynamic`: affected by gravity and forces, responds to collisions
 * - `kinematic`: moved by code (enemies, platforms), not affected by gravity
 * - `static`: never moves (walls, terrain)
 * - `sensor`: detects overlaps but doesn't resolve collisions (triggers, zones)
 */
export type BodyType = 'dynamic' | 'kinematic' | 'static' | 'sensor';

/**
 * Collision layer/mask system for filtering.
 * Bodies only collide when (a.layer & b.mask) !== 0 && (b.layer & a.mask) !== 0.
 */
export const CollisionLayers = {
    NONE:        0,
    DEFAULT:     1 << 0,
    PLAYER:      1 << 1,
    ENEMY:       1 << 2,
    PLATFORM:    1 << 3,
    COLLECTIBLE: 1 << 4,
    PROJECTILE:  1 << 5,
    TRIGGER:     1 << 6,
    ENVIRONMENT: 1 << 7,
    ALL:         0xFFFF,
} as const;

/**
 * A physics body representing a rectangular collider in the world.
 */
export class Body {
    /** Position (top-left corner) in world-space */
    position: Vector2;

    /** Velocity in pixels/second */
    velocity: Vector2 = Vector2.ZERO;

    /** Size of the AABB */
    readonly width: number;
    readonly height: number;

    /** Body type determines physics behaviour */
    type: BodyType;

    /** Gravity multiplier (0 = no gravity, 1 = normal, 2 = heavy) */
    gravityScale: number = 1;

    /** Bounciness (0 = no bounce, 1 = perfect bounce) */
    restitution: number = 0;

    /** Friction coefficient (0 = ice, 1 = sticky) */
    friction: number = 0;

    /** Maximum fall speed */
    maxFallSpeed: number = 12;

    /** Collision layer (what I am) */
    layer: number = CollisionLayers.DEFAULT;

    /** Collision mask (what I collide with) */
    mask: number = CollisionLayers.ALL;

    /** Whether this body is currently grounded */
    grounded: boolean = false;

    /** Direction the body is facing (-1 left, 1 right) */
    facing: number = 1;

    /** Invincibility frames remaining */
    invincible: number = 0;

    /** Whether this body is active (inactive bodies are skipped) */
    active: boolean = true;

    /** Arbitrary tag for identification in collision callbacks */
    tag: string = '';

    /** User data — attach any game-specific state */
    data: Record<string, unknown> = {};

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        type: BodyType = 'dynamic',
    ) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.type = type;
    }

    // ── Derived properties ─────────────────────────────────────

    get x(): number { return this.position.x; }
    set x(v: number) { this.position = new Vector2(v, this.position.y); }

    get y(): number { return this.position.y; }
    set y(v: number) { this.position = new Vector2(this.position.x, v); }

    get left(): number { return this.position.x; }
    get right(): number { return this.position.x + this.width; }
    get top(): number { return this.position.y; }
    get bottom(): number { return this.position.y + this.height; }

    get centerX(): number { return this.position.x + this.width / 2; }
    get centerY(): number { return this.position.y + this.height / 2; }
    get center(): Vector2 { return new Vector2(this.centerX, this.centerY); }

    /** Get the AABB as a Rect */
    get rect(): Rect {
        return new Rect(this.position.x, this.position.y, this.width, this.height);
    }

    // ── Movement helpers ───────────────────────────────────────

    /** Apply an impulse (instant velocity change). */
    impulse(dx: number, dy: number): void {
        this.velocity = new Vector2(this.velocity.x + dx, this.velocity.y + dy);
    }

    /** Set velocity directly. */
    setVelocity(vx: number, vy: number): void {
        this.velocity = new Vector2(vx, vy);
    }

    /** Move position directly by delta. */
    translate(dx: number, dy: number): void {
        this.position = new Vector2(this.position.x + dx, this.position.y + dy);
    }

    // ── Collision queries ──────────────────────────────────────

    /** Check if this body overlaps another AABB. */
    overlaps(other: Body): boolean {
        return this.rect.overlaps(other.rect);
    }

    /** Check with inset (shrink both hitboxes). */
    overlapsInset(other: Body, inset: number): boolean {
        return this.rect.overlapsWithInset(other.rect, inset);
    }

    /** Check if a point is inside this body. */
    containsPoint(px: number, py: number): boolean {
        return this.rect.containsPoint(px, py);
    }

    /** Distance from center to another body's center. */
    distanceTo(other: Body): number {
        return this.center.distanceTo(other.center);
    }

    /** Can this body collide with another based on layers/masks? */
    canCollideWith(other: Body): boolean {
        return (this.layer & other.mask) !== 0 && (other.layer & this.mask) !== 0;
    }
}
