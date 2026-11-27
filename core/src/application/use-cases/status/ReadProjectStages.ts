import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { ProjectStages, type MadeFacts } from '../../../domain/stages/ProjectStages.ts';
import { ProjectError, problemLine } from '../../ports/ProjectError.ts';
import type { ProjectRepository } from '../../ports/ProjectRepository.ts';
import type { ProjectStateReader } from '../../ports/ProjectStateReader.ts';
import type { CheckReport, Problem } from '../CheckProject.ts';
import { imageItems, voiceItems, type StatusTools } from './stageItems.ts';

type Checker = Readonly<{ run(project: Project): CheckReport }>;
/** `tools` gives the adapters of a loaded project (its voice and image providers are chosen by the project). */
export type StatusDependencies = Readonly<{
  repository: ProjectRepository;
  check: Checker;
  reader: ProjectStateReader;
  tools: (folder: string, project: Project) => StatusTools;
}>;

/** What each pending image and voice costs; undefined when the project does not load (then nothing is known). */
export type PendingItemCosts = Readonly<{ images: readonly CostEstimate[]; voices: readonly CostEstimate[] }>;
export type ProjectStatus = Readonly<{ stages: ProjectStages; project?: Project; pending?: PendingItemCosts }>;

type Loaded = Readonly<{ project?: Project; problems: readonly string[] }>;

const checkLine = ({ line, message }: Problem): string => (line ? `fala ${line}: ${message}` : message);

// Only a ProjectError is a script that does not pass; any other failure (a disk error) is not hidden as a stage.
function projectProblems(error: unknown): string[] {
  if (!(error instanceof ProjectError)) throw error;
  return error.problems.map(problemLine);
}

/** The stages of a project folder: what is made, what is out of date (item by item) and what each pending item costs. */
export class ReadProjectStages {
  readonly #dependencies: StatusDependencies;

  constructor(dependencies: StatusDependencies) {
    this.#dependencies = dependencies;
  }

  async run(folder: string): Promise<ProjectStatus> {
    const { reader } = this.#dependencies;
    const [idea, present] = await Promise.all([reader.hasIdea(folder), reader.hasScript(folder)]);
    const { project, problems } = present ? await this.#load(folder) : { problems: [] };
    const script = { present, problems };
    if (!project) return { stages: ProjectStages.from({ idea, script }) };
    const { made, pending } = await this.#made(folder, project);
    return { stages: ProjectStages.from({ idea, script, made }), project, pending };
  }

  // A project that does not load has its problems listed; one that loads is checked (its errors make the script stale).
  async #load(folder: string): Promise<Loaded> {
    const { repository, check } = this.#dependencies;
    try {
      const project = await repository.load(folder);
      return { project, problems: check.run(project).errors.map(checkLine) };
    } catch (error) {
      return { problems: projectProblems(error) };
    }
  }

  async #made(folder: string, project: Project): Promise<Readonly<{ made: MadeFacts; pending: PendingItemCosts }>> {
    const { reader, tools } = this.#dependencies;
    const adapters = tools(folder, project);
    const [voices, scenarios, video] = await Promise.all([voiceItems(project, adapters), imageItems(project, adapters), reader.video(folder)]);
    const made = { voices: voices.items, scenarios: scenarios.items, video };
    return { made, pending: { images: scenarios.costs, voices: voices.costs } };
  }
}
