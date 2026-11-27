import type { ProjectSummary } from '../../shared/contract.ts';
import type { MessageKey, Translate } from '../../shared/i18n/translate.ts';
import { useTranslate } from '../i18n.ts';

type Fact = Readonly<{ label: MessageKey; value: string }>;

const factsOf = (project: ProjectSummary, translate: Translate): readonly Fact[] => [
  { label: 'project.format', value: translate(`format.${project.format}` as MessageKey) },
  { label: 'project.language', value: project.language },
  { label: 'project.aspect', value: project.aspect },
  { label: 'project.cast', value: project.cast.join(', ') },
  { label: 'project.chapters', value: String(project.chapters) },
  { label: 'project.lines', value: String(project.lines) },
];

export function ProjectCard({ project }: Readonly<{ project: ProjectSummary }>) {
  const translate = useTranslate();
  const facts = factsOf(project, translate);
  return (
    <section className="card">
      <h2>{project.title}</h2>
      <p className="folder">{project.folder}</p>
      <dl className="facts">
        {facts.map(({ label, value }) => (
          <div key={label}><dt>{translate(label)}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </section>
  );
}
