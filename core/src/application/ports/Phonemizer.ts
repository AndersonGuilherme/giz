import type { Language } from '../../domain/values/Language.ts';

export interface Phonemizer {
  ipa(text: string, language: Language): Promise<string>;
}
