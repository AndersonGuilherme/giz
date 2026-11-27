import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placementOf, type Size } from '../../tour/placement.ts';
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

// Escape skips, the arrows go on and back.
function useKeys({ dispatch }: TourControl): void {
  useEffect(() => {
    const keys: Readonly<Record<string, 'skip' | 'next' | 'back'>> = { Escape: 'skip', ArrowRight: 'next', ArrowLeft: 'back' };
    const press = (event: KeyboardEvent) => {
      const type = keys[event.key];
      if (!type) return;
      event.preventDefault();
      dispatch({ type });
    };
    window.addEventListener('keydown', press);
    return () => window.removeEventListener('keydown', press);
  }, [dispatch]);
}

function Overlay({ control }: Readonly<{ control: TourControl }>) {
  const { tour, state } = control;
  const box = useTargetBox(tour.steps[state.step]?.target, state.step);
  const { card, size } = useCardSize(state.step);
  useKeys(control);
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
