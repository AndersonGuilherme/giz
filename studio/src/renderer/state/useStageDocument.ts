import { useCallback, useEffect, useState } from 'react';
import type { Failure, Result } from '../../shared/contract.ts';

/**
 * A stage screen's document (null while it loads) and its last failure: `apply` waits for a call that answers a new
 * document and shows it (or the failure, keeping the document as it was); `busy` while a call runs.
 */
export function useStageDocument<Document>(load: () => Promise<Result<Document>>) {
  const [document, setDocument] = useState<Document | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(0);
  const apply = useCallback(async (call: Promise<Result<Document>>): Promise<boolean> => {
    setBusy((count) => count + 1);
    const result = await call;
    setBusy((count) => count - 1);
    setFailure(result.ok ? null : result.failure);
    if (result.ok) setDocument(result.value);
    return result.ok;
  }, []);
  const reload = useCallback(() => void apply(load()), [apply, load]);
  useEffect(reload, [reload]);
  return { document, failure, setFailure, apply, reload, busy: busy > 0 };
}
