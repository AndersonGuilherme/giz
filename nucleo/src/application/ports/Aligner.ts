import type { Audio } from '../../domain/speech/Audio.ts';
import type { Words } from '../../domain/speech/Words.ts';
import type { Language } from '../../domain/values/Language.ts';

/** Finds when each word of `text` (the script text) is said in the audio. */
export interface Aligner {
  align(audio: Audio, text: string, language: Language): Promise<Words>;
}
