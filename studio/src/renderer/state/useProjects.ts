import { useCallback, useEffect, useState } from 'react';
import type { Failure, Result } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { ProjectListing } from '../../shared/projects.ts';

/** The home screen's list (null while it loads) and what its buttons do; each change reloads the list. */
export function useProjects(api: GizApi, onOpen: (folder: string) => void) {
  const [projects, setProjects] = useState<readonly ProjectListing[] | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const reload = useCallback(() => void api.projects.list().then((listed) => (listed.ok ? setProjects(listed.value) : setFailure(listed.failure))), [api]);
  useEffect(reload, [reload]);
  const after = useCallback(async (done: Promise<Result<unknown>>) => {
    const result = await done;
    setFailure(result.ok ? null : result.failure);
    reload();
  }, [reload]);
  const duplicate = useCallback((folder: string) => void after(api.projects.duplicate(folder)), [api, after]);
  const trash = useCallback((folder: string) => void after(api.projects.trash(folder)), [api, after]);
  const forget = useCallback((folder: string) => void after(api.projects.forget(folder)), [api, after]);
  const pick = useCallback(async () => {
    const picked = await api.projects.pick();
    if (!picked.ok) return setFailure(picked.failure);
    if (picked.value !== null) onOpen(picked.value);
  }, [api, onOpen]);
  return { projects, failure, duplicate, trash, forget, pick: () => void pick() };
}
