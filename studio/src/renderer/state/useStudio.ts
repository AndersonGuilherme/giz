import { useCallback, useEffect, useReducer } from 'react';
import type { GizApi } from '../../shared/GizApi.ts';
import { openLaunched, openPicked, renderProject } from './actions.ts';
import { INITIAL_STATE, reduce } from './studioState.ts';

/** The window state and the actions the buttons call. */
export function useStudio(api: GizApi) {
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  useEffect(() => api.video.onProgress(({ fraction }) => dispatch({ type: 'render-progress', fraction })), [api]);
  useEffect(() => void openLaunched(api, dispatch), [api]);
  const open = useCallback(() => void openPicked(api, dispatch), [api]);
  const { project } = state;
  const render = useCallback(() => void (project && renderProject(api, dispatch, project)), [api, project]);
  const cancel = useCallback(() => void api.video.cancel(), [api]);
  return { state, open, render, cancel };
}
