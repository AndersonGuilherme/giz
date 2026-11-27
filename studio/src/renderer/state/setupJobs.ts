import type { Failure } from '../../shared/contract.ts';
import type { SetupTask, TaskProgress } from '../../shared/setup.ts';

/** One setup task as the window sees it: never started, running (with its last progress), stopped, done or failed. */
export type JobState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'running'; progress: TaskProgress | null }>
  | Readonly<{ status: 'stopped'; progress: TaskProgress | null }>
  | Readonly<{ status: 'done' }>
  | Readonly<{ status: 'failed'; failure: Failure }>;

export type Jobs = Readonly<Partial<Record<SetupTask, JobState>>>;

export type JobEvent =
  | Readonly<{ type: 'started'; task: SetupTask }>
  | Readonly<{ type: 'progress'; progress: TaskProgress }>
  | Readonly<{ type: 'finished'; task: SetupTask }>
  | Readonly<{ type: 'stopped'; task: SetupTask }>
  | Readonly<{ type: 'failed'; task: SetupTask; failure: Failure }>;

const IDLE: JobState = { status: 'idle' };
export const jobOf = (jobs: Jobs, task: SetupTask): JobState => jobs[task] ?? IDLE;
const lastProgress = (job: JobState) => ('progress' in job ? job.progress : null);

type EventOf<Type extends JobEvent['type']> = Extract<JobEvent, { type: Type }>;
type Reducers = { readonly [Type in JobEvent['type']]: (jobs: Jobs, event: EventOf<Type>) => Jobs };

// A resumed task keeps showing where it stopped until its first new progress arrives.
const REDUCERS: Reducers = {
  started: (jobs, { task }) => ({ ...jobs, [task]: { status: 'running', progress: lastProgress(jobOf(jobs, task)) } }),
  progress: (jobs, { progress }) => (jobOf(jobs, progress.task).status === 'running' ? { ...jobs, [progress.task]: { status: 'running', progress } } : jobs),
  finished: (jobs, { task }) => ({ ...jobs, [task]: { status: 'done' } }),
  stopped: (jobs, { task }) => ({ ...jobs, [task]: { status: 'stopped', progress: lastProgress(jobOf(jobs, task)) } }),
  failed: (jobs, { task, failure }) => ({ ...jobs, [task]: { status: 'failed', failure } }),
};

export function reduceJobs(jobs: Jobs, event: JobEvent): Jobs {
  const reducer = REDUCERS[event.type] as (jobs: Jobs, event: JobEvent) => Jobs;
  return reducer(jobs, event);
}

/** The fraction of a progress, or null while its size is unknown. */
export const fractionOf = (progress: TaskProgress | null): number | null =>
  progress && progress.totalBytes > 0 ? Math.min(progress.receivedBytes / progress.totalBytes, 1) : null;
