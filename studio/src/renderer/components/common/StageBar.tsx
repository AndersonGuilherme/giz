import type { StageBrief } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';

// The mark of each state: done, to do, out of date, nothing yet.
const MARKS = { done: '✓', ready: '', stale: '!', empty: '·' } as const;

/** The six stages of a project (core's ProjectStages) with the state of each; `compact` for the projects list. */
export function StageBar({ stages, compact }: Readonly<{ stages: readonly StageBrief[]; compact?: boolean }>) {
  const translate = useTranslate();
  return (
    <ol className={`stage-bar${compact ? ' compact' : ''}`} data-testid="stage-bar" aria-label={translate('stages.title')}>
      {stages.map(({ stage, state, problems }) => (
        <li key={stage} className={`stage ${state}`} data-stage={stage} data-state={state} title={`${translate(`stage.${stage}`)}: ${translate(`stageState.${state}`)}${problems > 0 ? ` (${problems})` : ''}`}>
          <span className="stage-mark" aria-hidden="true">{MARKS[state]}</span>
          <span className="stage-name">{translate(`stage.${stage}`)}</span>
        </li>
      ))}
    </ol>
  );
}
