import { useState, type ReactNode } from 'react';
import type { ProjectVoice } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { isPaidVoice } from '../../media/money.ts';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

/**
 * "Ouvir amostra" with a paid voice: the first sample of this editor asks once (the service charges the person's
 * account); the local voice plays at once. `dialog` is drawn by the editor.
 */
export function usePaidSample(voice: ProjectVoice, say: () => void): Readonly<{ onSample: () => void; dialog: ReactNode }> {
  const translate = useTranslate();
  const [asking, setAsking] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const onSample = () => (isPaidVoice(voice.provider) && !agreed ? setAsking(true) : say());
  const yes = () => {
    setAsking(false);
    setAgreed(true);
    say();
  };
  const provider = translate(`voiceProvider.${voice.provider}`);
  const dialog = asking && (
    <ConfirmDialog title={translate('cast.paidSampleTitle')} confirm={translate('cast.paidSampleConfirm')} onConfirm={yes} onCancel={() => setAsking(false)}>
      <p>{translate('cast.paidSampleBody', { provider })}</p>
    </ConfirmDialog>
  );
  return { onSample, dialog };
}
