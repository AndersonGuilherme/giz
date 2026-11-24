import type { VideoProps } from '../../domain/timeline/VideoProps.ts';

/** Saves the captions file of the video (`.srt`) in `file`, creating its folder. */
export interface CaptionWriter {
  write(props: VideoProps, file: string): Promise<void>;
}
