import { DomainError } from '../../../domain/DomainError.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import type { ProjectVoice } from '../../../domain/project/Project.ts';
import type { ProjectFiles, ProjectFolder } from '../../ports/ProjectFolder.ts';
import type { ScriptMaterials } from '../../ports/ScriptMaterials.ts';
import { checkIdeaChoices } from './ideaChoices.ts';
import { draftOf } from './scriptDraft.ts';
import { starterAnswer } from './starterAnswer.ts';

type Dependencies = Readonly<{ materials: ScriptMaterials; folder: ProjectFolder }>;
export type StarterTarget = Readonly<{ folder: string; voice?: ProjectVoice }>;

const DEFAULT_VOICE: ProjectVoice = { provider: 'qwen' };

/** A project to write by hand: from an idea, its cast copied as the AI's would be, and a first line to replace. */
export class StartScript {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async run(idea: Idea, target: StarterTarget): Promise<ProjectFiles> {
    const { materials, folder } = this.#dependencies;
    const [cast, scenes] = await Promise.all([materials.castPresets(), materials.scenePresets()]);
    checkIdeaChoices(idea, { cast, scenes });
    const draft = draftOf(JSON.stringify(starterAnswer(idea, { cast, scenes })), { idea, presets: cast, voice: target.voice ?? DEFAULT_VOICE });
    if (!draft.files) throw new DomainError(draft.problems.join('\n'));
    await folder.save(target.folder, draft.files);
    return draft.files;
  }
}
