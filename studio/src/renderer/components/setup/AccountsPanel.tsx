import { KEY_PROVIDERS } from '../../../shared/accounts.ts';
import { IMAGE_PROVIDERS, TEXT_PROVIDERS, VOICE_PROVIDERS, type ProviderChoices } from '../../../shared/settings.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { KeyRow } from './KeyRow.tsx';
import { Notice } from './Notice.tsx';
import { providerName } from './providers.ts';

type Task = keyof ProviderChoices;
const CHOICES: ReadonlyArray<Readonly<{ task: Task; label: 'accounts.text' | 'accounts.image' | 'accounts.voice'; options: readonly ProviderChoices[Task][] }>> = [
  { task: 'text', label: 'accounts.text', options: TEXT_PROVIDERS },
  { task: 'image', label: 'accounts.image', options: IMAGE_PROVIDERS },
  { task: 'voice', label: 'accounts.voice', options: VOICE_PROVIDERS },
];

// The chosen service has no key yet: say so next to the choice (the local voice needs none).
function MissingKey({ chosen }: Readonly<{ chosen: ProviderChoices[Task] }>) {
  const translate = useTranslate();
  const { status } = useSetup().accounts;
  if (chosen === 'qwen' || !status || status.keys[chosen] !== null) return null;
  return <span className="warning-text" data-testid={`missing-key-${chosen}`}>{translate('accounts.noKeyFor', { name: providerName(chosen) })}</span>;
}

function ProviderChoice({ task, label, options }: (typeof CHOICES)[number]) {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const nameOf = (option: ProviderChoices[Task]) => providerName(option) || translate('accounts.local');
  return (
    <div className="choice">
      <span className="choice-label">{translate(label)}</span>
      <div className="segmented" role="radiogroup" aria-label={translate(label)}>
        {options.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={settings.providers[task] === option} className={settings.providers[task] === option ? 'on' : ''} onClick={() => actions.update({ providers: { [task]: option } })}>{nameOf(option)}</button>
        ))}
      </div>
      <MissingKey chosen={settings.providers[task]} />
    </div>
  );
}

function KeychainNotice() {
  const translate = useTranslate();
  const { status } = useSetup().accounts;
  if (!status || status.secure) return null;
  return <Notice tone="warning" testId="no-keychain">{translate('accounts.noKeychain', { folder: status.fileFolder })}</Notice>;
}

/** The AI accounts: which service does each task, and the key of each service (save, test, remove). */
export function AccountsPanel() {
  const translate = useTranslate();
  return (
    <>
      <p className="intro">{translate('accounts.intro')}</p>
      <h3>{translate('accounts.useFor')}</h3>
      <div className="choices">{CHOICES.map((choice) => <ProviderChoice key={choice.task} {...choice} />)}</div>
      <h3>{translate('accounts.keys')}</h3>
      <KeychainNotice />
      <ul className="keys">{KEY_PROVIDERS.map((provider) => <KeyRow key={provider} provider={provider} />)}</ul>
      <p className="muted small">{translate('accounts.cost')}</p>
    </>
  );
}
