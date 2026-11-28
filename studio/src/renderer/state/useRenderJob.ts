import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type MutableRefObject } from 'react';
import type { Aspect, RenderedFiles, Result } from '../../shared/contract.ts';
import type { GizzyApi } from '../../shared/GizzyApi.ts';
import { NO_RENDER, reduceRender, type RenderEvent, type RenderJobState } from './renderJob.ts';

/** The window's render, kept above every screen: it survives leaving the Video stage, another project or Settings. */
export type RenderJobTools = Readonly<{ state: RenderJobState; start: (folder: string, aspect: Aspect) => void; cancel: (folder: string) => void }>;

export const RenderJobContext = createContext<RenderJobTools | null>(null);

export function useRenderJobTools(): RenderJobTools {
  const tools = useContext(RenderJobContext);
  if (!tools) throw new Error('useRenderJobTools outside RenderJobContext');
  return tools;
}

type Dispatch = (event: RenderEvent) => void;

const POLL_MILLISECONDS = 1000;

function outcome(dispatch: Dispatch, named: Readonly<{ folder: string; aspect: Aspect }>, rendered: Result<RenderedFiles>): void {
  if (rendered.ok) return dispatch({ type: 'rendered', ...named, files: rendered.value });
  if (rendered.failure.code === 'cancelled') return dispatch({ type: 'cancelled', ...named });
  dispatch({ type: 'failed', ...named, failure: rendered.failure });
}

// A render this window did not start (found after a reload) has no answer to wait for: main is asked until it is gone.
function useWatching(api: GizzyApi, watching: boolean, dispatch: Dispatch): void {
  useEffect(() => {
    if (!watching) return undefined;
    const ask = () => void api.video.status().then((answer) => (answer.ok && answer.value === null ? dispatch({ type: 'vanished' }) : undefined));
    const timer = setInterval(ask, POLL_MILLISECONDS);
    return () => clearInterval(timer);
  }, [api, watching, dispatch]);
}

function useStart(api: GizzyApi, dispatch: Dispatch, own: MutableRefObject<boolean>) {
  return useCallback(async (folder: string, aspect: Aspect) => {
    own.current = true;
    dispatch({ type: 'started', folder, aspect });
    const rendered = await api.video.render(folder, aspect);
    own.current = false;
    outcome(dispatch, { folder, aspect }, rendered);
  }, [api, dispatch, own]);
}

/** The render state of the window: progress from main, the running render found again on start, start and cancel. */
export function useRenderJob(api: GizzyApi): RenderJobTools {
  const [state, dispatch] = useReducer(reduceRender, NO_RENDER);
  const own = useRef(false);
  useEffect(() => api.video.onProgress((progress) => dispatch({ type: 'progress', ...progress })), [api]);
  useEffect(() => void api.video.status().then((answer) => (answer.ok ? dispatch({ type: 'attached', status: answer.value }) : undefined)), [api]);
  useWatching(api, state.job.status === 'running' && !own.current, dispatch);
  const start = useStart(api, dispatch, own);
  const cancel = useCallback((folder: string) => void api.video.cancel(folder), [api]);
  return useMemo(() => ({ state, start: (folder: string, aspect: Aspect) => void start(folder, aspect), cancel }), [state, start, cancel]);
}
