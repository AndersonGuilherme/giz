import type { GpuStatus, ModelsStatus, SetupTask } from '../../../shared/setup.ts';
import type { SetupJob, SetupTools } from '../../ports/SetupTools.ts';

// The rehearsal machine (GIZ_STUDIO_REHEARSAL=1, used by the smoke test): an NVIDIA GPU, nothing installed yet, and
// downloads that only pretend, a few seconds each, so the whole first run can be walked without the network.
const GIGABYTE = 1e9;
const SIZES: Readonly<Record<SetupTask, number>> = { gpu: 2.1 * GIGABYTE, 'voice-0.6b': 5.9 * GIGABYTE, 'voice-1.7b': 13.4 * GIGABYTE, whisper: 0.24 * GIGABYTE };
const LABELS: Readonly<Record<SetupTask, string>> = { gpu: 'libcublas', 'voice-0.6b': 'Qwen3-TTS 0.6B', 'voice-1.7b': 'Qwen3-TTS 1.7B', whisper: 'onnx/decoder_model_merged_quantized.onnx' };
const STEPS = 40;
const STEP_MILLISECONDS = 60;
const later = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/** A pretend setup: progress in steps, stoppable, resuming where it stopped; the free space is a fixed 120 GB. */
export class RehearsalSetupTools implements SetupTools {
  readonly #done = new Set<SetupTask>();
  readonly #reached = new Map<SetupTask, number>();

  async gpu(): Promise<GpuStatus> {
    return { gpu: { name: 'NVIDIA GeForce RTX 4060 (ensaio)', memoryMiB: 8188, driver: '560.94' }, supported: true, ready: this.#done.has('gpu'), bytes: SIZES.gpu };
  }

  async models(modelsDir: string): Promise<ModelsStatus> {
    const status = (task: SetupTask) => ({ ready: this.#done.has(task), bytes: SIZES[task], onDiskBytes: (SIZES[task] * (this.#reached.get(task) ?? 0)) / STEPS });
    return { modelsDir, freeBytes: 120 * GIGABYTE, voice: { '0.6b': status('voice-0.6b'), '1.7b': status('voice-1.7b') }, whisper: status('whisper') };
  }

  async run(task: SetupTask, job: SetupJob): Promise<void> {
    for (let step = this.#reached.get(task) ?? 0; step <= STEPS; step += 1) {
      job.signal.throwIfAborted();
      this.#reached.set(task, step);
      job.onProgress({ label: LABELS[task], receivedBytes: (SIZES[task] * step) / STEPS, totalBytes: SIZES[task] });
      await later(STEP_MILLISECONDS);
    }
    this.#done.add(task);
  }
}
