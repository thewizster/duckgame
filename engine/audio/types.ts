/** Oscillator waveform type */
export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** ADSR envelope parameters (all values in seconds, levels 0–1) */
export interface Envelope {
    attack?: number;    // time to peak (default 0.005)
    decay?: number;     // time from peak to sustain level (default 0)
    sustain?: number;   // level held after decay (default 1)
    release?: number;   // time from key-off to silence (default 0.05)
}

/** A single tone/note to be synthesised */
export interface ToneOptions {
    frequency: number;
    waveType?: WaveType;
    volume?: number;         // 0–1 (default 0.1)
    duration: number;        // seconds
    delay?: number;          // seconds before start (default 0)
    envelope?: Envelope;
    detune?: number;         // cents (default 0)
    pan?: number;            // -1 (left) to 1 (right)
    filterType?: BiquadFilterType;
    filterFreq?: number;     // Hz
    filterQ?: number;
}

/** A single step in a sequencer track */
export interface SequencerNote {
    frequency: number | null;  // null = rest
    duration?: number;         // override track default
    volume?: number;           // override track default
}

/** One voice/track in a music theme */
export interface SequencerTrack {
    notes: (number | null)[];       // frequencies; null = rest
    waveType?: WaveType;
    volume?: number;
    noteDurationRatio?: number;     // fraction of step time (default 0.75)
    octaveShift?: number;           // shift all notes by N octaves
    envelope?: Envelope;
    pan?: number;
}

/** A complete music theme with multiple tracks */
export interface MusicTheme {
    tracks: SequencerTrack[];
    tempo: number;          // ms per step
    name?: string;
    loop?: boolean;         // default true
}

/** A sound effect defined as a series of tone steps */
export interface SoundEffect {
    name?: string;
    steps: ToneOptions[];
}

/** Audio effect node configuration */
export interface EffectConfig {
    type: 'delay' | 'distortion' | 'filter' | 'compressor';
    params: Record<string, number>;
}
