const BEAT = /\[[^\]]+\]/g;
const BRACKETS = /[[\]]/g;
const BRACKETS_PER_BEAT = 2;

const wordsIn = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** A text with `[span]` beats: where each beat opens, in the text without the brackets. */
export class BeatText {
  readonly #raw: string;

  private constructor(raw: string) {
    this.#raw = raw;
  }

  static of(text: string): BeatText {
    return new BeatText(text);
  }

  static hasBeats(text: string): boolean {
    return new RegExp(BEAT.source).test(text);
  }

  clean(): string {
    return this.#raw.replace(BRACKETS, '');
  }

  count(): number {
    return this.#positions().length;
  }

  /** Index (in the words of the clean text) of the word that opens each beat. */
  openingWords(): number[] {
    const clean = this.clean();
    return this.#positions().map((position) => {
      const before = clean.slice(0, position);
      const midWord = position > 0 && !/\s$/.test(before);
      return wordsIn(before) - (midWord ? 1 : 0);
    });
  }

  /** Where each beat opens, as a fraction (from 0 to 1) of the clean text. */
  fractions(): number[] {
    const size = Math.max(1, this.clean().length);
    return this.#positions().map((position) => position / size);
  }

  // Position of each beat in the clean text: each earlier beat removed two brackets.
  #positions(): number[] {
    const found = [...this.#raw.matchAll(BEAT)];
    return found.map((beat, order) => (beat.index ?? 0) - order * BRACKETS_PER_BEAT);
  }
}
