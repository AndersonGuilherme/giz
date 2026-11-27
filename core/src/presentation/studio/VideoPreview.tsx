import { useMemo, type FC } from 'react';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { MediaSource } from '../remotion/mediaSource.ts';
import { Video } from '../remotion/Video.tsx';
import { mediaSourceOf } from './videoMarks.ts';

/** `video`: core's BuildTimeline props; `files`: the URL of each file the video asks for, by its path in the project. */
export type VideoPreviewProps = Readonly<{ video: VideoProps; files: Readonly<Record<string, string>> }>;

/** The whole video in the Studio window (a Remotion Player plays it): the same composition the render draws. */
export const VideoPreview: FC<VideoPreviewProps> = ({ video, files }) => {
  const source = useMemo(() => mediaSourceOf(files), [files]);
  return (
    <MediaSource.Provider value={source}>
      <Video {...video} />
    </MediaSource.Provider>
  );
};
