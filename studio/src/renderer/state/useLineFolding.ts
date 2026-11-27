import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addedLineOf, ALL_FOLDED, allOpened, isOpen, opened, toggled, type Folding } from '../editor/lineFolding.ts';

// Per project, for as long as the window lives: going to another tab or project and back keeps the open lines.
const remembered = new Map<string, Folding>();

/** The open lines and how to change them; `fresh`: the line just added (it opens with the caret in its text). */
export type LineFolding = Readonly<{
  isOpen: (id: string) => boolean;
  allOpen: boolean;
  anyOpen: boolean;
  fresh: string | null;
  toggle: (id: string) => void;
  open: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}>;

// A line added (a new one, a copy, a line below) opens, and the one open before folds.
function useFreshLine(ids: readonly string[] | null, change: (next: (folding: Folding) => Folding) => void): string | null {
  const [fresh, setFresh] = useState<string | null>(null);
  const before = useRef<readonly string[] | null>(null);
  const key = ids?.join('\n') ?? null;
  useEffect(() => {
    if (!ids) return;
    const added = addedLineOf(before.current, ids);
    before.current = ids;
    if (added === null) return;
    change((folding) => opened(folding, added));
    setFresh(added);
  }, [key]);
  return fresh;
}

/** Which lines of the project are open: every one folded at first, one at a time, until "expand all". */
export function useLineFolding(folder: string, ids: readonly string[] | null): LineFolding {
  const [folding, setFolding] = useState<Folding>(() => remembered.get(folder) ?? ALL_FOLDED);
  useEffect(() => void remembered.set(folder, folding), [folder, folding]);
  const fresh = useFreshLine(ids, setFolding);
  const toggle = useCallback((id: string) => setFolding((current) => toggled(current, id)), []);
  const open = useCallback((id: string) => setFolding((current) => opened(current, id)), []);
  const expandAll = useCallback(() => setFolding(allOpened()), []);
  const collapseAll = useCallback(() => setFolding(ALL_FOLDED), []);
  return useMemo(() => ({
    isOpen: (id: string) => isOpen(folding, id),
    allOpen: folding.mode === 'all',
    anyOpen: folding.mode === 'all' || (folding.open !== null && (ids ?? []).includes(folding.open)),
    fresh, toggle, open, expandAll, collapseAll,
  }), [folding, fresh, ids, toggle, open, expandAll, collapseAll]);
}
