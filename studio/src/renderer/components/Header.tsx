import { useTranslate } from '../i18n.ts';
import { Brand } from './Brand.tsx';

type Props = Readonly<{ atHome: boolean; onHome: () => void; onSettings: () => void }>;

/** The Gizzycera mark, the way back to the projects and Settings. */
export function Header({ atHome, onHome, onSettings }: Props) {
  const translate = useTranslate();
  return (
    <header className="header">
      <Brand />
      <div className="row">
        {!atHome && <button type="button" className="chalk-button quiet" data-testid="go-home" onClick={onHome}>← {translate('home.title')}</button>}
        <button type="button" className="chalk-button quiet" data-testid="open-settings" onClick={onSettings}>⚙ {translate('app.settings')}</button>
      </div>
    </header>
  );
}
