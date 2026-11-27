import { useTranslate } from '../i18n.ts';

/** The giz mark: a stick of chalk, the name and the tagline. */
export function Brand() {
  const translate = useTranslate();
  return (
    <div className="brand">
      <span className="logo" aria-hidden="true" />
      <div>
        <h1>{translate('app.title')}</h1>
        <p className="tagline">{translate('app.tagline')}</p>
      </div>
    </div>
  );
}
