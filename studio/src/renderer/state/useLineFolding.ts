import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addedLineOf, ALL_FOLDED, allOpened, everyOpen, isOpen, opened, someOpen, toggled, type Folding } from '../editor/lineFolding.ts';

// Per project, for as long as the window lives: going to another tab or project and back keeps the open lines.
const remembered = new Map<string, Folding>();

/** The open lines and how to change them; `fresh`: the line just added (it opens with the caret in its text). */
export type LineFolding = Readonly<{
  isOpen: (id: string) => boolean;
  allOpen: boolean;
  anyOpen: boolean;
  fresh: string | null;
  /** The new line got the caret: it is no longer fresh (a remount, a move, never takes the caret again). */
  arrived: () => void;
  toggle: (id: string) => void;
  open: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}>;

// A line added by an edit (a new one, a copy, a line below) opens, and the one open before folds; a line that comes
// back by undo or redo is no new line.
function useFreshLine(ids: readonly string[] | null, byEdit: boolean, change: (next: (folding: Folding) => Folding) => void) {
  const [fresh, setFresh] = useState<string | null>(null);
  const before = useRef<readonly string[] | null>(null);
  const key = ids?.join('\n') ?? null;
  useEffect(() => {
    if (!ids) return;
    const added = addedLineOf(before.current, ids);
    before.current = ids;
    if (added === null || !byEdit) return;
    change((folding) => opened(folding, added));
    setFresh(added);
  }, [key]);
  return { fresh, arrived: useCallback(() => setFresh(null), []) };
}

/** Which lines of the project are open: every one folded at first, one at a time, until "expand all". */
export function useLineFolding(folder: string, ids: readonly string[] | null, byEdit: boolean): LineFolding {
  const [folding, setFolding] = useState<Folding>(() => remembered.get(folder) ?? ALL_FOLDED);
  useEffect(() => void remembered.set(folder, folding), [folder, folding]);
  const { fresh, arrived } = useFreshLine(ids, byEdit, setFolding);
  const toggle = useCallback((id: string) => setFolding((current) => toggled(current, id)), []);
  const open = useCallback((id: string) => setFolding((current) => opened(current, id)), []);
  const expandAll = useCallback(() => setFolding(allOpened()), []);
  const collapseAll = useCallback(() => setFolding(ALL_FOLDED), []);
  return useMemo(() => ({
    isOpen: (id: string) => isOpen(folding, id),
    allOpen: everyOpen(folding, ids ?? []),
    anyOpen: someOpen(folding, ids ?? []),
    fresh, arrived, toggle, open, expandAll, collapseAll,
  }), [folding, fresh, arrived, ids, toggle, open, expandAll, collapseAll]);
}
