import { Vector2 } from '../math/Vector2';
import { Body } from './Body';
import {
    testCollision,
    resolveCollision,
    SpatialGrid,
    type CollisionResult,
} from './Collision';

/**
 * Callback signature for collision events.
 */
export type CollisionCallback = (result: CollisionResult) => void;

/**
 * Configuration for a physics zone (water, lava, etc.).
 */
export interface PhysicsZone {
    /** Zone name for identification */
    name: string;
    /** World-space Y coordinate where the zone starts */
    y: number;
    /** Gravity multiplier inside this zone */
    gravityScale: number;
    /** Maximum fall speed inside this zone */
    maxFallSpeed: number;
    /** Damage per second to bodies inside this zone (0 = safe) */
    damagePerSecond: number;
    /** Whether the zone is lethal on contact */
    lethal: boolean;
}

/**
 * Physics simulation world. Manages bodies, applies gravity, handles
 * collisions, and supports environmental zones.
 *
 * ```ts
 * const physics = new PhysicsWorld();
 * physics.gravity = new Vector2(0, 600); // pixels/sec²
 * physics.addBody(player);
 * physics.addBody(platform);
 * physics.onCollision('player', 'platform', handleLanding);
 * physics.update(dt);
 * ```
 */
export class PhysicsWorld {
    /** Global gravity in pixels/sec² */
    gravity: Vector2 = new Vector2(0, 450);

    /** All active bodies */
    private bodies: Body[] = [];

    /** Environmental zones */
    private zones: PhysicsZone[] = [];

    /** Collision callbacks keyed by tag pair */
    private collisionCallbacks = new Map<string, CollisionCallback[]>();

    /** Spatial grid for broad-phase */
    private grid: SpatialGrid;

    /** Collisions detected this frame */
    private frameCollisions: CollisionResult[] = [];

    constructor(cellSize: number = 128) {
        this.grid = new SpatialGrid(cellSize);
    }

    // ── Body management ────────────────────────────────────────

    addBody(body: Body): void {
        this.bodies.push(body);
    }

    removeBody(body: Body): void {
        const idx = this.bodies.indexOf(body);
        if (idx !== -1) this.bodies.splice(idx, 1);
    }

    getBodies(): readonly Body[] {
        return this.bodies;
    }

    getBodiesByTag(tag: string): Body[] {
        return this.bodies.filter(b => b.tag === tag);
    }

    clearBodies(): void {
        this.bodies.length = 0;
    }

    // ── Zone management ────────────────────────────────────────

    addZone(zone: PhysicsZone): void {
        this.zones.push(zone);
    }

    removeZone(name: string): void {
        this.zones = this.zones.filter(z => z.name !== name);
    }

    clearZones(): void {
        this.zones.length = 0;
    }

    /** Check which zone a body is in (returns the first matching zone, or null). */
    getZoneFor(body: Body): PhysicsZone | null {
        for (const zone of this.zones) {
            if (body.bottom > zone.y) return zone;
        }
        return null;
    }

    // ── Collision callbacks ────────────────────────────────────

    /**
     * Register a callback for when two tagged bodies collide.
     * Order doesn't matter — callback fires for either order.
     */
    onCollision(tagA: string, tagB: string, callback: CollisionCallback): () => void {
        const key1 = `${tagA}:${tagB}`;
        const key2 = `${tagB}:${tagA}`;

        for (const key of [key1, key2]) {
            let list = this.collisionCallbacks.get(key);
            if (!list) {
                list = [];
                this.collisionCallbacks.set(key, list);
            }
            list.push(callback);
        }

        return () => {
            for (const key of [key1, key2]) {
                const list = this.collisionCallbacks.get(key);
                if (list) {
                    const idx = list.indexOf(callback);
                    if (idx !== -1) list.splice(idx, 1);
                }
            }
        };
    }

    /** Get all collisions detected in the last update. */
    getCollisions(): readonly CollisionResult[] {
        return this.frameCollisions;
    }

    // ── Simulation step ────────────────────────────────────────

    /**
     * Step the physics simulation forward by dt seconds.
     */
    update(dt: number): void {
        this.frameCollisions.length = 0;

        // 1. Apply gravity and velocity to dynamic bodies
        for (const body of this.bodies) {
            if (!body.active) continue;
            if (body.type !== 'dynamic') continue;

            body.grounded = false;

            // Determine effective gravity (zone or global)
            const zone = this.getZoneFor(body);
            let effGravity = this.gravity.mul(body.gravityScale);
            let maxFall = body.maxFallSpeed;

            if (zone) {
                effGravity = effGravity.mul(zone.gravityScale);
                maxFall = zone.maxFallSpeed;
            }

            // Apply gravity to velocity
            body.velocity = new Vector2(
                body.velocity.x,
                body.velocity.y + effGravity.y * dt,
            );

            // Clamp fall speed
            if (body.velocity.y > maxFall * 60 * dt) {
                body.velocity = new Vector2(body.velocity.x, maxFall * 60 * dt);
            }

            // Apply velocity to position
            body.position = new Vector2(
                body.position.x + body.velocity.x * dt,
                body.position.y + body.velocity.y * dt,
            );

            // Tick invincibility
            if (body.invincible > 0) body.invincible--;
        }

        // 2. Apply velocity to kinematic bodies (no gravity)
        for (const body of this.bodies) {
            if (!body.active) continue;
            if (body.type !== 'kinematic') continue;
            body.position = new Vector2(
                body.position.x + body.velocity.x * dt,
                body.position.y + body.velocity.y * dt,
            );
        }

        // 3. Broad-phase: populate spatial grid
        this.grid.clear();
        for (const body of this.bodies) {
            if (!body.active) continue;
            this.grid.insert(body);
        }

        // 4. Narrow-phase: test all candidate pairs
        const pairs = this.grid.getPairs();
        for (const [a, b] of pairs) {
            if (!a.canCollideWith(b)) continue;

            const result = testCollision(a, b);
            if (!result) continue;

            this.frameCollisions.push(result);

            // Resolve dynamic vs static/platform
            if (a.type === 'dynamic' && (b.type === 'static' || b.type === 'kinematic')) {
                resolveCollision(a, result);
            } else if (b.type === 'dynamic' && (a.type === 'static' || a.type === 'kinematic')) {
                // Invert result for b
                resolveCollision(b, {
                    ...result,
                    bodyA: b,
                    bodyB: a,
                    mtv: result.mtv.negate(),
                    sideA: flipSide(result.sideA),
                });
            }

            // Fire tag-based collision callbacks
            const key = `${a.tag}:${b.tag}`;
            const callbacks = this.collisionCallbacks.get(key);
            if (callbacks) {
                for (const cb of callbacks) cb(result);
            }
        }
    }
}

function flipSide(side: CollisionResult['sideA']): CollisionResult['sideA'] {
    switch (side) {
        case 'top': return 'bottom';
        case 'bottom': return 'top';
        case 'left': return 'right';
        case 'right': return 'left';
    }
}
