// The keys while a tour is open: it is modal, so the page under it takes no shortcut and Tab stays in the card.

export type TourKey = Readonly<{ code: string; shift: boolean; control: boolean; inCard: boolean }>;
export type TourKeyAction = 'skip' | 'next' | 'back' | 'tab' | 'block' | 'none';

const ARROWS: Readonly<Record<string, TourKeyAction>> = { ArrowRight: 'next', ArrowLeft: 'back' };
const PAGE_SHORTCUTS = ['KeyZ', 'KeyY'];

const ANYWHERE: Readonly<Record<string, TourKeyAction>> = { Escape: 'skip', Tab: 'tab' };

export function tourKeyAction({ code, control, inCard }: TourKey): TourKeyAction {
  if (control && PAGE_SHORTCUTS.includes(code)) return 'block';
  const arrow = inCard ? ARROWS[code] : undefined;
  return ANYWHERE[code] ?? arrow ?? 'none';
}

/** Where Tab must put the focus so it never leaves the card (`at`: the focused button, −1 outside); null: let it move. */
export function wrappedFocus(count: number, at: number, backwards: boolean): number | null {
  if (count === 0) return null;
  // Going forward, the edge is the last button and the way round leads to the first; backwards, the other way.
  const [edge, round] = backwards ? [0, count - 1] : [count - 1, 0];
  return at < 0 || at === edge ? round : null;
}
