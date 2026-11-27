import { useTranslate } from '../i18n.ts';
import { Brand } from './Brand.tsx';

type Props = Readonly<{ opening: boolean; onOpen: () => void; onSettings: () => void }>;

export function Header({ opening, onOpen, onSettings }: Props) {
  const translate = useTranslate();
  return (
    <header className="header">
      <Brand />
      <div className="row">
        <button type="button" className="chalk-button quiet" data-testid="open-settings" onClick={onSettings}>⚙ {translate('app.settings')}</button>
        <button type="button" className="chalk-button" onClick={onOpen} disabled={opening}>
          {opening ? translate('project.opening') : translate('project.open')}
        </button>
      </div>
    </header>
  );
}
