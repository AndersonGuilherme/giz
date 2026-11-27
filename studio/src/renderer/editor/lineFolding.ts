// Which lines of the script editor are open. Only the window's view: nothing of it is saved in script.json.

/** `one`: at most one open line (opening another folds it); `all`: every line open except the ones folded by hand. */
export type Folding = Readonly<{ mode: 'one'; open: string | null }> | Readonly<{ mode: 'all'; folded: readonly string[] }>;

export const ALL_FOLDED: Folding = { mode: 'one', open: null };

export const allOpened = (): Folding => ({ mode: 'all', folded: [] });

export function isOpen(folding: Folding, id: string): boolean {
  if (folding.mode === 'all') return !folding.folded.includes(id);
  return folding.open === id;
}

/** The line opened (a click on a folded row, a jump to it, a new line); the open one before it folds, unless all are open. */
export function opened(folding: Folding, id: string): Folding {
  if (folding.mode === 'all') return { mode: 'all', folded: folding.folded.filter((each) => each !== id) };
  return { mode: 'one', open: id };
}

/** A click on the row: open it, or fold it when it is open. */
export function toggled(folding: Folding, id: string): Folding {
  if (!isOpen(folding, id)) return opened(folding, id);
  if (folding.mode === 'all') return { mode: 'all', folded: [...folding.folded, id] };
  return ALL_FOLDED;
}

/** The id of the line just added (a new line, a copy): the one new id when the list grew by exactly one line. */
export function addedLineOf(before: readonly string[] | null, after: readonly string[]): string | null {
  if (before === null || after.length !== before.length + 1) return null;
  const added = after.filter((id) => !before.includes(id));
  return added.length === 1 ? added[0]! : null;
}
