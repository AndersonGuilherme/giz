import type { FC } from 'react';
import { Html5Audio, Sequence, staticFile } from 'remotion';
import type { SoundCue } from '../../domain/video/SoundTrack.ts';

/** Plays each sound (a line voice or an effect) from its frame; the files are in the render's public folder. */
export const Sounds: FC<Readonly<{ cues: readonly SoundCue[] }>> = ({ cues }) => (
  <>
    {cues.map((cue, index) => (
      <Sequence key={`${index}-${cue.file}`} from={cue.from} durationInFrames={cue.duration} layout="none">
        <Html5Audio src={staticFile(cue.file)} volume={cue.volume} />
      </Sequence>
    ))}
  </>
);
