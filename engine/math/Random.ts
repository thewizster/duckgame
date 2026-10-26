/**
 * Deterministic and non-deterministic random utilities for game development.
 * Includes a seedable PRNG (xoshiro128**) so runs can be replayed, plus
 * convenience helpers for common game-dev patterns.
 */
export class Random {
    private s: Uint32Array;

    constructor(seed?: number) {
        this.s = new Uint32Array(4);
        this.seed(seed ?? (Math.random() * 0xffffffff) >>> 0);
    }

    /** Re-seed the generator */
    seed(value: number): void {
        // SplitMix32 to expand a single seed into 4 state words
        let z = value >>> 0;
        for (let i = 0; i < 4; i++) {
            z = (z + 0x9e3779b9) >>> 0;
            let t = z ^ (z >>> 16);
            t = Math.imul(t, 0x21f0aaad);
            t = t ^ (t >>> 15);
            t = Math.imul(t, 0x735a2d97);
            t = t ^ (t >>> 15);
            this.s[i] = t >>> 0;
        }
    }

    /** Raw unsigned 32-bit integer */
    nextU32(): number {
        const s = this.s;
        const result = (Math.imul(s[1]! * 5, 1 << 7 | 1) + s[0]!) >>> 0;
        const t = (s[1]! << 9) >>> 0;
        s[2] = (s[2]! ^ s[0]!) >>> 0;
        s[3] = (s[3]! ^ s[1]!) >>> 0;
        s[1] = (s[1]! ^ s[2]!) >>> 0;
        s[0] = (s[0]! ^ s[3]!) >>> 0;
        s[2] = (s[2]! ^ t) >>> 0;
        s[3] = ((s[3]! << 11) | (s[3]! >>> 21)) >>> 0;
        return result;
    }

    /** Float in [0, 1) */
    next(): number {
        return this.nextU32() / 0x100000000;
    }

    /** Float in [min, max) */
    between(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /** Integer in [min, max] inclusive */
    int(min: number, max: number): number {
        return Math.floor(this.between(min, max + 1));
    }

    /** Boolean with given probability of true (default 0.5) */
    chance(probability: number = 0.5): boolean {
        return this.next() < probability;
    }

    /** Pick a random element from an array */
    pick<T>(array: readonly T[]): T {
        return array[Math.floor(this.next() * array.length)]!;
    }

    /** Pick N unique elements from an array */
    pickN<T>(array: readonly T[], n: number): T[] {
        const copy = array.slice();
        this.shuffle(copy);
        return copy.slice(0, Math.min(n, copy.length));
    }

    /** Fisher-Yates shuffle (in-place) */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            const tmp = array[i]!;
            array[i] = array[j]!;
            array[j] = tmp;
        }
        return array;
    }

    /** Random angle in [0, 2π) */
    angle(): number {
        return this.next() * Math.PI * 2;
    }

    /** Random sign: -1 or 1 */
    sign(): number {
        return this.chance() ? 1 : -1;
    }

    /** Gaussian (normal) distribution via Box-Muller */
    gaussian(mean: number = 0, stddev: number = 1): number {
        const u1 = this.next() || 0.0001;
        const u2 = this.next();
        return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    /** Weighted random index: weights don't need to sum to 1 */
    weightedIndex(weights: number[]): number {
        let total = 0;
        for (let i = 0; i < weights.length; i++) total += weights[i]!;
        let r = this.next() * total;
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i]!;
            if (r <= 0) return i;
        }
        return weights.length - 1;
    }
}

/** Global non-deterministic random instance for convenience */
export const random = new Random();
