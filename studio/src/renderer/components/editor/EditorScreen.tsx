import { useCallback, useMemo, useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import { useTranslate } from '../../i18n.ts';
import { useEditor, type Editor } from '../../state/useEditor.ts';
import { StageBar } from '../common/StageBar.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { EditorContext, type EditorTools } from './EditorContext.ts';
import { EditorToolbar } from './EditorToolbar.tsx';
import { LineList } from './LineList.tsx';
import { ProblemsPanel } from './ProblemsPanel.tsx';
import { RenderBox } from './RenderBox.tsx';
import { useUndoKeys } from './useUndoKeys.ts';

type Props = Readonly<{ api: GizApi; folder: string }>;

type Local = Pick<EditorTools, 'selected' | 'select' | 'unsaved' | 'markDraft'>;

/** What only the window knows: the selected line, and the JSON boxes holding text that does not parse (not saved). */
function useLocal(): Local {
  const [selected, select] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<ReadonlySet<string>>(new Set());
  const markDraft = useCallback((key: string, invalid: boolean) => setDrafts((current) => {
    if (current.has(key) === invalid) return current;
    return new Set(invalid ? [...current, key] : [...current].filter((known) => known !== key));
  }), []);
  return useMemo(() => ({ selected, select, unsaved: drafts.size > 0, markDraft }), [selected, drafts, markDraft]);
}

const NO_PROBLEMS = { errors: [], warnings: [] } as const;

function useTools(api: GizApi, editor: Editor, selection: Local): EditorTools | null {
  const { loaded, history, report, edit } = editor;
  return useMemo(() => {
    if (!loaded || !history) return null;
    const { errors, warnings } = report ?? NO_PROBLEMS;
    return { api, document: loaded.document, vocabulary: loaded.vocabulary, script: history.present, errors, warnings, edit, ...selection };
  }, [api, loaded, history, report, edit, selection]);
}

function Body({ editor }: Readonly<{ editor: Editor }>) {
  return (
    <div className="editor-body">
      <LineList />
      <aside className="editor-side"><ProblemsPanel saving={editor.saving} saveFailure={editor.saveFailure} /><RenderBox /></aside>
    </div>
  );
}

function Title({ tools }: Readonly<{ tools: EditorTools }>) {
  const { document } = tools;
  return (
    <div className="editor-title">
      <h2>{document.title}</h2>
      <p className="folder">{document.folder}</p>
    </div>
  );
}

/** The Script stage: the stages on top, the lines in the middle, the check and the render beside them. */
export function EditorScreen({ api, folder }: Props) {
  const translate = useTranslate();
  const editor = useEditor(api, folder);
  const tools = useTools(api, editor, useLocal());
  useUndoKeys(editor.undo, editor.redo);
  if (editor.failure) return <main className="board"><FailurePanel failure={editor.failure} /></main>;
  if (!tools) return <p className="hint">{translate('editor.loading')}</p>;
  return (
    <EditorContext.Provider value={tools}>
      <main className="editor" data-testid="editor">
        <div className="editor-head"><Title tools={tools} /><StageBar stages={editor.report?.stages ?? []} /></div>
        <EditorToolbar editor={editor} />
        <Body editor={editor} />
      </main>
    </EditorContext.Provider>
  );
}
