import { Icon } from '../common/Icon.tsx';
import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { addLine, moveLine } from '../../editor/scriptEdits.ts';
import { useEditorTools } from './EditorContext.ts';
import { LineCard } from './LineCard.tsx';

/** Every line in order; a line is dragged by its handle and dropped on another to take its place. */
export function LineList() {
  const translate = useTranslate();
  const { script, edit } = useEditorTools();
  const [dragged, setDragged] = useState<number | null>(null);
  const drop = (target: number) => {
    if (dragged !== null) edit((current) => moveLine(current, dragged, target));
    setDragged(null);
  };
  return (
    <ol className="line-list" data-testid="line-list">
      {script.lines.length === 0 && <li className="hint">{translate('editor.noLines')}</li>}
      {script.lines.map((line, index) => (
        <LineCard key={`${line.id}-${index}`} index={index} dragging={dragged === index} onDragStart={() => setDragged(index)} onDrop={() => drop(index)} />
      ))}
      <li className="line-insert"><button type="button" className="chalk-button small quiet" onClick={() => edit((current) => addLine(current, current.lines.length - 1, translate('editor.newLineText')))}><Icon name="plus" /> {translate('editor.addLine')}</button></li>
    </ol>
  );
}
