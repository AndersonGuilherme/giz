import type { Aspect } from '../../../shared/contract.ts';
import { useTranslate } from '../../i18n.ts';
import { Modal } from '../common/Modal.tsx';

/** The rendered video, played in the window (served by the media scheme from the project's output folder). */
export function WatchDialog({ url, aspect, onClose }: Readonly<{ url: string; aspect: Aspect; onClose: () => void }>) {
  const translate = useTranslate();
  return (
    <Modal title={translate('video.watchTitle', { aspect })} testId="watch-dialog">
      <video className={`watch-video ${aspect === '9:16' ? 'tall' : 'wide'}`} src={url} controls autoPlay data-testid="watch-video" />
      <div className="dialog-actions"><button type="button" className="chalk-button" data-testid="watch-close" onClick={onClose}>{translate('video.close')}</button></div>
    </Modal>
  );
}
