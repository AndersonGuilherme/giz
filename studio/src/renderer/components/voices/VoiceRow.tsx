import type { VoiceLine } from '../../../shared/voices.ts';
import { useTranslate } from '../../i18n.ts';

/** What a line's buttons do. */
export type LineActions = Readonly<{
  regenerate: (lineId: string) => void;
  record: (lineId: string) => void;
  save: (lineId: string) => Promise<void>;
  discard: () => void;
  unrecord: (lineId: string) => void;
}>;
type Props = Readonly<{ line: VoiceLine; busy: boolean; recording: string | null; actions: LineActions }>;

function Recording({ line, actions }: Readonly<{ line: VoiceLine; actions: LineActions }>) {
  const translate = useTranslate();
  return (
    <div className="voice-buttons recording" data-testid={`recording-${line.lineId}`}>
      <span className="rec-dot" aria-hidden="true" />{translate('voices.recordingNow')}
      <button type="button" className="chalk-button small primary" data-testid={`voice-stop-${line.lineId}`} onClick={() => void actions.save(line.lineId)}>{translate('voices.stopAndSave')}</button>
      <button type="button" className="chalk-button small quiet" onClick={actions.discard}>{translate('common.cancel')}</button>
    </div>
  );
}

function Buttons({ line, busy, recording, actions }: Props) {
  const translate = useTranslate();
  if (recording === line.lineId) return <Recording line={line} actions={actions} />;
  const idle = !busy && recording === null;
  return (
    <div className="voice-buttons">
      <button type="button" className="chalk-button small" data-testid={`voice-regenerate-${line.lineId}`} disabled={!idle} onClick={() => actions.regenerate(line.lineId)}>{translate(line.audio ? 'voices.regenerate' : 'voices.generate')}</button>
      <button type="button" className="chalk-button small" data-testid={`voice-record-${line.lineId}`} disabled={!idle} onClick={() => actions.record(line.lineId)}>{translate(line.recorded ? 'voices.recordAgain' : 'voices.record')}</button>
      {line.recorded && <button type="button" className="chalk-button small quiet" data-testid={`voice-unrecord-${line.lineId}`} disabled={!idle} onClick={() => actions.unrecord(line.lineId)}>{translate('voices.unrecord')}</button>}
    </div>
  );
}

/** One line: who says it and what, its state, its audio to play, and the buttons to make it or record it. */
export function VoiceRow(props: Props) {
  const translate = useTranslate();
  const { line } = props;
  return (
    <li className={`voice-row state-${line.state}`} data-testid={`voice-${line.lineId}`} data-state={line.state}>
      <span className="voice-number">{line.number}</span>
      <div className="voice-text">
        <p><b>{line.speakerName}</b> {line.text}</p>
        <div className="scene-badges">
          <span className={`badge state-${line.state}`} data-testid={`voice-state-${line.lineId}`}>{translate(`voices.state.${line.state}`)}</span>
          {line.recorded && <span className="badge ok" data-testid={`voice-own-${line.lineId}`}>{translate('voices.ownTake')}</span>}
        </div>
      </div>
      {line.audio ? <audio controls preload="none" src={line.audio} data-testid={`voice-audio-${line.lineId}`} /> : <span className="muted small">{translate('voices.noAudio')}</span>}
      <Buttons {...props} />
    </li>
  );
}
