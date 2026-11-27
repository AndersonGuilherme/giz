import type { FC } from 'react';
import { Html5Audio, Sequence } from 'remotion';
import type { SoundCue } from '../../domain/video/SoundTrack.ts';
import { useMediaSource } from './mediaSource.ts';

/** Plays each sound (a line voice or an effect) from its frame; the files are in the render's public folder (see MediaSource). */
export const Sounds: FC<Readonly<{ cues: readonly SoundCue[] }>> = ({ cues }) => {
  const source = useMediaSource();
  return (
    <>
      {cues.map((cue, index) => (
        <Sequence key={`${index}-${cue.file}`} from={cue.from} durationInFrames={cue.duration} layout="none">
          <Html5Audio src={source(cue.file)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
};
