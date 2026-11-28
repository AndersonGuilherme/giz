import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { Notice } from './Notice.tsx';

/** Where the projects go: the suggested ~/Gizzycera/projetos (projects in English), or a folder picked in the system dialog. */
export function ProjectsFolderPanel() {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const { projectsFolder, defaultProjectsFolder } = settings;
  return (
    <>
      <p className="intro">{translate('projects.intro')}</p>
      <div className={`folder-box${projectsFolder ? ' chosen' : ''}`} data-testid="projects-folder">
        <span className="folder-label">{projectsFolder ? translate('projects.chosen') : translate('projects.suggested')}</span>
        <code className="path">{projectsFolder ?? defaultProjectsFolder}</code>
      </div>
      <div className="row">
        <button type="button" className={`chalk-button${projectsFolder ? '' : ' primary'}`} data-testid="projects-default" onClick={() => actions.projectsFolder('default')}>{translate('projects.useDefault')}</button>
        <button type="button" className="chalk-button" onClick={() => actions.projectsFolder('pick')}>{translate('projects.pick')}</button>
      </div>
      {projectsFolder && <Notice tone="ok">✔ {translate('projects.ready')}</Notice>}
    </>
  );
}
