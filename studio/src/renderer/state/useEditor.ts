import { useCallback, useEffect, useState } from 'react';
import type { Failure } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { EditorReport, ScriptDocument, ScriptJson, Vocabulary } from '../../shared/script.ts';
import { edited, historyOf, redone, undone, type History } from '../editor/editorHistory.ts';
import { useAutosave } from './useAutosave.ts';

type Loaded = Readonly<{ document: ScriptDocument; vocabulary: Vocabulary; report: EditorReport }>;

/** Opens the project: its document, the pickers' lists and the first check (nothing is saved by opening). */
function useLoaded(api: GizApi, folder: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  useEffect(() => {
    void Promise.all([api.script.read(folder), api.script.vocabulary(), api.script.check(folder)]).then(([document, vocabulary, report]) => {
      const failed = [document, vocabulary, report].find((result) => !result.ok);
      if (failed && !failed.ok) return setFailure(failed.failure);
      if (document.ok && vocabulary.ok && report.ok) setLoaded({ document: document.value, vocabulary: vocabulary.value, report: report.value });
    });
  }, [api, folder]);
  return { loaded, failure };
}

/** The history of the script: every change is one step to undo (or the same step, while one field is typed). */
function useHistory(loaded: Loaded | null) {
  const [history, setHistory] = useState<History | null>(null);
  useEffect(() => void (loaded && setHistory(historyOf(loaded.document.script))), [loaded]);
  const edit = useCallback((change: (script: ScriptJson) => ScriptJson, key?: string) => {
    const mark = key ? { key, at: Date.now() } : undefined;
    setHistory((current) => current && edited(current, change(current.present), mark));
  }, []);
  const undo = useCallback(() => setHistory((current) => current && undone(current)), []);
  const redo = useCallback(() => setHistory((current) => current && redone(current)), []);
  return { history, edit, undo, redo };
}

const shownOf = (history: History | null, loaded: Loaded | null) => ({ script: history?.present ?? null, opened: loaded?.document.script ?? null });
// The check of the last save; before any save, the one made when the project opened.
const latestReport = (saved: EditorReport | null, loaded: Loaded | null) => saved ?? loaded?.report ?? null;

/** The script being edited, saved (and checked) a moment after the typing stops. */
export function useEditor(api: GizApi, folder: string) {
  const { loaded, failure } = useLoaded(api, folder);
  const { history, ...changes } = useHistory(loaded);
  const save = useAutosave(api, folder, shownOf(history, loaded));
  return { loaded, failure, history, ...changes, report: latestReport(save.report, loaded), saving: save.status, saveFailure: save.failure };
}

export type Editor = ReturnType<typeof useEditor>;
