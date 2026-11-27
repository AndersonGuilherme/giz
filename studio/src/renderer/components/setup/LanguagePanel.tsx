import { INTERFACE_LANGUAGES } from '../../../shared/settings.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { OptionCard } from './OptionCard.tsx';

/** The interface language: the change shows at once, on this very screen. */
export function LanguagePanel() {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  return (
    <>
      <p className="intro">{translate('language.intro')}</p>
      <div className="options two" role="radiogroup" aria-label={translate('panel.language')}>
        {INTERFACE_LANGUAGES.map((language) => (
          <OptionCard key={language} testId={`language-${language}`} selected={settings.language === language} onSelect={() => actions.update({ language })} title={translate(`language.${language}`)} />
        ))}
      </div>
    </>
  );
}
