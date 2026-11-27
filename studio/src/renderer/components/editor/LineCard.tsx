import { useEffect, useRef, useState, type RefObject } from 'react';
import { useEditorTools } from './EditorContext.ts';
import { BeatsEditor } from './BeatsEditor.tsx';
import { ExtrasFields } from './ExtrasFields.tsx';
import { useFolding } from './FoldingContext.ts';
import { GestureFields } from './GestureFields.tsx';
import { LineHeader } from './LineHeader.tsx';
import { LineProblems } from './LineProblems.tsx';
import { LineRow } from './LineRow.tsx';
import { LineText } from './LineText.tsx';
import { SceneEditor } from './SceneEditor.tsx';

type Props = Readonly<{ index: number; dragging: boolean; onDragStart: () => void; onDrop: () => void }>;

/** Everything of an open line: who says what, how, the scene it opens, its beats and extras, and its problems. */
function LineBody({ index }: Readonly<{ index: number }>) {
  return (
    <>
      <LineHeader index={index} />
      <LineText index={index} />
      <GestureFields index={index} />
      <SceneEditor index={index} />
      <BeatsEditor index={index} />
      <ExtrasFields index={index} />
      <LineProblems index={index} />
    </>
  );
}

// Once opened, a line's fields stay mounted while folded (hidden), so a JSON box with text that does not parse keeps it.
function useOpened(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  useEffect(() => void (open && setOpened(true)), [open]);
  return open || opened;
}

// The selected line (a jump) is scrolled to; a line just added gets the caret in its text.
// (A jump to the selected line folded by hand opens it again, and it is scrolled to again.)
function useArrival(card: RefObject<HTMLLIElement | null>, index: number, id: string): void {
  const { selected } = useEditorTools();
  const { fresh, isOpen } = useFolding();
  const open = isOpen(id);
  useEffect(() => {
    if (selected === index && open) card.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selected, index, open]);
  useEffect(() => {
    if (fresh !== id) return;
    card.current?.querySelector<HTMLTextAreaElement>('.line-text textarea')?.focus({ preventScroll: true });
    card.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [fresh, id]);
}

const classesOf = (states: Readonly<Record<'open' | 'failing' | 'selected' | 'dragging', boolean>>) =>
  ['line-card card', states.open ? 'open' : 'folded', states.failing && 'has-error', states.selected && 'selected', states.dragging && 'dragging'].filter(Boolean).join(' ');

/** One line: its row, always shown, and its fields when it is open. */
export function LineCard({ index, dragging, onDragStart, onDrop }: Props) {
  const { errors, selected, script } = useEditorTools();
  const card = useRef<HTMLLIElement>(null);
  const id = script.lines[index]?.id ?? '';
  const open = useFolding().isOpen(id);
  const mounted = useOpened(open);
  useArrival(card, index, id);
  const failing = errors.some(({ line }) => line === index);
  const classes = classesOf({ open, failing, selected: selected === index, dragging });
  const bodyId = `line-body-${index}`;
  return (
    <li ref={card} id={`line-${index}`} className={classes} data-testid={`line-${index}`} data-open={open} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <LineRow index={index} bodyId={bodyId} onDragStart={onDragStart} />
      <div id={bodyId} className="line-body" hidden={!open}>{mounted && <LineBody index={index} />}</div>
    </li>
  );
}
