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

// A cut answer gets more room on the repair, up to a limit a non-streaming call still finishes within.
const REPAIR_GROWTH = 1.5;
const MAX_REPAIR_TOKENS = 48_000;

/** The output limit of the repair after an answer cut at `previous` tokens. */
export function grownOutputTokens(previous: number): number {
  return Math.min(MAX_REPAIR_TOKENS, Math.ceil(previous * REPAIR_GROWTH));
}
