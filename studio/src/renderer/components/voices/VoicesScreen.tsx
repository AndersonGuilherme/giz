import { useCallback, useEffect, useState } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { VoiceProgress, VoicesDocument } from '../../../shared/voices.ts';
import { useTranslate } from '../../i18n.ts';
import { costText, isPaidVoice } from '../../media/money.ts';
import { useRecorder } from '../../media/useRecorder.ts';
import { useStageDocument } from '../../state/useStageDocument.ts';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';
import { ScreenHead } from '../common/ScreenHead.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { VoiceRow, type LineActions } from './VoiceRow.tsx';

type Props = Readonly<{ api: GizApi; folder: string }>;
type Stage = ReturnType<typeof useStageDocument<VoicesDocument>>;

// The job's progress; when it ends the document is read again (a job started before this screen opened ends here too).
function useProgress(api: GizApi, onEnded: () => void): VoiceProgress | null {
  const [progress, setProgress] = useState<VoiceProgress | null>(null);
  useEffect(() => api.voices.onProgress((step) => {
    setProgress(step.ended ? null : step);
    if (step.ended) onEnded();
  }), [api, onEnded]);
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

type PendingProps = Readonly<{ document: VoicesDocument; stage: Stage; api: GizApi; working: boolean; progress: VoiceProgress | null }>;

// A paid voice asks first, with what the pending lines cost; the local voice and a recording start at once.
function PaidConfirm({ open, document, onYes, onNo }: Readonly<{ open: boolean; document: VoicesDocument; onYes: () => void; onNo: () => void }>) {
  const translate = useTranslate();
  if (!open) return null;
  const provider = translate(`voiceProvider.${document.provider}`);
  return (
    <ConfirmDialog title={translate('voices.paidTitle', { provider })} confirm={translate('voices.paidConfirm')} onConfirm={onYes} onCancel={onNo}>
      <p data-testid="voices-paid-cost">{translate('voices.paidBody', { provider, cost: costText(document.dollars, translate) })}</p>
    </ConfirmDialog>
  );
}

function Pending({ document, stage, api, working, progress }: PendingProps) {
  const translate = useTranslate();
  const [asking, setAsking] = useState(false);
  const generate = () => void stage.apply(api.voices.generate(document.folder));
  const onGenerate = () => (isPaidVoice(document.provider) ? setAsking(true) : generate());
  return (
    <section className="card voices-pending" data-testid="voices-pending">
      <p><b>{translate(document.pending > 0 ? 'voices.pending' : 'voices.allDone', { count: document.pending })}</b> · {translate(`voiceProvider.${document.provider}`)} · <span data-testid="voices-cost">{costText(document.dollars, translate)}</span></p>
      {working && progress && <Progress progress={progress} />}
      <div className="dialog-actions">
        {working && <button type="button" className="chalk-button" data-testid="voices-cancel" onClick={() => void api.voices.cancel()}>{translate('common.cancel')}</button>}
        <button type="button" className="chalk-button primary" data-testid="voices-generate-all" disabled={working || document.pending === 0} onClick={onGenerate}>{translate('voices.generateAll')}</button>
      </div>
      <PaidConfirm open={asking} document={document} onYes={() => (setAsking(false), generate())} onNo={() => setAsking(false)} />
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
  const progress = useProgress(api, stage.reload);
  const recorder = useRecorder();
  const { document, failure } = stage;
  if (!document) return failure ? <main className="board"><FailurePanel failure={failure} /></main> : <p className="hint">{translate('editor.loading')}</p>;
  const actions = actionsOf({ api, stage, folder }, recorder);
  const working = stage.busy || document.generating; // a job may run in main from before this screen opened
  return (
    <main className="board wide stage-screen" data-testid="voices-screen">
      <ScreenHead title={translate('voices.title')} hint={translate('voices.hint')} stages={document.stages} />
      <Pending document={document} stage={stage} api={api} working={working} progress={progress} />
      {failure && <FailurePanel failure={failure} />}
      {recorder.failure && <p className="warning-text" role="alert">{translate('voices.micFailed', { reason: recorder.failure })}</p>}
      <ol className="voice-list" data-testid="voice-list">{document.lines.map((line) => <VoiceRow key={line.lineId} line={line} busy={working} recording={recorder.recording} actions={actions} />)}</ol>
    </main>
  );
}
