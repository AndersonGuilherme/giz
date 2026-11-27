import { Icon } from '../common/Icon.tsx';
import { useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { ProjectListing } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';
import { useProjects } from '../../state/useProjects.ts';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { ProjectTile } from './ProjectTile.tsx';

type Props = Readonly<{ api: GizApi; onOpen: (folder: string) => void; onNew: () => void }>;

function Empty({ onNew }: Readonly<{ onNew: () => void }>) {
  const translate = useTranslate();
  return (
    <div className="empty-board" data-testid="projects-empty">
      <p>{translate('home.empty')}</p>
      <button type="button" className="chalk-button primary" onClick={onNew}>{translate('home.new')}</button>
    </div>
  );
}

function Toolbar({ count, onNew, onPick }: Readonly<{ count: number | null; onNew: () => void; onPick: () => void }>) {
  const translate = useTranslate();
  return (
    <div className="screen-top">
      <h2>{translate('home.title')}{count !== null && <span className="count">{count}</span>}</h2>
      <div className="row">
        <button type="button" className="chalk-button" data-testid="open-folder" onClick={onPick}>{translate('home.openFolder')}</button>
        <button type="button" className="chalk-button primary" data-testid="new-project" onClick={onNew}><Icon name="plus" /> {translate('home.new')}</button>
      </div>
    </div>
  );
}

function TrashQuestion({ project, onYes, onNo }: Readonly<{ project: ProjectListing; onYes: () => void; onNo: () => void }>) {
  const translate = useTranslate();
  return (
    <ConfirmDialog title={translate('home.trashTitle')} confirm={translate('home.trashConfirm')} danger onConfirm={onYes} onCancel={onNo}>
      <p>{translate('home.trashQuestion', { title: project.title || project.folder })}</p>
      <p className="folder">{project.folder}</p>
    </ConfirmDialog>
  );
}

type Actions = Omit<Parameters<typeof ProjectTile>[0], 'project'>;

function ProjectList({ projects, actions, onNew }: Readonly<{ projects: readonly ProjectListing[] | null; actions: Actions; onNew: () => void }>) {
  const translate = useTranslate();
  if (projects === null) return <p className="hint">{translate('home.loading')}</p>;
  if (projects.length === 0) return <Empty onNew={onNew} />;
  return <ul className="project-grid">{projects.map((project) => <ProjectTile key={project.folder} project={project} {...actions} />)}</ul>;
}

/** The home screen: every project with its stages, and the way to a new one. */
export function ProjectsScreen({ api, onOpen, onNew }: Props) {
  const { projects, failure, duplicate, trash, forget, pick } = useProjects(api, onOpen);
  const [trashing, setTrashing] = useState<ProjectListing | null>(null);
  const actions = { onOpen, onDuplicate: duplicate, onTrash: setTrashing, onForget: forget };
  return (
    <main className="board wide" data-testid="projects-screen">
      <Toolbar count={projects?.length ?? null} onNew={onNew} onPick={pick} />
      {failure && <FailurePanel failure={failure} />}
      <ProjectList projects={projects} actions={actions} onNew={onNew} />
      {trashing && <TrashQuestion project={trashing} onNo={() => setTrashing(null)} onYes={() => [trash(trashing.folder), setTrashing(null)]} />}
    </main>
  );
}
