import { useEffect, useState } from 'react';
import type { Failure } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';
import type { ImageEstimate, ImageStyle, ScenariosDocument, SceneCard } from '../../shared/scenarios.ts';

/** `edit` the prompt, see the `estimate` and confirm, `running` (cancellable), then `failed` or done (the dialog closes). */
export type ImageStep =
  | Readonly<{ step: 'edit' }>
  | Readonly<{ step: 'estimate'; estimate: ImageEstimate }>
  | Readonly<{ step: 'running'; calling: boolean }>
  | Readonly<{ step: 'failed'; failure: Failure }>;

type Job = Readonly<{ api: GizApi; folder: string; card: SceneCard; onDone: (document: ScenariosDocument) => void }>;

/** The steps of making one scene's image: save the prompt, ask the price, then make it (or make it again). */
export function useImageJob({ api, folder, card, onDone }: Job) {
  const [state, setState] = useState<ImageStep>({ step: 'edit' });
  useEffect(() => api.scenarios.onProgress(({ lineId, phase }) => (lineId === card.lineId && phase === 'calling' ? setState({ step: 'running', calling: true }) : undefined)), [api, card.lineId]);
  const failed = (failure: Failure) => setState({ step: 'failed', failure });
  const price = async (prompt: string, style?: ImageStyle) => {
    const saved = await api.scenarios.prompt(folder, card.lineId, { prompt, style });
    if (!saved.ok) return failed(saved.failure);
    onDone(saved.value);
    const estimate = await api.scenarios.estimate(folder, card.lineId, false);
    return estimate.ok ? setState({ step: 'estimate', estimate: estimate.value }) : failed(estimate.failure);
  };
  const make = async (force: boolean) => {
    setState({ step: 'running', calling: false });
    const made = await api.scenarios.generate(folder, card.lineId, force);
    return made.ok ? onDone(made.value) : failed(made.failure);
  };
  return { state, price: (prompt: string, style?: ImageStyle) => void price(prompt, style), make: (force: boolean) => void make(force), cancel: () => void api.scenarios.cancel(), back: () => setState({ step: 'edit' }) };
}
