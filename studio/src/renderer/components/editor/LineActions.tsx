import { Icon } from '../common/Icon.tsx';
import { useTranslate } from '../../i18n.ts';
import { addLine as addLineAfter, duplicateLine, moveLine, removeLine } from '../../editor/scriptEdits.ts';
import { useLine } from './lineAccess.ts';

/** Move up, move down, a new line below, a copy, remove (on the line's row, open or folded). */
export function LineActions({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { script, edit } = useLine(index);
  return (
    <div className="line-actions">
      <button type="button" className="icon-button" title={translate('editor.up')} aria-label={translate('editor.up')} data-testid={`up-${index}`} disabled={index === 0} onClick={() => edit((current) => moveLine(current, index, index - 1))}><Icon name="up" /></button>
      <button type="button" className="icon-button" title={translate('editor.down')} aria-label={translate('editor.down')} data-testid={`down-${index}`} disabled={index === script.lines.length - 1} onClick={() => edit((current) => moveLine(current, index, index + 1))}><Icon name="down" /></button>
      <button type="button" className="icon-button" title={translate('editor.insertAfter')} aria-label={translate('editor.insertAfter')} data-testid={`insert-${index}`} onClick={() => edit((current) => addLineAfter(current, index, translate('editor.newLineText')))}><Icon name="plus" /></button>
      <button type="button" className="icon-button" title={translate('editor.duplicate')} aria-label={translate('editor.duplicate')} data-testid={`duplicate-${index}`} onClick={() => edit((current) => duplicateLine(current, index))}><Icon name="copy" /></button>
      <button type="button" className="icon-button danger-text" title={translate('editor.remove')} aria-label={translate('editor.remove')} data-testid={`remove-${index}`} onClick={() => edit((current) => removeLine(current, index))}><Icon name="close" /></button>
    </div>
  );
}
