import type { MontageFailure as Failure } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import type { WorkStage } from '../project/ProjectScreen.tsx';

/** Why there is no preview: missing voices (with the way to the Voices stage) or core's readable error. */
export function MontageFailure({ failure, onStage, onRetry }: Readonly<{ failure: Failure; onStage: (stage: WorkStage) => void; onRetry: () => void }>) {
  const translate = useTranslate();
  return (
    <section className="card preview-card montage-failure" role="alert" data-testid="montage-failure">
      <h2>{translate('video.noPreview')}</h2>
      <p>{failure.message}</p>
      {failure.details.length > 0 && <ul>{failure.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
      <div className="dialog-actions">
        <button type="button" className="chalk-button" data-testid="montage-retry" onClick={onRetry}>{translate('video.buildAgain')}</button>
        {failure.voices.length > 0 && <button type="button" className="chalk-button primary" data-testid="montage-voices" onClick={() => onStage('voices')}>{translate('video.goTo.voices')}</button>}
      </div>
    </section>
  );
}
