import type { AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import type { Audio } from '../../domain/speech/Audio.ts';
import type { WordJson } from '../../domain/speech/WordJson.ts';
import type { Language } from '../../domain/values/Language.ts';
import type { Listener } from './WhisperAligner.ts';
import { loadRecognizer, resampledForWhisper, WHISPER_LANGUAGES } from './whisperModel.ts';

export { WHISPER_MODEL } from './whisperModel.ts';

type HeardChunk = { text: string; timestamp: [number, number | null] };
type Transcription = { text: string; chunks?: HeardChunk[] };

/** Local Whisper (CPU): the model loads on the first line and is reused for the next ones. */
export class WhisperListener implements Listener {
  #recognizer: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

  async listen(audio: Audio, language: Language): Promise<WordJson[]> {
    const recognizer = await this.#loaded();
    const options = { language: WHISPER_LANGUAGES[language.code()], task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30 } as const;
    const transcription = (await recognizer(resampledForWhisper(audio), options)) as Transcription;
    const duration = audio.duration();
    return (transcription.chunks ?? []).map(({ text, timestamp: [start, end] }) => ({ text: text, start, end: end ?? duration.value() }));
  }

  // A single load; if it fails, the next line tries again instead of inheriting the rejected promise.
  #loaded(): Promise<AutomaticSpeechRecognitionPipeline> {
    this.#recognizer ??= loadRecognizer().catch((error: unknown) => {
      this.#recognizer = undefined;
      throw error;
    });
    return this.#recognizer;
  }
}
