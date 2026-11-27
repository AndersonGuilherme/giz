import { useEffect } from 'react';
import { beforeLeaving } from '../state/leaving.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import { Header } from './Header.tsx';
import { NewProjectScreen } from './idea/NewProjectScreen.tsx';
import { ProjectScreen, type WorkStage } from './project/ProjectScreen.tsx';
import { ProjectsScreen } from './projects/ProjectsScreen.tsx';

/** Where the Studio is: the projects list, the new-project wizard or a project at one of its stages (the script first). */
export type View = Readonly<{ name: 'home' }> | Readonly<{ name: 'new' }> | Readonly<{ name: 'editor'; folder: string; stage?: WorkStage }>;
type Props = Readonly<{ api: GizApi; view: View; go: (view: View) => void; onSettings: () => void }>;

// The folder given on the command line (`--project`) opens in the editor once per app run: not again after a visit
// to Settings (which unmounts the Studio).
let launchAsked = false;

function useLaunched(api: GizApi, go: (view: View) => void): void {
  useEffect(() => {
    if (launchAsked) return;
    launchAsked = true;
    void api.projects.launched().then((launched) => (launched.ok && launched.value ? go({ name: 'editor', folder: launched.value }) : undefined));
  }, [api, go]);
}

/** The Studio after the first run: one screen at a time under the header. */
export function Studio({ api, view, go: show, onSettings: showSettings }: Props) {
  // Leaving a screen waits for its pending save (the editor flushes it), so the next screen reads it from disk.
  const go = (next: View) => void beforeLeaving().then(() => show(next));
  const onSettings = () => void beforeLeaving().then(showSettings);
  useLaunched(api, show);
  const home = () => go({ name: 'home' });
  const open = (folder: string) => go({ name: 'editor', folder });
  return (
    <>
      <Header atHome={view.name === 'home'} onHome={home} onSettings={onSettings} />
      {view.name === 'home' && <ProjectsScreen api={api} onOpen={open} onNew={() => go({ name: 'new' })} />}
      {view.name === 'new' && <NewProjectScreen api={api} onCreated={open} onCancel={home} />}
      {view.name === 'editor' && <ProjectScreen api={api} folder={view.folder} stage={view.stage ?? 'script'} onStage={(stage) => go({ ...view, stage })} />}
    </>
  );
}
