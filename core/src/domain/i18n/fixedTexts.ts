import type { Language } from '../values/Language.ts';
import { ENGLISH } from './en.ts';
import { PORTUGUESE } from './pt-BR.ts';

/** The fixed labels the video draws, by language; both languages have exactly the same keys (the type demands it). */
export type FixedTexts = Readonly<{
  objective: string;
  summary: string;
  challenge: string;
  nextLesson: string;
  findTheBug: string;
  rule: string;
  ticket: string;
  chapter: string;
  seconds: string;
  clue: string;
  healthy: string;
  rotten: string;
  readTheCode: string;
}>;

const TEXTS: Readonly<Record<ReturnType<Language['code']>, FixedTexts>> = { 'pt-BR': PORTUGUESE, en: ENGLISH };

export function fixedTexts(language: Language): FixedTexts {
  return TEXTS[language.code()];
}
