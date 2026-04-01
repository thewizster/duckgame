import { Random } from '../math/Random';

/**
 * Utilities for procedural world generation in side-scrolling / endless games.
 * Manages a generation cursor that advances ahead of the camera, spawning
 * platforms, enemies, collectibles, etc. as the player moves forward.
 *
 * ```ts
 * const gen = new WorldGenerator(rng);
 *
 * gen.register('platform', {
 *   spacing: [85, 180],
 *   generator: (cursor) => ({
 *     x: cursor, y: rng.between(180, 315),
 *     width: rng.between(80, 200), height: 14,
 *   }),
 * });
 *
 * // Each frame:
 * const newPlatforms = gen.advance('platform', cameraX + 950);
 * ```
 */

export interface GeneratorRule<T> {
    /** Spacing range between generated objects [min, max] */
    spacing: [number, number];
    /** Factory function: receives the cursor X position, returns a new object */
    generator: (cursorX: number) => T;
    /** Initial cursor offset from world origin */
    startOffset?: number;
}

interface ActiveGenerator<T> {
    rule: GeneratorRule<T>;
    cursor: number;
}

export class WorldGenerator {
    private generators = new Map<string, ActiveGenerator<unknown>>();
    private rng: Random;

    constructor(rng?: Random) {
        this.rng = rng ?? new Random();
    }

    /**
     * Register a named generator rule.
     */
    register<T>(name: string, rule: GeneratorRule<T>): void {
        this.generators.set(name, {
            rule: rule as GeneratorRule<unknown>,
            cursor: rule.startOffset ?? 0,
        });
    }

    /**
     * Advance a generator up to `targetX`, producing all objects needed.
     * Returns an array of newly generated objects.
     */
    advance<T>(name: string, targetX: number): T[] {
        const gen = this.generators.get(name);
        if (!gen) return [];

        const results: T[] = [];
        while (gen.cursor < targetX) {
            const spacing = this.rng.between(gen.rule.spacing[0], gen.rule.spacing[1]);
            gen.cursor += spacing;
            if (gen.cursor < targetX) {
                results.push(gen.rule.generator(gen.cursor) as T);
            }
        }
        return results;
    }

    /**
     * Reset a generator's cursor position.
     */
    reset(name: string, cursor?: number): void {
        const gen = this.generators.get(name);
        if (gen) gen.cursor = cursor ?? (gen.rule.startOffset ?? 0);
    }

    /** Reset all generators. */
    resetAll(): void {
        for (const gen of this.generators.values()) {
            gen.cursor = gen.rule.startOffset ?? 0;
        }
    }

    /** Get the current cursor position for a generator. */
    getCursor(name: string): number {
        return this.generators.get(name)?.cursor ?? 0;
    }

    /** Set the cursor position directly. */
    setCursor(name: string, x: number): void {
        const gen = this.generators.get(name);
        if (gen) gen.cursor = x;
    }

    /** Remove a registered generator. */
    unregister(name: string): void {
        this.generators.delete(name);
    }
}

/**
 * Cull objects that have scrolled too far behind the camera.
 * Generic utility — works with any array of objects that have an `x` + `width`
 * (or just `x` for point objects).
 */
export function cullBehind<T extends { x: number; width?: number }>(
    objects: T[],
    cameraX: number,
    margin: number = 400,
): T[] {
    return objects.filter(obj => {
        const right = obj.x + (obj.width ?? 0);
        return right > cameraX - margin;
    });
}

/**
 * Infinite scrolling background helper: compute the wrap-around X offset
 * for a repeating background layer.
 */
export function scrollWrap(
    cameraX: number,
    parallaxSpeed: number,
    tileWidth: number,
): number {
    return -((cameraX * parallaxSpeed) % tileWidth + tileWidth) % tileWidth;
}
