import { useEffect } from 'react';
import { beforeLeaving } from '../state/leaving.ts';
import { OpenSettingsContext } from '../state/OpenSettings.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import { Header } from './Header.tsx';
import { NewProjectScreen } from './idea/NewProjectScreen.tsx';
import { ProjectScreen, type WorkStage } from './project/ProjectScreen.tsx';
import { ProjectsScreen } from './projects/ProjectsScreen.tsx';

/** Where the Studio is: the projects list, the new-project wizard or a project at one of its stages (the script first). */
/** `focus`: a line to show at the stage (the Video stage's check jumps to it in the script). */
export type View = Readonly<{ name: 'home' }> | Readonly<{ name: 'new' }> | Readonly<{ name: 'editor'; folder: string; stage?: WorkStage; focus?: string }>;
type Props = Readonly<{ api: GizApi; view: View; go: (view: View) => void; onSettings: () => void }>;

// The folder given on the command line (`--project`) opens in the editor once per app run: not again after a visit
// to Settings (which unmounts the Studio).
let launchAsked = false;

function useLaunched(api: GizApi, go: (view: View) => void): void {
  useEffect(() => {
    const open = () => void api.projects.launched().then(async (launched) => {
      if (!launched.ok || !launched.value) return;
      await beforeLeaving(); // the screen being left saves first
      go({ name: 'editor', folder: launched.value });
    });
    // A later launch of the app (the single-instance lock hands it to this one) may name another project.
    const stop = api.projects.onLaunched(open);
    if (!launchAsked) open();
    launchAsked = true;
    return stop;
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
    <OpenSettingsContext.Provider value={onSettings}>
      <Header atHome={view.name === 'home'} onHome={home} onSettings={onSettings} />
      {view.name === 'home' && <ProjectsScreen api={api} onOpen={open} onNew={() => go({ name: 'new' })} />}
      {view.name === 'new' && <NewProjectScreen api={api} onCreated={open} onCancel={home} />}
      {view.name === 'editor' && <ProjectScreen api={api} folder={view.folder} stage={view.stage ?? 'script'} focus={view.focus} onStage={(stage, focus) => go({ name: 'editor', folder: view.folder, stage, focus })} />}
    </OpenSettingsContext.Provider>
  );
}
