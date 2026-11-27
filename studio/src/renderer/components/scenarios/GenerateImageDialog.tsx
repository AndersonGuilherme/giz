import { useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import { IMAGE_STYLES, type ImageEstimate, type ImageStyle, type ScenariosDocument, type SceneCard } from '../../../shared/scenarios.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { costText } from '../../media/money.ts';
import { useImageJob } from '../../state/useImageJob.ts';
import { Modal } from '../common/Modal.tsx';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';

type Props = Readonly<{ api: GizApi; document: ScenariosDocument; card: SceneCard; onClose: () => void; onDone: (document: ScenariosDocument) => void }>;
type Job = ReturnType<typeof useImageJob>;

function Edit({ card, job, onClose }: Readonly<{ card: SceneCard; job: Job; onClose: () => void }>) {
  const translate = useTranslate();
  // A scene switched to a vector starts from the prompt it had (kept, no longer used).
  const start = card.generate ?? card.keptPrompt;
  const [prompt, setPrompt] = useState(start?.prompt ?? '');
  const [style, setStyle] = useState<ImageStyle | undefined>(start?.style);
  return (
    <>
      <p className="muted small">{translate('scenarios.promptHint')}</p>
      <TextField label={translate('scenarios.prompt')} value={prompt} multiline onChange={setPrompt} testId="image-prompt" />
      <Picker label={translate('scenarios.sceneStyle')} value={style} options={IMAGE_STYLES} group="imageStyle" empty={translate('scenarios.projectStyle')} onChange={(chosen) => setStyle(chosen as ImageStyle | undefined)} testId="image-style" />
      <div className="dialog-actions">
        <button type="button" className="chalk-button quiet" onClick={onClose}>{translate('common.cancel')}</button>
        <button type="button" className="chalk-button primary" data-testid="image-price" disabled={!prompt.trim()} onClick={() => job.price(prompt, style)}>{translate('scenarios.seePrice')}</button>
      </div>
    </>
  );
}

function Estimate({ estimate, job }: Readonly<{ estimate: ImageEstimate; job: Job }>) {
  const translate = useTranslate();
  const current = estimate.pending === 0;
  return (
    <>
      <dl className="facts costs" data-testid="image-estimate">
        <div><dt>{translate('scenarios.service')}</dt><dd>{labelOf(translate, 'imageProvider', estimate.provider)} · {estimate.model}</dd></div>
        <div><dt>{translate('scenarios.cost')}</dt><dd>{current ? translate('scenarios.upToDate') : costText(estimate.dollars, translate)}</dd></div>
      </dl>
      {current && <p className="muted small">{translate('scenarios.makeAgainHint')}</p>}
      <div className="dialog-actions">
        <button type="button" className="chalk-button quiet" onClick={job.back}>{translate('scenarios.back')}</button>
        <button type="button" className="chalk-button primary" data-testid="image-confirm" onClick={() => job.make(current)}>{translate(current ? 'scenarios.makeAgain' : 'scenarios.confirm')}</button>
      </div>
    </>
  );
}

function Running({ calling, job }: Readonly<{ calling: boolean; job: Job }>) {
  const translate = useTranslate();
  return (
    <div data-testid="image-running">
      <p>{translate(calling ? 'scenarios.calling' : 'scenarios.starting')}</p>
      <div className="progress indeterminate"><span /></div>
      <div className="dialog-actions"><button type="button" className="chalk-button" data-testid="image-cancel" onClick={job.cancel}>{translate('common.cancel')}</button></div>
    </div>
  );
}

/** "Gerar com IA": edit the prompt and style, see the price, confirm, watch it (and cancel it). */
export function GenerateImageDialog({ api, document, card, onClose, onDone }: Props) {
  const translate = useTranslate();
  const job = useImageJob({ api, folder: document.folder, card, onDone: (next) => [onDone(next), next.cards.find(({ lineId }) => lineId === card.lineId)?.state === 'done' && onClose()] });
  const { state } = job;
  return (
    <Modal title={translate('scenarios.generateTitle', { number: card.number })} testId="generate-image">
      {state.step === 'edit' && <Edit card={card} job={job} onClose={onClose} />}
      {state.step === 'estimate' && <Estimate estimate={state.estimate} job={job} />}
      {state.step === 'running' && <Running calling={state.calling} job={job} />}
      {state.step === 'failed' && <><p className="warning-text" data-testid="image-failed">{state.failure.message}</p>{state.failure.details.map((detail) => <p key={detail} className="muted small">{detail}</p>)}<div className="dialog-actions"><button type="button" className="chalk-button" onClick={onClose}>{translate('common.close')}</button></div></>}
    </Modal>
  );
}
