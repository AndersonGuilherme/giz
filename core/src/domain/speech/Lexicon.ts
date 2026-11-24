// The pronunciation dictionary of a voice service: spellings that make the voice say a word right ("deploy" →
// "diplói"). Only the voice uses it; the caption keeps the script text. Each service has its own (the phonetic
// spellings made for Qwen confuse voices that already read English names).
type Entry = Readonly<{ pattern: RegExp; replacement: string }>;

const SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

// A whole word: no letter (accented ones included) right before or right after it; case is ignored.
function entryOf([word, replacement]: readonly [string, string]): Entry {
  const literal = word.replace(SPECIAL_CHARACTERS, '\\$&');
  return { pattern: new RegExp(`(?<![\\p{L}])${literal}(?![\\p{L}])`, 'giu'), replacement };
}

export class Lexicon {
  static readonly EMPTY = new Lexicon([]);
  readonly #entries: readonly Entry[];

  private constructor(entries: readonly Entry[]) {
    this.#entries = entries;
  }

  /** The entries in the order of the file: each one applies to the result of the previous ones. */
  static of(spellings: Readonly<Record<string, string>>): Lexicon {
    return new Lexicon(Object.entries(spellings).map(entryOf));
  }

  apply(text: string): string {
    return this.#entries.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
  }
}
