import { useCallback, useEffect, useReducer } from 'react';
import { CLOSED_TOUR, reduceTour, shouldStart, type TourEvent, type TourState } from '../tour/tourProgress.ts';
import type { Tour } from '../tour/tours.ts';
import type { TourId } from '../../shared/settings.ts';
import { useSetup } from './SetupContext.ts';

// The tours already shown in this window: one starts by itself once, even before the main process says it was seen.
const shown = new Set<TourId>();

/** "Mostrar tutoriais de novo": the tours start by themselves again in this window too. */
export const forgetShownTours = (): void => shown.clear();

export type TourControl = Readonly<{ tour: Tour; state: TourState; dispatch: (event: TourEvent) => void; start: () => void }>;

/**
 * A screen's tour: it starts by itself when the screen is `ready` and the person never saw it; finishing or skipping
 * tells the main process (the app settings), so it does not start again, in this window or the next.
 */
export function useTour(tour: Tour, ready: boolean): TourControl {
  const { settings, actions } = useSetup();
  const [state, dispatch] = useReducer(reduceTour, CLOSED_TOUR);
  const start = useCallback(() => {
    shown.add(tour.id);
    dispatch({ type: 'start', steps: tour.steps.length });
  }, [tour]);
  useEffect(() => {
    if (ready && shouldStart(tour.id, settings.toursSeen, shown.has(tour.id))) start();
  }, [ready]);
  useEffect(() => void (state.seen && actions.tourSeen(tour.id)), [state.seen]);
  return { tour, state, dispatch, start };
}
