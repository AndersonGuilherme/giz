import { REMOTION_LICENSES, type RemotionLicense } from '../../../shared/settings.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { Notice } from './Notice.tsx';
import { OptionCard } from './OptionCard.tsx';

const ANSWER = {
  'pessoa-fisica': 'license.free',
  'empresa-ate-3': 'license.free',
  'empresa-com-licenca': 'license.paid',
  'nao-informado': 'license.later',
} as const;

/** The Remotion license notice, and who uses giz (core's `remotionLicense`, shared with the CLI). */
export function LicensePanel() {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const chosen: RemotionLicense = settings.remotionLicense;
  return (
    <>
      <p className="intro" data-testid="license-notice">{translate('license.intro')}</p>
      <h3>{translate('license.who')}</h3>
      <div className="options" role="radiogroup" aria-label={translate('license.who')}>
        {REMOTION_LICENSES.map((license) => (
          <OptionCard key={license} testId={`license-${license}`} selected={chosen === license} onSelect={() => actions.update({ remotionLicense: license })} title={translate(`license.${license}`)} />
        ))}
      </div>
      <Notice tone={chosen === 'nao-informado' ? 'info' : 'ok'}>{translate(ANSWER[chosen])}</Notice>
    </>
  );
}
