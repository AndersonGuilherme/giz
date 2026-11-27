import type { CostEstimate } from '../../domain/ai/CostEstimate.ts';

/**
 * One call: the instructions (`system`), the request, the output limit and whether the answer must be JSON.
 * `stablePrefix`: how many leading characters of `prompt` repeat across calls (a repair resends the first prompt);
 * a provider that caches prompts may cache the system and that prefix.
 */
export type TextRequest = Readonly<{ system: string; prompt: string; maxTokens?: number; json?: boolean; stablePrefix?: number }>;
/** The tokens the provider billed (thinking tokens count as output). */
export type TokenUsage = Readonly<{ inputTokens: number; outputTokens: number }>;
/** `truncated`: the answer stopped at the output limit (it may be cut in the middle). */
export type TextAnswer = Readonly<{ text: string; usage: TokenUsage; truncated?: boolean }>;

/** A text AI (Claude, GPT, Gemini...): the answer to a request and, before calling, what it can cost. */
export interface TextProvider {
  generate(request: TextRequest): Promise<TextAnswer>;
  estimate(request: TextRequest): CostEstimate;
}
