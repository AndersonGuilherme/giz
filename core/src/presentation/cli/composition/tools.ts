// Part of the composition point (see composition.ts): the install tools behind `giz setup`, `giz models`, `giz gpu`
// and `giz sounds`. The heavy modules (onnxruntime, transformers) are imported only by the tool that needs them.
import { fileURLToPath } from 'node:url';
import { Audio } from '../../../domain/speech/Audio.ts';
import { downloadWhisperModel, whisperDownloaded } from '../../../infrastructure/alignment/whisperDownload.ts';
import type { DownloadProgress } from '../../../infrastructure/download/resumableDownload.ts';
import { cudaLibrariesReady, installGpu } from '../../../infrastructure/gpu/cudaLibraries.ts';
import { detectNvidia, type GpuInfo } from '../../../infrastructure/gpu/nvidiaGpu.ts';
import { ortHasCuda, requiredCudaMajor } from '../../../infrastructure/gpu/onnxRuntimeCuda.ts';
import { writeSounds } from '../../../infrastructure/sound/writeSounds.ts';
import { downloadModel, ensureModel, modelReady } from '../../../infrastructure/voice/qwen/modelDownload.ts';
import { modelFolder } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { QWEN_MODELS, QWEN_RATE, repositoryOf } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { toWav } from '../../../infrastructure/voice/wav.ts';
import type { GizConfig } from './install.ts';

export type { GpuInfo } from '../../../infrastructure/gpu/nvidiaGpu.ts';
export type { DownloadProgress } from '../../../infrastructure/download/resumableDownload.ts';
export { QWEN_MODELS as VOICE_MODEL_SIZES, QWEN_VOICES } from '../../../infrastructure/voice/qwen/qwenModels.ts';

type Log = (message: string) => void;
type Progress = (progress: DownloadProgress) => void;
/** What the setup needs of the local voice: a test line and the voice samples. */
export type LocalVoice = Readonly<{
  generate(text: string, options: Readonly<{ speaker: string; language?: string; instruct?: string; seed?: number }>): Promise<Float32Array>;
  availableSpeakers(): string[];
}>;

export const SOUNDS_FOLDER = fileURLToPath(new URL('../../../../public/sounds', import.meta.url));

export const gpu = {
  detect: (): GpuInfo | null => detectNvidia(),
  install: (modelsDir: string, log: Log, onProgress?: Progress): Promise<void> => installGpu(modelsDir, log, onProgress),
  info: () => ({ gpu: detectNvidia(), providerCuda: ortHasCuda(), cuda: ortHasCuda() ? requiredCudaMajor() : null }),
  /** Whether the voice can run on the GPU: the ONNX Runtime CUDA provider and the NVIDIA libraries are installed. */
  ready: (modelsDir: string): boolean => ortHasCuda() && cudaLibrariesReady(modelsDir),
};

/** Downloads the configured voice model (once); returns its folder. */
export function downloadVoiceModel(config: GizConfig, log: Log): Promise<string> {
  return ensureModel(repositoryOf(config.model), config.modelsDir, log);
}

/** Whether a voice model was downloaded to the end into `modelsDir`. */
export const voiceModelReady = (model: GizConfig['model'], modelsDir: string): boolean => modelReady(repositoryOf(model), modelsDir);

/** The folder of a voice model in `modelsDir` (the Studio counts the bytes already there). */
export const voiceModelFolder = (model: GizConfig['model'], modelsDir: string): string => modelFolder(repositoryOf(model), modelsDir);

/** The same download with the bytes of the whole model (the Studio's progress bar). */
export function downloadVoiceModelWithProgress(config: Pick<GizConfig, 'model' | 'modelsDir'>, onProgress: (receivedBytes: number, totalBytes: number) => void): Promise<string> {
  return downloadModel(repositoryOf(config.model), config.modelsDir, { log: () => undefined, onProgress });
}

export async function openLocalVoice(config: GizConfig): Promise<LocalVoice> {
  const { loadQwen } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return loadQwen(config);
}

export const wavOf = (samples: Float32Array): Buffer => toWav(Audio.of(samples, QWEN_RATE));
export const secondsOf = (samples: Float32Array): number => samples.length / QWEN_RATE;
export const modelGigabytes = (model: GizConfig['model']): number => QWEN_MODELS[model].gigabytes;

/**
 * Downloads Whisper (~250 MB, the pronunciation check) into the transformers cache; `onProgress`: each file's bytes.
 * A stopped download leaves nothing half-written in the cache (see whisperDownload.ts).
 */
export function downloadWhisper(onProgress?: Progress): Promise<void> {
  return downloadWhisperModel({ onProgress });
}

/** Whether Whisper is already downloaded (checked without loading transformers). */
export const whisperReady = (): boolean => whisperDownloaded();

export const synthesizeSounds = (folder: string = SOUNDS_FOLDER): Promise<string[]> => writeSounds(folder);
