// The machine setup of the first run (GPU, voice models, Whisper): its status and the progress of each long task.
import type { VoiceModel } from './settings.ts';

/** The long tasks: each runs once at a time, streams progress and can be stopped (a stopped download resumes later). */
export const SETUP_TASKS = ['gpu', 'voice-0.6b', 'voice-1.7b', 'whisper'] as const;
export type SetupTask = (typeof SETUP_TASKS)[number];
export const voiceTaskOf = (model: VoiceModel): SetupTask => `voice-${model}`;

export type GpuInfo = Readonly<{ name: string; memoryMiB: number; driver: string }>;
/** `supported`: the GPU setup exists for this system (Linux x64, WSL included); `ready`: the voice can run on it. */
export type GpuStatus = Readonly<{ gpu: GpuInfo | null; supported: boolean; ready: boolean; bytes: number }>;

/** `bytes`: the whole model; `onDiskBytes`: what a stopped download already left on disk (it needs only the rest). */
export type ModelStatus = Readonly<{ ready: boolean; bytes: number; onDiskBytes: number }>;
/** `freeBytes`: free space where the models go (null when it cannot be read). */
export type ModelsStatus = Readonly<{ modelsDir: string; freeBytes: number | null; voice: Readonly<Record<VoiceModel, ModelStatus>>; whisper: ModelStatus }>;

/** `label`: the file or step being downloaded; `totalBytes` 0 while unknown. */
export type TaskProgress = Readonly<{ task: SetupTask; label: string; receivedBytes: number; totalBytes: number }>;

/** The event the main process pushes while a setup task runs. */
export const SETUP_PROGRESS_EVENT = 'setup.progress';
