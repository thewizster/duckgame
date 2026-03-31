export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ToneOptions {
    frequency: number;
    waveType?: WaveType;
    volume?: number;
    duration: number;
    delay?: number;
    attack?: number;   // seconds (default 0.001)
    sustain?: number;  // 0-1 level after attack (default 1)
    release?: number;  // seconds (default = duration)
}

export interface SequencerNote {
    frequency: number | null;
    duration?: number; // override track default
}

export interface SequencerTrack {
    notes: (number | null)[];
    waveType?: WaveType;
    volume?: number;
    noteDurationRatio?: number; // fraction of step time (default 0.75)
    octaveShift?: number; // shift all notes by N octaves
}

export interface MusicTheme {
    tracks: SequencerTrack[];
    tempo: number; // ms per step
    name?: string;
}

export interface SoundEffect {
    steps: ToneOptions[];
}
