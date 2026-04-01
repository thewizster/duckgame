import { Vector2 } from './Vector2';

/**
 * Axis-aligned bounding box defined by position (top-left) and size.
 * Provides AABB collision tests, containment checks, and geometric helpers.
 */
export class Rect {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
    ) {}

    // ── Factories ──────────────────────────────────────────────

    static fromCenter(cx: number, cy: number, w: number, h: number): Rect {
        return new Rect(cx - w / 2, cy - h / 2, w, h);
    }

    static fromCorners(x1: number, y1: number, x2: number, y2: number): Rect {
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        return new Rect(minX, minY, Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    // ── Edges ──────────────────────────────────────────────────

    get left(): number { return this.x; }
    get right(): number { return this.x + this.width; }
    get top(): number { return this.y; }
    get bottom(): number { return this.y + this.height; }

    get centerX(): number { return this.x + this.width / 2; }
    get centerY(): number { return this.y + this.height / 2; }
    get center(): Vector2 { return new Vector2(this.centerX, this.centerY); }
    get position(): Vector2 { return new Vector2(this.x, this.y); }
    get size(): Vector2 { return new Vector2(this.width, this.height); }

    // ── Collision / containment ────────────────────────────────

    /** AABB overlap test */
    overlaps(other: Rect): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    /** AABB overlap with configurable inset (shrinks both rects) */
    overlapsWithInset(other: Rect, inset: number): boolean {
        return (
            this.x + inset < other.x + other.width - inset &&
            this.x + this.width - inset > other.x + inset &&
            this.y + inset < other.y + other.height - inset &&
            this.y + this.height - inset > other.y + inset
        );
    }

    /** Returns the overlap rectangle, or null if no overlap */
    intersection(other: Rect): Rect | null {
        const x = Math.max(this.x, other.x);
        const y = Math.max(this.y, other.y);
        const w = Math.min(this.right, other.right) - x;
        const h = Math.min(this.bottom, other.bottom) - y;
        if (w <= 0 || h <= 0) return null;
        return new Rect(x, y, w, h);
    }

    /** Minimum translation vector to separate this from other (push this out) */
    mtv(other: Rect): Vector2 | null {
        const dx1 = other.right - this.left;
        const dx2 = this.right - other.left;
        const dy1 = other.bottom - this.top;
        const dy2 = this.bottom - other.top;

        if (dx1 <= 0 || dx2 <= 0 || dy1 <= 0 || dy2 <= 0) return null;

        const minX = dx1 < dx2 ? dx1 : -dx2;
        const minY = dy1 < dy2 ? dy1 : -dy2;

        if (Math.abs(minX) < Math.abs(minY)) {
            return new Vector2(minX, 0);
        }
        return new Vector2(0, minY);
    }

    containsPoint(px: number, py: number): boolean {
        return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom;
    }

    containsRect(other: Rect): boolean {
        return (
            other.x >= this.x &&
            other.right <= this.right &&
            other.y >= this.y &&
            other.bottom <= this.bottom
        );
    }

    // ── Transforms ─────────────────────────────────────────────

    expand(amount: number): Rect {
        return new Rect(this.x - amount, this.y - amount, this.width + amount * 2, this.height + amount * 2);
    }

    translate(dx: number, dy: number): Rect {
        return new Rect(this.x + dx, this.y + dy, this.width, this.height);
    }

    setPosition(x: number, y: number): Rect {
        return new Rect(x, y, this.width, this.height);
    }

    // ── Serialisation ──────────────────────────────────────────

    clone(): Rect {
        return new Rect(this.x, this.y, this.width, this.height);
    }

    equals(other: Rect): boolean {
        return this.x === other.x && this.y === other.y &&
            this.width === other.width && this.height === other.height;
    }

    toString(): string {
        return `Rect(${this.x}, ${this.y}, ${this.width}x${this.height})`;
    }
}
