import type { IdeaFields, Presets, ScriptEstimate, StageBrief } from '../../shared/projects.ts';
import type { SceneProblem, Vocabulary } from '../../shared/script.ts';
import { GenerationFailure, type Generation, type GenerationJob, type ScriptCore, type TextProviderName, type Validation } from '../ports/ScriptCore.ts';
import { translate } from '../text.ts';
import { coreComposition, coreCost, coreEditing, coreGeneration, coreIdea, coreScript, coreStatus } from './coreModules.ts';
import { drawnPortraits } from './portraitsFile.ts';
import { RehearsalTextProvider } from './rehearsal/RehearsalTextProvider.ts';
import { validationOf } from './validation.ts';

type Generator = Awaited<ReturnType<typeof generatorOf>>;

// Only the one key of this call; nothing from the CLI's environment or key files.
const keysWith = (provider: TextProviderName, key: string | undefined) => ({
  get: (service: string) => (service === provider ? key : undefined),
  hint: () => translate('keys.hint'),
});

/** `rehearsal`: a pretend text AI answers (no network, no key), as the rest of rehearsal mode. */
async function generatorOf(idea: IdeaFields, provider: TextProviderName, options: Readonly<{ key?: string; rehearsal: boolean }>) {
  const script = await coreScript();
  if (!options.rehearsal) return script.scriptGenerator(provider, { keys: keysWith(provider, options.key) });
  const text = new RehearsalTextProvider(idea, (await coreCost()).CostEstimate);
  return { generate: script.scriptGeneratorWith(text), model: translate('ideas.rehearsalModel') };
}

const isGenerationError = (error: unknown): error is Error & { problems: readonly string[]; draft: string } =>
  error instanceof Error && error.name === 'ScriptGenerationError';

/** Core's script stage, through core's composition point (loaded on first use, like GizzyCore). */
export class GizzyScriptCore implements ScriptCore {
  readonly #rehearsal: boolean;

  constructor(options: Readonly<{ rehearsal: boolean }>) {
    this.#rehearsal = options.rehearsal;
  }

  async stages(folder: string): Promise<readonly StageBrief[]> {
    const { stages } = await (await coreStatus()).projectStages().run(folder);
    return stages.each().map(({ stage, state, problems, stale, missing, blocked }) => ({ stage, state, problems: problems.length + stale.length + missing.length + blocked.length }));
  }

  async validate(folder: string): Promise<Validation> {
    return validationOf(folder, await coreComposition());
  }

  async start(idea: IdeaFields, folder: string): Promise<void> {
    const { Idea } = await coreIdea();
    await (await coreScript()).startScript().run(Idea.fromJson(idea), { folder });
  }

  async presets(): Promise<Presets> {
    const materials = (await coreScript()).scriptMaterials();
    const [cast, scenes] = await Promise.all([materials.castPresets(), materials.scenePresets()]);
    const backgrounds = [...(await coreEditing()).scriptVocabulary().backgrounds];
    return {
      cast: cast.map(({ id, name, personality, rig }) => ({ id, name, personality, rig: rig ?? null })),
      scenes: scenes.map(({ id, name, description }) => ({ id, name, description })),
      backgrounds,
    };
  }

  async portraits(folder: string) {
    const presets = await (await coreScript()).scriptMaterials().castPresets();
    return drawnPortraits(folder, presets, (await coreComposition()).castPortraits());
  }

  async estimate(idea: IdeaFields, provider: TextProviderName): Promise<ScriptEstimate> {
    const { Idea } = await coreIdea();
    const { generate, model } = await generatorOf(idea, provider, { rehearsal: this.#rehearsal });
    const { firstCall, maximum } = await generate.estimate(Idea.fromJson(idea));
    const repairs = (await coreGeneration()).MAX_REPAIRS;
    return { provider, model, firstCall: firstCall.dollars() ?? null, maximum: maximum.dollars() ?? null, calls: repairs + 1, repairs };
  }

  async generate(idea: IdeaFields, job: GenerationJob): Promise<Generation> {
    const { Idea } = await coreIdea();
    const { generate } = await generatorOf(idea, job.provider, { key: job.key, rehearsal: this.#rehearsal });
    return run(generate, Idea.fromJson(idea), job);
  }

  async vocabulary(): Promise<Vocabulary> {
    return structuredClone((await coreEditing()).scriptVocabulary());
  }

  async checkScene(scene: unknown): Promise<readonly SceneProblem[]> {
    return (await coreEditing()).checkScene(scene).map(({ path, message }) => ({ path, message }));
  }
}

async function run(generate: Generator['generate'], idea: Parameters<Generator['generate']['run']>[0], job: GenerationJob): Promise<Generation> {
  try {
    const { repairs, usage } = await generate.run(idea, { folder: job.folder, onCall: job.onCall, signal: job.signal });
    return { repairs, calls: usage.calls };
  } catch (error) {
    throw isGenerationError(error) ? new GenerationFailure(error.problems, error.draft) : error;
  }
}
