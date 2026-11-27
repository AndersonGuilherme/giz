import type { ProjectListing } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { StageBar } from '../common/StageBar.tsx';

type Props = Readonly<{
  project: ProjectListing;
  onOpen: (folder: string) => void;
  onDuplicate: (folder: string) => void;
  onTrash: (project: ProjectListing) => void;
  onForget: (folder: string) => void;
}>;

const folderName = (folder: string) => folder.split(/[\\/]/).filter(Boolean).at(-1) ?? folder;

function Facts({ project }: Readonly<{ project: ProjectListing }>) {
  const translate = useTranslate();
  const { language } = useSetup().settings;
  const when = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(project.modified);
  return (
    <p className="tile-facts">
      {project.format && <span className="badge">{labelOf(translate, 'format', project.format)}</span>}
      {project.aspect && <span className="badge quiet">{project.aspect}</span>}
      {project.language && <span className="badge quiet">{project.language}</span>}
      <span className="muted small">{translate('home.modified', { when })}</span>
    </p>
  );
}

/** One project of the list: title, profile, stages and its actions. */
// A project of the projects folder can go to the trash; a folder opened from elsewhere only leaves the list (ruling S3-I4).
function Removal({ project, onTrash, onForget }: Pick<Props, 'project' | 'onTrash' | 'onForget'>) {
  const translate = useTranslate();
  if (project.inProjectsFolder) return <button type="button" className="chalk-button small quiet danger-text" data-testid="project-trash" onClick={() => onTrash(project)}>{translate('home.trash')}</button>;
  return <button type="button" className="chalk-button small quiet" data-testid="project-forget" title={translate('home.forgetHint')} onClick={() => onForget(project.folder)}>{translate('home.forget')}</button>;
}

export function ProjectTile({ project, onOpen, onDuplicate, onTrash, onForget }: Props) {
  const translate = useTranslate();
  const name = folderName(project.folder);
  return (
    <li className={`project-tile card${project.problem ? ' broken' : ''}`} data-testid={`project-${name}`}>
      <button type="button" className="tile-open" onClick={() => onOpen(project.folder)}>
        <h3>{project.title || name}</h3>
        <span className="folder">{project.folder}</span>
      </button>
      <Facts project={project} />
      {project.problem ? <p className="warning-text">{project.problem}</p> : <StageBar stages={project.stages} compact />}
      <div className="tile-actions">
        <button type="button" className="chalk-button small" data-testid="project-open" onClick={() => onOpen(project.folder)}>{translate('home.open')}</button>
        <button type="button" className="chalk-button small quiet" data-testid="project-duplicate" onClick={() => onDuplicate(project.folder)}>{translate('home.duplicate')}</button>
        <Removal project={project} onTrash={onTrash} onForget={onForget} />
      </div>
    </li>
  );
}
