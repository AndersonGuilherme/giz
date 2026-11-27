import { useCallback, useEffect, useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { VoiceProgress, VoicesDocument } from '../../../shared/voices.ts';
import { useTranslate } from '../../i18n.ts';
import { costText } from '../../media/money.ts';
import { useRecorder } from '../../media/useRecorder.ts';
import { useStageDocument } from '../../state/useStageDocument.ts';
import { ScreenHead } from '../common/ScreenHead.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { VoiceRow, type LineActions } from './VoiceRow.tsx';

type Props = Readonly<{ api: GizApi; folder: string }>;
type Stage = ReturnType<typeof useStageDocument<VoicesDocument>>;

function useProgress(api: GizApi): VoiceProgress | null {
  const [progress, setProgress] = useState<VoiceProgress | null>(null);
  useEffect(() => api.voices.onProgress(setProgress), [api]);
  return progress;
}

function Progress({ progress }: Readonly<{ progress: VoiceProgress }>) {
  const translate = useTranslate();
  return (
    <>
      <div className="progress" data-testid="voices-progress"><span style={{ width: `${(100 * progress.done) / Math.max(1, progress.total)}%` }} /></div>
      <p className="muted small">{translate('voices.progress', { done: progress.done, total: progress.total })}</p>
    </>
  );
}

function Pending({ document, stage, api }: Readonly<{ document: VoicesDocument; stage: Stage; api: GizApi }>) {
  const translate = useTranslate();
  const progress = useProgress(api);
  const running = stage.busy && progress !== null;
  return (
    <section className="card voices-pending" data-testid="voices-pending">
      <p><b>{translate(document.pending > 0 ? 'voices.pending' : 'voices.allDone', { count: document.pending })}</b> · {translate(`voiceProvider.${document.provider}`)} · <span data-testid="voices-cost">{costText(document.dollars, translate)}</span></p>
      {running && <Progress progress={progress} />}
      <div className="dialog-actions">
        {stage.busy && <button type="button" className="chalk-button" data-testid="voices-cancel" onClick={() => void api.voices.cancel()}>{translate('common.cancel')}</button>}
        <button type="button" className="chalk-button primary" data-testid="voices-generate-all" disabled={stage.busy || document.pending === 0} onClick={() => void stage.apply(api.voices.generate(document.folder))}>{translate('voices.generateAll')}</button>
      </div>
    </section>
  );
}

function actionsOf({ api, stage, folder }: Readonly<{ api: GizApi; stage: Stage; folder: string }>, recorder: ReturnType<typeof useRecorder>): LineActions {
  return {
    regenerate: (lineId) => void stage.apply(api.voices.generate(folder, lineId)),
    record: recorder.start,
    save: async (lineId) => {
      const wav = await recorder.stop();
      if (wav) await stage.apply(api.voices.record(folder, lineId, wav));
    },
    discard: recorder.discard,
    unrecord: (lineId) => void stage.apply(api.voices.unrecord(folder, lineId)),
  };
}

/** The Voices stage: every line with its audio and state, made by the project voice or recorded by the person. */
export function VoicesScreen({ api, folder }: Props) {
  const translate = useTranslate();
  const load = useCallback(() => api.voices.read(folder), [api, folder]);
  const stage = useStageDocument(load);
  const recorder = useRecorder();
  const { document, failure } = stage;
  if (!document) return failure ? <main className="board"><FailurePanel failure={failure} /></main> : <p className="hint">{translate('editor.loading')}</p>;
  const actions = actionsOf({ api, stage, folder }, recorder);
  return (
    <main className="board wide stage-screen" data-testid="voices-screen">
      <ScreenHead title={translate('voices.title')} hint={translate('voices.hint')} stages={document.stages} />
      <Pending document={document} stage={stage} api={api} />
      {failure && <FailurePanel failure={failure} />}
      {recorder.failure && <p className="warning-text" role="alert">{translate('voices.micFailed', { reason: recorder.failure })}</p>}
      <ol className="voice-list" data-testid="voice-list">{document.lines.map((line) => <VoiceRow key={line.lineId} line={line} busy={stage.busy} recording={recorder.recording} actions={actions} />)}</ol>
    </main>
  );
}
