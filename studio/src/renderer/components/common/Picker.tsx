import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';

type Props = Readonly<{
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
  /** The label group of the options (`pose` → `pose.explain`); none: the options are shown as they are. */
  group?: string;
  /** The text of "no value" (the field is left out); none: a value is required. */
  empty?: string;
  testId?: string;
  names?: Readonly<Record<string, string>>;
}>;

/** A labelled drop-down of one of core's lists. */
export function Picker({ label, value, options, onChange, group, empty, testId, names }: Props) {
  const translate = useTranslate();
  const name = (option: string) => names?.[option] ?? (group ? labelOf(translate, group, option) : option);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="chalk-input" data-testid={testId} value={value ?? ''} onChange={(event) => onChange(event.target.value || undefined)}>
        {empty !== undefined && <option value="">{empty}</option>}
        {value !== undefined && !options.includes(value) && <option value={value}>{value}</option>}
        {options.map((option) => <option key={option} value={option}>{name(option)}</option>)}
      </select>
    </label>
  );
}
