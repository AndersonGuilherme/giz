import type { ReactNode } from 'react';
import type { ScriptEstimate } from '../../../shared/projects.ts';
import type { GenerationState } from '../../idea/generation.ts';
import { formatDollars } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import type { IdeaWizard } from '../../state/useIdeaWizard.ts';
import { Modal } from '../common/Modal.tsx';
import { GenerationFailed, GenerationRunning } from './GenerationSteps.tsx';

type Ai = IdeaWizard['ai'];

function Estimate({ estimate, ai }: Readonly<{ estimate: ScriptEstimate; ai: Ai }>) {
  const translate = useTranslate();
  const { language } = useSetup().settings;
  const cost = (dollars: number | null) => (dollars === null ? translate('idea.costUnknown') : formatDollars(dollars, language));
  return (
    <div data-testid="generate-estimate">
      <p>{translate('idea.estimateService', { provider: estimate.provider, model: estimate.model })}</p>
      <dl className="facts costs">
        <div><dt>{translate('idea.firstCall')}</dt><dd>{translate('idea.upTo', { cost: cost(estimate.firstCall) })}</dd></div>
        <div><dt>{translate('idea.worstCase', { calls: estimate.calls })}</dt><dd data-testid="worst-case">{translate('idea.upTo', { cost: cost(estimate.maximum) })}</dd></div>
      </dl>
      <p className="muted small">{translate('idea.estimateNote', { provider: estimate.provider })}</p>
      <div className="dialog-actions">
        <button type="button" className="chalk-button quiet" onClick={ai.close}>{translate('common.cancel')}</button>
        <button type="button" className="chalk-button primary" data-testid="generate-confirm" onClick={ai.generate}>{translate('idea.confirmGenerate')}</button>
      </div>
    </div>
  );
}

function Cancelled({ ai }: Readonly<{ ai: Ai }>) {
  const translate = useTranslate();
  return (
    <div data-testid="generate-cancelled">
      <p>{translate('idea.cancelled')}</p>
      <div className="dialog-actions"><button type="button" className="chalk-button" onClick={ai.close}>{translate('common.close')}</button></div>
    </div>
  );
}

function Estimating() {
  const translate = useTranslate();
  return <p className="muted">{translate('idea.estimating')}</p>;
}

type Steps = { readonly [Status in GenerationState['status']]: (state: Extract<GenerationState, { status: Status }>, ai: Ai) => ReactNode };

// What the dialog shows in each state: a map, not a chain of conditions.
const STEPS: Steps = {
  idle: () => null,
  estimating: () => <Estimating />,
  confirm: ({ estimate }, ai) => <Estimate estimate={estimate} ai={ai} />,
  running: ({ progress }, ai) => <GenerationRunning progress={progress} onCancel={ai.cancel} />,
  failed: ({ failure }, ai) => <GenerationFailed failure={failure} onClose={ai.close} />,
  cancelled: (_state, ai) => <Cancelled ai={ai} />,
};

/** "Gerar com IA": the estimate to confirm, then the calls with their progress, then the failure if there is one. */
export function GenerateDialog({ ai }: Readonly<{ ai: Ai }>) {
  const translate = useTranslate();
  const { generation } = ai;
  if (generation.status === 'idle') return null;
  const step = STEPS[generation.status] as (state: GenerationState, ai: Ai) => ReactNode;
  return <Modal title={translate('idea.generateTitle')} testId="generate-dialog">{step(generation, ai)}</Modal>;
}
