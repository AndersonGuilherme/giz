import { useEffect } from 'react';

// Ctrl+Z undoes, Ctrl+Shift+Z or Ctrl+Y redoes (⌘ on a Mac), in the text boxes too: the editor keeps one history.
const ACTIONS: Readonly<Record<string, (shift: boolean) => 'undo' | 'redo'>> = { KeyZ: (shift) => (shift ? 'redo' : 'undo'), KeyY: () => 'redo' };

/** The undo and redo keys of the whole editor. */
export function useUndoKeys(undo: () => void, redo: () => void): void {
  useEffect(() => {
    const run = { undo, redo };
    const listener = (event: KeyboardEvent) => {
      const action = ACTIONS[event.code];
      if (!action || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      run[action(event.shiftKey)]();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [undo, redo]);
}
