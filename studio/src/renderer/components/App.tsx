import type { GizApi } from '../../shared/GizApi.ts';
import type { StudioState } from '../state/studioState.ts';
import { useStudio } from '../state/useStudio.ts';
import { CheckPanel } from './CheckPanel.tsx';
import { FailurePanel } from './FailurePanel.tsx';
import { Header } from './Header.tsx';
import { ProjectCard } from './ProjectCard.tsx';
import { RenderPanel } from './RenderPanel.tsx';
import { useTranslate } from '../i18n.ts';

type Actions = Readonly<{ render: () => void; cancel: () => void }>;

function OpenProject({ state, actions }: Readonly<{ state: StudioState; actions: Actions }>) {
  const { project, report } = state;
  if (!project || !report) return null;
  const blocked = report.errors.length > 0;
  return (
    <>
      <ProjectCard project={project} />
      <CheckPanel report={report} />
      <RenderPanel render={state.render} blocked={blocked} onRender={actions.render} onCancel={actions.cancel} />
    </>
  );
}

/** The Studio: open a project, see its check, render it. */
export function App({ api, onSettings }: Readonly<{ api: GizApi; onSettings: () => void }>) {
  const translate = useTranslate();
  const { state, open, render, cancel } = useStudio(api);
  const { project, failure } = state;
  return (
    <>
      <Header opening={state.opening} onOpen={open} onSettings={onSettings} />
      <main className="board">
        {failure && <FailurePanel failure={failure} />}
        {!project && !failure && <p className="hint">{translate('project.none')}</p>}
        <OpenProject state={state} actions={{ render, cancel }} />
      </main>
    </>
  );
}
