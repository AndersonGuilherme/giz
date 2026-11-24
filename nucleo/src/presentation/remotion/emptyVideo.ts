import type { VideoProps } from '../../domain/timeline/VideoProps.ts';

/** The Video composition without props (in the Studio): a blank 9:16 video with no lines. */
export const EMPTY_VIDEO: VideoProps = {
  fps: 30, width: 1080, height: 1920, language: 'pt-BR', format: 'story', captionStyle: 'words', title: '', chapters: [],
  totalFrames: 0, segments: [], cast: [], soundEffects: [],
};
