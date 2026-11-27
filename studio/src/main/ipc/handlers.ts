import type { IdeaService } from '../services/IdeaService.ts';
import type { KeyService } from '../services/KeyService.ts';
import type { ProjectService } from '../services/ProjectService.ts';
import type { ProjectsService } from '../services/ProjectsService.ts';
import type { ScriptService } from '../services/ScriptService.ts';
import type { RenderService } from '../services/RenderService.ts';
import type { SettingsService } from '../services/SettingsService.ts';
import type { SetupService } from '../services/SetupService.ts';
import { projectHandlers, scriptHandlers } from './projectHandlers.ts';
import type { Handlers } from './registry.ts';

export type Services = Readonly<{
  projects: ProjectService;
  listing: ProjectsService;
  ideas: IdeaService;
  script: ScriptService;
  video: RenderService;
  keys: KeyService;
  settings: SettingsService;
  setup: SetupService;
}>;

/** The channel map: each channel name to the service call that answers it. */
export function handlersOf({ projects, listing, ideas, script, video, keys, settings, setup }: Services): Handlers {
  return {
    ...projectHandlers(projects, listing),
    ...scriptHandlers(ideas, script),
    'projects.open': ({ folder }) => projects.open(folder),
    'projects.check': ({ folder }) => projects.check(folder),
    'video.render': (request) => video.render(request),
    'video.cancel': async () => video.cancel(),
    ...keyHandlers(keys),
    ...settingsHandlers(settings),
    'gpu.status': () => setup.gpu(),
    'models.status': () => setup.models(),
    'setup.run': ({ task }) => setup.run(task),
    'setup.stop': async ({ task }) => setup.stop(task),
  };
}

function keyHandlers(keys: KeyService): Pick<Handlers, 'keys.set' | 'keys.has' | 'keys.remove' | 'keys.status' | 'keys.test'> {
  return {
    'keys.set': ({ provider, key }) => keys.set(provider, key),
    'keys.has': ({ provider }) => keys.has(provider),
    'keys.remove': ({ provider }) => keys.remove(provider),
    'keys.status': () => keys.status(),
    'keys.test': ({ provider }) => keys.test(provider),
  };
}

type SettingsChannels = 'settings.get' | 'settings.update' | 'settings.projectsFolder' | 'settings.modelsFolder' | 'settings.finish';

function settingsHandlers(settings: SettingsService): Pick<Handlers, SettingsChannels> {
  return {
    'settings.get': () => settings.get(),
    'settings.update': (patch) => settings.update(patch),
    'settings.projectsFolder': ({ source }) => settings.projectsFolder(source),
    'settings.modelsFolder': ({ source }) => settings.modelsFolder(source),
    'settings.finish': () => settings.finish(),
  };
}
