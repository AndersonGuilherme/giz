import type { VideoProps } from '../../domain/timeline/VideoProps.ts';

/** Turns the video props into the video file `output`; `onProgress` receives the done fraction (0 to 1). */
export interface Renderer {
  render(props: VideoProps, output: string, onProgress: (fraction: number) => void): Promise<void>;
}
