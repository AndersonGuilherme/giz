// Where a guided tour is: closed, or open on one of its steps. `seen` turns true when it is finished or skipped.
import type { TourId } from '../../shared/settings.ts';

export type TourState = Readonly<{ open: boolean; step: number; steps: number; seen: boolean }>;
export type TourEvent = Readonly<{ type: 'start'; steps: number }> | Readonly<{ type: 'next' | 'back' | 'skip' }>;

export const CLOSED_TOUR: TourState = { open: false, step: 0, steps: 0, seen: false };

const ended: TourState = { ...CLOSED_TOUR, seen: true };

function moved(state: TourState, by: number): TourState {
  const step = state.step + by;
  if (step >= state.steps) return ended;
  return { ...state, step: Math.max(0, step) };
}

export function reduceTour(state: TourState, event: TourEvent): TourState {
  if (event.type === 'start') return { open: true, step: 0, steps: event.steps, seen: false };
  if (!state.open) return state;
  if (event.type === 'skip') return ended;
  return moved(state, event.type === 'next' ? 1 : -1);
}

/** A tour starts by itself only when it was never seen and was not shown yet in this window. */
export const shouldStart = (tour: TourId, seen: readonly TourId[], shown: boolean): boolean => !shown && !seen.includes(tour);
