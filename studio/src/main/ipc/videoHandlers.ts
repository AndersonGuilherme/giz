import type { RenderService } from '../services/RenderService.ts';
import type { VideoService } from '../services/video/VideoService.ts';
import type { Handlers } from './registry.ts';

type VideoChannel = Extract<keyof Handlers, `video.${string}`>;

/** The render and the Video stage's channels, each to its service call. */
export function videoHandlers(render: RenderService, video: VideoService): Pick<Handlers, VideoChannel> {
  return {
    'video.render': (request) => render.render(request),
    'video.cancel': async ({ folder }) => render.cancel(folder),
    'video.status': async () => render.status(),
    'video.preview': ({ folder, aspect }) => video.preview(folder, aspect),
    'video.openFolder': ({ folder }) => video.openFolder(folder),
    'video.copyCaptions': ({ folder, aspect }) => video.copyCaptions(folder, aspect),
    'video.exportCaptions': ({ folder, aspect }) => video.exportCaptions(folder, aspect),
  };
}
