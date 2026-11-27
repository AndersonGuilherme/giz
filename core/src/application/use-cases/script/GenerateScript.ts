import { CHARACTERS_PER_TOKEN } from '../../../domain/ai/ModelPrice.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import type { ProjectVoice } from '../../../domain/project/Project.ts';
import type { ProjectFiles } from '../../ports/ProjectFolder.ts';
import type { RigCatalog } from '../../ports/RigCatalog.ts';
import type { ScriptMaterials } from '../../ports/ScriptMaterials.ts';
import type { TextProvider, TextRequest, TokenUsage } from '../../ports/TextProvider.ts';
import { draftErrors, type Reviewers } from './draftReview.ts';
import { checkIdeaChoices } from './ideaChoices.ts';
import { rigReference } from './rigReference.ts';
import { draftOf, type DraftContext } from './scriptDraft.ts';
import { ScriptGenerationError, shownProblems } from './ScriptGenerationError.ts';
import { repairRequest, scriptRequest } from './scriptPrompt.ts';

/** After the first answer, at most this many rounds send the problems back for a corrected version. */
export const MAX_REPAIRS = 3;
// A new project speaks with the local voice; `giz script` keeps the voice the project already has.
const DEFAULT_VOICE: ProjectVoice = { provider: 'qwen' };

type Dependencies = Reviewers & Readonly<{ text: TextProvider; materials: ScriptMaterials; rigs: RigCatalog }>;
export type ScriptTarget = Readonly<{ folder: string; voice?: ProjectVoice }>;
export type ScriptUsage = Readonly<{ calls: number; inputTokens: number; outputTokens: number }>;
export type ScriptResult = Readonly<{ files: ProjectFiles; repairs: number; usage: ScriptUsage }>;
/** Before calling: the first call, and the most it can cost with every repair round (each resends the answer). */
export type ScriptEstimate = Readonly<{ firstCall: CostEstimate; maximum: CostEstimate }>;

type Prepared = Readonly<{ request: TextRequest; draft: Omit<DraftContext, 'voice'> }>;
type Context = Readonly<{ base: TextRequest; draft: DraftContext; folder: string }>;
type Attempt = Readonly<{ request: TextRequest; repairs: number; usage: ScriptUsage }>;

const NO_USAGE: ScriptUsage = { calls: 0, inputTokens: 0, outputTokens: 0 };

function added(usage: ScriptUsage, call: TokenUsage): ScriptUsage {
  return { calls: usage.calls + 1, inputTokens: usage.inputTokens + call.inputTokens, outputTokens: usage.outputTokens + call.outputTokens };
}

// The longest previous answer a repair can resend: the whole output limit.
const longestAnswer = (request: TextRequest) => ' '.repeat((request.maxTokens ?? 0) * CHARACTERS_PER_TOKEN);

/** Writes a project from an idea with a text AI: prompt, validation as `giz check` does, and up to 3 repairs. */
export class GenerateScript {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async estimate(idea: Idea): Promise<ScriptEstimate> {
    const { text } = this.#dependencies;
    const { request } = await this.#prepared(idea);
    const firstCall = text.estimate(request);
    const repair = text.estimate(repairRequest(request, longestAnswer(request), []));
    return { firstCall, maximum: Array.from({ length: MAX_REPAIRS }, () => repair).reduce((sum, cost) => sum.plus(cost), firstCall) };
  }

  /** The valid project is saved into `target.folder`; nothing is written there while the answers are invalid. */
  async run(idea: Idea, target: ScriptTarget): Promise<ScriptResult> {
    const { request, draft } = await this.#prepared(idea);
    const context = { base: request, draft: { ...draft, voice: target.voice ?? DEFAULT_VOICE }, folder: target.folder };
    return this.#attempt(context, { request, repairs: 0, usage: NO_USAGE });
  }

  async #prepared(idea: Idea): Promise<Prepared> {
    const { materials, rigs } = this.#dependencies;
    const [guide, castPresets, scenePresets] = await Promise.all([materials.guide(idea.format(), idea.language()), materials.castPresets(), materials.scenePresets()]);
    checkIdeaChoices(idea, { cast: castPresets, scenes: scenePresets });
    const sources = { guide, reference: materials.answerReference(), castPresets, scenePresets, rigs: rigReference(rigs), voices: materials.voices() };
    return { request: scriptRequest(idea, sources), draft: { idea, presets: castPresets } };
  }

  async #attempt(context: Context, attempt: Attempt): Promise<ScriptResult> {
    const answer = await this.#dependencies.text.generate(attempt.request);
    const usage = added(attempt.usage, answer.usage);
    const { files, problems } = await this.#reviewed(answer.text, context.draft);
    if (files) return this.#saved(context.folder, { files, repairs: attempt.repairs, usage });
    if (attempt.repairs >= MAX_REPAIRS) throw new ScriptGenerationError(attempt.repairs, problems);
    const request = repairRequest(context.base, answer.text, shownProblems(problems));
    return this.#attempt(context, { request, repairs: attempt.repairs + 1, usage });
  }

  async #reviewed(text: string, context: DraftContext): Promise<Readonly<{ files?: ProjectFiles; problems: readonly string[] }>> {
    const draft = draftOf(text, context);
    if (!draft.files) return draft;
    const problems = await draftErrors(draft.files, this.#dependencies);
    return problems.length > 0 ? { problems } : draft;
  }

  async #saved(folder: string, result: ScriptResult): Promise<ScriptResult> {
    await this.#dependencies.folder.save(folder, result.files);
    return result;
  }
}
