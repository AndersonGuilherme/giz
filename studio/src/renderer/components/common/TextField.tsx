type Props = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  testId?: string;
  invalid?: boolean;
  hint?: string;
}>;

/** A labelled text box; `multiline` makes it a text area. */
export function TextField({ label, value, onChange, multiline, placeholder, testId, invalid, hint }: Props) {
  const common = { className: `chalk-input${invalid ? ' invalid' : ''}`, value, placeholder, 'data-testid': testId, 'aria-invalid': invalid || undefined };
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {multiline
        ? <textarea {...common} rows={2} onChange={(event) => onChange(event.target.value)} />
        : <input {...common} type="text" onChange={(event) => onChange(event.target.value)} />}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
