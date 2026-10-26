import type { SoundEffect, ToneOptions, WaveType, Envelope } from './types';

/**
 * Declarative builder for sound effects. Chain tone steps together to
 * create complex SFX from pure synthesis — no audio files needed.
 *
 * ```ts
 * const jumpSfx = sfx()
 *   .tone(260, 0.08, 'square', 0.10)
 *   .tone(360, 0.07, 'square', 0.07, 0.07)
 *   .build();
 *
 * const deathSfx = sfx()
 *   .descending([380, 280, 200, 130, 90], 0.14, 'sawtooth', 0.11, 0.11)
 *   .build();
 *
 * audio.playSfx(jumpSfx);
 * ```
 */
export class SfxBuilder {
    private steps: ToneOptions[] = [];
    private _name: string = '';

    /** Set a name for the SFX. */
    name(n: string): this {
        this._name = n;
        return this;
    }

    /** Add a single tone step. */
    tone(
        frequency: number,
        duration: number,
        waveType: WaveType = 'square',
        volume: number = 0.1,
        delay: number = 0,
        envelope?: Envelope,
    ): this {
        this.steps.push({ frequency, duration, waveType, volume, delay, envelope });
        return this;
    }

    /** Add a tone with full options. */
    add(opts: ToneOptions): this {
        this.steps.push(opts);
        return this;
    }

    /**
     * Add a descending sequence of tones (great for death/fall sounds).
     * Each note is delayed by `spacing` from the previous.
     */
    descending(
        frequencies: number[],
        duration: number = 0.14,
        waveType: WaveType = 'sawtooth',
        volume: number = 0.11,
        spacing: number = 0.11,
    ): this {
        for (let i = 0; i < frequencies.length; i++) {
            this.steps.push({
                frequency: frequencies[i]!,
                duration,
                waveType,
                volume,
                delay: i * spacing,
            });
        }
        return this;
    }

    /**
     * Add an ascending sequence of tones (great for power-up/victory sounds).
     */
    ascending(
        frequencies: number[],
        duration: number = 0.11,
        waveType: WaveType = 'square',
        volume: number = 0.09,
        spacing: number = 0.09,
    ): this {
        return this.descending(frequencies, duration, waveType, volume, spacing);
    }

    /**
     * Add a two-tone chirp (up or down).
     */
    chirp(
        freq1: number,
        freq2: number,
        duration: number = 0.08,
        waveType: WaveType = 'square',
        volume: number = 0.10,
        gap: number = 0.07,
    ): this {
        this.steps.push({ frequency: freq1, duration, waveType, volume, delay: 0 });
        this.steps.push({ frequency: freq2, duration, waveType, volume: volume * 0.7, delay: gap });
        return this;
    }

    /**
     * Add simultaneous tones (chord hit, impact layering).
     */
    chord(
        frequencies: number[],
        duration: number = 0.18,
        waveType: WaveType = 'sawtooth',
        volume: number = 0.08,
        delay: number = 0,
    ): this {
        for (const freq of frequencies) {
            this.steps.push({ frequency: freq, duration, waveType, volume, delay });
        }
        return this;
    }

    /** Build the final SoundEffect definition. */
    build(): SoundEffect {
        return {
            name: this._name || undefined,
            steps: [...this.steps],
        };
    }
}

/** Create a new SfxBuilder */
export function sfx(): SfxBuilder {
    return new SfxBuilder();
}

// ── Pre-built common SFX ───────────────────────────────────

export const CommonSfx = {
    jump: sfx().chirp(260, 360, 0.08, 'square', 0.10, 0.07).build(),
    burst: sfx().chirp(200, 550, 0.07, 'sawtooth', 0.14, 0.05).build(),
    hit: sfx()
        .tone(140, 0.18, 'sawtooth', 0.16)
        .tone(80, 0.25, 'sawtooth', 0.10)
        .build(),
    die: sfx().descending([380, 280, 200, 130, 90], 0.14, 'sawtooth', 0.11, 0.11).build(),
    collect: sfx().chirp(900, 1200, 0.06, 'sine', 0.09, 0.055).build(),
    upgrade: sfx().ascending([523, 659, 784, 1047], 0.11, 'square', 0.09, 0.09).build(),
    kill: sfx().chirp(600, 400, 0.05, 'square', 0.08, 0.055).build(),
    heal: sfx().tone(520, 0.09, 'sine', 0.05).build(),
    alert: sfx().descending([262, 196, 262, 196], 0.18, 'sawtooth', 0.14, 0.18).build(),
    menuSelect: sfx().tone(440, 0.06, 'square', 0.06).build(),
    menuConfirm: sfx().chirp(440, 660, 0.06, 'square', 0.08, 0.06).build(),
} as const;
