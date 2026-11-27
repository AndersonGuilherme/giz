import { useEffect, useRef } from 'react';
import type { GizApi } from '../../shared/GizApi.ts';
import { EditorScreen } from './editor/EditorScreen.tsx';
import { Header } from './Header.tsx';
import { NewProjectScreen } from './idea/NewProjectScreen.tsx';
import { ProjectsScreen } from './projects/ProjectsScreen.tsx';

/** Where the Studio is: the projects list, the new-project wizard or a project's script editor. */
export type View = Readonly<{ name: 'home' }> | Readonly<{ name: 'new' }> | Readonly<{ name: 'editor'; folder: string }>;
type Props = Readonly<{ api: GizApi; view: View; go: (view: View) => void; onSettings: () => void }>;

// The folder given on the command line (`--project`) opens in the editor, once per window.
function useLaunched(api: GizApi, go: (view: View) => void): void {
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    void api.projects.launched().then((launched) => (launched.ok && launched.value ? go({ name: 'editor', folder: launched.value }) : undefined));
  }, [api, go]);
}

/** The Studio after the first run: one screen at a time under the header. */
export function Studio({ api, view, go, onSettings }: Props) {
  useLaunched(api, go);
  const home = () => go({ name: 'home' });
  const open = (folder: string) => go({ name: 'editor', folder });
  return (
    <>
      <Header atHome={view.name === 'home'} onHome={home} onSettings={onSettings} />
      {view.name === 'home' && <ProjectsScreen api={api} onOpen={open} onNew={() => go({ name: 'new' })} />}
      {view.name === 'new' && <NewProjectScreen api={api} onCreated={open} onCancel={home} />}
      {view.name === 'editor' && <EditorScreen key={view.folder} api={api} folder={view.folder} />}
    </>
  );
}
