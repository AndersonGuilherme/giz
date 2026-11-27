import { useCallback, useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import { IMAGE_STYLES, SCENE_IMAGE_PROVIDERS, type ScenariosDocument, type SceneCard } from '../../../shared/scenarios.ts';
import { useTranslate } from '../../i18n.ts';
import { useStageDocument } from '../../state/useStageDocument.ts';
import { Picker } from '../common/Picker.tsx';
import { ScreenHead } from '../common/ScreenHead.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { GenerateImageDialog } from './GenerateImageDialog.tsx';
import { SceneTile, type SceneActions } from './SceneTile.tsx';

type Props = Readonly<{ api: GizApi; folder: string }>;
type Apply = ReturnType<typeof useStageDocument<ScenariosDocument>>['apply'];

function Settings({ document, api, apply }: Readonly<{ document: ScenariosDocument; api: GizApi; apply: Apply }>) {
  const translate = useTranslate();
  const folder = document.folder;
  return (
    <div className="form-row">
      <Picker label={translate('scenarios.style')} value={document.style} options={IMAGE_STYLES} group="imageStyle" onChange={(style) => style && void apply(api.scenarios.settings(folder, { style: style as never }))} testId="scenarios-style" />
      <Picker label={translate('scenarios.provider')} value={document.provider} options={SCENE_IMAGE_PROVIDERS} group="imageProvider" onChange={(provider) => provider && void apply(api.scenarios.settings(folder, { provider: provider as never }))} testId="scenarios-provider" />
    </div>
  );
}

function actionsOf({ api, document, apply }: Readonly<{ api: GizApi; document: ScenariosDocument; apply: Apply }>, generate: (card: SceneCard) => void): SceneActions {
  const folder = document.folder;
  return {
    vector: (card, vector) => void apply(api.scenarios.vector(folder, card.lineId, vector)),
    upload: async (card, file) => void apply(api.scenarios.upload(folder, card.lineId, new Uint8Array(await file.arrayBuffer()))),
    useGenerated: (card) => void apply(api.scenarios.useGenerated(folder, card.lineId)),
    generate,
  };
}

/** The Scenarios stage: one card per scenario scene, each with its background and the ways to change it. */
export function ScenariosScreen({ api, folder }: Props) {
  const translate = useTranslate();
  const load = useCallback(() => api.scenarios.read(folder), [api, folder]);
  const { document, failure, apply } = useStageDocument(load);
  const [generating, setGenerating] = useState<SceneCard | null>(null);
  if (!document) return failure ? <main className="board"><FailurePanel failure={failure} /></main> : <p className="hint">{translate('editor.loading')}</p>;
  const actions = actionsOf({ api, document, apply }, setGenerating);
  return (
    <main className="board wide stage-screen" data-testid="scenarios-screen">
      <ScreenHead title={translate('scenarios.title')} hint={translate('scenarios.hint')} stages={document.stages}><Settings document={document} api={api} apply={apply} /></ScreenHead>
      {failure && <FailurePanel failure={failure} />}
      {document.cards.length === 0 && <p className="empty-board">{translate('scenarios.none')}</p>}
      <ul className="scene-grid" data-testid="scene-grid">{document.cards.map((card) => <SceneTile key={card.lineId} card={card} document={document} actions={actions} />)}</ul>
      {generating && <GenerateImageDialog api={api} document={document} card={generating} onClose={() => setGenerating(null)} onDone={(next) => void apply(Promise.resolve({ ok: true, value: next }))} />}
    </main>
  );
}
