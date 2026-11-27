import { useEffect, useRef, useState } from 'react';
import type { Failure, Result } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { EditorReport, ScriptJson } from '../../shared/script.ts';

/** `saved`: what is on disk is what is shown; `pending`: a change waits for the typing to stop; `saving`: on its way. */
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'failed';

// How long after the last change the script is saved and checked.
export const SAVE_DELAY = 600;

type Answer = Readonly<{ status: SaveStatus; report: EditorReport | null; failure: Failure | null }>;
/** `script`: what the editor shows now; `opened`: what was on disk when it opened (not saved again). */
type Shown = Readonly<{ script: ScriptJson | null; opened: ScriptJson | null }>;

const SAVED: Answer = { status: 'saved', report: null, failure: null };

const answerOf = (result: Result<EditorReport>, current: Answer): Answer =>
  (result.ok ? { status: 'saved', report: result.value, failure: null } : { ...current, status: 'failed', failure: result.failure });

/**
 * Saves the script a moment after it stops changing (script.json is replaced atomically by the main process) and
 * keeps the check that comes back; an answer to an older save is dropped when a newer one was sent.
 */
export function useAutosave(api: GizApi, folder: string, { script, opened }: Shown): Answer {
  const [answer, setAnswer] = useState<Answer>(SAVED);
  const sent = useRef(0);
  const saved = useRef(opened);
  saved.current ??= opened;
  useEffect(() => {
    if (script === null || script === saved.current) return;
    setAnswer((current) => ({ ...current, status: 'pending' }));
    const save = async () => {
      const number = ++sent.current;
      saved.current = script;
      setAnswer((current) => ({ ...current, status: 'saving' }));
      const result = await api.script.save(folder, script);
      if (number === sent.current) setAnswer((current) => answerOf(result, current));
    };
    const timer = setTimeout(() => void save(), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [api, folder, script]);
  return answer;
}
