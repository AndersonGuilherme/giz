import { useEffect, useRef } from 'react';
import { useEditorTools } from './EditorContext.ts';
import { BeatsEditor } from './BeatsEditor.tsx';
import { ExtrasFields } from './ExtrasFields.tsx';
import { GestureFields } from './GestureFields.tsx';
import { LineHeader } from './LineHeader.tsx';
import { LineProblems } from './LineProblems.tsx';
import { LineText } from './LineText.tsx';
import { SceneEditor } from './SceneEditor.tsx';

type Props = Readonly<{ index: number; dragging: boolean; onDragStart: () => void; onDrop: () => void }>;

/** One line: who says what, how, the scene it opens, its beats and extras, and the problems the check found in it. */
export function LineCard({ index, dragging, onDragStart, onDrop }: Props) {
  const { errors, selected } = useEditorTools();
  const card = useRef<HTMLLIElement>(null);
  const failing = errors.some(({ line }) => line === index);
  useEffect(() => {
    if (selected === index) card.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selected, index]);
  const classes = ['line-card', 'card', failing ? 'has-error' : '', selected === index ? 'selected' : '', dragging ? 'dragging' : ''].filter(Boolean).join(' ');
  return (
    <li ref={card} id={`line-${index}`} className={classes} data-testid={`line-${index}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <LineHeader index={index} onDragStart={onDragStart} />
      <LineText index={index} />
      <GestureFields index={index} />
      <SceneEditor index={index} />
      <BeatsEditor index={index} />
      <ExtrasFields index={index} />
      <LineProblems index={index} />
    </li>
  );
}
