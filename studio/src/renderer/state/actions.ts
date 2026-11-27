import type { ProjectSummary, Result } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { StudioEvent } from './studioState.ts';

type Dispatch = (event: StudioEvent) => void;

/** Opens the project of a folder and checks it. */
async function openFolder(api: GizApi, dispatch: Dispatch, folder: string): Promise<void> {
  dispatch({ type: 'opening' });
  const opened = await api.projects.open(folder);
  if (!opened.ok) return dispatch({ type: 'failed', failure: opened.failure });
  const checked = await api.projects.check(folder);
  if (!checked.ok) return dispatch({ type: 'failed', failure: checked.failure });
  dispatch({ type: 'opened', project: opened.value, report: checked.value });
}

async function openChosen(api: GizApi, dispatch: Dispatch, chosen: Result<string | null>): Promise<void> {
  if (!chosen.ok) return dispatch({ type: 'failed', failure: chosen.failure });
  if (chosen.value === null) return;
  await openFolder(api, dispatch, chosen.value);
}

/** Picks a folder with the main-process dialog and opens it (nothing happens when the person cancels). */
export async function openPicked(api: GizApi, dispatch: Dispatch): Promise<void> {
  await openChosen(api, dispatch, await api.projects.pick());
}

/** Opens the folder given on the command line, if there is one. */
export async function openLaunched(api: GizApi, dispatch: Dispatch): Promise<void> {
  await openChosen(api, dispatch, await api.projects.launched());
}

/** Renders the open project in its own aspect; progress arrives through `video.onProgress`. */
export async function renderProject(api: GizApi, dispatch: Dispatch, project: ProjectSummary): Promise<void> {
  dispatch({ type: 'render-started' });
  const rendered = await api.video.render(project.folder, project.aspect);
  if (rendered.ok) return dispatch({ type: 'rendered', files: rendered.value });
  if (rendered.failure.code === 'cancelled') return dispatch({ type: 'render-cancelled' });
  dispatch({ type: 'failed', failure: rendered.failure });
}
