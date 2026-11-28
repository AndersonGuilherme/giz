import { useCallback, useEffect, useReducer, useState } from 'react';
import type { GizzyApi } from '../../shared/GizzyApi.ts';
import type { GpuStatus, ModelsStatus, SetupTask } from '../../shared/setup.ts';
import { reduceJobs, type JobEvent } from './setupJobs.ts';

type Dispatch = (event: JobEvent) => void;

async function runTask(api: GizzyApi, dispatch: Dispatch, task: SetupTask): Promise<void> {
  dispatch({ type: 'started', task });
  const result = await api.setup.run(task);
  if (result.ok) return dispatch({ type: 'finished', task });
  if (result.failure.code === 'cancelled') return dispatch({ type: 'stopped', task });
  dispatch({ type: 'failed', task, failure: result.failure });
}

/**
 * The machine status (GPU, models) and the long setup tasks: progress arrives as events; the status is asked again
 * when a task ends or the models folder changes (`modelsDir`). `onEnded` runs after each task (a finished GPU install
 * changes the voice device in the settings).
 */
export function useSetupJobs(api: GizzyApi, modelsDir: string | undefined, onEnded: () => void) {
  const [jobs, dispatch] = useReducer(reduceJobs, {});
  const [gpu, setGpu] = useState<GpuStatus | null>(null);
  const [models, setModels] = useState<ModelsStatus | null>(null);
  const refresh = useCallback(() => {
    void api.setup.gpu().then((result) => result.ok && setGpu(result.value));
    void api.setup.models().then((result) => result.ok && setModels(result.value));
  }, [api]);
  useEffect(() => api.setup.onProgress((progress) => dispatch({ type: 'progress', progress })), [api]);
  useEffect(() => void (modelsDir && refresh()), [modelsDir, refresh]);
  const run = useCallback((task: SetupTask) => void runTask(api, dispatch, task).then(refresh).then(onEnded), [api, refresh, onEnded]);
  const stop = useCallback((task: SetupTask) => void api.setup.stop(task), [api]);
  return { jobs, gpu, models, run, stop };
}

export type SetupJobs = ReturnType<typeof useSetupJobs>;
