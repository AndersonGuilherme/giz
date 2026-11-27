import type { AutomaticSpeechRecognitionPipeline, PretrainedModelOptions } from '@huggingface/transformers';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
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

// transformers' default cache: the .cache folder of its own package (where loadRecognizer downloads to). Its entry is
// <package>/dist/<file>; its package.json is not in its exports, so it cannot be resolved directly.
const transformersCache = () => join(dirname(dirname(createRequire(import.meta.url).resolve('@huggingface/transformers'))), '.cache');
const WHISPER_FILES = ['config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];

/** Whether Whisper (q8) is already in the transformers cache, without loading transformers. */
export function whisperDownloaded(cache: string = transformersCache()): boolean {
  return WHISPER_FILES.every((file) => existsSync(join(cache, WHISPER_MODEL, file)));
}

type TransformersEvent = Readonly<{ status: string; file?: string; loaded?: number; total?: number }>;

/** A transformers `progress` event as download progress; its other events (initiate, done, ready) give undefined. */
export function whisperProgressOf(event: TransformersEvent): DownloadProgress | undefined {
  if (event.status !== 'progress') return undefined;
  return { label: event.file ?? '', receivedBytes: event.loaded ?? 0, totalBytes: event.total ?? 0 };
}

// Late import: commands that do not listen never load transformers (and its onnxruntime session).
export async function loadRecognizer(onProgress?: (progress: DownloadProgress) => void): Promise<AutomaticSpeechRecognitionPipeline> {
  const transformers = await import('@huggingface/transformers');
  const create = transformers.pipeline as CreateRecognizer;
  const progress_callback = (event: TransformersEvent) => {
    const progress = whisperProgressOf(event);
    if (progress) onProgress?.(progress);
  };
  return create('automatic-speech-recognition', WHISPER_MODEL, { dtype: 'q8', device: 'cpu', progress_callback });
}
