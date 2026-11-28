import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { VideoPreview, videoMarks, type VideoMarks, type VideoPreviewProps } from 'gizzycera-core/src/presentation/studio/index.ts';
import type { VideoLine, VideoMontage } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { clockText, markAt } from '../../video/playhead.ts';
import { MarksList } from './MarksList.tsx';

type Props = Readonly<{ montage: VideoMontage; lines: readonly VideoLine[] }>;

// The frame and the play state of the Player, followed through its own events.
function usePlayhead(player: React.RefObject<PlayerRef | null>, initial: number) {
  const [frame, setFrame] = useState(initial);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const current = player.current;
    if (!current) return undefined;
    const onFrame = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame);
    const [onPlay, onPause] = [() => setPlaying(true), () => setPlaying(false)];
    current.addEventListener('frameupdate', onFrame);
    current.addEventListener('play', onPlay);
    current.addEventListener('pause', onPause);
    return () => {
      current.removeEventListener('frameupdate', onFrame);
      current.removeEventListener('play', onPlay);
      current.removeEventListener('pause', onPause);
    };
  }, [player]);
  return { frame, playing };
}

function Controls({ player, frame, playing, length, fps }: Readonly<{ player: React.RefObject<PlayerRef | null>; frame: number; playing: boolean; length: number; fps: number }>) {
  const translate = useTranslate();
  return (
    <div className="player-controls">
      <button type="button" className="chalk-button small primary play-button" data-testid="video-play" aria-label={translate(playing ? 'video.pause' : 'video.play')} onClick={(event) => player.current?.toggle(event)}>{playing ? '❚❚' : '▶'}</button>
      <input type="range" className="seek" data-testid="video-seek" aria-label={translate('video.seek')} min={0} max={length - 1} value={frame} onChange={(event) => player.current?.seekTo(Number(event.target.value))} />
      <span className="clock" data-testid="video-clock">{clockText(frame, fps)} / {clockText(length, fps)}</span>
    </div>
  );
}

// It opens a second into the first line: the lead-in's first frames are still empty (the scene pops in).
const openingOf = (marks: VideoMarks, fps: number) => Math.min((marks.lines[0]?.frame ?? 0) + fps, marks.durationInFrames - 1);

/** The whole video in a Remotion Player (the same composition the render draws), its controls and its marks. */
export function PreviewPlayer({ montage, lines }: Props) {
  const player = useRef<PlayerRef>(null);
  const inputProps = useMemo(() => ({ video: montage.video, files: montage.files }) as VideoPreviewProps, [montage]);
  const marks = useMemo(() => videoMarks(inputProps.video), [inputProps]);
  const { width, height, fps } = inputProps.video;
  const opening = openingOf(marks, fps);
  const { frame, playing } = usePlayhead(player, opening);
  const current = markAt(marks.lines, frame);
  const tall = height > width;
  const seek = (to: number) => player.current?.seekTo(to);
  return (
    <section className="card preview-card" data-testid="video-preview">
      <div className={`video-frame ${tall ? 'tall' : 'wide'}`} data-current-line={current?.lineId ?? ''}>
        <Player ref={player} component={VideoPreview} inputProps={inputProps} durationInFrames={marks.durationInFrames} compositionWidth={width} compositionHeight={height} fps={fps} initialFrame={opening} acknowledgeRemotionLicense clickToPlay style={{ width: '100%', height: '100%' }} />
      </div>
      <Controls player={player} frame={frame} playing={playing} length={marks.durationInFrames} fps={fps} />
      <MarksList marks={marks} lines={lines} current={current?.lineId} fps={fps} onSeek={seek} />
    </section>
  );
}
