import { useCallback, useEffect, useState } from 'react';
import type { KeyProvider, KeysStatus } from '../../shared/accounts.ts';
import type { Failure, Result } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';

/** The last answer of a key row: a test that worked (with its numbers) or a failure to show. */
export type KeyOutcome = Readonly<{ ok: true; model: string; inputTokens: number; outputTokens: number }> | Readonly<{ ok: false; failure: Failure }>;
type Rows = Readonly<Partial<Record<KeyProvider, Readonly<{ busy: boolean; outcome?: KeyOutcome }>>>>;

// The rows: busy while a call runs, then its outcome (nothing for a save or a remove that worked).
function useRows() {
  const [rows, setRows] = useState<Rows>({});
  const begin = useCallback((provider: KeyProvider) => setRows((all) => ({ ...all, [provider]: { busy: true } })), []);
  const settle = useCallback((provider: KeyProvider, outcome?: KeyOutcome) => setRows((all) => ({ ...all, [provider]: { busy: false, outcome } })), []);
  return { rows, begin, settle };
}

/** The AI accounts: where each key is (never its value) and the save / test / remove of each row. */
export function useAccounts(api: GizApi) {
  const [status, setStatus] = useState<KeysStatus | null>(null);
  const { rows, begin, settle } = useRows();
  const refresh = useCallback(() => void api.keys.status().then((result) => result.ok && setStatus(result.value)), [api]);
  useEffect(refresh, [refresh]);
  // A save or remove shows only its failure; a test shows its answer either way. The status is asked again after each.
  const act = useCallback(async <T,>(provider: KeyProvider, call: () => Promise<Result<T>>, shown: (value: T) => KeyOutcome | undefined) => {
    begin(provider);
    const result = await call();
    settle(provider, result.ok ? shown(result.value) : result);
    refresh();
  }, [begin, settle, refresh]);
  const save = useCallback((provider: KeyProvider, key: string) => act(provider, () => api.keys.set(provider, key), () => undefined), [api, act]);
  const test = useCallback((provider: KeyProvider) => act(provider, () => api.keys.test(provider), (check) => ({ ok: true, ...check })), [api, act]);
  const remove = useCallback((provider: KeyProvider) => act(provider, () => api.keys.remove(provider), () => undefined), [api, act]);
  return { status, rows, save, test, remove };
}

export type Accounts = ReturnType<typeof useAccounts>;
