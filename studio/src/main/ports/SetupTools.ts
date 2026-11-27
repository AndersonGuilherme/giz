import type { GpuStatus, ModelsStatus, SetupTask } from '../../shared/setup.ts';

export type ByteProgress = Readonly<{ label: string; receivedBytes: number; totalBytes: number }>;
/** `signal` stops the task (a download keeps its partial files and resumes next time). */
export type SetupJob = Readonly<{ modelsDir: string; signal: AbortSignal; onProgress: (progress: ByteProgress) => void }>;

/** core's setup steps for the GPU, the voice models and Whisper (tests pass a fake; the smoke test a rehearsal). */
export interface SetupTools {
  gpu(modelsDir: string): Promise<GpuStatus>;
  models(modelsDir: string): Promise<ModelsStatus>;
  run(task: SetupTask, job: SetupJob): Promise<void>;
}
