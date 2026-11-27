type Props<Value extends string> = Readonly<{
  label: string;
  value: Value;
  options: readonly Value[];
  name: (value: Value) => string;
  onChange: (value: Value) => void;
  testId?: string;
}>;

/** A choice among a few options, drawn as joined buttons. */
export function Segmented<Value extends string>({ label, value, options, name, onChange, testId }: Props<Value>) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label} data-testid={testId}>
        {options.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={option === value} className={option === value ? 'on' : ''} data-value={option} onClick={() => onChange(option)}>{name(option)}</button>
        ))}
      </div>
    </div>
  );
}
