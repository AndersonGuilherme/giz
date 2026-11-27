import { useTranslate } from '../../i18n.ts';
import { PANELS } from '../setup/panels.ts';

/** The six steps as chalk dots on a line: the done ones filled, the current one yellow. */
export function StepRail({ current }: Readonly<{ current: number }>) {
  const translate = useTranslate();
  return (
    <ol className="rail" aria-label={translate('wizard.step', { number: current + 1, total: PANELS.length })}>
      {PANELS.map((panel, index) => (
        <li key={panel.id} className={index < current ? 'done' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
          <span className="rail-dot">{index < current ? '✓' : index + 1}</span>
          <span className="rail-label">{translate(panel.title)}</span>
        </li>
      ))}
    </ol>
  );
}
