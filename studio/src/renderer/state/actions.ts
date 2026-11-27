import type { ProjectSummary } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { StudioEvent } from './studioState.ts';

type Dispatch = (event: StudioEvent) => void;

/** Renders the open project in its own aspect; progress arrives through `video.onProgress`. */
export async function renderProject(api: GizApi, dispatch: Dispatch, project: Pick<ProjectSummary, 'folder' | 'aspect'>): Promise<void> {
  dispatch({ type: 'render-started' });
  const rendered = await api.video.render(project.folder, project.aspect);
  if (rendered.ok) return dispatch({ type: 'rendered', files: rendered.value });
  if (rendered.failure.code === 'cancelled') return dispatch({ type: 'render-cancelled' });
  dispatch({ type: 'failed', failure: rendered.failure });
}
