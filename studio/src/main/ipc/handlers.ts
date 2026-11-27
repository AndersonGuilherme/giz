import type { IdeaService } from '../services/IdeaService.ts';
import type { KeyService } from '../services/KeyService.ts';
import type { ProjectService } from '../services/ProjectService.ts';
import type { ProjectsService } from '../services/ProjectsService.ts';
import type { ScriptService } from '../services/ScriptService.ts';
import type { RenderService } from '../services/RenderService.ts';
import type { SettingsService } from '../services/SettingsService.ts';
import type { SetupService } from '../services/SetupService.ts';
import type { CastService } from '../services/media/CastService.ts';
import type { ScenarioService } from '../services/media/ScenarioService.ts';
import type { VoiceService } from '../services/media/VoiceService.ts';
import type { VideoService } from '../services/video/VideoService.ts';
import type { FolderGrants } from '../services/FolderGrants.ts';
import type { ServedFolders } from '../services/media/ServedFolders.ts';
import { FolderJobs } from '../services/FolderJobs.ts';
import { folderJobsGuard } from './folderJobsGuard.ts';
import { mediaHandlers } from './mediaHandlers.ts';
import { projectHandlers, scriptHandlers } from './projectHandlers.ts';
import { videoHandlers } from './videoHandlers.ts';
import type { Handlers } from './registry.ts';

export type Services = Readonly<{
  projects: ProjectService;
  listing: ProjectsService;
  ideas: IdeaService;
  script: ScriptService;
  video: RenderService;
  videoStage: VideoService;
  keys: KeyService;
  settings: SettingsService;
  setup: SetupService;
  cast: CastService;
  scenarios: ScenarioService;
  voices: VoiceService;
  /** The folders the person gave the Studio: the media scheme serves only files inside them. */
  grants: FolderGrants;
  /** What the media scheme serves: the granted folders and the Studio's own media folders (the voice samples). */
  served: ServedFolders;
}>;

/** The channel map: each channel name to the service call that answers it (a render and a voice or image job never share a folder). */
export function handlersOf(services: Services): Handlers {
  const { projects, listing, ideas, script, video, keys, settings, setup } = services;
  return folderJobsGuard({
    ...mediaHandlers(services),
    ...projectHandlers(projects, listing),
    ...scriptHandlers(ideas, script),
    'projects.open': ({ folder }) => projects.open(folder),
    'projects.check': ({ folder }) => projects.check(folder),
    ...videoHandlers(video, services.videoStage),
    ...keyHandlers(keys),
    ...settingsHandlers(settings),
    'gpu.status': () => setup.gpu(),
    'models.status': () => setup.models(),
    'setup.run': ({ task }) => setup.run(task),
    'setup.stop': async ({ task }) => setup.stop(task),
  }, new FolderJobs(), { voices: () => services.voices.ended() });
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
