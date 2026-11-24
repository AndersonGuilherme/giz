// Part of the composition point (see composition.ts): the install tools behind `giz setup`, `giz models`, `giz gpu`
// and `giz sounds`. The heavy modules (onnxruntime, transformers) are imported only by the tool that needs them.
import { fileURLToPath } from 'node:url';
import { Audio } from '../../../domain/speech/Audio.ts';
import { installGpu } from '../../../infrastructure/gpu/cudaLibraries.ts';
import { detectNvidia, type GpuInfo } from '../../../infrastructure/gpu/nvidiaGpu.ts';
import { ortHasCuda, requiredCudaMajor } from '../../../infrastructure/gpu/onnxRuntimeCuda.ts';
import { writeSounds } from '../../../infrastructure/sound/writeSounds.ts';
import { ensureModel } from '../../../infrastructure/voice/qwen/modelDownload.ts';
import { QWEN_MODELS, QWEN_RATE, repositoryOf } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { toWav } from '../../../infrastructure/voice/wav.ts';
import type { GizConfig } from './install.ts';

export type { GpuInfo } from '../../../infrastructure/gpu/nvidiaGpu.ts';
export { QWEN_MODELS as VOICE_MODEL_SIZES, QWEN_VOICES } from '../../../infrastructure/voice/qwen/qwenModels.ts';

type Log = (message: string) => void;
/** What the setup needs of the local voice: a test line and the voice samples. */
export type LocalVoice = Readonly<{
  generate(text: string, options: Readonly<{ speaker: string; language?: string; instruct?: string; seed?: number }>): Promise<Float32Array>;
  availableSpeakers(): string[];
}>;

export const SOUNDS_FOLDER = fileURLToPath(new URL('../../../../public/sounds', import.meta.url));

export const gpu = {
  detect: (): GpuInfo | null => detectNvidia(),
  install: (modelsDir: string, log: Log): Promise<void> => installGpu(modelsDir, log),
  info: () => ({ gpu: detectNvidia(), providerCuda: ortHasCuda(), cuda: ortHasCuda() ? requiredCudaMajor() : null }),
};

/** Downloads the configured voice model (once); returns its folder. */
export function downloadVoiceModel(config: GizConfig, log: Log): Promise<string> {
  return ensureModel(repositoryOf(config.model), config.modelsDir, log);
}

export async function openLocalVoice(config: GizConfig): Promise<LocalVoice> {
  const { loadQwen } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return loadQwen(config);
}

export const wavOf = (samples: Float32Array): Buffer => toWav(Audio.of(samples, QWEN_RATE));
export const secondsOf = (samples: Float32Array): number => samples.length / QWEN_RATE;
export const modelGigabytes = (model: GizConfig['model']): number => QWEN_MODELS[model].gigabytes;

/** Downloads Whisper (~250 MB, the pronunciation check) into the transformers cache. */
export async function downloadWhisper(): Promise<void> {
  const { loadRecognizer } = await import('../../../infrastructure/alignment/whisperModel.ts');
  await loadRecognizer();
}

export const synthesizeSounds = (folder: string = SOUNDS_FOLDER): Promise<string[]> => writeSounds(folder);
