import type { Language } from '../values/Language.ts';

// How the examples start every voice style: without it the Qwen voices drift to another accent (lessons-learned 28).
const DEFAULT_STYLES: Readonly<Record<ReturnType<Language['code']>, string>> = {
  'pt-BR': 'Fale em português do Brasil, com sotaque brasileiro, de forma natural',
  en: 'Speak in natural American English',
};

/** The voice style of a character that has none, in the language of the project. */
export function defaultVoiceStyle(language: Language): string {
  return DEFAULT_STYLES[language.code()];
}
