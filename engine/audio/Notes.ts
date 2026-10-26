/**
 * Complete chromatic note frequency table spanning C0–B8.
 * Access notes as `Notes.C4` (262 Hz) or use `noteFreq('C', 4)`.
 */

function freq(semitone: number): number {
    // A4 = 440 Hz = semitone 57 (from C0)
    return Math.round(440 * Math.pow(2, (semitone - 57) / 12) * 100) / 100;
}

const NOTE_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'] as const;
type NoteName = typeof NOTE_NAMES[number];

type NoteTable = {
    [K in `${NoteName}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`]: number;
};

function buildTable(): NoteTable {
    const table: Record<string, number> = {};
    for (let octave = 0; octave <= 8; octave++) {
        for (let i = 0; i < NOTE_NAMES.length; i++) {
            const semitone = octave * 12 + i;
            table[`${NOTE_NAMES[i]}${octave}`] = freq(semitone);
        }
    }
    return table as NoteTable;
}

/**
 * Note frequency lookup table.
 *
 * Sharps are denoted with `s` suffix: `Notes.Cs4` = C#4, `Notes.Fs3` = F#3.
 * Flats can be expressed as the enharmonic sharp: Ab = Gs, Bb = As, Eb = Ds, etc.
 *
 * ```ts
 * Notes.C4   // 261.63
 * Notes.A4   // 440.00
 * Notes.Fs3  // 185.00 (F#3)
 * ```
 */
export const Notes: Readonly<NoteTable> = buildTable();

/**
 * Get a note frequency by name and octave at runtime.
 * ```ts
 * noteFreq('C', 4)   // 261.63
 * noteFreq('Fs', 3)  // 185.00
 * ```
 */
export function noteFreq(note: NoteName, octave: number): number {
    const key = `${note}${octave}` as keyof NoteTable;
    const f = Notes[key];
    if (f === undefined) throw new Error(`Invalid note: ${key}`);
    return f;
}

/**
 * Convert a MIDI note number (0–127) to frequency.
 * MIDI 69 = A4 = 440 Hz.
 */
export function midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Build a chord from a root frequency and semitone intervals.
 * ```ts
 * chord(Notes.C4, [0, 4, 7])      // C major: [C4, E4, G4]
 * chord(Notes.A3, [0, 3, 7])      // A minor: [A3, C4, E4]
 * chord(Notes.C4, [0, 4, 7, 11])  // Cmaj7
 * ```
 */
export function chord(root: number, intervals: number[]): number[] {
    return intervals.map(i => root * Math.pow(2, i / 12));
}

/**
 * Common chord interval patterns.
 */
export const Chords = {
    major:      [0, 4, 7],
    minor:      [0, 3, 7],
    diminished: [0, 3, 6],
    augmented:  [0, 4, 8],
    major7:     [0, 4, 7, 11],
    minor7:     [0, 3, 7, 10],
    dom7:       [0, 4, 7, 10],
    sus2:       [0, 2, 7],
    sus4:       [0, 5, 7],
    power:      [0, 7],
} as const;

/**
 * Common scale interval patterns (semitones from root).
 */
export const Scales = {
    major:            [0, 2, 4, 5, 7, 9, 11],
    minor:            [0, 2, 3, 5, 7, 8, 10],
    pentatonicMajor:  [0, 2, 4, 7, 9],
    pentatonicMinor:  [0, 3, 5, 7, 10],
    blues:            [0, 3, 5, 6, 7, 10],
    dorian:           [0, 2, 3, 5, 7, 9, 10],
    mixolydian:       [0, 2, 4, 5, 7, 9, 10],
    chromatic:        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    wholeTone:        [0, 2, 4, 6, 8, 10],
} as const;

/**
 * Generate all note frequencies in a given scale across octave range.
 * ```ts
 * scale(Notes.C4, Scales.pentatonicMinor, 2) // two octaves of C pentatonic minor
 * ```
 */
export function scale(root: number, intervals: readonly number[], octaves: number = 1): number[] {
    const result: number[] = [];
    for (let oct = 0; oct < octaves; oct++) {
        for (const interval of intervals) {
            result.push(root * Math.pow(2, (interval + oct * 12) / 12));
        }
    }
    return result;
}
