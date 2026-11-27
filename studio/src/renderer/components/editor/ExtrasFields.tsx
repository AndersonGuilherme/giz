import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';
import { useLine } from './lineAccess.ts';

type Hold = Readonly<{ seconds: number; label: string }>;
const holdOf = (value: unknown): Hold | undefined => (typeof value === 'object' && value !== null ? (value as Hold) : undefined);

/** A sound at the start of the line, and a pause after it for the viewer to think (with its countdown label). */
export function ExtrasFields({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, vocabulary, set, text } = useLine(index);
  const hold = holdOf(line.holdAfter);
  const setHold = (patch: Partial<Hold>) => set('holdAfter', { seconds: hold?.seconds ?? 3, label: hold?.label ?? '', ...patch });
  return (
    <details className="fold" open={hold !== undefined || text('sfx') !== undefined}>
      <summary>{translate('editor.extras')}</summary>
      <div className="form-row three">
        <Picker label={translate('editor.sfx')} value={text('sfx')} options={vocabulary.sounds} group="sfx" empty={translate('editor.unset')} onChange={(value) => set('sfx', value)} testId={`sfx-${index}`} />
        <label className="field">
          <span className="field-label">{translate('editor.holdSeconds')}</span>
          <input type="number" min={0} step={0.5} className="chalk-input" data-testid={`hold-${index}`} value={hold?.seconds ?? ''} onChange={(event) => (event.target.value === '' ? set('holdAfter', undefined) : setHold({ seconds: event.target.valueAsNumber }))} />
        </label>
        {hold && <TextField label={translate('editor.holdLabel')} value={hold.label} onChange={(label) => setHold({ label })} />}
      </div>
    </details>
  );
}
