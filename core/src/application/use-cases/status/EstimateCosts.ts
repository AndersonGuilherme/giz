import { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import { Idea } from '../../../domain/idea/Idea.ts';
import type { StageState } from '../../../domain/stages/StageState.ts';
import { pendingCosts, type PendingCosts, type TextCost } from '../../../domain/stages/PendingCosts.ts';
import type { ProjectFolder } from '../../ports/ProjectFolder.ts';
import type { ScriptEstimate } from '../script/GenerateScript.ts';
import type { ProjectStatus } from './ReadProjectStages.ts';

type ScriptEstimator = Readonly<{ estimate(idea: Idea): Promise<ScriptEstimate> }>;
export type CostDependencies = Readonly<{ folder: Pick<ProjectFolder, 'readIdea'>; script: ScriptEstimator }>;
/** `regenerateScript`: count the script generation even when the folder already has a script. */
export type CostOptions = Readonly<{ regenerateScript?: boolean }>;

const WRITTEN: ReadonlySet<StageState> = new Set(['done', 'stale']);
// The script is generated when there is none yet (empty or ready) or when asked to be generated again.
const textPending = (status: ProjectStatus, options: CostOptions): boolean => options.regenerateScript === true || !WRITTEN.has(status.stages.of('script').state);

const errorText = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** What the pending paid steps of a project cost: the script (text AI), the images and the paid voices. */
export class EstimateCosts {
  readonly #dependencies: CostDependencies;

  constructor(dependencies: CostDependencies) {
    this.#dependencies = dependencies;
  }

  async run(folder: string, status: ProjectStatus, options: CostOptions = {}): Promise<PendingCosts> {
    const text = textPending(status, options) ? await this.#text(folder) : undefined;
    const { pending } = status;
    return pendingCosts({ text, images: pending?.images, voices: pending?.voices });
  }

  // The most the generation can cost (the first call and every repair); without a valid idea.json it is unknown.
  async #text(folder: string): Promise<TextCost> {
    const { folder: projectFolder, script } = this.#dependencies;
    try {
      const idea = Idea.fromJson(await projectFolder.readIdea(folder));
      const { maximum } = await script.estimate(idea);
      return { cost: maximum };
    } catch (error) {
      return { cost: CostEstimate.UNKNOWN, problem: errorText(error) };
    }
  }
}
