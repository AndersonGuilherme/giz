import { CHARACTERS_PER_TOKEN } from '../../../domain/ai/ModelPrice.ts';
import type { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import { grownOutputTokens } from '../../../domain/idea/speechPace.ts';
import type { ProjectVoice } from '../../../domain/project/Project.ts';
import type { ProjectFiles } from '../../ports/ProjectFolder.ts';
import type { RigCatalog } from '../../ports/RigCatalog.ts';
import type { ScriptMaterials } from '../../ports/ScriptMaterials.ts';
import type { TextAnswer, TextProvider, TextRequest, TokenUsage } from '../../ports/TextProvider.ts';
import { draftErrors, type Reviewers } from './draftReview.ts';
import { checkIdeaChoices } from './ideaChoices.ts';
import { rigReference } from './rigReference.ts';
import { draftOf, jsonText, type DraftContext } from './scriptDraft.ts';
import { ScriptGenerationError, shownProblems } from './ScriptGenerationError.ts';
import { repairRequest, scriptRequest } from './scriptPrompt.ts';

/** After the first answer, at most this many rounds send the problems back for a corrected version. */
export const MAX_REPAIRS = 3;
// A new project speaks with the local voice; `giz script` keeps the voice the project already has.
const DEFAULT_VOICE: ProjectVoice = { provider: 'qwen' };

type Dependencies = Reviewers & Readonly<{ text: TextProvider; materials: ScriptMaterials; rigs: RigCatalog }>;
/**
 * `onCall(call, most)` is told before each call to the AI (1 of 4, then 2 of 4 for a repair...); an aborted `signal`
 * stops before the next call and before anything is saved (the answer of a call already made is then thrown away).
 */
export type ScriptTarget = Readonly<{ folder: string; voice?: ProjectVoice; onCall?: (call: number, most: number) => void; signal?: AbortSignal }>;
export type ScriptUsage = Readonly<{ calls: number; inputTokens: number; outputTokens: number }>;
export type ScriptResult = Readonly<{ files: ProjectFiles; repairs: number; usage: ScriptUsage }>;
/** Before calling: the first call, and the most it can cost with every repair round (each resends the answer). */
export type ScriptEstimate = Readonly<{ firstCall: CostEstimate; maximum: CostEstimate }>;

type Prepared = Readonly<{ request: TextRequest; draft: Omit<DraftContext, 'voice'> }>;
type Context = Readonly<{ base: TextRequest; draft: DraftContext; target: ScriptTarget }>;
type Attempt = Readonly<{ request: TextRequest; repairs: number; usage: ScriptUsage }>;
type Review = Readonly<{ files?: ProjectFiles; problems: readonly string[] }>;

const NO_USAGE: ScriptUsage = { calls: 0, inputTokens: 0, outputTokens: 0 };

function added(usage: ScriptUsage, call: TokenUsage): ScriptUsage {
  return { calls: usage.calls + 1, inputTokens: usage.inputTokens + call.inputTokens, outputTokens: usage.outputTokens + call.outputTokens };
}

// The worst repairs: each previous answer as long as its whole limit and cut there, so each limit grows.
function worstRepairs(request: TextRequest): TextRequest[] {
  const repairs: TextRequest[] = [];
  let limit = request.maxTokens ?? 0;
  for (let round = 0; round < MAX_REPAIRS; round++) {
    const grown = grownOutputTokens(limit);
    repairs.push(repairRequest(request, { answer: ' '.repeat(limit * CHARACTERS_PER_TOKEN), maxTokens: grown }, []));
    limit = grown;
  }
  return repairs;
}

// A cut answer is a problem of its own, and the repair gets more room to answer whole.
function afterCut(answer: TextAnswer, limit: number, problems: readonly string[]): Readonly<{ problems: readonly string[]; maxTokens: number }> {
  if (!answer.truncated) return { problems, maxTokens: limit };
  const cut = `a resposta foi cortada no limite de ${limit} tokens de saída: responda com o JSON inteiro, mais enxuto`;
  return { problems: [cut, ...problems], maxTokens: grownOutputTokens(limit) };
}

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
    return { firstCall, maximum: worstRepairs(request).reduce((sum, repair) => sum.plus(text.estimate(repair)), firstCall) };
  }

  /** The valid project is saved into `target.folder`; nothing is written there while the answers are invalid. */
  async run(idea: Idea, target: ScriptTarget): Promise<ScriptResult> {
    const { request, draft } = await this.#prepared(idea);
    const context = { base: request, draft: { ...draft, voice: target.voice ?? DEFAULT_VOICE }, target };
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
    const answer = await this.#called(context.target, attempt);
    const usage = added(attempt.usage, answer.usage);
    const review = await this.#reviewed(answer.text, context.draft);
    if (review.files) return this.#saved(context.target, { files: review.files, repairs: attempt.repairs, usage });
    const { problems, maxTokens } = afterCut(answer, attempt.request.maxTokens ?? 0, review.problems);
    if (attempt.repairs >= MAX_REPAIRS) return this.#failed(context.target.folder, { answer: answer.text, problems, repairs: attempt.repairs });
    const request = repairRequest(context.base, { answer: answer.text, maxTokens }, shownProblems(problems));
    return this.#attempt(context, { request, repairs: attempt.repairs + 1, usage });
  }

  async #called(target: ScriptTarget, attempt: Attempt): Promise<TextAnswer> {
    target.onCall?.(attempt.repairs + 1, MAX_REPAIRS + 1);
    target.signal?.throwIfAborted();
    const answer = await this.#dependencies.text.generate(attempt.request);
    target.signal?.throwIfAborted();
    return answer;
  }

  async #reviewed(text: string, context: DraftContext): Promise<Review> {
    const draft = draftOf(text, context);
    if (!draft.files) return draft;
    const problems = await draftErrors(draft.files, this.#dependencies);
    return problems.length > 0 ? { problems } : draft;
  }

  async #saved(target: ScriptTarget, result: ScriptResult): Promise<ScriptResult> {
    target.signal?.throwIfAborted();
    await this.#dependencies.folder.save(target.folder, result.files);
    return result;
  }

  // The last answer is kept next to the project folder (never inside it) for whoever wants to fix it by hand.
  async #failed(folder: string, last: Readonly<{ answer: string; problems: readonly string[]; repairs: number }>): Promise<never> {
    const draft = await this.#dependencies.folder.keepFailed(folder, { answer: jsonText(last.answer), problems: last.problems });
    throw new ScriptGenerationError(last.repairs, { problems: last.problems, draft });
  }
}
