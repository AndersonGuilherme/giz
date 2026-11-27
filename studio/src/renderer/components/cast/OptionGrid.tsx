import { memo, useState } from 'react';
import { RigStill } from 'giz-core/src/presentation/studio/index.ts';
import type { ParameterValue } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import type { FieldProps, OptionLook } from './ParameterField.tsx';

type Drawing = Readonly<{ id: string; rig: string; parameters: Readonly<Record<string, ParameterValue>> }>;

/** A small drawing of the character with one option (memoized: the grid redraws only what changed). */
const OptionDrawing = memo(function OptionDrawing({ id, rig, parameters }: Drawing) {
  return <span className="option-drawing" aria-hidden="true"><RigStill id={id} rig={rig} parameters={parameters} height={118} /></span>;
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
  const drawingOf = (option: string): Drawing => ({ id: `option-${name}-${option}`, ...preview(option) });
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
