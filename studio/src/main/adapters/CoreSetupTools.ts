import type { GpuStatus, ModelsStatus, SetupTask } from '../../shared/setup.ts';
import type { SetupJob, SetupTools } from '../ports/SetupTools.ts';
import { coreTools } from './coreModules.ts';
import { freeBytesOf } from './diskSpace.ts';
import { runInWorker } from './WorkerSetupRunner.ts';

const GIGABYTE = 1e9;
// The GPU support: the ONNX Runtime CUDA provider (~0.3 GB) and the NVIDIA libraries (~1.8 GB); Whisper q8 (~0.24 GB).
const GPU_BYTES = 2.1 * GIGABYTE;
const WHISPER_BYTES = 0.24 * GIGABYTE;
// core's GPU setup exists for Linux x64 (WSL included); elsewhere the voice runs on the CPU.
const GPU_SUPPORTED = process.platform === 'linux' && process.arch === 'x64';

/** core's setup tools: the status is read here; the long tasks run in a utility process (see WorkerSetupRunner). */
export class CoreSetupTools implements SetupTools {
  async gpu(modelsDir: string): Promise<GpuStatus> {
    const { gpu } = await coreTools();
    const found = gpu.detect();
    return { gpu: found, supported: GPU_SUPPORTED, ready: found !== null && gpu.ready(modelsDir), bytes: GPU_BYTES };
  }

  async models(modelsDir: string): Promise<ModelsStatus> {
    const { VOICE_MODEL_SIZES, voiceModelReady, whisperReady } = await coreTools();
    const voiceOf = (model: '0.6b' | '1.7b') => ({ ready: voiceModelReady(model, modelsDir), bytes: VOICE_MODEL_SIZES[model].gigabytes * GIGABYTE });
    return {
      modelsDir,
      freeBytes: await freeBytesOf(modelsDir),
      voice: { '0.6b': voiceOf('0.6b'), '1.7b': voiceOf('1.7b') },
      whisper: { ready: whisperReady(), bytes: WHISPER_BYTES },
    };
  }

  run(task: SetupTask, job: SetupJob): Promise<void> {
    return runInWorker(task, job);
  }
}
