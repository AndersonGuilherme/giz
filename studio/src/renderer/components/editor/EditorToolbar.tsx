import { Icon } from '../common/Icon.tsx';
import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import type { Editor } from '../../state/useEditor.ts';
import { addLine } from '../../editor/scriptEdits.ts';
import { ChaptersPanel } from './ChaptersPanel.tsx';
import { useEditorTools } from './EditorContext.ts';
import { useFolding } from './FoldingContext.ts';

/** "Expandir todas" opens every line (then each folds alone); "Recolher todas" folds them and brings back one at a time. */
function FoldButtons() {
  const translate = useTranslate();
  const folding = useFolding();
  return (
    <>
      <button type="button" className="chalk-button small quiet" data-testid="expand-all" disabled={folding.allOpen} onClick={folding.expandAll}><Icon name="unfold" /> {translate('editor.expandAll')}</button>
      <button type="button" className="chalk-button small quiet" data-testid="collapse-all" disabled={!folding.anyOpen} onClick={folding.collapseAll}><Icon name="fold" /> {translate('editor.collapseAll')}</button>
    </>
  );
}

/** Undo, redo, the chapters, open or fold every line, and a new line at the end. */
export function EditorToolbar({ editor }: Readonly<{ editor: Editor }>) {
  const translate = useTranslate();
  const { script, edit } = useEditorTools();
  const [chapters, setChapters] = useState(false);
  const history = editor.history;
  return (
    <div className="editor-toolbar">
      <div className="row">
        <button type="button" className="chalk-button small" data-testid="undo" disabled={!history?.past.length} onClick={editor.undo} title="Ctrl+Z"><Icon name="undo" /> {translate('editor.undo')}</button>
        <button type="button" className="chalk-button small" data-testid="redo" disabled={!history?.future.length} onClick={editor.redo} title="Ctrl+Shift+Z"><Icon name="redo" /> {translate('editor.redo')}</button>
        <button type="button" className="chalk-button small" data-testid="toggle-chapters" aria-expanded={chapters} onClick={() => setChapters(!chapters)}>{translate('editor.chapters', { count: script.chapters.length })}</button>
        <FoldButtons />
      </div>
      <button type="button" className="chalk-button small primary" data-testid="add-line" data-tour="add-line" onClick={() => edit((current) => addLine(current, current.lines.length - 1, translate('editor.newLineText')))}><Icon name="plus" /> {translate('editor.addLine')}</button>
      {chapters && <ChaptersPanel />}
    </div>
  );
}
