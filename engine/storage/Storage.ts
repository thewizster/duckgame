/**
 * Type-safe localStorage wrapper for game persistence
 * (high scores, meta-progression, settings, achievements).
 *
 * ```ts
 * interface MetaData {
 *   bestDistance: number;
 *   totalRuns: number;
 *   achievements: string[];
 * }
 *
 * const meta = new GameStorage<MetaData>('duckrun_meta', {
 *   bestDistance: 0,
 *   totalRuns: 0,
 *   achievements: [],
 * });
 *
 * meta.data.bestDistance = 1500;
 * meta.save();
 *
 * // Later / next session:
 * const loaded = meta.data; // automatically loaded from localStorage
 * ```
 */
export class GameStorage<T extends Record<string, unknown>> {
    private key: string;
    private defaults: T;
    private _data: T;

    constructor(key: string, defaults: T) {
        this.key = key;
        this.defaults = { ...defaults };
        this._data = this.load();
    }

    /** Current data (loaded or default). */
    get data(): T {
        return this._data;
    }

    /** Save current data to localStorage. */
    save(): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(this._data));
        } catch {
            // localStorage full or unavailable — silently fail
        }
    }

    /** Load data from localStorage, falling back to defaults. */
    load(): T {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return { ...this.defaults };
            const parsed = JSON.parse(raw) as Partial<T>;
            // Merge with defaults so new fields get default values
            return { ...this.defaults, ...parsed };
        } catch {
            return { ...this.defaults };
        }
    }

    /** Reload from localStorage (discards unsaved in-memory changes). */
    reload(): void {
        this._data = this.load();
    }

    /** Reset to defaults and save. */
    reset(): void {
        this._data = { ...this.defaults };
        this.save();
    }

    /** Update specific fields and auto-save. */
    update(partial: Partial<T>): void {
        Object.assign(this._data, partial);
        this.save();
    }

    /** Delete the stored data from localStorage. */
    delete(): void {
        try {
            localStorage.removeItem(this.key);
        } catch {
            // Ignore
        }
    }

    /** Check if data exists in localStorage. */
    exists(): boolean {
        try {
            return localStorage.getItem(this.key) !== null;
        } catch {
            return false;
        }
    }
}

/**
 * Simple high-score table backed by localStorage.
 *
 * ```ts
 * const scores = new HighScoreTable('myGame_scores', 5);
 * if (scores.isTopScore(currentScore)) {
 *   scores.add('AAA', currentScore);
 * }
 * ```
 */
export class HighScoreTable {
    private storage: GameStorage<{ entries: HighScoreEntry[] }>;
    private maxEntries: number;

    constructor(key: string, maxEntries: number = 5) {
        this.maxEntries = maxEntries;
        this.storage = new GameStorage(key, { entries: [] });
    }

    get entries(): readonly HighScoreEntry[] {
        return this.storage.data.entries;
    }

    /** Check if a score qualifies for the table. */
    isTopScore(score: number): boolean {
        const entries = this.storage.data.entries;
        return entries.length < this.maxEntries || score > (entries[entries.length - 1]?.score ?? 0);
    }

    /** Add a new entry (auto-sorts and trims). */
    add(name: string, score: number, meta?: Record<string, unknown>): void {
        const entries = this.storage.data.entries;
        entries.push({ name, score, date: Date.now(), meta });
        entries.sort((a, b) => b.score - a.score);
        if (entries.length > this.maxEntries) entries.length = this.maxEntries;
        this.storage.save();
    }

    /** Clear all scores. */
    clear(): void {
        this.storage.data.entries = [];
        this.storage.save();
    }
}

export interface HighScoreEntry {
    name: string;
    score: number;
    date: number;
    meta?: Record<string, unknown>;
}
