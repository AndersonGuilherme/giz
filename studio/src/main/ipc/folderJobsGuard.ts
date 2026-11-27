import type { FolderJob, FolderJobs } from '../services/FolderJobs.ts';
import type { Handler, Handlers } from './registry.ts';

type Guarded = 'video.render' | 'voices.generate' | 'voices.record' | 'voices.unrecord' | 'scenarios.generate';

/** When the voice job in flight has really ended (a cancel answers at once; the voice worker ends the job later). */
export type JobsEnded = Readonly<{ voices: () => Promise<void> }>;

type Claim = Readonly<{ jobs: FolderJobs; job: FolderJob; ended?: () => Promise<void> }>;

const NOTHING_RUNS = async () => undefined;
const isCancel = (error: unknown) => (error as { code?: unknown } | null)?.code === 'cancelled';

// A refusal frees the folder at once; a cancel frees it once the job has really ended.
function releaseAfter(error: unknown, release: () => void, ended: () => Promise<void>): void {
  if (isCancel(error)) return void ended().finally(release);
  release();
}

// The folder is freed when the handler answers; after a cancel (answered at once, only ever by this call's own job,
// since a voice job runs alone) it stays taken until that job has really ended. Any other refusal frees it at once.
function through<Name extends Guarded>({ jobs, job, ended = NOTHING_RUNS }: Claim, handler: Handler<Name>): Handler<Name> {
  return async (request) => {
    const release = jobs.claim(request.folder, job);
    try {
      const answer = await handler(request);
      release();
      return answer;
    } catch (error) {
      releaseAfter(error, release, ended);
      throw error;
    }
  };
}

/**
 * The render and the channels that make voices (generate, a take recorded or removed) or scenario images go through
 * the folder jobs: a render does not start while that project's voices or images are being made, nor they while it
 * renders. A voice job keeps its folder until the voice worker has really ended it (an image cancel aborts its call).
 */
export function folderJobsGuard(handlers: Handlers, jobs: FolderJobs, ended: JobsEnded): Handlers {
  return {
    ...handlers,
    'video.render': through({ jobs, job: 'render' }, handlers['video.render']),
    'voices.generate': through({ jobs, job: 'voices', ended: ended.voices }, handlers['voices.generate']),
    'voices.record': through({ jobs, job: 'voices', ended: ended.voices }, handlers['voices.record']),
    'voices.unrecord': through({ jobs, job: 'voices', ended: ended.voices }, handlers['voices.unrecord']),
    'scenarios.generate': through({ jobs, job: 'scenarios' }, handlers['scenarios.generate']),
  };
}
