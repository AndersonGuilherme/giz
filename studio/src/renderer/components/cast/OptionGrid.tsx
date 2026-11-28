import { memo, useState } from 'react';
import { RigStill } from 'gizzycera-core/src/presentation/studio/index.ts';
import type { ParameterValue } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { DrawingBoundary } from './DrawingBoundary.tsx';
import type { FieldProps, OptionLook } from './ParameterField.tsx';

type Drawing = Readonly<{ id: string; rig: string; parameters: Readonly<Record<string, ParameterValue>>; head: boolean }>;

/**
 * A small drawing of the character with one option (memoized: the grid redraws only what changed); `head`: framed from
 * above its highest point (headwear: a tall hat stays whole).
 */
const OptionDrawing = memo(function OptionDrawing({ id, rig, parameters, head }: Drawing) {
  const still = head ? <RigStill id={id} rig={rig} parameters={parameters} height={74} framing="head" /> : <RigStill id={id} rig={rig} parameters={parameters} height={118} />;
  return <span className={`option-drawing${head ? ' head' : ''}`} aria-hidden="true"><DrawingBoundary look={JSON.stringify(parameters)} fallback="⚠">{still}</DrawingBoundary></span>;
});

type GridProps = FieldProps & Readonly<{ preview: (option: string) => OptionLook }>;

function Choice({ option, chosen, label, drawing, pick }: Readonly<{ option: string; chosen: boolean; label: string; drawing: Drawing; pick: () => void }>) {
  return (
    <button type="button" className={`option-choice${chosen ? ' on' : ''}`} aria-pressed={chosen} title={label} data-value={option} onClick={pick}>
      <OptionDrawing {...drawing} />
      <span className="option-name">{label}</span>
    </button>
  );
}

/** An option picked by its look: the current one, and (opened) a grid with the character drawn with each option. */
export function OptionGrid({ name, info, value, onChange, preview }: GridProps) {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const drawingOf = (option: string): Drawing => ({ id: `option-${name}-${option}`, ...preview(option), head: name === 'headwear' });
  const label = (option: string) => labelOf(translate, `opt.${name}`, option);
  return (
    <div className={`field option-field${open ? ' open' : ''}`} data-testid={`param-${name}`}>
      <button type="button" className="option-current" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="field-label">{labelOf(translate, 'param', name)}</span>
        <span className="option-value">{label(String(value))}</span>
      </button>
      {open && <div className="option-grid">{(info.options ?? []).map((option) => <Choice key={option} option={option} chosen={option === value} label={label(option)} drawing={drawingOf(option)} pick={() => onChange(option)} />)}</div>}
    </div>
  );
}
