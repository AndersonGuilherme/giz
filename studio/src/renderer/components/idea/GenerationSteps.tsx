import type { Failure } from '../../../shared/contract.ts';
import type { ScriptProgress } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';

// More than this many problems say nothing more on screen: the draft folder has them all.
const SHOWN_PROBLEMS = 8;

/** The calls as they happen: "Chamada 2 de 4: corrigindo…", a bar, and the way to stop. */
export function GenerationRunning({ progress, onCancel }: Readonly<{ progress: ScriptProgress | null; onCancel: () => void }>) {
  const translate = useTranslate();
  const { call, most } = progress ?? { call: 0, most: 4 };
  const what = translate(call <= 1 ? 'idea.writing' : 'idea.repairing');
  const line = progress ? translate('idea.call', { call, most, what }) : translate('idea.preparing');
  return (
    <div data-testid="generate-running">
      <p aria-live="polite" data-testid="generate-progress">{line}</p>
      <progress className="chalk-progress" max={most} value={Math.max(call - 0.5, 0)} />
      <p className="muted small">{translate('idea.runningNote')}</p>
      <div className="dialog-actions"><button type="button" className="chalk-button" data-testid="generate-cancel" onClick={onCancel}>{translate('common.cancel')}</button></div>
    </div>
  );
}

/** The readable failure: what was wrong with the last answer, and where that answer was kept. */
export function GenerationFailed({ failure, onClose }: Readonly<{ failure: Failure; onClose: () => void }>) {
  const translate = useTranslate();
  const rest = failure.details.length - SHOWN_PROBLEMS;
  return (
    <div className="generation-failed" role="alert" data-testid="generate-failed">
      <p className="warning-text">{failure.message}</p>
      {failure.details.length > 0 && <ul className="problem-list">{failure.details.slice(0, SHOWN_PROBLEMS).map((detail) => <li key={detail}>{detail}</li>)}</ul>}
      {rest > 0 && <p className="muted small">{translate('idea.moreProblems', { count: rest })}</p>}
      {failure.path && <p>{translate('idea.draftKept')} <code className="path" data-testid="draft-path">{failure.path}</code></p>}
      <div className="dialog-actions"><button type="button" className="chalk-button" onClick={onClose}>{translate('common.close')}</button></div>
    </div>
  );
}
