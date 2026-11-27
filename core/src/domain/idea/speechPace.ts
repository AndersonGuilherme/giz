import type { Language } from '../values/Language.ts';

type LanguageCode = ReturnType<Language['code']>;

// Words spoken per second, pauses included: ~1.8 measured with the pt-BR Qwen voice; English is read a bit faster.
const WORDS_PER_SECOND: Readonly<Record<LanguageCode, number>> = { 'pt-BR': 1.8, en: 2.2 };

/** How many words of speech fit in a duration, in a language. */
export function targetWords(language: Language, seconds: number): number {
  return Math.round(seconds * WORDS_PER_SECOND[language.code()]);
}

// The JSON of a script (scenes, beats, reactions) is long next to the speech; models that think spend output on it too.
const BASE_TOKENS = 8_000;
const TOKENS_PER_SECOND = 100;
const MAX_TOKENS = 32_000;

/** The output limit for writing the script of a video of this duration. */
export function scriptOutputTokens(seconds: number): number {
  return Math.min(MAX_TOKENS, BASE_TOKENS + seconds * TOKENS_PER_SECOND);
}
