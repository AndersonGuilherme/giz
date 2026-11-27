import type { VideoDocument, VideoProblem } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';

type Props = Readonly<{ document: VideoDocument; onLine: (lineId: string) => void }>;
type ListProps = Readonly<{ title: 'check.errors' | 'check.warnings'; tone: 'error' | 'warning'; problems: readonly VideoProblem[]; numbers: ReadonlyMap<string, number>; onLine: (lineId: string) => void }>;

function ProblemList({ title, tone, problems, numbers, onLine }: ListProps) {
  const translate = useTranslate();
  if (problems.length === 0) return null;
  return (
    <div className={`problems ${tone}`}>
      <h3>{translate(title)}</h3>
      <ul>
        {problems.map((problem, at) => {
          const number = numbers.get(problem.line);
          const where = number === undefined
            ? <code>{translate('check.wholeProject')}</code>
            : <button type="button" className="jump" data-testid="video-jump" data-line={problem.line} onClick={() => onLine(problem.line)}>{translate('editor.lineNumber', { number })}</button>;
          return <li key={at}>{where} {problem.message}</li>;
        })}
      </ul>
    </div>
  );
}

/** Core's check in the chosen aspect: each problem of a line is a jump to that line in the Script stage. */
export function VideoCheck({ document, onLine }: Props) {
  const translate = useTranslate();
  const { errors, warnings } = document.check;
  const numbers = new Map(document.lines.map(({ lineId, number }) => [lineId, number]));
  const clean = errors.length + warnings.length === 0;
  return (
    <section className="card problems-panel" data-testid="video-check">
      <h2>{translate('video.checkTitle', { aspect: document.aspect })}</h2>
      <p className={clean ? 'ok' : 'summary'} data-testid="video-check-summary">{clean ? translate('check.ok') : translate('check.summary', { errors: errors.length, warnings: warnings.length })}</p>
      <ProblemList title="check.errors" tone="error" problems={errors} numbers={numbers} onLine={onLine} />
      <ProblemList title="check.warnings" tone="warning" problems={warnings} numbers={numbers} onLine={onLine} />
    </section>
  );
}
