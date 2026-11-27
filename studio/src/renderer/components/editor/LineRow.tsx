import type { CSSProperties } from 'react';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { beatCountOf, chipColorOf, excerptOf, problemCountOf, sceneTypeOf } from '../../editor/lineSummary.ts';
import { Icon } from '../common/Icon.tsx';
import { useFolding } from './FoldingContext.ts';
import { LineActions } from './LineActions.tsx';
import { useLine } from './lineAccess.ts';

/** Who speaks: a chip of their cast color with their initial, then their name. */
function Speaker({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, document } = useLine(index);
  const member = document.cast.find(({ id }) => id === line.speaker);
  const color = chipColorOf(document.cast.map(({ id }) => id), line.speaker);
  const name = member?.name ?? (line.speaker || translate('editor.noSpeaker'));
  return (
    <span className="row-speaker">
      <span className="speaker-chip" style={{ '--speaker': color ?? 'var(--line-strong)' } as CSSProperties} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      <span className="speaker-name">{name}</span>
    </span>
  );
}

/** The scene it opens, its beats and its problems, as small chips at the end of the row. */
function Facts({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, errors, warnings } = useLine(index);
  const scene = sceneTypeOf(line);
  const failing = problemCountOf(errors, index);
  const problems = failing + problemCountOf(warnings, index);
  return (
    <span className="row-facts">
      {scene && <span className="row-chip scene-chip">{translate('editor.sceneChip', { type: labelOf(translate, 'sceneType', scene) })}</span>}
      <span className="row-chip">{translate('editor.beatCount', { count: beatCountOf(line) })}</span>
      {problems > 0 && <span className={`row-chip problem-badge ${failing > 0 ? 'error' : 'warning'}`} data-testid={`row-problems-${index}`}>{translate('editor.problemCount', { count: problems })}</span>}
    </span>
  );
}

type Props = Readonly<{ index: number; bodyId: string; onDragStart: () => void }>;

/** The line in one row: a click (or Enter / Space) opens or folds it; the handle drags it; the buttons move, copy or remove it. */
export function LineRow({ index, bodyId, onDragStart }: Props) {
  const translate = useTranslate();
  const { line } = useLine(index);
  const folding = useFolding();
  const open = folding.isOpen(line.id);
  const text = excerptOf(line.text ?? '');
  return (
    <div className="line-row" data-tour="line-row">
      <span className="drag-handle" draggable onDragStart={onDragStart} title={translate('editor.drag')} aria-hidden="true">⠿</span>
      <button type="button" className="line-toggle" aria-expanded={open} aria-controls={bodyId} data-testid={`line-toggle-${index}`} title={translate(open ? 'editor.closeLine' : 'editor.openLine', { number: index + 1 })} onClick={() => folding.toggle(line.id)}>
        <span className="toggle-mark"><Icon name="chevron" /></span>
        <span className="line-number">{index + 1}</span>
        <Speaker index={index} />
        <span className={`row-text${text ? '' : ' muted'}`}>{text || translate('editor.emptyText')}</span>
        <Facts index={index} />
      </button>
      <LineActions index={index} />
    </div>
  );
}
