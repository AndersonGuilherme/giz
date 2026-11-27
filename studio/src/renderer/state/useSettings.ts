import { useCallback, useEffect, useState } from 'react';
import type { Failure, Result } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { FolderSource, Settings, SettingsPatch } from '../../shared/settings.ts';

/** The settings, loaded once and replaced by each answer of the main process (which owns them). */
export function useSettings(api: GizApi) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const take = useCallback((result: Result<Settings>) => {
    if (!result.ok) return setFailure(result.failure);
    setFailure(null);
    setSettings(result.value);
  }, []);
  const reload = useCallback(() => void api.settings.get().then(take), [api, take]);
  useEffect(reload, [reload]);
  const update = useCallback((patch: SettingsPatch) => void api.settings.update(patch).then(take), [api, take]);
  const projectsFolder = useCallback((source: FolderSource) => void api.settings.projectsFolder(source).then(take), [api, take]);
  const modelsFolder = useCallback((source: FolderSource) => void api.settings.modelsFolder(source).then(take), [api, take]);
  const finish = useCallback(() => void api.settings.finish().then(take), [api, take]);
  return { settings, failure, reload, update, projectsFolder, modelsFolder, finish };
}

export type SettingsActions = Omit<ReturnType<typeof useSettings>, 'settings' | 'failure'>;
