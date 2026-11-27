import { Icon } from '../common/Icon.tsx';
import { useTranslate } from '../../i18n.ts';
import { addChapter, removeChapter, renameChapter } from '../../editor/scriptEdits.ts';
import { useEditorTools } from './EditorContext.ts';

/** The chapters in order: rename, remove (its lines join the chapter before) and add. */
export function ChaptersPanel() {
  const translate = useTranslate();
  const { script, edit } = useEditorTools();
  return (
    <section className="chapters card" data-testid="chapters">
      <ol>
        {script.chapters.map((chapter, index) => (
          <li key={index}>
            <input className="chalk-input" value={chapter} aria-label={translate('editor.chapterName', { number: index + 1 })} data-testid={`chapter-${index}`} onChange={(event) => edit((current) => renameChapter(current, index, event.target.value), `chapter.${index}`)} />
            <button type="button" className="icon-button" title={translate('editor.removeChapter')} disabled={script.chapters.length <= 1} onClick={() => edit((current) => removeChapter(current, index))}><Icon name="close" /></button>
          </li>
        ))}
      </ol>
      <button type="button" className="chalk-button small" data-testid="add-chapter" onClick={() => edit((current) => addChapter(current, translate('editor.newChapter', { number: current.chapters.length + 1 })))}><Icon name="plus" /> {translate('editor.addChapter')}</button>
    </section>
  );
}
