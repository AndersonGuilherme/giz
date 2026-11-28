import { useTranslate } from '../i18n.ts';
import { Logo } from './Logo.tsx';

/** The Gizzycera mark: the chalk speech bubble, the name and the tagline. */
export function Brand() {
  const translate = useTranslate();
  return (
    <div className="brand">
      <Logo />
      <div>
        <h1>{translate('app.title')}</h1>
        <p className="tagline">{translate('app.tagline')}</p>
      </div>
    </div>
  );
}
