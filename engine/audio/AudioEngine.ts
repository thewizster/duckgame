import type { ToneOptions, WaveType, Envelope, SoundEffect } from './types';

/**
 * Zero-dependency digital audio synthesiser built on the Web Audio API.
 *
 * Features:
 * - Oscillator-based tone generation with all standard waveforms
 * - Full ADSR envelope shaping
 * - Per-voice filter, detune, and stereo panning
 * - Master gain with channel bus architecture
 * - SFX playback from declarative definitions
 * - Safe initialisation respecting browser autoplay policy
 *
 * ```ts
 * const audio = new AudioEngine();
 * audio.playTone({ frequency: 440, duration: 0.3, waveType: 'square' });
 * audio.playSfx(mySfxDef);
 * ```
 */
export class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private _masterVolume: number = 1;
    private _sfxVolume: number = 1;
    private _musicVolume: number = 1;
    private _muted: boolean = false;

    /** Lazily initialise the AudioContext (must happen after user gesture). */
    init(): AudioContext {
        if (this.ctx) return this.ctx;
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this._muted ? 0 : this._masterVolume;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this._sfxVolume;
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this._musicVolume;
        this.musicGain.connect(this.masterGain);

        return this.ctx;
    }

    /** Whether the AudioContext has been created */
    get initialized(): boolean { return this.ctx !== null; }

    /** The raw AudioContext (null before init) */
    get context(): AudioContext | null { return this.ctx; }

    /** Resume a suspended context (e.g. after tab switch) */
    resume(): void {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ── Volume controls ────────────────────────────────────────

    get masterVolume(): number { return this._masterVolume; }
    set masterVolume(v: number) {
        this._masterVolume = Math.max(0, Math.min(1, v));
        if (this.masterGain && !this._muted) {
            this.masterGain.gain.value = this._masterVolume;
        }
    }

    get sfxVolume(): number { return this._sfxVolume; }
    set sfxVolume(v: number) {
        this._sfxVolume = Math.max(0, Math.min(1, v));
        if (this.sfxGain) this.sfxGain.gain.value = this._sfxVolume;
    }

    get musicVolume(): number { return this._musicVolume; }
    set musicVolume(v: number) {
        this._musicVolume = Math.max(0, Math.min(1, v));
        if (this.musicGain) this.musicGain.gain.value = this._musicVolume;
    }

    get muted(): boolean { return this._muted; }
    set muted(v: boolean) {
        this._muted = v;
        if (this.masterGain) {
            this.masterGain.gain.value = v ? 0 : this._masterVolume;
        }
    }

    toggleMute(): boolean {
        this.muted = !this._muted;
        return this._muted;
    }

    // ── Tone synthesis ─────────────────────────────────────────

    /**
     * Play a single synthesised tone with full control over waveform,
     * envelope, filter, panning, and timing.
     */
    playTone(opts: ToneOptions, bus: 'sfx' | 'music' = 'sfx'): OscillatorNode | null {
        const ctx = this.ctx;
        if (!ctx) return null;

        const destination = bus === 'music' ? this.musicGain! : this.sfxGain!;
        const now = ctx.currentTime + (opts.delay ?? 0);
        const vol = opts.volume ?? 0.1;
        const dur = opts.duration;
        const env = opts.envelope ?? {};

        const attack  = env.attack  ?? 0.005;
        const decay   = env.decay   ?? 0;
        const sustain = env.sustain ?? 1;
        const release = env.release ?? 0.05;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = opts.waveType ?? 'sine';
            osc.frequency.setValueAtTime(opts.frequency, now);
            if (opts.detune) osc.detune.setValueAtTime(opts.detune, now);

            // ADSR envelope
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(vol, now + attack);
            if (decay > 0) {
                gain.gain.linearRampToValueAtTime(vol * sustain, now + attack + decay);
            }
            const noteOff = now + dur;
            gain.gain.setValueAtTime(vol * sustain, noteOff);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteOff + release);

            // Build audio graph: osc → [filter] → gain → [panner] → destination
            let source: AudioNode = osc;

            if (opts.filterType && opts.filterFreq) {
                const filter = ctx.createBiquadFilter();
                filter.type = opts.filterType;
                filter.frequency.setValueAtTime(opts.filterFreq, now);
                if (opts.filterQ) filter.Q.setValueAtTime(opts.filterQ, now);
                source.connect(filter);
                source = filter;
            }

            source.connect(gain);

            if (opts.pan !== undefined && opts.pan !== 0) {
                const panner = ctx.createStereoPanner();
                panner.pan.setValueAtTime(Math.max(-1, Math.min(1, opts.pan)), now);
                gain.connect(panner);
                panner.connect(destination);
            } else {
                gain.connect(destination);
            }

            osc.start(now);
            osc.stop(noteOff + release + 0.05);

            return osc;
        } catch {
            return null;
        }
    }

    /**
     * Play a pre-defined sound effect (a series of tones).
     */
    playSfx(sfx: SoundEffect): void {
        for (const step of sfx.steps) {
            this.playTone(step, 'sfx');
        }
    }

    /**
     * Convenience: play a quick tone with minimal parameters.
     */
    beep(
        frequency: number,
        duration: number = 0.1,
        waveType: WaveType = 'square',
        volume: number = 0.08,
    ): void {
        this.playTone({ frequency, duration, waveType, volume });
    }

    /**
     * Play a sequence of frequencies as an arpeggio.
     */
    arpeggio(
        frequencies: number[],
        stepDuration: number = 0.1,
        waveType: WaveType = 'square',
        volume: number = 0.08,
    ): void {
        for (let i = 0; i < frequencies.length; i++) {
            this.playTone({
                frequency: frequencies[i]!,
                duration: stepDuration,
                waveType,
                volume,
                delay: i * stepDuration,
            });
        }
    }

    /**
     * Play a descending tone sweep (useful for death/failure SFX).
     */
    sweep(
        startFreq: number,
        endFreq: number,
        duration: number = 0.3,
        waveType: WaveType = 'sawtooth',
        volume: number = 0.1,
    ): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const now = ctx.currentTime;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = waveType;
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + duration);
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            osc.connect(gain);
            gain.connect(this.sfxGain ?? ctx.destination);
            osc.start(now);
            osc.stop(now + duration + 0.05);
        } catch { /* ignore */ }
    }

    /**
     * Generate white noise burst (useful for percussion / explosions).
     */
    noise(duration: number = 0.15, volume: number = 0.06): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const now = ctx.currentTime;
        try {
            const bufferSize = Math.ceil(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            source.connect(gain);
            gain.connect(this.sfxGain ?? ctx.destination);
            source.start(now);
            source.stop(now + duration + 0.05);
        } catch { /* ignore */ }
    }

    // ── Utility ────────────────────────────────────────────────

    /** Get the destination node for the music bus (for Sequencer connection) */
    getMusicDestination(): AudioNode {
        return this.musicGain ?? this.ctx?.destination ?? new GainNode(this.init());
    }

    /** Get the destination node for the SFX bus */
    getSfxDestination(): AudioNode {
        return this.sfxGain ?? this.ctx?.destination ?? new GainNode(this.init());
    }

    /** Current audio context time in seconds */
    get currentTime(): number {
        return this.ctx?.currentTime ?? 0;
    }

    /** Dispose of all audio resources */
    dispose(): void {
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
            this.masterGain = null;
            this.sfxGain = null;
            this.musicGain = null;
        }
    }
}
