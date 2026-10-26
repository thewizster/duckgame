import type { MusicTheme, SequencerTrack, WaveType, Envelope } from './types';
import { AudioEngine } from './AudioEngine';

/**
 * Multi-track music sequencer that plays looping themes using the AudioEngine.
 *
 * Each theme is a set of tracks (voices) with note sequences, tempos, and
 * per-track waveform/volume/envelope settings. The sequencer schedules notes
 * ahead of time using Web Audio API timing for sample-accurate playback.
 *
 * ```ts
 * const seq = new Sequencer(audioEngine);
 * seq.play(oceanTheme);
 * // later...
 * seq.crossfadeTo(swampTheme, 1.0); // 1 second crossfade
 * seq.stop();
 * ```
 */
export class Sequencer {
    private audio: AudioEngine;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private currentTheme: MusicTheme | null = null;
    private step: number = 0;
    private _playing: boolean = false;

    // Crossfade state
    private fadeOutInterval: ReturnType<typeof setInterval> | null = null;

    constructor(audio: AudioEngine) {
        this.audio = audio;
    }

    get playing(): boolean { return this._playing; }
    get theme(): MusicTheme | null { return this.currentTheme; }

    /**
     * Start playing a music theme. If already playing the same theme, does nothing.
     * If playing a different theme, stops the old one first.
     */
    play(theme: MusicTheme): void {
        if (this.currentTheme === theme && this._playing) return;
        this.stop();

        this.audio.init();
        this.currentTheme = theme;
        this._playing = true;
        this.step = 0;

        this.intervalId = setInterval(() => {
            if (!this._playing || !this.currentTheme) return;
            this.scheduleStep();
            this.step++;

            // Check if all tracks have completed (for non-looping themes)
            if (theme.loop === false) {
                const maxLen = Math.max(...theme.tracks.map(t => t.notes.length));
                if (this.step >= maxLen) {
                    this.stop();
                }
            }
        }, theme.tempo);
    }

    /** Stop playback immediately. */
    stop(): void {
        this._playing = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.fadeOutInterval !== null) {
            clearInterval(this.fadeOutInterval);
            this.fadeOutInterval = null;
        }
        this.currentTheme = null;
        this.step = 0;
    }

    /** Switch to a new theme with an optional crossfade duration (seconds). */
    crossfadeTo(theme: MusicTheme, duration: number = 0.5): void {
        if (this.currentTheme === theme && this._playing) return;

        if (!this._playing || duration <= 0) {
            this.play(theme);
            return;
        }

        // Store old music volume, fade it out, then start new theme
        const oldVolume = this.audio.musicVolume;
        const fadeSteps = Math.max(1, Math.floor(duration * 20)); // 20 steps/sec
        const fadeInterval = (duration * 1000) / fadeSteps;
        let fadeStep = 0;

        this.fadeOutInterval = setInterval(() => {
            fadeStep++;
            const t = fadeStep / fadeSteps;
            this.audio.musicVolume = oldVolume * (1 - t);

            if (fadeStep >= fadeSteps) {
                if (this.fadeOutInterval !== null) {
                    clearInterval(this.fadeOutInterval);
                    this.fadeOutInterval = null;
                }
                this.stop();
                this.audio.musicVolume = oldVolume;
                this.play(theme);
            }
        }, fadeInterval);
    }

    /** Pause playback (can be resumed). */
    pause(): void {
        this._playing = false;
    }

    /** Resume paused playback. */
    resume(): void {
        if (this.currentTheme && !this._playing) {
            this._playing = true;
        }
    }

    private scheduleStep(): void {
        const theme = this.currentTheme;
        if (!theme) return;

        for (const track of theme.tracks) {
            const noteIdx = this.step % track.notes.length;
            let freq = track.notes[noteIdx] ?? null;
            if (freq === null) continue; // rest

            // Apply octave shift
            if (track.octaveShift) {
                freq = freq * Math.pow(2, track.octaveShift);
            }

            const ratio = track.noteDurationRatio ?? 0.75;
            const dur = (theme.tempo / 1000) * ratio;

            this.audio.playTone({
                frequency: freq,
                waveType: (track.waveType ?? 'square') as WaveType,
                volume: track.volume ?? 0.07,
                duration: dur,
                envelope: track.envelope as Envelope | undefined,
                pan: track.pan,
            }, 'music');
        }
    }
}

// ── Theme builder helpers ──────────────────────────────────

/**
 * Build a SequencerTrack from a concise note array.
 */
export function track(
    notes: (number | null)[],
    opts: Partial<Omit<SequencerTrack, 'notes'>> = {},
): SequencerTrack {
    return { notes, ...opts };
}

/**
 * Build a MusicTheme from tracks and tempo.
 */
export function theme(
    tracks: SequencerTrack[],
    tempo: number,
    name?: string,
): MusicTheme {
    return { tracks, tempo, name, loop: true };
}
