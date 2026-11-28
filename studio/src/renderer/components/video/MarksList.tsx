import type { VideoMarks } from 'gizzycera-core/src/presentation/studio/index.ts';
import type { VideoLine } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { clockText } from '../../video/playhead.ts';

type Props = Readonly<{ marks: VideoMarks; lines: readonly VideoLine[]; current: string | undefined; fps: number; onSeek: (frame: number) => void }>;

type MarkProps = Readonly<{ mark: VideoMarks['lines'][number]; line: VideoLine | undefined; on: boolean; fps: number; onSeek: (frame: number) => void }>;

function LineMark({ mark, line, on, fps, onSeek }: MarkProps) {
  return (
    <li>
      <button type="button" className={on ? 'mark-line on' : 'mark-line'} data-line={mark.lineId} onClick={() => onSeek(mark.frame)}>
        <span className="mark-time">{clockText(mark.frame, fps)}</span>
        <b>{line?.number ?? '?'}</b> <span className="mark-speaker">{line?.speakerName}</span> <span className="mark-text">{line?.text}</span>
      </button>
    </li>
  );
}

/** The chapters and the lines of the video: each one a jump to where it starts; the line playing is marked. */
export function MarksList({ marks, lines, current, fps, onSeek }: Props) {
  const translate = useTranslate();
  const lineOf = new Map(lines.map((line) => [line.lineId, line]));
  return (
    <div className="video-marks">
      <div className="chips small-chips" data-testid="video-chapters" aria-label={translate('video.chapters')}>
        {marks.chapters.map((chapter) => <button key={chapter.number} type="button" className="chip-button" data-chapter={chapter.number} onClick={() => onSeek(chapter.frame)}>{chapter.number}. {chapter.title}</button>)}
      </div>
      <ol className="mark-lines" data-testid="video-lines">
        {marks.lines.map((mark) => <LineMark key={mark.lineId} mark={mark} line={lineOf.get(mark.lineId)} on={mark.lineId === current} fps={fps} onSeek={onSeek} />)}
      </ol>
    </div>
  );
}
