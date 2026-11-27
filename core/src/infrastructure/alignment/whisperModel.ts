import type { AutomaticSpeechRecognitionPipeline, PretrainedModelOptions } from '@huggingface/transformers';
import type { Audio } from '../../domain/speech/Audio.ts';
import type { DownloadProgress } from '../download/resumableDownload.ts';

// The motor whisper-small (scripts/asr-check.ts) was exported without the cross attentions and gives no per-word
// time; this is the same network exported with them, used for the alignment and for `giz qa`. It downloads once
// (~250 MB, q8) into the transformers cache.
export const WHISPER_MODEL = 'onnx-community/whisper-small_timestamped';
const WHISPER_RATE = 16000;
/** Whisper language names, by project language code. */
export const WHISPER_LANGUAGES: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };

// The generic signature of `pipeline` blows the tsc union limit; this is the only form used here.
type CreateRecognizer = (task: 'automatic-speech-recognition', model: string, options: PretrainedModelOptions) => Promise<AutomaticSpeechRecognitionPipeline>;

/** Linear interpolation to 16 kHz, the rate Whisper expects (same as the motor readWav16k). */
export function resampledForWhisper(audio: Audio): Float32Array {
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

type TransformersEvent = Readonly<{ status: string; file?: string; loaded?: number; total?: number }>;

/** A transformers `progress` event as download progress; its other events (initiate, done, ready) give undefined. */
export function whisperProgressOf(event: TransformersEvent): DownloadProgress | undefined {
  if (event.status !== 'progress') return undefined;
  return { label: event.file ?? '', receivedBytes: event.loaded ?? 0, totalBytes: event.total ?? 0 };
}

/** `cacheDir`: another cache than transformers' own (the download into a partial folder, see whisperDownload.ts). */
export type RecognizerOptions = Readonly<{ onProgress?: (progress: DownloadProgress) => void; cacheDir?: string }>;

/**
 * GIZ_WHISPER_CACHE: another cache folder than the transformers package's own, which is read-only once the Studio is
 * installed (the Studio sets it); undefined keeps transformers' own.
 */
export const whisperCacheOf = (env: Readonly<Record<string, string | undefined>>): string | undefined => env.GIZ_WHISPER_CACHE?.trim() || undefined;

// Late import: commands that do not listen never load transformers (and its onnxruntime session).
export async function loadRecognizer({ onProgress, cacheDir = whisperCacheOf(process.env) }: RecognizerOptions = {}): Promise<AutomaticSpeechRecognitionPipeline> {
  const transformers = await import('@huggingface/transformers');
  const create = transformers.pipeline as CreateRecognizer;
  const progress_callback = (event: TransformersEvent) => {
    const progress = whisperProgressOf(event);
    if (progress) onProgress?.(progress);
  };
  const cache = cacheDir ? { cache_dir: cacheDir } : {};
  return create('automatic-speech-recognition', WHISPER_MODEL, { dtype: 'q8', device: 'cpu', progress_callback, ...cache });
}
