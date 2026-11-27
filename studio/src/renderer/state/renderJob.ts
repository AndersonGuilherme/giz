import type { Aspect, Failure, RenderedFiles, RenderJobStatus } from '../../shared/contract.ts';

type Named = Readonly<{ folder: string; aspect: Aspect }>;

/** The render of the window: none, running (`fraction` null while it prepares), or how it ended. */
export type RenderJob =
  | Readonly<{ status: 'none' }>
  | (Named & Readonly<{ status: 'running'; fraction: number | null }>)
  | (Named & Readonly<{ status: 'done'; files: RenderedFiles }>)
  | (Named & Readonly<{ status: 'cancelled' }>)
  | (Named & Readonly<{ status: 'failed'; failure: Failure }>);

/** `ended`: which folder's render ended last and how many have ended, so a screen reloads once per end. */
export type RenderJobState = Readonly<{ job: RenderJob; ended: Readonly<{ folder: string; count: number }> }>;

/** What a project's render card shows: its own render (the one of another folder is not its own). */
export type RenderView =
  | Readonly<{ status: 'idle'; failure?: Failure }>
  | Readonly<{ status: 'running'; aspect: Aspect; fraction: number | null }>
  | Readonly<{ status: 'done'; aspect: Aspect; files: RenderedFiles }>
  | Readonly<{ status: 'cancelled'; aspect: Aspect }>;

export type RenderEvent =
  | (Named & Readonly<{ type: 'started' }>)
  | (Named & Readonly<{ type: 'progress'; fraction: number }>)
  | Readonly<{ type: 'attached'; status: RenderJobStatus | null }>
  | (Named & Readonly<{ type: 'rendered'; files: RenderedFiles }>)
  | (Named & Readonly<{ type: 'cancelled' }>)
  | (Named & Readonly<{ type: 'failed'; failure: Failure }>)
  | Readonly<{ type: 'vanished' }>;

export const NO_RENDER: RenderJobState = { job: { status: 'none' }, ended: { folder: '', count: 0 } };

type EventOf<Type extends RenderEvent['type']> = Extract<RenderEvent, { type: Type }>;
type Reducers = { readonly [Type in RenderEvent['type']]: (state: RenderJobState, event: EventOf<Type>) => RenderJobState };

const running = (state: RenderJobState, { folder, aspect }: Named, fraction: number | null): RenderJobState => ({ ...state, job: { status: 'running', folder, aspect, fraction } });
const ended = (state: RenderJobState, job: Exclude<RenderJob, { status: 'none' | 'running' }>): RenderJobState => ({ job, ended: { folder: job.folder, count: state.ended.count + 1 } });
// Progress of the running render, or of one this window did not start (after a reload); a late step of an ended render is dropped.
const progressed = (state: RenderJobState, event: EventOf<'progress'>) => (state.job.status === 'running' || state.job.status === 'none' ? running(state, event, event.fraction) : state);

function vanished(state: RenderJobState): RenderJobState {
  if (state.job.status !== 'running') return state;
  return { job: { status: 'none' }, ended: { folder: state.job.folder, count: state.ended.count + 1 } };
}

// One entry per event: a new event is one more entry, never one more `case`.
const REDUCERS: Reducers = {
  started: (state, event) => running(state, event, null),
  progress: progressed,
  attached: (state, { status }) => (status ? running(state, status, status.fraction) : state),
  rendered: (state, { folder, aspect, files }) => ended(state, { status: 'done', folder, aspect, files }),
  cancelled: (state, { folder, aspect }) => ended(state, { status: 'cancelled', folder, aspect }),
  failed: (state, { folder, aspect, failure }) => ended(state, { status: 'failed', folder, aspect, failure }),
  vanished,
};

export function reduceRender(state: RenderJobState, event: RenderEvent): RenderJobState {
  const reducer = REDUCERS[event.type] as (state: RenderJobState, event: RenderEvent) => RenderJobState;
  return reducer(state, event);
}

const VIEWS: { readonly [Status in RenderJob['status']]: (job: Extract<RenderJob, { status: Status }>) => RenderView } = {
  none: () => ({ status: 'idle' }),
  running: ({ aspect, fraction }) => ({ status: 'running', aspect, fraction }),
  done: ({ aspect, files }) => ({ status: 'done', aspect, files }),
  cancelled: ({ aspect }) => ({ status: 'cancelled', aspect }),
  failed: ({ failure }) => ({ status: 'idle', failure }),
};

/** The render as the card of `folder` shows it: idle unless the render is that folder's. */
export function renderOf({ job }: RenderJobState, folder: string): RenderView {
  if (job.status === 'none' || job.folder !== folder) return { status: 'idle' };
  return (VIEWS[job.status] as (job: RenderJob) => RenderView)(job);
}
