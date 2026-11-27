import { useCallback, useEffect, useRef, useState } from 'react';
import type { Failure, Result } from '../../../shared/contract.ts';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { VideoDocument } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { renderOf, type RenderJobState, type RenderView } from '../../state/renderJob.ts';
import { useRenderJobTools } from '../../state/useRenderJob.ts';
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

// The document is read again once when this project's render ends: never again for that end, whatever changes later
// (another aspect chosen afterwards makes no extra montage).
function useReloadOnEnd(folder: string, onRendered: () => void): void {
  const { state } = useRenderJobTools();
  const latest = useRef(onRendered);
  const seen = useRef(state.ended.count);
  useEffect(() => void (latest.current = onRendered), [onRendered]);
  useEffect(() => {
    if (state.ended.count === seen.current) return;
    seen.current = state.ended.count;
    if (state.ended.folder === folder) latest.current();
  }, [state.ended, folder]);
}

// The folder of a render running for another project, which blocks this one's.
const otherRendering = ({ job }: RenderJobState, folder: string) => (job.status === 'running' && job.folder !== folder ? job.folder : null);
const isBlocked = (document: VideoDocument, other: string | null) => document.montage === null || document.check.errors.length > 0 || other !== null;
const failureOf = (render: RenderView) => (render.status === 'idle' ? render.failure : undefined);

function BlockedNote({ document, other }: Readonly<{ document: VideoDocument; other: string | null }>) {
  const translate = useTranslate();
  const reason = other === null ? (document.montage ? 'video.blockedByCheck' : 'video.blockedByMontage') : 'video.otherRendering';
  return <p className="muted small" data-testid="render-blocked">{translate(reason, { folder: other ?? '' })}</p>;
}

/**
 * The render in the chosen aspect (blocked while the montage fails, the check has errors or another project renders),
 * its outputs and history. The render itself lives above the screens: back on this card, a running one shows again,
 * labelled with its own aspect.
 */
export function RenderCard({ api, document, onRendered }: Props) {
  const translate = useTranslate();
  const { state, start, cancel } = useRenderJobTools();
  useReloadOnEnd(document.folder, onRendered);
  const render = renderOf(state, document.folder);
  const other = otherRendering(state, document.folder);
  const blocked = isBlocked(document, other);
  const failure = failureOf(render);
  return (
    <section className="render-card" data-testid="video-render">
      <h2>{translate('video.renderTitle', { aspect: render.status === 'running' ? render.aspect : document.aspect })}</h2>
      {blocked && <BlockedNote document={document} other={other} />}
      {failure && <FailurePanel failure={failure} />}
      <RenderPanel render={render} blocked={blocked} onRender={() => start(document.folder, document.aspect)} onCancel={() => cancel(document.folder)} />
      <Outputs api={api} document={document} />
      <RenderHistory renders={document.renders} />
    </section>
  );
}
