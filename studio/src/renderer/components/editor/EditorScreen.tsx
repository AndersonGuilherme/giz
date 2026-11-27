import { useCallback, useMemo, useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import { useTranslate } from '../../i18n.ts';
import { useEditor, type Editor } from '../../state/useEditor.ts';
import { useTour, type TourControl } from '../../state/useTour.ts';
import { SCRIPT_TOUR } from '../../tour/scriptTour.ts';
import { Icon } from '../common/Icon.tsx';
import { StageBar } from '../common/StageBar.tsx';
import { TourOverlay } from '../tour/TourOverlay.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { EditorContext, type EditorTools } from './EditorContext.ts';
import { EditorToolbar } from './EditorToolbar.tsx';
import { FoldingContext } from './FoldingContext.ts';
import { LineList } from './LineList.tsx';
import { ProblemsPanel } from './ProblemsPanel.tsx';
import { useFocusLine, useScriptFolding, useTourLine } from './useScriptFolding.ts';
import { useUndoKeys } from './useUndoKeys.ts';

type Props = Readonly<{ api: GizApi; folder: string; focus?: string }>;

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
      <aside className="editor-side"><ProblemsPanel saving={editor.saving} saveFailure={editor.saveFailure} /></aside>
    </div>
  );
}

function Title({ tools, tour }: Readonly<{ tools: EditorTools; tour: TourControl }>) {
  const translate = useTranslate();
  const { document } = tools;
  return (
    <div className="editor-title">
      <h2>{document.title}</h2>
      <p className="folder">{document.folder}</p>
      <button type="button" className="chalk-button small quiet tour-show" data-testid="tour-show" title={translate('tour.showTitle')} onClick={tour.start}><Icon name="help" /> {translate('tour.show')}</button>
    </div>
  );
}

function Board({ editor, tools, tour }: Readonly<{ editor: Editor; tools: EditorTools; tour: TourControl }>) {
  return (
    <>
      <main className="editor" data-testid="editor">
        <div className="editor-head"><Title tools={tools} tour={tour} /><StageBar stages={editor.report?.stages ?? []} /></div>
        <EditorToolbar editor={editor} />
        <Body editor={editor} />
      </main>
      <TourOverlay control={tour} />
    </>
  );
}

/**
 * The Script stage: the stages on top, the folded lines in the middle, the check beside them (the render is in the Video
 * stage), and the tour the first time.
 */
export function EditorScreen({ api, folder, focus }: Props) {
  const translate = useTranslate();
  const editor = useEditor(api, folder);
  const tools = useTools(api, editor, useLocal());
  const folding = useScriptFolding(folder, tools);
  const tour = useTour(SCRIPT_TOUR, tools !== null);
  useFocusLine(tools, folding, focus);
  useTourLine(tour, folding, tools);
  useUndoKeys(editor.undo, editor.redo);
  if (editor.failure) return <main className="board"><FailurePanel failure={editor.failure} /></main>;
  if (!tools) return <p className="hint">{translate('editor.loading')}</p>;
  return (
    <EditorContext.Provider value={tools}>
      <FoldingContext.Provider value={folding}><Board editor={editor} tools={tools} tour={tour} /></FoldingContext.Provider>
    </EditorContext.Provider>
  );
}
