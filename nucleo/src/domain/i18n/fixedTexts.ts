import type { Language } from '../values/Language.ts';

// Minimal stub created by Task 13 with the labels the lesson scenes draw. Task 14 completes it (one file per language).
/** The fixed labels the video draws, by language; both languages have exactly the same keys. */
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
}>;

const PORTUGUESE: FixedTexts = {
  objective: 'Objetivo',
  summary: 'Resumo',
  challenge: 'Desafio',
  nextLesson: 'Próxima aula',
  findTheBug: 'Ache o bug',
  rule: 'Regra',
  ticket: 'Pedido do negócio',
  chapter: 'Capítulo',
  seconds: 'segundos',
  clue: 'Pista',
  healthy: 'saudável',
  rotten: 'apodrecido',
};

const ENGLISH: FixedTexts = {
  objective: 'Objective',
  summary: 'Summary',
  challenge: 'Challenge',
  nextLesson: 'Next lesson',
  findTheBug: 'Find the bug',
  rule: 'Rule',
  ticket: 'Business request',
  chapter: 'Chapter',
  seconds: 'seconds',
  clue: 'Clue',
  healthy: 'healthy',
  rotten: 'rotten',
};

const TEXTS: Readonly<Record<ReturnType<Language['code']>, FixedTexts>> = { 'pt-BR': PORTUGUESE, en: ENGLISH };

export function fixedTexts(language: Language): FixedTexts {
  return TEXTS[language.code()];
}
