import type { Aspect } from '../../../shared/contract.ts';

/** The other aspect gets its own files (`9x16` → output/video-9x16.mp4), so the video of the project's aspect stays. */
export const variantOf = (aspect: Aspect, projectAspect: Aspect): string | undefined => (aspect === projectAspect ? undefined : aspect.replace(':', 'x'));

/** Where core's render writes the video and its captions (relative to the project), as RenderVideo names them. */
export function outputOf(variant: string | undefined): Readonly<{ video: string; captions: string }> {
  const suffix = variant === undefined ? '' : `-${variant}`;
  return { video: `output/video${suffix}.mp4`, captions: `output/captions${suffix}.srt` };
}

/** The renders history of a project, newest first, kept with its output. */
export const HISTORY_FILE = 'output/renders.json';
