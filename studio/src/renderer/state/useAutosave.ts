import { useEffect, useMemo, useState } from 'react';
import type { Failure } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { EditorReport, ScriptJson } from '../../shared/script.ts';
import { ScriptSaver, type SaveAnswer, type SaveStatus } from '../editor/scriptSaver.ts';
import { onLeaving } from './leaving.ts';

export type { SaveStatus };

// How long after the last change the script is saved and checked.
export const SAVE_DELAY = 600;

type Answer = Readonly<{ status: SaveStatus; report: EditorReport | null; failure: Failure | null }>;
/** `script`: what the editor shows now; `opened`: what was on disk when it opened (not saved again). */
type Shown = Readonly<{ script: ScriptJson | null; opened: ScriptJson | null }>;

const SAVED: Answer = { status: 'saved', report: null, failure: null };

function next(current: Answer, { status, result }: SaveAnswer): Answer {
  if (!result) return { ...current, status };
  return result.ok ? { status, report: result.value, failure: null } : { ...current, status, failure: result.failure };
}

/** Closing the window with a change on its way: the close waits for the save, then the window closes itself. */
export function guardClose(saver: Pick<ScriptSaver, 'hasPending' | 'flush'>): () => void {
  const listener = (event: BeforeUnloadEvent) => {
    if (!saver.hasPending()) return;
    event.preventDefault();
    event.returnValue = '';
    void saver.flush().then(() => window.close());
  };
  window.addEventListener('beforeunload', listener);
  return () => window.removeEventListener('beforeunload', listener);
}

/** The script saved a moment after it stops changing, and flushed when the editor goes away or the window closes. */
export function useAutosave(api: GizApi, folder: string, { script, opened }: Shown): Answer {
  const [answer, setAnswer] = useState<Answer>(SAVED);
  const saver = useMemo(() => {
    if (opened === null) return null;
    return new ScriptSaver({ send: (json) => api.script.save(folder, json), saved: opened, delay: SAVE_DELAY, onAnswer: (given) => setAnswer((current) => next(current, given)) });
  }, [api, folder, opened]);
  useEffect(() => void (saver && script && saver.change(script)), [saver, script]);
  useEffect(() => {
    if (!saver) return;
    const stopLeaving = onLeaving(() => saver.flush());
    const stopClose = guardClose(saver);
    return () => {
      stopLeaving();
      stopClose();
      void saver.flush();
    };
  }, [saver]);
  return answer;
}
