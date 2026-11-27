import { Icon } from '../common/Icon.tsx';
import { useTranslate } from '../../i18n.ts';
import { addLine as addLineAfter, duplicateLine, moveLine, removeLine } from '../../editor/scriptEdits.ts';
import { Picker } from '../common/Picker.tsx';
import { useLine } from './lineAccess.ts';

/** Move up, move down, a new line below, a copy, remove. */
function LineActions({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { script, edit } = useLine(index);
  return (
    <div className="line-actions">
        <button type="button" className="icon-button" title={translate('editor.up')} data-testid={`up-${index}`} disabled={index === 0} onClick={() => edit((current) => moveLine(current, index, index - 1))}><Icon name="up" /></button>
        <button type="button" className="icon-button" title={translate('editor.down')} data-testid={`down-${index}`} disabled={index === script.lines.length - 1} onClick={() => edit((current) => moveLine(current, index, index + 1))}><Icon name="down" /></button>
        <button type="button" className="icon-button" title={translate('editor.insertAfter')} data-testid={`insert-${index}`} onClick={() => edit((current) => addLineAfter(current, index, translate('editor.newLineText')))}><Icon name="plus" /></button>
        <button type="button" className="icon-button" title={translate('editor.duplicate')} data-testid={`duplicate-${index}`} onClick={() => edit((current) => duplicateLine(current, index))}><Icon name="copy" /></button>
        <button type="button" className="icon-button danger-text" title={translate('editor.remove')} data-testid={`remove-${index}`} onClick={() => edit((current) => removeLine(current, index))}><Icon name="close" /></button>
    </div>
  );
}

/** The line's place (number, id, drag handle, chapter), who says it, and the buttons that move, copy or remove it. */
export function LineHeader({ index, onDragStart }: Readonly<{ index: number; onDragStart: () => void }>) {
  const translate = useTranslate();
  const { line, script, document, set } = useLine(index);
  const chapters = script.chapters.map((_name, at) => String(at + 1));
  const names = Object.fromEntries(script.chapters.map((name, at) => [String(at + 1), `${at + 1}. ${name}`]));
  const speakers = Object.fromEntries(document.cast.map(({ id, name, body }) => [id, body ? name : `${name} (${translate('editor.voiceOnly')})`]));
  return (
    <div className="line-head">
      <span className="drag-handle" draggable onDragStart={onDragStart} title={translate('editor.drag')} aria-hidden="true">⠿</span>
      <span className="line-number">{index + 1}</span>
      <span className="line-id muted small">#{line.id}</span>
      <Picker label={translate('editor.speaker')} value={line.speaker || undefined} options={document.cast.map(({ id }) => id)} names={speakers} onChange={(speaker) => set('speaker', speaker ?? '')} testId={`speaker-${index}`} />
      <Picker label={translate('editor.chapter')} value={String(line.chapter)} options={chapters} names={names} onChange={(chapter) => set('chapter', Number(chapter ?? 1))} testId={`chapter-of-${index}`} />
      <LineActions index={index} />
    </div>
  );
}
