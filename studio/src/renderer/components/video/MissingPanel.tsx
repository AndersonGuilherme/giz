import type { VideoDocument } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import type { WorkStage } from '../project/ProjectScreen.tsx';

type Props = Readonly<{ document: VideoDocument; onStage: (stage: WorkStage) => void }>;
type Want = Readonly<{ key: 'video.missingVoiceLines' | 'video.staleVoiceLines' | 'video.missingImages' | 'video.staleImages' | 'video.blockedImages'; lines: readonly string[]; stage: 'voices' | 'scenarios'; tone: 'error' | 'warning' }>;

const GO_TO = { voices: 'video.goTo.voices', scenarios: 'video.goTo.scenarios' } as const;

function wantsOf({ missing }: VideoDocument): readonly Want[] {
  const all: readonly Want[] = [
    { key: 'video.missingVoiceLines', lines: missing.voices, stage: 'voices', tone: 'error' },
    { key: 'video.staleVoiceLines', lines: missing.staleVoices, stage: 'voices', tone: 'warning' },
    { key: 'video.missingImages', lines: missing.images, stage: 'scenarios', tone: 'warning' },
    { key: 'video.staleImages', lines: missing.staleImages, stage: 'scenarios', tone: 'warning' },
    { key: 'video.blockedImages', lines: missing.blockedImages, stage: 'scenarios', tone: 'warning' },
  ];
  return all.filter(({ lines }) => lines.length > 0);
}

/** What the video still lacks, from core's stages: each with a button to the stage that makes it. */
export function MissingPanel({ document, onStage }: Props) {
  const translate = useTranslate();
  const wants = wantsOf(document);
  const numbers = new Map(document.lines.map(({ lineId, number }) => [lineId, number]));
  const listed = (lines: readonly string[]) => lines.map((lineId) => numbers.get(lineId) ?? lineId).join(', ');
  return (
    <section className="card missing-panel" data-testid="video-missing">
      <h2>{translate('video.missingTitle')}</h2>
      {wants.length === 0 && <p className="ok">{translate('video.nothingMissing')}</p>}
      <ul className="wants">
        {wants.map((want) => (
          <li key={want.key} className={want.tone} data-want={want.key}>
            <span>{translate(want.key, { count: want.lines.length, lines: listed(want.lines) })}</span>
            <button type="button" className="chalk-button small" data-testid={`go-${want.stage}`} onClick={() => onStage(want.stage)}>{translate(GO_TO[want.stage])}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
