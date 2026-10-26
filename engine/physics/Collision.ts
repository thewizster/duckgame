import { Vector2 } from '../math/Vector2';
import { Rect } from '../math/Rect';
import { Body } from './Body';

/**
 * Collision detection results and resolution utilities.
 */

/** Result of a collision test between two bodies */
export interface CollisionResult {
    bodyA: Body;
    bodyB: Body;
    /** Minimum translation vector to separate A from B */
    mtv: Vector2;
    /** Which side of A was hit: 'top' | 'bottom' | 'left' | 'right' */
    sideA: 'top' | 'bottom' | 'left' | 'right';
    /** Overlap depth */
    depth: number;
}

/**
 * Test AABB overlap between two bodies and compute the collision result.
 * Returns null if no overlap.
 */
export function testCollision(a: Body, b: Body): CollisionResult | null {
    const ar = a.rect;
    const br = b.rect;
    const mtv = ar.mtv(br);
    if (!mtv) return null;

    let side: CollisionResult['sideA'];
    if (mtv.x !== 0) {
        side = mtv.x > 0 ? 'left' : 'right';
    } else {
        side = mtv.y > 0 ? 'top' : 'bottom';
    }

    return {
        bodyA: a,
        bodyB: b,
        mtv,
        sideA: side,
        depth: Math.abs(mtv.x) + Math.abs(mtv.y),
    };
}

/**
 * Test overlap between two Rects (non-body convenience).
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
    return a.overlaps(b);
}

/**
 * Test if a moving AABB will hit a static AABB (swept AABB).
 * Returns the time of impact [0,1] or null if no hit within this step.
 */
export function sweepAABB(
    mover: Rect,
    velocity: Vector2,
    target: Rect,
): { time: number; normal: Vector2 } | null {
    // Minkowski expansion
    const expanded = new Rect(
        target.x - mover.width,
        target.y - mover.height,
        target.width + mover.width,
        target.height + mover.height,
    );

    // Ray vs expanded AABB
    const origin = new Vector2(mover.x, mover.y);
    return rayVsRect(origin, velocity, expanded);
}

/**
 * Ray vs AABB intersection.
 * Returns { time, normal } or null.
 */
export function rayVsRect(
    origin: Vector2,
    direction: Vector2,
    rect: Rect,
): { time: number; normal: Vector2 } | null {
    let tNear = new Vector2(
        (rect.x - origin.x) / direction.x,
        (rect.y - origin.y) / direction.y,
    );
    let tFar = new Vector2(
        (rect.right - origin.x) / direction.x,
        (rect.bottom - origin.y) / direction.y,
    );

    if (isNaN(tNear.x) || isNaN(tNear.y) || isNaN(tFar.x) || isNaN(tFar.y)) return null;

    if (tNear.x > tFar.x) { const tmp = tNear.x; tNear = new Vector2(tFar.x, tNear.y); tFar = new Vector2(tmp, tFar.y); }
    if (tNear.y > tFar.y) { const tmp = tNear.y; tNear = new Vector2(tNear.x, tFar.y); tFar = new Vector2(tFar.x, tmp); }

    if (tNear.x > tFar.y || tNear.y > tFar.x) return null;

    const tHitNear = Math.max(tNear.x, tNear.y);
    const tHitFar = Math.min(tFar.x, tFar.y);

    if (tHitFar < 0 || tHitNear > 1) return null;

    let normal: Vector2;
    if (tNear.x > tNear.y) {
        normal = direction.x < 0 ? Vector2.RIGHT : Vector2.LEFT;
    } else {
        normal = direction.y < 0 ? Vector2.DOWN : Vector2.UP;
    }

    return { time: Math.max(0, tHitNear), normal };
}

/**
 * Resolve a dynamic body's position after colliding with a static/platform body.
 * Only resolves along the MTV axis. Zeroes velocity on the resolved axis.
 */
export function resolveCollision(dynamic: Body, collision: CollisionResult): void {
    const mtv = collision.mtv;
    dynamic.position = new Vector2(
        dynamic.position.x + mtv.x,
        dynamic.position.y + mtv.y,
    );

    if (mtv.x !== 0) {
        dynamic.velocity = new Vector2(0, dynamic.velocity.y);
    }
    if (mtv.y !== 0) {
        dynamic.velocity = new Vector2(dynamic.velocity.x, 0);
        if (mtv.y < 0) {
            dynamic.grounded = true;
        }
    }
}

/**
 * Broad-phase collision pair generation using spatial grid.
 */
export class SpatialGrid {
    private cellSize: number;
    private grid = new Map<string, Body[]>();

    constructor(cellSize: number = 128) {
        this.cellSize = cellSize;
    }

    clear(): void {
        this.grid.clear();
    }

    insert(body: Body): void {
        const minCX = Math.floor(body.left / this.cellSize);
        const maxCX = Math.floor(body.right / this.cellSize);
        const minCY = Math.floor(body.top / this.cellSize);
        const maxCY = Math.floor(body.bottom / this.cellSize);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const key = `${cx},${cy}`;
                let cell = this.grid.get(key);
                if (!cell) {
                    cell = [];
                    this.grid.set(key, cell);
                }
                cell.push(body);
            }
        }
    }

    /** Get all potential collision pairs (no duplicates). */
    getPairs(): [Body, Body][] {
        const pairs: [Body, Body][] = [];
        const seen = new Set<string>();

        for (const cell of this.grid.values()) {
            for (let i = 0; i < cell.length; i++) {
                for (let j = i + 1; j < cell.length; j++) {
                    const a = cell[i]!;
                    const b = cell[j]!;
                    // Deterministic pair key to avoid duplicates
                    const key = a < b ? `${idOf(a)}-${idOf(b)}` : `${idOf(b)}-${idOf(a)}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        pairs.push([a, b]);
                    }
                }
            }
        }
        return pairs;
    }

    /** Query all bodies overlapping a rect. */
    query(rect: Rect): Body[] {
        const result: Body[] = [];
        const seen = new Set<Body>();
        const minCX = Math.floor(rect.left / this.cellSize);
        const maxCX = Math.floor(rect.right / this.cellSize);
        const minCY = Math.floor(rect.top / this.cellSize);
        const maxCY = Math.floor(rect.bottom / this.cellSize);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const cell = this.grid.get(`${cx},${cy}`);
                if (!cell) continue;
                for (const body of cell) {
                    if (!seen.has(body) && body.rect.overlaps(rect)) {
                        seen.add(body);
                        result.push(body);
                    }
                }
            }
        }
        return result;
    }
}

// Simple identity for pair dedup
let nextId = 0;
const bodyIds = new WeakMap<Body, number>();
function idOf(body: Body): number {
    let id = bodyIds.get(body);
    if (id === undefined) {
        id = nextId++;
        bodyIds.set(body, id);
    }
    return id;
}
