import type { GpuStatus, ModelsStatus, SetupTask, TaskProgress } from '../../shared/setup.ts';
import type { SharedConfigStore } from '../ports/SettingsStores.ts';
import type { ByteProgress, SetupTools } from '../ports/SetupTools.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';

type Dependencies = Readonly<{ tools: SetupTools; shared: SharedConfigStore; progress: (progress: TaskProgress) => void }>;

/**
 * Sends a task's progress when the file changes or it moved at least half a percent: a download reports every chunk
 * it writes, the window needs a few hundred steps.
 */
export function progressSteps(task: SetupTask, send: (progress: TaskProgress) => void): (progress: ByteProgress) => void {
  let last = { label: '', step: -1 };
  return (progress) => {
    const step = progress.totalBytes > 0 ? Math.floor((progress.receivedBytes / progress.totalBytes) * 200) : 0;
    if (progress.label === last.label && step === last.step) return;
    last = { label: progress.label, step };
    send({ task, ...progress });
  };
}

// What each finished task changes in giz.config.json: a ready GPU becomes the voice device (the CLI's setup does so).
const AFTER: Readonly<Partial<Record<SetupTask, (shared: SharedConfigStore) => Promise<unknown>>>> = {
  gpu: (shared) => shared.write({ device: 'cuda' }),
};

/** The machine setup: status of the GPU and models, and the long tasks (one run per task at a time, each stoppable). */
export class SetupService {
  readonly #dependencies: Dependencies;
  readonly #running = new Map<SetupTask, AbortController>();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async gpu(): Promise<GpuStatus> {
    const { tools, shared } = this.#dependencies;
    return tools.gpu((await shared.read()).modelsDir);
  }

  async models(): Promise<ModelsStatus> {
    const { tools, shared } = this.#dependencies;
    return tools.models((await shared.read()).modelsDir);
  }

  async run(task: SetupTask): Promise<true> {
    if (this.#running.has(task)) throw new StudioError('busy', translate('errors.taskBusy'));
    const controller = new AbortController();
    this.#running.set(task, controller);
    try {
      await this.#run(task, controller.signal);
      return true;
    } catch (error) {
      throw controller.signal.aborted ? new StudioError('cancelled', translate('errors.taskStopped')) : error;
    } finally {
      this.#running.delete(task);
    }
  }

  /** Stops the task (a download keeps what it has and resumes on the next run); false when it was not running. */
  stop(task: SetupTask): boolean {
    const controller = this.#running.get(task);
    controller?.abort();
    return controller !== undefined;
  }

  async #run(task: SetupTask, signal: AbortSignal): Promise<void> {
    const { tools, shared, progress } = this.#dependencies;
    const { modelsDir } = await shared.read();
    await tools.run(task, { modelsDir, signal, onProgress: progressSteps(task, progress) });
    signal.throwIfAborted();
    await AFTER[task]?.(shared);
  }
}
