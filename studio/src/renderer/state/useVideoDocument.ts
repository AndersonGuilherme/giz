import { useCallback, useEffect, useRef, useState } from 'react';
import type { Aspect, Failure } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { VideoDocument } from '../../shared/video.ts';

/**
 * The Video stage's document in the chosen aspect (the project's own until one is chosen): `load` runs "montar"
 * again; only the answer of the latest request is shown (an older one arriving late is dropped).
 */
export function useVideoDocument(api: GizApi, folder: string) {
  const [document, setDocument] = useState<VideoDocument | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);
  const load = useCallback(async (aspect?: Aspect) => {
    const request = ++latest.current;
    setLoading(true);
    const answer = await api.video.preview(folder, aspect);
    if (request !== latest.current) return;
    setLoading(false);
    setFailure(answer.ok ? null : answer.failure);
    if (answer.ok) setDocument(answer.value);
  }, [api, folder]);
  useEffect(() => void load(), [load]);
  return { document, failure, loading, load };
}
