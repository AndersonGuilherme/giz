import { useLayoutEffect, useState } from 'react';
import type { Box } from '../../tour/placement.ts';

const boxOf = (element: Element): Box => {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { top, left, width, height };
};

// The first element marked `data-tour="<target>"` that is on screen (a hidden one, in a folded line, does not count).
function shownTarget(target: string | undefined): Element | null {
  if (!target) return null;
  const marked = [...document.querySelectorAll(`[data-tour="${target}"]`)];
  return marked.find((element) => element.getClientRects().length > 0) ?? null;
}

/** Where the step's target is in the window (null: not on screen), followed while the window scrolls or resizes. */
export function useTargetBox(target: string | undefined, step: number): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const element = shownTarget(target);
    element?.scrollIntoView({ block: 'center', inline: 'nearest' });
    const measure = () => setBox(element ? boxOf(element) : null);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target, step]);
  return box;
}
