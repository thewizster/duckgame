/**
 * Generic object pool for reducing garbage collection pressure.
 * Pre-allocates a set of objects and recycles them instead of
 * creating/destroying instances every frame.
 *
 * ```ts
 * const bulletPool = new ObjectPool(
 *   () => ({ x: 0, y: 0, dx: 0, dy: 0, active: false }),
 *   bullet => { bullet.active = false; },
 *   200,
 * );
 *
 * const b = bulletPool.acquire();
 * b.x = player.x; b.y = player.y; b.active = true;
 * // later:
 * bulletPool.release(b);
 * ```
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private reset: (obj: T) => void;

    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        initialSize: number = 0,
    ) {
        this.factory = factory;
        this.reset = reset;

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    /** Get an object from the pool (creates one if empty). */
    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.factory();
    }

    /** Return an object to the pool for reuse. */
    release(obj: T): void {
        this.reset(obj);
        this.pool.push(obj);
    }

    /** Release all objects in a list back to the pool and clear the list. */
    releaseAll(objects: T[]): void {
        for (const obj of objects) {
            this.reset(obj);
            this.pool.push(obj);
        }
        objects.length = 0;
    }

    /** Number of objects currently available in the pool. */
    get available(): number {
        return this.pool.length;
    }

    /** Pre-allocate additional objects. */
    warm(count: number): void {
        for (let i = 0; i < count; i++) {
            this.pool.push(this.factory());
        }
    }

    /** Clear the pool entirely. */
    drain(): void {
        this.pool.length = 0;
    }
}
