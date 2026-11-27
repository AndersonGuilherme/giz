import { useCallback, useEffect, useReducer, useState } from 'react';
import type { Failure, Result } from '../../../shared/contract.ts';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { VideoDocument } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { renderProject } from '../../state/actions.ts';
import { INITIAL_STATE, reduce } from '../../state/studioState.ts';
import { FailurePanel } from '../FailurePanel.tsx';
import { RenderPanel } from '../RenderPanel.tsx';
import { RenderHistory } from './RenderHistory.tsx';
import { WatchDialog } from './WatchDialog.tsx';

type Props = Readonly<{ api: GizApi; document: VideoDocument; onRendered: () => void }>;

// The answer of an output action as a short note (or its failure).
function useNote() {
  const [note, setNote] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const show = useCallback(async <T,>(call: Promise<Result<T>>, text: (value: T) => string | null) => {
    const answer = await call;
    setFailure(answer.ok ? null : answer.failure);
    setNote(answer.ok ? text(answer.value) : null);
  }, []);
  return { note, failure, show };
}

type OutputProps = Readonly<{ api: GizApi; document: VideoDocument; captions: boolean; show: ReturnType<typeof useNote>['show']; onWatch: (() => void) | null }>;

function OutputButtons({ api, document, captions, show, onWatch }: OutputProps) {
  const translate = useTranslate();
  const { folder, aspect } = document;
  return (
    <div className="output-buttons">
      <button type="button" className="chalk-button small primary" data-testid="video-watch" disabled={!onWatch} onClick={() => onWatch?.()}>{translate('video.watch')}</button>
      <button type="button" className="chalk-button small" data-testid="video-open-folder" onClick={() => void show(api.video.openFolder(folder), () => translate('video.folderOpened'))}>{translate('video.openFolder')}</button>
      <button type="button" className="chalk-button small" data-testid="video-copy-captions" disabled={!captions} onClick={() => void show(api.video.copyCaptions(folder, aspect), () => translate('video.captionsCopied'))}>{translate('video.copyCaptions')}</button>
      <button type="button" className="chalk-button small" data-testid="video-export-captions" disabled={!captions} onClick={() => void show(api.video.exportCaptions(folder, aspect), (path) => (path ? translate('video.captionsSaved', { path }) : null))}>{translate('video.exportCaptions')}</button>
    </div>
  );
}

function Note({ note, failure }: Readonly<{ note: string | null; failure: Failure | null }>) {
  if (failure) return <FailurePanel failure={failure} />;
  return note ? <p className="note" data-testid="video-note" aria-live="polite">{note}</p> : null;
}

// What the last render in the chosen aspect left: watch it, open its folder, copy or export its captions.
function Outputs({ api, document }: Readonly<{ api: GizApi; document: VideoDocument }>) {
  const [watching, setWatching] = useState(false);
  const { note, failure, show } = useNote();
  const made = document.rendered.find(({ aspect }) => aspect === document.aspect);
  return (
    <div className="render-outputs" data-testid="render-outputs">
      <OutputButtons api={api} document={document} captions={made?.captions === true} show={show} onWatch={made ? () => setWatching(true) : null} />
      <Note note={note} failure={failure} />
      {watching && made && <WatchDialog url={made.url} aspect={made.aspect} onClose={() => setWatching(false)} />}
    </div>
  );
}

/** The render in the chosen aspect (blocked while the montage fails or the check has errors), its outputs and history. */
export function RenderCard({ api, document, onRendered }: Props) {
  const translate = useTranslate();
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  useEffect(() => api.video.onProgress(({ fraction }) => dispatch({ type: 'render-progress', fraction })), [api]);
  useEffect(() => (state.render.status === 'done' ? onRendered() : undefined), [state.render.status, onRendered]);
  const render = () => void renderProject(api, dispatch, { folder: document.folder, aspect: document.aspect });
  const blocked = document.montage === null || document.check.errors.length > 0;
  return (
    <section className="render-card" data-testid="video-render">
      <h2>{translate('video.renderTitle', { aspect: document.aspect })}</h2>
      {blocked && <p className="muted small" data-testid="render-blocked">{translate(document.montage ? 'video.blockedByCheck' : 'video.blockedByMontage')}</p>}
      {state.failure && <FailurePanel failure={state.failure} />}
      <RenderPanel render={state.render} blocked={blocked} onRender={render} onCancel={() => void api.video.cancel()} />
      <Outputs api={api} document={document} />
      <RenderHistory renders={document.renders} />
    </section>
  );
}
