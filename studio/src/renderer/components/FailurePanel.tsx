import type { Failure } from '../../shared/contract.ts';
import { useTranslate } from '../i18n.ts';
import { useOpenSettings } from '../state/OpenSettings.ts';

export function FailurePanel({ failure }: Readonly<{ failure: Failure }>) {
  const translate = useTranslate();
  const openSettings = useOpenSettings();
  return (
    <section className="card failure" role="alert">
      <h2>{translate('errors.title')}</h2>
      <p>{failure.message}</p>
      {failure.details.length > 0 && <ul>{failure.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
      {failure.code === 'needs-setup' && openSettings && (
        <button type="button" className="chalk-button primary" data-testid="failure-open-settings" onClick={openSettings}>{translate('errors.openSettings')}</button>
      )}
    </section>
  );
}
