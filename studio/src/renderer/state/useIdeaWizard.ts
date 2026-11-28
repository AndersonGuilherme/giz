import { useCallback, useEffect, useReducer, useState } from 'react';
import type { Failure } from '../../shared/contract.ts';
import type { GizzyApi } from '../../shared/GizzyApi.ts';
import type { Portraits, Presets } from '../../shared/projects.ts';
import { IDLE, reduceGeneration } from '../idea/generation.ts';
import { emptyDraft, ideaOf, type IdeaDraft } from '../idea/ideaDraft.ts';

/** The ready characters and scenes, and the portraits (they take a moment the first time: the picker waits for them). */
function usePresets(api: GizzyApi) {
  const [presets, setPresets] = useState<Presets | null>(null);
  const [portraits, setPortraits] = useState<Portraits | null>(null);
  useEffect(() => {
    void api.ideas.presets().then((answer) => answer.ok && setPresets(answer.value));
    void api.ideas.portraits().then((answer) => answer.ok && setPortraits(answer.value));
  }, [api]);
  return { presets, portraits };
}

/** "Gerar com IA": the estimate, the confirmation, the calls (with progress) and their end. */
function useGeneration(api: GizzyApi, draft: IdeaDraft, onCreated: (folder: string) => void) {
  const [generation, dispatch] = useReducer(reduceGeneration, IDLE);
  useEffect(() => api.script.onProgress((progress) => dispatch({ type: 'progress', progress })), [api]);
  const estimate = useCallback(async () => {
    dispatch({ type: 'estimate' });
    const estimated = await api.script.estimate(ideaOf(draft));
    dispatch(estimated.ok ? { type: 'estimated', estimate: estimated.value } : { type: 'failed', failure: estimated.failure });
  }, [api, draft]);
  const generate = useCallback(async () => {
    dispatch({ type: 'start' });
    const generated = await api.script.generate(ideaOf(draft));
    if (generated.ok) return onCreated(generated.value.folder);
    dispatch(generated.failure.code === 'cancelled' ? { type: 'cancelled' } : { type: 'failed', failure: generated.failure });
  }, [api, draft, onCreated]);
  return { generation, estimate: () => void estimate(), generate: () => void generate(), cancel: () => void api.script.cancel(), close: () => dispatch({ type: 'close' }) };
}

const IDLE_STATES: readonly string[] = ['idle', 'failed', 'cancelled'];

/** The new-project wizard: the draft, the presets, "write it myself" and "generate with AI". */
export function useIdeaWizard(api: GizzyApi, language: IdeaDraft['language'], onCreated: (folder: string) => void) {
  const [draft, setDraft] = useState(() => emptyDraft(language));
  const [failure, setFailure] = useState<Failure | null>(null);
  const change = useCallback((patch: Partial<IdeaDraft>) => setDraft((current) => ({ ...current, ...patch })), []);
  const [creating, setCreating] = useState(false);
  const writeMyself = useCallback(async () => {
    setCreating(true);
    const created = await api.projects.create(ideaOf(draft));
    setCreating(false);
    return created.ok ? onCreated(created.value) : setFailure(created.failure);
  }, [api, draft, onCreated]);
  const ai = useGeneration(api, draft, onCreated);
  // While a project is being made, neither way can start another one.
  const busy = creating || !IDLE_STATES.includes(ai.generation.status);
  return { draft, change, failure, busy, ...usePresets(api), writeMyself: () => void (busy || writeMyself()), ai };
}

export type IdeaWizard = ReturnType<typeof useIdeaWizard>;
