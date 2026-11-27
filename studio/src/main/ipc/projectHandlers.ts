import type { IdeaService } from '../services/IdeaService.ts';
import type { ProjectService } from '../services/ProjectService.ts';
import type { ProjectsService } from '../services/ProjectsService.ts';
import type { ScriptService } from '../services/ScriptService.ts';
import type { Handlers } from './registry.ts';

type ProjectChannels = 'projects.pick' | 'projects.launched' | 'projects.list' | 'projects.create' | 'projects.duplicate' | 'projects.trash' | 'projects.stages';

// A folder the person opens (the picker, or the command line) joins the home screen's list.
async function remembered(folder: string | null, listing: ProjectsService): Promise<string | null> {
  if (folder !== null) await listing.remember(folder);
  return folder;
}

/** The home screen's channels: open, list, create, copy and trash projects. */
export function projectHandlers(projects: ProjectService, listing: ProjectsService): Pick<Handlers, ProjectChannels> {
  return {
    'projects.pick': async () => remembered(await projects.pick(), listing),
    'projects.launched': async () => remembered(projects.launched(), listing),
    'projects.list': () => listing.list(),
    'projects.create': ({ idea }) => listing.create(idea),
    'projects.duplicate': ({ folder }) => listing.duplicate(folder),
    'projects.trash': ({ folder }) => listing.trash(folder),
    'projects.stages': ({ folder }) => listing.stages(folder),
  };
}

type ScriptChannels =
  | 'ideas.presets' | 'ideas.portraits' | 'script.estimate' | 'script.generate' | 'script.cancel'
  | 'script.read' | 'script.save' | 'script.check' | 'script.vocabulary' | 'script.checkScene';

/** The Idea and Script stages: presets, the text AI and the script editor. */
export function scriptHandlers(ideas: IdeaService, script: ScriptService): Pick<Handlers, ScriptChannels> {
  return {
    'ideas.presets': () => ideas.presets(),
    'ideas.portraits': () => ideas.portraits(),
    'script.estimate': ({ idea }) => ideas.estimate(idea),
    'script.generate': ({ idea }) => ideas.generate(idea),
    'script.cancel': async () => ideas.cancel(),
    'script.read': ({ folder }) => script.read(folder),
    'script.save': ({ folder, script: json }) => script.save(folder, json),
    'script.check': ({ folder }) => script.check(folder),
    'script.vocabulary': () => script.vocabulary(),
    'script.checkScene': ({ scene }) => script.checkScene(scene),
  };
}
