import type { Failure } from '../../shared/contract.ts';
import { translate } from '../i18n.ts';

export function FailurePanel({ failure }: Readonly<{ failure: Failure }>) {
  return (
    <section className="card failure" role="alert">
      <h2>{translate('errors.title')}</h2>
      <p>{failure.message}</p>
      {failure.details.length > 0 && <ul>{failure.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
    </section>
  );
}
