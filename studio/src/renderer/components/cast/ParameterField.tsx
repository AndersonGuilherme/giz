import type { ParameterInfo, ParameterValue } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { Picker } from '../common/Picker.tsx';
import { OptionGrid } from './OptionGrid.tsx';

/** One rig parameter: its name, definition and value, how to change it and how to draw a preview of an option. */
export type FieldProps = Readonly<{
  name: string;
  info: ParameterInfo;
  value: ParameterValue;
  onChange: (value: ParameterValue) => void;
  /** The drawing of the character with one option (options without it are a plain list). */
  preview?: (option: string) => OptionLook;
}>;

export type OptionLook = Readonly<{ rig: string; parameters: Readonly<Record<string, ParameterValue>> }>;

const AUTO = 'auto';

function ColorField({ name, info, value, onChange }: FieldProps) {
  const translate = useTranslate();
  const automatic = value === AUTO;
  return (
    <div className="field color-field">
      <span className="field-label">{labelOf(translate, 'param', name)}</span>
      <div className="color-row">
        <input type="color" aria-label={labelOf(translate, 'param', name)} data-testid={`param-${name}`} value={automatic ? '#888888' : String(value)} disabled={automatic} onChange={(event) => onChange(event.target.value)} />
        {!automatic && <code>{String(value)}</code>}
        {info.defaultValue === AUTO && <label className="check small"><input type="checkbox" checked={automatic} onChange={(event) => onChange(event.target.checked ? AUTO : '#888888')} />{translate('cast.colorAuto')}</label>}
      </div>
    </div>
  );
}

function NumberField({ name, info, value, onChange }: FieldProps) {
  const translate = useTranslate();
  const [min, max] = [info.min ?? 0, info.max ?? 1];
  const step = max - min > 5 ? 1 : 0.05;
  return (
    <label className="field number-field">
      <span className="field-label">{labelOf(translate, 'param', name)} <b>{Number(value).toFixed(step < 1 ? 2 : 0)}</b></span>
      <input type="range" data-testid={`param-${name}`} min={min} max={max} step={step} value={Number(value)} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="range-ends"><span>{min}</span><span>{max}</span></span>
    </label>
  );
}

function BooleanField({ name, value, onChange }: FieldProps) {
  const translate = useTranslate();
  return (
    <label className="check switch-field">
      <input type="checkbox" data-testid={`param-${name}`} checked={value === true} onChange={(event) => onChange(event.target.checked)} />
      {labelOf(translate, 'param', name)}
    </label>
  );
}

function OptionField(props: FieldProps) {
  const translate = useTranslate();
  const { name, info, value, onChange, preview } = props;
  if (preview) return <OptionGrid {...props} preview={preview} />;
  return <Picker label={labelOf(translate, 'param', name)} value={String(value)} options={info.options ?? []} group={`opt.${name}`} onChange={(chosen) => chosen && onChange(chosen)} testId={`param-${name}`} />;
}

const FIELDS = { color: ColorField, number: NumberField, boolean: BooleanField, option: OptionField } as const;

/** The control of a parameter, by its type (a registry: a new type is one more entry). */
export function ParameterField(props: FieldProps) {
  const Field = FIELDS[props.info.type];
  return <Field {...props} />;
}
