import type { KeyService } from '../services/KeyService.ts';
import type { ProjectService } from '../services/ProjectService.ts';
import type { RenderService } from '../services/RenderService.ts';
import type { Handlers } from './registry.ts';

export type Services = Readonly<{ projects: ProjectService; video: RenderService; keys: KeyService }>;

/** The channel map: each channel name to the service call that answers it. */
export function handlersOf({ projects, video, keys }: Services): Handlers {
  return {
    'projects.pick': () => projects.pick(),
    'projects.launched': async () => projects.launched(),
    'projects.open': ({ folder }) => projects.open(folder),
    'projects.check': ({ folder }) => projects.check(folder),
    'video.render': (request) => video.render(request),
    'video.cancel': async () => video.cancel(),
    'keys.set': ({ provider, key }) => keys.set(provider, key),
    'keys.has': ({ provider }) => keys.has(provider),
    'keys.remove': ({ provider }) => keys.remove(provider),
  };
}
