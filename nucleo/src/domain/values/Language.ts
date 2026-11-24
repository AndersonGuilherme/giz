import { DomainError } from '../DomainError.ts';

type LanguageCode = 'pt-BR' | 'en';
type EspeakVoice = 'pt-br' | 'en-us';

export class Language {
  static readonly PORTUGUESE = new Language('pt-BR', 'pt-br');
  static readonly ENGLISH = new Language('en', 'en-us');

  readonly #code: LanguageCode;
  readonly #voice: EspeakVoice;

  private constructor(code: LanguageCode, voice: EspeakVoice) {
    this.#code = code;
    this.#voice = voice;
  }

  static of(code: string): Language {
    const supported = [Language.PORTUGUESE, Language.ENGLISH];
    const found = supported.find((language) => language.#code === code);
    if (!found) throw new DomainError(`idioma "${code}" não suportado (use pt-BR ou en)`);
    return found;
  }

  code(): LanguageCode {
    return this.#code;
  }

  espeakVoice(): EspeakVoice {
    return this.#voice;
  }

  equals(other: Language): boolean {
    return this.#code === other.#code;
  }
}
