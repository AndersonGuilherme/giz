import { useCallback, useEffect, useMemo } from 'react';
import { useLineFolding } from '../../state/useLineFolding.ts';
import type { TourControl } from '../../state/useTour.ts';
import type { EditorTools } from './EditorContext.ts';
import type { FoldingTools } from './FoldingContext.ts';

/**
 * The open lines of this project (`byEdit`: the script's last change was an edit, not undo or redo), and `show`: open a
 * line and select it (it scrolls into view).
 */
export function useScriptFolding(folder: string, tools: EditorTools | null, byEdit: boolean): FoldingTools {
  const lines = tools?.script.lines;
  const ids = useMemo(() => lines?.map(({ id }) => String(id)) ?? null, [lines]);
  const folding = useLineFolding(folder, ids, byEdit);
  const { open } = folding;
  const select = tools?.select;
  const show = useCallback((index: number) => {
    const id = ids?.[index];
    if (id === undefined) return;
    open(id);
    select?.(index);
  }, [ids, open, select]);
  return useMemo(() => ({ ...folding, show }), [folding, show]);
}

// A line named by another stage (the Video stage's check) is opened and selected once the script is loaded.
export function useFocusLine(tools: EditorTools | null, folding: FoldingTools, focus: string | undefined): void {
  const ready = tools !== null;
  useEffect(() => {
    if (!tools || focus === undefined) return;
    const index = tools.script.lines.findIndex((line) => line.id === focus);
    if (index >= 0) folding.show(index);
  }, [ready, focus]);
}

// The tour points at a line's fields: when it starts with no line really open, the first one opens.
export function useTourLine(control: TourControl, folding: FoldingTools, tools: EditorTools | null): void {
  const first = tools?.script.lines[0]?.id;
  useEffect(() => {
    if (control.state.open && !folding.anyOpen && first !== undefined) folding.open(String(first));
  }, [control.state.open]);
}
