import type { Failure } from '../../../shared/contract.ts';
import type { EditorProblem } from '../../../shared/script.ts';
import { useTranslate } from '../../i18n.ts';
import type { SaveStatus } from '../../state/useAutosave.ts';
import { useEditorTools } from './EditorContext.ts';
import { useFolding } from './FoldingContext.ts';

type ListProps = Readonly<{ title: 'check.errors' | 'check.warnings'; problems: readonly EditorProblem[]; tone: 'error' | 'warning' }>;

function ProblemList({ title, problems, tone }: ListProps) {
  const translate = useTranslate();
  const { show } = useFolding();
  if (problems.length === 0) return null;
  return (
    <div className={`problems ${tone}`}>
      <h3>{translate(title)}</h3>
      <ul>
        {problems.map((problem, at) => (
          <li key={at}>
            {problem.line === null ? <code>{translate('check.wholeProject')}</code> : <button type="button" className="jump" data-testid="jump" onClick={() => show(problem.line!)}>{translate('editor.lineNumber', { number: problem.line + 1 })}</button>}
            {problem.field && <code>{problem.field}</code>} {problem.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SaveLine({ saving, saveFailure }: Readonly<{ saving: SaveStatus; saveFailure: Failure | null }>) {
  const translate = useTranslate();
  const { unsaved } = useEditorTools();
  if (unsaved) return <p className="save-status failed" data-testid="save-status" data-status="unsaved" aria-live="polite">{translate('editor.save.unsaved')}</p>;
  const text = saving === 'failed' ? translate('editor.saveFailed', { message: saveFailure?.message ?? '' }) : translate(`editor.save.${saving}`);
  return <p className={`save-status ${saving}`} data-testid="save-status" data-status={saving} aria-live="polite">{text}</p>;
}

/** The check of the saved script: errors and warnings, each one a jump to its line. */
export function ProblemsPanel({ saving, saveFailure }: Readonly<{ saving: SaveStatus; saveFailure: Failure | null }>) {
  const translate = useTranslate();
  const { errors, warnings } = useEditorTools();
  const clean = errors.length + warnings.length === 0;
  return (
    <section className="card problems-panel" data-testid="check-report" data-tour="check">
      <h2>{translate('check.title')}</h2>
      <SaveLine saving={saving} saveFailure={saveFailure} />
      <p className={clean ? 'ok' : 'summary'} data-testid="check-summary">{clean ? translate('check.ok') : translate('check.summary', { errors: errors.length, warnings: warnings.length })}</p>
      <ProblemList title="check.errors" problems={errors} tone="error" />
      <ProblemList title="check.warnings" problems={warnings} tone="warning" />
    </section>
  );
}
