import type { AutomaticSpeechRecognitionPipeline, PretrainedModelOptions } from '@huggingface/transformers';
import type { Audio } from '../../domain/speech/Audio.ts';
import type { WordJson } from '../../domain/speech/WordJson.ts';
import type { Language } from '../../domain/values/Language.ts';
import type { Listener } from './WhisperAligner.ts';

// The motor whisper-small (scripts/asr-check.ts) was exported without the cross attentions and gives no per-word
// time; this is the same network exported with them. It downloads once (~250 MB, q8) into the transformers cache.
export const WHISPER_MODEL = 'onnx-community/whisper-small_timestamped';
const WHISPER_RATE = 16000;
const WHISPER_LANGUAGES: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };

// The generic signature of `pipeline` blows the tsc union limit; this is the only form used here.
type CreateRecognizer = (task: 'automatic-speech-recognition', model: string, options: PretrainedModelOptions) => Promise<AutomaticSpeechRecognitionPipeline>;
type HeardChunk = { text: string; timestamp: [number, number | null] };
type Transcription = { text: string; chunks?: HeardChunk[] };

// Linear interpolation to 16 kHz, the rate Whisper expects (same as the motor readWav16k).
function resampled(audio: Audio): Float32Array {
  const samples = audio.samples();
  const ratio = audio.rate() / WHISPER_RATE;
  const output = new Float32Array(Math.floor(samples.length / ratio));
  return output.map((_sample, index) => {
    const position = index * ratio;
    const before = Math.floor(position);
    const fraction = position - before;
    return (samples[before] ?? 0) * (1 - fraction) + (samples[before + 1] ?? 0) * fraction;
  });
}

// Late import: the Qwen onnxruntime (with CUDA, from the motor) must load first in the process;
// if the nucleo one (CPU only) loads first, its native library is reused and Qwen does not find CUDA.
async function load(): Promise<AutomaticSpeechRecognitionPipeline> {
  const transformers = await import('@huggingface/transformers');
  const create = transformers.pipeline as CreateRecognizer;
  return create('automatic-speech-recognition', WHISPER_MODEL, { dtype: 'q8', device: 'cpu' });
}

/** Local Whisper (CPU): the model loads on the first line and is reused for the next ones. */
export class WhisperListener implements Listener {
  #recognizer: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

  async listen(audio: Audio, language: Language): Promise<WordJson[]> {
    const recognizer = await this.#loaded();
    const options = { language: WHISPER_LANGUAGES[language.code()], task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30 } as const;
    const transcription = (await recognizer(resampled(audio), options)) as Transcription;
    const duration = audio.duration();
    return (transcription.chunks ?? []).map(({ text, timestamp: [start, end] }) => ({ text: text, start, end: end ?? duration.value() }));
  }

  // A single load; if it fails, the next line tries again instead of inheriting the rejected promise.
  #loaded(): Promise<AutomaticSpeechRecognitionPipeline> {
    this.#recognizer ??= load().catch((error: unknown) => {
      this.#recognizer = undefined;
      throw error;
    });
    return this.#recognizer;
  }
}
