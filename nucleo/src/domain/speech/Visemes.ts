import type { Language } from '../values/Language.ts';

export type Viseme = 'X' | 'M' | 'A' | 'E' | 'I' | 'O' | 'U' | 'F' | 'C';

type PhonemesByViseme = Readonly<Partial<Record<Viseme, string>>>;

// Phoneme → mouth shape, one object per language. X = rest; whatever is not in the table becomes C (consonant).
const TABLES: Readonly<Record<string, PhonemesByViseme>> = {
  'pt-BR': { 'A': 'aɐɑ', 'E': 'eɛə', 'I': 'iɪj', 'O': 'oɔ', 'U': 'uʊw', 'M': 'mbp', 'F': 'fv' },
  en: { 'A': 'aɐɑʌæ', 'E': 'eɛəɜɚ', 'I': 'iɪj', 'O': 'oɔ', 'U': 'uʊw', 'M': 'mbp', 'F': 'fv', 'C': 'θð' },
};

const IGNORED = /[̀-ͯˈˌː\s,.;:!?…]/;

export class VisemeSequence {
  readonly #visemes: readonly Viseme[];

  constructor(visemes: readonly Viseme[]) {
    this.#visemes = visemes;
  }

  text(): string {
    return this.#visemes.join('');
  }

  // Spreads the visemes, in order, over the voiced frames; the others stay at rest (X).
  spreadOver(voicedFrames: readonly boolean[]): string {
    const voicedTotal = voicedFrames.filter(Boolean).length;
    let seen = 0;
    return voicedFrames
      .map((voiced) => (voiced ? this.#frameViseme(seen++, voicedTotal) : 'X'))
      .join('');
  }

  #frameViseme(position: number, voicedTotal: number): Viseme {
    const index = Math.floor((position * this.#visemes.length) / voicedTotal);
    return this.#visemes[index] ?? 'X';
  }
}

export class VisemeMap {
  readonly #byPhoneme: ReadonlyMap<string, Viseme>;

  private constructor(byPhoneme: ReadonlyMap<string, Viseme>) {
    this.#byPhoneme = byPhoneme;
  }

  static for(language: Language): VisemeMap {
    const table = TABLES[language.code()] ?? {};
    const pairs = Object.entries(table).flatMap(([viseme, phonemes]) =>
      [...(phonemes ?? '')].map((phoneme): [string, Viseme] => [phoneme, viseme as Viseme]),
    );
    return new VisemeMap(new Map(pairs));
  }

  convert(ipa: string): VisemeSequence {
    const phonemes = [...ipa.normalize('NFD')].filter((char) => !IGNORED.test(char));
    return new VisemeSequence(phonemes.map((phoneme) => this.#byPhoneme.get(phoneme) ?? 'C'));
  }
}
