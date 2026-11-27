// Where the tour's card goes: beside the lit-up target (below, above, right or left, the first that fits), or centred.

export type Box = Readonly<{ top: number; left: number; width: number; height: number }>;
export type Size = Readonly<{ width: number; height: number }>;
export type Side = 'below' | 'above' | 'right' | 'left' | 'centre';
export type Placement = Readonly<{ hole: Box | null; card: Readonly<{ top: number; left: number }>; side: Side }>;

const PADDING = 8;
const GAP = 14;
const MARGIN = 16;

const clamp = (value: number, lowest: number, highest: number) => Math.max(lowest, Math.min(value, Math.max(lowest, highest)));

const padded = ({ top, left, width, height }: Box): Box => ({ top: top - PADDING, left: left - PADDING, width: width + 2 * PADDING, height: height + 2 * PADDING });

// The card's place on each side of the hole, and whether it fits there.
function sides(hole: Box, view: Size, card: Size) {
  const across = clamp(hole.left, MARGIN, view.width - card.width - MARGIN);
  const along = clamp(hole.top, MARGIN, view.height - card.height - MARGIN);
  const below = hole.top + hole.height + GAP;
  const above = hole.top - GAP - card.height;
  const right = hole.left + hole.width + GAP;
  const left = hole.left - GAP - card.width;
  return [
    { side: 'below', top: below, left: across, fits: below + card.height <= view.height - MARGIN },
    { side: 'above', top: above, left: across, fits: above >= MARGIN },
    { side: 'right', top: along, left: right, fits: right + card.width <= view.width - MARGIN },
    { side: 'left', top: along, left, fits: left >= MARGIN },
  ] as const;
}

const centred = (view: Size, card: Size) => ({ top: Math.round((view.height - card.height) / 2), left: Math.round((view.width - card.width) / 2) });

export function placementOf(target: Box | null, view: Size, card: Size): Placement {
  if (!target) return { hole: null, card: centred(view, card), side: 'centre' };
  const hole = padded(target);
  const chosen = sides(hole, view, card).find(({ fits }) => fits);
  // Nothing fits (a target as big as the window): the card sits at the bottom, over it.
  if (!chosen) return { hole, card: { top: view.height - card.height - MARGIN, left: centred(view, card).left }, side: 'centre' };
  return { hole, card: { top: chosen.top, left: chosen.left }, side: chosen.side };
}
