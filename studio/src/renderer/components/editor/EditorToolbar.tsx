import { Icon } from '../common/Icon.tsx';
import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import type { Editor } from '../../state/useEditor.ts';
import { addLine } from '../../editor/scriptEdits.ts';
import { ChaptersPanel } from './ChaptersPanel.tsx';
import { useEditorTools } from './EditorContext.ts';

/** Undo, redo, a new line at the end and the chapters. */
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
      </div>
      <button type="button" className="chalk-button small primary" data-testid="add-line" onClick={() => edit((current) => addLine(current, current.lines.length - 1, translate('editor.newLineText')))}><Icon name="plus" /> {translate('editor.addLine')}</button>
      {chapters && <ChaptersPanel />}
    </div>
  );
}
