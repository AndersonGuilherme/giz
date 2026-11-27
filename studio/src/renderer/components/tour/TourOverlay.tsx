import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { placementOf, type Size } from '../../tour/placement.ts';
import { tourKeyAction, wrappedFocus } from '../../tour/tourKeys.ts';
import type { TourControl } from '../../state/useTour.ts';
import { TourCard } from './TourCard.tsx';
import { useTargetBox } from './useTargetBox.ts';

const GUESS: Size = { width: 380, height: 240 };

// The card's real size once drawn (its text changes with each step and language).
function useCardSize(step: number) {
  const card = useRef<HTMLElement>(null);
  const [size, setSize] = useState<Size>(GUESS);
  useLayoutEffect(() => {
    const element = card.current;
    if (element && (element.offsetWidth !== size.width || element.offsetHeight !== size.height)) setSize({ width: element.offsetWidth, height: element.offsetHeight });
  });
  // The first button takes the focus on each step, so Enter goes on.
  useEffect(() => card.current?.querySelector<HTMLButtonElement>('[data-primary]')?.focus(), [step]);
  return { card, size };
}

const BUTTONS = 'button:not(:disabled)';

const actionOf = (event: KeyboardEvent, card: HTMLElement | null) =>
  tourKeyAction({ code: event.code || event.key, shift: event.shiftKey, control: event.ctrlKey || event.metaKey, inCard: card?.contains(document.activeElement) ?? false });

// Escape skips; the arrows go on and back while the focus is in the card; Tab goes round inside it; the page's own
// shortcuts (undo, redo) are swallowed before they reach it (a capture listener runs first).
function useKeys({ dispatch }: TourControl, card: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      const action = actionOf(event, card.current);
      if (action === 'none') return;
      if (action === 'tab') return keepTabInside(event, card.current);
      event.preventDefault();
      event.stopImmediatePropagation();
      if (action !== 'block') dispatch({ type: action });
    };
    window.addEventListener('keydown', press, true);
    return () => window.removeEventListener('keydown', press, true);
  }, [dispatch, card]);
}

function keepTabInside(event: KeyboardEvent, card: HTMLElement | null): void {
  const buttons = [...(card?.querySelectorAll<HTMLElement>(BUTTONS) ?? [])];
  const target = wrappedFocus(buttons.length, buttons.indexOf(document.activeElement as HTMLElement), event.shiftKey);
  if (target === null) return;
  event.preventDefault();
  buttons[target]?.focus();
}

// While the tour is open the page under it is inert (no click, no focus, no screen reader); on close the focus goes
// back where it was.
function useModal(): void {
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const page = document.getElementById('root');
    page?.setAttribute('inert', '');
    return () => {
      page?.removeAttribute('inert');
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);
}

function Overlay({ control }: Readonly<{ control: TourControl }>) {
  const { tour, state } = control;
  const box = useTargetBox(tour.steps[state.step]?.target, state.step);
  const { card, size } = useCardSize(state.step);
  useKeys(control, card);
  useModal();
  const placed = placementOf(box, { width: window.innerWidth, height: window.innerHeight }, size);
  return createPortal(
    <div className="tour" data-testid="tour-overlay">
      {placed.hole ? <div className="tour-hole" style={placed.hole} /> : <div className="tour-dim" />}
      <TourCard ref={card} control={control} pointing={placed.hole !== null} style={placed.card} side={placed.side} />
    </div>,
    document.body,
  );
}

/** A guided tour over the screen: the page dimmed, the step's element lit up and the card beside it (centred when there is none). */
export function TourOverlay({ control }: Readonly<{ control: TourControl }>) {
  return control.state.open ? <Overlay control={control} /> : null;
}
