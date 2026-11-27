import { translate } from '../i18n.ts';

type Props = Readonly<{ opening: boolean; onOpen: () => void }>;

export function Header({ opening, onOpen }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <span className="logo" aria-hidden="true" />
        <div>
          <h1>{translate('app.title')}</h1>
          <p className="tagline">{translate('app.tagline')}</p>
        </div>
      </div>
      <button type="button" className="chalk-button" onClick={onOpen} disabled={opening}>
        {opening ? translate('project.opening') : translate('project.open')}
      </button>
    </header>
  );
}
