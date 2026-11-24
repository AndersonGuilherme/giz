import type { AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import type { Audio } from '../../domain/speech/Audio.ts';
import { loadRecognizer, resampledForWhisper } from '../alignment/whisperModel.ts';

/** What Whisper heard: the text only (the QA tools compare words, not times). */
export interface Transcriber {
  transcribe(audio: Audio, language: string): Promise<string>;
}

/** The local Whisper of the alignment, loaded on the first use. */
export class WhisperTranscriber implements Transcriber {
  #recognizer: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

  async transcribe(audio: Audio, language: string): Promise<string> {
    this.#recognizer ??= loadRecognizer();
    const recognizer = await this.#recognizer;
    const result = (await recognizer(resampledForWhisper(audio), { language, task: 'transcribe' })) as { text: string };
    return result.text.trim();
  }
}
