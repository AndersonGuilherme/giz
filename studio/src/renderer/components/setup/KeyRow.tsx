import { useState } from 'react';
import type { KeyProvider, KeyStorage } from '../../../shared/accounts.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import type { KeyOutcome } from '../../state/useAccounts.ts';
import { SERVICES } from './providers.ts';

const STORAGE_TEXT = { keychain: 'accounts.inKeychain', file: 'accounts.inFile' } as const;

function Outcome({ outcome }: Readonly<{ outcome?: KeyOutcome }>) {
  const translate = useTranslate();
  if (!outcome) return null;
  if (outcome.ok) return <p className="key-outcome ok" aria-live="polite">✔ {translate('accounts.testOk', { model: outcome.model, input: outcome.inputTokens, output: outcome.outputTokens })}</p>;
  return <p className="key-outcome warning" role="alert">{outcome.failure.message}</p>;
}

// "Testar" for the services core can check; the others say there is no test yet (their key serves images or voices).
function TestButton({ provider }: Readonly<{ provider: KeyProvider }>) {
  const translate = useTranslate();
  const { accounts } = useSetup();
  const busy = accounts.rows[provider]?.busy ?? false;
  if (!accounts.status?.testable.includes(provider)) return <span className="muted small" title={translate('errors.noKeyCheck')}>{translate('accounts.noTest')}</span>;
  return <button type="button" className="chalk-button small" data-testid={`test-${provider}`} disabled={busy} onClick={() => void accounts.test(provider)}>{translate(busy ? 'accounts.testing' : 'accounts.test')}</button>;
}

function KeyActions({ provider, storage }: Readonly<{ provider: KeyProvider; storage: KeyStorage }>) {
  const translate = useTranslate();
  const { accounts } = useSetup();
  return (
    <div className="row">
      <span className={`chip ${storage}`}>{translate(STORAGE_TEXT[storage])}</span>
      <TestButton provider={provider} />
      <button type="button" className="chalk-button small quiet" data-testid={`remove-${provider}`} onClick={() => void accounts.remove(provider)}>{translate('accounts.remove')}</button>
    </div>
  );
}

function KeyInput({ provider }: Readonly<{ provider: KeyProvider }>) {
  const translate = useTranslate();
  const { accounts } = useSetup();
  const [key, setKey] = useState('');
  const save = () => void accounts.save(provider, key).then(() => setKey(''));
  return (
    <form className="row" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <input type="password" className="chalk-input" data-testid={`key-${provider}`} autoComplete="off" spellCheck={false} placeholder={translate('accounts.keyPlaceholder')} value={key} onChange={(event) => setKey(event.target.value)} />
      <button type="submit" className="chalk-button small" disabled={key.trim() === ''}>{translate('accounts.save')}</button>
    </form>
  );
}

/** One service: its name and uses, then either the key field or where the key is with "Testar" and "Remover". */
export function KeyRow({ provider }: Readonly<{ provider: KeyProvider }>) {
  const translate = useTranslate();
  const { accounts } = useSetup();
  const storage = accounts.status?.keys[provider] ?? null;
  const uses = SERVICES[provider].uses.map((use) => translate(use)).join(' · ');
  return (
    <li className="key-row" data-testid={`account-${provider}`}>
      <div className="key-name">
        <strong>{SERVICES[provider].name}</strong>
        <span className="muted">{uses}</span>
      </div>
      <div className="key-body">
        {storage ? <KeyActions provider={provider} storage={storage} /> : <KeyInput provider={provider} />}
        <Outcome outcome={accounts.rows[provider]?.outcome} />
      </div>
    </li>
  );
}
