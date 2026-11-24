import type { WordJson } from '../speech/WordJson.ts';
import { Fps, Seconds } from '../values/Time.ts';
import type { WordInFrames } from './VideoProps.ts';

/** What the timeline uses from the recorded voice of a line. */
export type LineVoice = Readonly<{
  file: string;
  envelope: readonly number[];
  visemes: string;
  words?: readonly WordJson[];
}>;

// The voiced frames; with none, every frame of the line.
function spokenFrames(envelope: readonly number[]): number[] {
  const spoken = envelope.flatMap((opening, frame) => (opening > 0 ? [frame] : []));
  return spoken.length > 0 ? spoken : [...envelope.keys()];
}

// Fraction (from 0 to 1) of the text where each word starts, by letters.
function startFractions(texts: readonly string[]): number[] {
  const size = Math.max(1, texts.join(' ').length);
  return texts.map((_text, index) => texts.slice(0, index).reduce((sum, previous) => sum + previous.length + 1, 0) / size);
}

/** Converts the line times into relative frames; without the recorded words, it interpolates over the voiced frames. */
export class LineTimings {
  readonly #envelope: readonly number[];
  readonly #words: readonly WordJson[] | undefined;

  private constructor(envelope: readonly number[], words: readonly WordJson[] | undefined) {
    this.#envelope = envelope;
    this.#words = words;
  }

  /** The recorded words only count if there are as many as the script words (`texts`). */
  static of(voice: LineVoice, texts: readonly string[]): LineTimings {
    const words = voice.words?.length === texts.length ? voice.words : undefined;
    return new LineTimings(voice.envelope, words);
  }

  /** The line duration in frames: the envelope length (the same as the visemes). */
  frames(): number {
    return this.#envelope.length;
  }

  /** The frame where the word starts; without recorded words, `undefined`. */
  wordStart(index: number): number | undefined {
    const word = this.#words?.[index];
    return word && this.#toFrames(word.start);
  }

  /** The voiced frame where the fraction `fraction` (from 0 to 1) of the line falls. */
  frameAtFraction(fraction: number): number {
    const frames = spokenFrames(this.#envelope);
    if (fraction >= 1) return this.frames();
    return frames[Math.floor(fraction * frames.length)] ?? 0;
  }

  toFrames(texts: readonly string[]): WordInFrames[] {
    const starts = this.#words?.map((word) => this.#toFrames(word.start)) ?? startFractions(texts).map((fraction) => this.frameAtFraction(fraction));
    const ends = this.#words?.map((word) => this.#toFrames(word.end)) ?? [...starts.slice(1), this.frames()];
    return texts.map((text, index) => ({ text, start: starts[index] ?? 0, end: ends[index] ?? this.frames() }));
  }

  #toFrames(seconds: number): number {
    const frame = Seconds.of(seconds).toFrames(Fps.DEFAULT);
    return Math.min(this.frames(), frame.value());
  }
}
