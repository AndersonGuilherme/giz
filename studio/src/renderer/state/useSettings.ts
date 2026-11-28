import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Failure, Result } from '../../shared/contract.ts';
import type { GizzyApi } from '../../shared/GizzyApi.ts';
import type { FolderSource, Settings, SettingsPatch, TourId } from '../../shared/settings.ts';
import { serially } from './serially.ts';

/**
 * The settings, loaded once and replaced by each answer of the main process (which owns them). The calls go one at a
 * time, so the last answer shown is always the one of the last change.
 */
export function useSettings(api: GizzyApi) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const take = useCallback((result: Result<Settings>) => {
    if (!result.ok) return setFailure(result.failure);
    setFailure(null);
    setSettings(result.value);
  }, []);
  const queue = useMemo(serially, []);
  const send = useCallback((call: () => Promise<Result<Settings>>) => void queue(call).then(take), [queue, take]);
  const reload = useCallback(() => send(() => api.settings.get()), [api, send]);
  useEffect(reload, [reload]);
  const update = useCallback((patch: SettingsPatch) => send(() => api.settings.update(patch)), [api, send]);
  const projectsFolder = useCallback((source: FolderSource) => send(() => api.settings.projectsFolder(source)), [api, send]);
  const modelsFolder = useCallback((source: FolderSource) => send(() => api.settings.modelsFolder(source)), [api, send]);
  const finish = useCallback(() => send(() => api.settings.finish()), [api, send]);
  const tourSeen = useCallback((tour: TourId) => send(() => api.settings.tourSeen(tour)), [api, send]);
  const resetTours = useCallback(() => send(() => api.settings.resetTours()), [api, send]);
  return { settings, failure, reload, update, projectsFolder, modelsFolder, finish, tourSeen, resetTours };
}

export type SettingsActions = Omit<ReturnType<typeof useSettings>, 'settings' | 'failure'>;
