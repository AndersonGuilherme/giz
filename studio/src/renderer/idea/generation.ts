import type { Failure } from '../../shared/contract.ts';
import type { ScriptEstimate, ScriptProgress } from '../../shared/projects.ts';

/** "Gerar com IA": the estimate first, the person's confirmation, the calls with their progress, then done or failed. */
export type GenerationState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'estimating' }>
  | Readonly<{ status: 'confirm'; estimate: ScriptEstimate }>
  | Readonly<{ status: 'running'; estimate: ScriptEstimate; progress: ScriptProgress | null }>
  | Readonly<{ status: 'failed'; failure: Failure }>
  | Readonly<{ status: 'cancelled' }>;

export type GenerationEvent =
  | Readonly<{ type: 'estimate' }>
  | Readonly<{ type: 'estimated'; estimate: ScriptEstimate }>
  | Readonly<{ type: 'start' }>
  | Readonly<{ type: 'progress'; progress: ScriptProgress }>
  | Readonly<{ type: 'failed'; failure: Failure }>
  | Readonly<{ type: 'cancelled' }>
  | Readonly<{ type: 'close' }>;

type EventOf<Type extends GenerationEvent['type']> = Extract<GenerationEvent, { type: Type }>;
type Reducers = { readonly [Type in GenerationEvent['type']]: (state: GenerationState, event: EventOf<Type>) => GenerationState };

export const IDLE: GenerationState = { status: 'idle' };

// A map of event → next state: progress only counts while running, start only after the confirmation.
const REDUCERS: Reducers = {
  estimate: () => ({ status: 'estimating' }),
  estimated: (state, { estimate }) => (state.status === 'estimating' ? { status: 'confirm', estimate } : state),
  start: (state) => (state.status === 'confirm' ? { status: 'running', estimate: state.estimate, progress: null } : state),
  progress: (state, { progress }) => (state.status === 'running' ? { ...state, progress } : state),
  failed: (_state, { failure }) => ({ status: 'failed', failure }),
  cancelled: () => ({ status: 'cancelled' }),
  close: () => IDLE,
};

export function reduceGeneration(state: GenerationState, event: GenerationEvent): GenerationState {
  const reducer = REDUCERS[event.type] as (state: GenerationState, event: GenerationEvent) => GenerationState;
  return reducer(state, event);
}
