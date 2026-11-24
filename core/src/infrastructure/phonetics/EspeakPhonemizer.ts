import { createRequire } from 'node:module';
import type { Phonemizer } from '../../application/ports/Phonemizer.ts';
import type { Language } from '../../domain/values/Language.ts';
import { normalizeGeneral, normalizePtBr } from './normalization.ts';

type EspeakWorker = { set_voice(voice: string): void; synthesize_ipa(text: string): { ipa: string } };

const NORMALIZERS: Readonly<Record<string, (ipa: string) => string>> = {
  'pt-BR': normalizePtBr,
  en: normalizeGeneral,
};

// espeak is loaded (WASM) once per process and reused by every instance.
let worker: Promise<EspeakWorker> | undefined;

async function loadEspeak(): Promise<EspeakWorker> {
  const require = createRequire(import.meta.url);
  const factory = (await import(require.resolve('@echogarden/espeak-ng-emscripten'))).default;
  return new (await factory()).eSpeakNGWorker() as EspeakWorker;
}

// The worker has a single active voice: calls go into a queue so the voice is not switched in the middle of another call.
let queue: Promise<unknown> = Promise.resolve();

export class EspeakPhonemizer implements Phonemizer {
  ipa(text: string, language: Language): Promise<string> {
    const result = queue.then(() => this.#phonemize(text, language));
    queue = result.catch(() => undefined);
    return result;
  }

  async #phonemize(text: string, language: Language): Promise<string> {
    worker ??= loadEspeak();
    const espeak = await worker;
    espeak.set_voice(language.espeakVoice());
    const normalize = NORMALIZERS[language.code()] ?? normalizeGeneral;
    const chunks = [...text.matchAll(/([^,.;:!?…]+)([,.;:!?…]*)/g)];
    const phonemizeChunk = (words: string): string => {
      const lines = espeak.synthesize_ipa(words).ipa.split('\n').filter(Boolean);
      return normalize(lines.map((line) => line.replace(/_/g, '')).join(' '));
    };
    return chunks
      .map(([, words, punctuation]) => this.#chunk(phonemizeChunk, words!.trim(), punctuation!))
      .filter(Boolean)
      .join(' ');
  }

  #chunk(phonemize: (words: string) => string, words: string, punctuation: string): string {
    if (!words) return '';
    return phonemize(words) + punctuation.replace('…', '...').slice(0, 3);
  }
}
