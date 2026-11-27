import type { CheckProblem, CheckReport } from '../../shared/contract.ts';
import type { MessageKey } from '../../shared/i18n/translate.ts';
import { translate } from '../i18n.ts';

type ListProps = Readonly<{ title: MessageKey; problems: readonly CheckProblem[]; tone: 'error' | 'warning' }>;

function ProblemList({ title, problems, tone }: ListProps) {
  if (problems.length === 0) return null;
  return (
    <div className={`problems ${tone}`}>
      <h3>{translate(title)}</h3>
      <ul>
        {problems.map((problem, index) => (
          <li key={index}><code>{problem.line || translate('check.wholeProject')}</code> {problem.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function CheckPanel({ report }: Readonly<{ report: CheckReport }>) {
  const { errors, warnings } = report;
  const clean = errors.length + warnings.length === 0;
  return (
    <section className="card" data-testid="check-report">
      <h2>{translate('check.title')}</h2>
      <p className={clean ? 'ok' : 'summary'}>{clean ? translate('check.ok') : translate('check.summary', { errors: errors.length, warnings: warnings.length })}</p>
      <ProblemList title="check.errors" problems={errors} tone="error" />
      <ProblemList title="check.warnings" problems={warnings} tone="warning" />
    </section>
  );
}
