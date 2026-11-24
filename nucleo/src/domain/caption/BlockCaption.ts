import type { Words } from '../speech/Words.ts';
import { Fps, Seconds, type Frame } from '../values/Time.ts';

/** A block of the text: `start` is where it begins, as a fraction (0 to 1) of the text, as in the motor's `captionChunks`. */
export type Block = Readonly<{ text: string; start: number }>;
/** A block with the real times of its words, in seconds from the start of the line. */
export type Cue = Readonly<{ text: string; start: Seconds; end: Seconds }>;
type Piece = Readonly<{ text: string; offset: number }>;

// A cut only counts past 35% of the limit, so no block is left tiny.
const MINIMUM_CUT_FRACTION = 0.35;
const CUT_PLACES = [/[.!?:]\s/g, /[,;]\s/g, /\s/g];

function lastCut(window: string, place: RegExp, maximum: number): number {
  const cuts = [...window.matchAll(place)].filter((match) => match.index > maximum * MINIMUM_CUT_FRACTION);
  const last = cuts.at(-1);
  return last ? last.index + last[0].length : -1;
}

// End of a sentence > comma > space; without any, cut at the limit.
function cutOf(rest: string, maximum: number): number {
  if (rest.length <= maximum) return rest.length;
  const window = rest.slice(0, maximum + 1);
  const cuts = CUT_PLACES.map((place) => lastCut(window, place, maximum));
  return cuts.find((cut) => cut > 0) ?? maximum;
}

function pieces(text: string, maximum: number, offset = 0): Piece[] {
  const rest = text.slice(offset);
  const trimmed = rest.trimStart();
  if (trimmed.length === 0) return [];
  const start = offset + rest.length - trimmed.length;
  const cut = cutOf(trimmed, maximum);
  return [{ text: trimmed.slice(0, cut).trim(), offset: start }, ...pieces(text, maximum, start + cut)];
}

// Index of the word where each piece starts (the word that contains its first letter).
function firstWords(texts: readonly string[], blockPieces: readonly Piece[]): number[] {
  const wordOffsets = texts.map((_text, index) => texts.slice(0, index).reduce((sum, previous) => sum + previous.length + 1, 0));
  return blockPieces.map((piece) => wordOffsets.filter((offset) => offset <= piece.offset).length - 1);
}

/** Block captions (lessons): the line in pieces of up to `maximum` characters, each shown from its first word on. */
export class BlockCaption {
  readonly #cues: readonly Cue[];

  private constructor(cues: readonly Cue[]) {
    this.#cues = cues;
  }

  /** Port of `captionChunks` from the motor (`motor/src/captions.ts`). */
  static blocksOf(text: string, maximum: number): Block[] {
    const clean = text.trim();
    return pieces(clean, maximum).map((piece) => ({ text: piece.text, start: piece.offset / clean.length }));
  }

  static of(words: Words, maximum: number): BlockCaption {
    const timed = words.toJson();
    const texts = timed.map((word) => word.text);
    const blockPieces = pieces(texts.join(' '), maximum);
    const starts = firstWords(texts, blockPieces).map((index) => timed[index].start);
    const lastEnd = timed.at(-1)?.end ?? 0;
    const cues = blockPieces.map((piece, index) => ({
      text: piece.text, start: Seconds.of(starts[index]), end: Seconds.of(starts[index + 1] ?? Math.max(lastEnd, starts[index])),
    }));
    return new BlockCaption(cues);
  }

  /** Every block with its times (for the `.srt`). */
  cues(): Cue[] {
    return [...this.#cues];
  }

  /** The block on screen at `frame`: the last one already started (the first one before that); empty without words. */
  blockAt(frame: Frame): string {
    const instant = frame.toSeconds(Fps.DEFAULT);
    const started = this.#cues.filter((cue) => cue.start.value() <= instant.value()).at(-1);
    return (started ?? this.#cues[0])?.text ?? '';
  }
}
