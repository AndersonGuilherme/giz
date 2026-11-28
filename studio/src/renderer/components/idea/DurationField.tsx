import { IDEA_LIMITS } from '../../../shared/projects.ts';
import { durationText } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';

// The usual lengths, one click each: a short, a minute, a short lesson, a long one.
const PRESETS = [30, 60, 120, 300] as const;

type Props = Readonly<{ seconds: number; onChange: (seconds: number) => void; invalid: boolean }>;

/** The target duration, in seconds, with a few common lengths. */
export function DurationField({ seconds, onChange, invalid }: Props) {
  const translate = useTranslate();
  const { min, max } = IDEA_LIMITS.seconds;
  return (
    <div className="field">
      <span className="field-label">{translate('idea.duration')}</span>
      <div className="row">
        <input type="number" className={`chalk-input seconds${invalid ? ' invalid' : ''}`} min={min} max={max} value={Number.isNaN(seconds) ? '' : seconds} data-testid="idea-seconds" onChange={(event) => onChange(event.target.valueAsNumber)} aria-invalid={invalid || undefined} />
        <span className="muted">{translate('idea.seconds')}</span>
        {PRESETS.map((preset) => <button key={preset} type="button" className={`chip-button${seconds === preset ? ' on' : ''}`} onClick={() => onChange(preset)}>{durationText(preset, translate)}</button>)}
      </div>
      <span className={invalid ? 'field-hint warning-text' : 'field-hint'}>{translate('idea.durationHint', { min, max: max / 60 })}</span>
    </div>
  );
}
