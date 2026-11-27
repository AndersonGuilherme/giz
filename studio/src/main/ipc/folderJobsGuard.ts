import type { FolderJob, FolderJobs } from '../services/FolderJobs.ts';
import type { Handler, Handlers } from './registry.ts';

type Guarded = 'video.render' | 'voices.generate' | 'voices.record' | 'voices.unrecord' | 'scenarios.generate';

/** When the voice job has really ended (a cancel answers at once; the voice worker ends the job later). */
export type JobsEnded = Readonly<{ voices: () => Promise<void> }>;

type Claim = Readonly<{ jobs: FolderJobs; job: FolderJob; ended?: () => Promise<void> }>;

const NOTHING_RUNS = async () => undefined;

// The folder stays claimed until the handler answered and the service's job really ended.
function through<Name extends Guarded>({ jobs, job, ended = NOTHING_RUNS }: Claim, handler: Handler<Name>): Handler<Name> {
  return (request) => jobs.run(request.folder, job, async () => {
    try {
      return await handler(request);
    } finally {
      await ended();
    }
  });
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
