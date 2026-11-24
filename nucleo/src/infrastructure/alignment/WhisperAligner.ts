import type { Aligner } from '../../application/ports/Aligner.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import type { WordJson } from '../../domain/speech/WordJson.ts';
import { Words } from '../../domain/speech/Words.ts';
import { reconcile } from '../../domain/speech/Reconciliation.ts';
import type { Language } from '../../domain/values/Language.ts';

/** Speech recognition: the heard words, with the time of each one. */
export interface Listener {
  listen(audio: Audio, language: Language): Promise<WordJson[]>;
}

const nothingToWarn = () => undefined;
const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Times of what Whisper heard, pinned to the script words. If the alignment is too poor, or if Whisper
 * fails (no network to download the model, an onnx error), it uses the fallback: the line voice is never lost because of it.
 */
export class WhisperAligner implements Aligner {
  readonly #fallback: Aligner;
  readonly #listener: Listener;
  readonly #onWarning: (message: string) => void;

  constructor(fallback: Aligner, listener: Listener, onWarning: (message: string) => void = nothingToWarn) {
    this.#fallback = fallback;
    this.#listener = listener;
    this.#onWarning = onWarning;
  }

  async align(audio: Audio, text: string, language: Language): Promise<Words> {
    const heard = await this.#listen(audio, language);
    const reconciled = heard && reconcile(Words.fromText(text), heard, audio.duration());
    return reconciled ?? this.#fallback.align(audio, text, language);
  }

  async #listen(audio: Audio, language: Language): Promise<WordJson[] | null> {
    try {
      return await this.#listener.listen(audio, language);
    } catch (error) {
      this.#onWarning(`alinhamento por Whisper falhou (${reasonOf(error)}); usando o envelope da voz`);
      return null;
    }
  }
}
