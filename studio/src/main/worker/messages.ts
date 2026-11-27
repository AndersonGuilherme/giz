import type { SetupTask } from '../../shared/setup.ts';
import type { ByteProgress } from '../ports/SetupTools.ts';

/** The job the setup worker runs, given in its environment (`GIZ_SETUP_JOB`, JSON). */
export type WorkerJob = Readonly<{ task: SetupTask; modelsDir: string }>;
export const JOB_VARIABLE = 'GIZ_SETUP_JOB';

/** What the worker tells the main process: progress steps, then done or failed. */
export type WorkerMessage =
  | Readonly<{ type: 'progress'; progress: ByteProgress }>
  | Readonly<{ type: 'done' }>
  | Readonly<{ type: 'failed'; message: string }>;
