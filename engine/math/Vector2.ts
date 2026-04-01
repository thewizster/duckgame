/**
 * Immutable-by-convention 2D vector with a full suite of operations.
 * Every mutating method returns a *new* Vector2 so call-sites stay predictable.
 * For hot-path code that cannot afford allocations, use the static `mut*` helpers
 * which write into an existing target.
 */
export class Vector2 {
    constructor(
        public readonly x: number = 0,
        public readonly y: number = 0,
    ) {}

    // ── Factories ──────────────────────────────────────────────

    static readonly ZERO  = new Vector2(0, 0);
    static readonly ONE   = new Vector2(1, 1);
    static readonly UP    = new Vector2(0, -1);
    static readonly DOWN  = new Vector2(0, 1);
    static readonly LEFT  = new Vector2(-1, 0);
    static readonly RIGHT = new Vector2(1, 0);

    static fromAngle(radians: number, length: number = 1): Vector2 {
        return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
    }

    static fromArray(arr: [number, number]): Vector2 {
        return new Vector2(arr[0], arr[1]);
    }

    // ── Arithmetic ─────────────────────────────────────────────

    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    mul(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vector2 {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    hadamard(other: Vector2): Vector2 {
        return new Vector2(this.x * other.x, this.y * other.y);
    }

    negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    // ── Geometry ───────────────────────────────────────────────

    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSq());
    }

    distanceTo(other: Vector2): number {
        return this.sub(other).length();
    }

    distanceToSq(other: Vector2): number {
        return this.sub(other).lengthSq();
    }

    normalize(): Vector2 {
        const len = this.length();
        return len === 0 ? Vector2.ZERO : this.div(len);
    }

    withLength(len: number): Vector2 {
        return this.normalize().mul(len);
    }

    clampLength(max: number): Vector2 {
        const sq = this.lengthSq();
        if (sq <= max * max) return this;
        return this.withLength(max);
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    angleTo(other: Vector2): number {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }

    rotate(radians: number): Vector2 {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos,
        );
    }

    perpCW(): Vector2 {
        return new Vector2(-this.y, this.x);
    }

    perpCCW(): Vector2 {
        return new Vector2(this.y, -this.x);
    }

    reflect(normal: Vector2): Vector2 {
        return this.sub(normal.mul(2 * this.dot(normal)));
    }

    lerp(target: Vector2, t: number): Vector2 {
        return new Vector2(
            this.x + (target.x - this.x) * t,
            this.y + (target.y - this.y) * t,
        );
    }

    // ── Comparison ─────────────────────────────────────────────

    equals(other: Vector2, epsilon: number = 0): boolean {
        return (
            Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon
        );
    }

    isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    // ── Mutation helpers (hot-path, write into existing target) ─

    static mutAdd(out: { x: number; y: number }, a: Vector2, b: Vector2): void {
        out.x = a.x + b.x;
        out.y = a.y + b.y;
    }

    static mutScale(out: { x: number; y: number }, v: Vector2, s: number): void {
        out.x = v.x * s;
        out.y = v.y * s;
    }

    // ── Serialisation ──────────────────────────────────────────

    toArray(): [number, number] {
        return [this.x, this.y];
    }

    toString(): string {
        return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}
