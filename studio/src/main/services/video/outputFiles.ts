import type { Aspect } from '../../../shared/contract.ts';

/** The other aspect gets its own files (`9x16` → output/video-9x16.mp4, as core names them), so the video of the project's aspect stays. */
export const variantOf = (aspect: Aspect, projectAspect: Aspect): string | undefined => (aspect === projectAspect ? undefined : aspect.replace(':', 'x'));

/** The renders history of a project, newest first, kept with its output. */
export const HISTORY_FILE = 'output/renders.json';
