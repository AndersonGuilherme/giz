import type { CheckReport, Failure, ProjectSummary, RenderedFiles } from '../../shared/contract.ts';

/** `fraction` is null while the render prepares (bundle), before the first frame. */
export type RenderState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'running'; fraction: number | null }>
  | Readonly<{ status: 'done'; files: RenderedFiles }>
  | Readonly<{ status: 'cancelled' }>;

export type StudioState = Readonly<{
  opening: boolean;
  project?: ProjectSummary;
  report?: CheckReport;
  failure?: Failure;
  render: RenderState;
}>;

export type StudioEvent =
  | Readonly<{ type: 'opening' }>
  | Readonly<{ type: 'opened'; project: ProjectSummary; report: CheckReport }>
  | Readonly<{ type: 'failed'; failure: Failure }>
  | Readonly<{ type: 'render-started' }>
  | Readonly<{ type: 'render-progress'; fraction: number }>
  | Readonly<{ type: 'rendered'; files: RenderedFiles }>
  | Readonly<{ type: 'render-cancelled' }>;

type EventOf<Type extends StudioEvent['type']> = Extract<StudioEvent, { type: Type }>;
type Reducers = { readonly [Type in StudioEvent['type']]: (state: StudioState, event: EventOf<Type>) => StudioState };

export const INITIAL_STATE: StudioState = { opening: false, render: { status: 'idle' } };

const IDLE: RenderState = { status: 'idle' };

// One entry per event: a new event is one more entry, never one more `case`.
const REDUCERS: Reducers = {
  opening: (state) => ({ ...state, opening: true, failure: undefined }),
  opened: (_state, { project, report }) => ({ opening: false, project, report, render: IDLE }),
  failed: (state, { failure }) => ({ ...state, opening: false, failure, render: IDLE }),
  'render-started': (state) => ({ ...state, failure: undefined, render: { status: 'running', fraction: null } }),
  'render-progress': (state, { fraction }) => (state.render.status === 'running' ? { ...state, render: { status: 'running', fraction } } : state),
  rendered: (state, { files }) => ({ ...state, render: { status: 'done', files } }),
  'render-cancelled': (state) => ({ ...state, render: { status: 'cancelled' } }),
};

export function reduce(state: StudioState, event: StudioEvent): StudioState {
  const reducer = REDUCERS[event.type] as (state: StudioState, event: StudioEvent) => StudioState;
  return reducer(state, event);
}
