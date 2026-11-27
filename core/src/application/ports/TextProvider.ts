import type { CostEstimate } from '../../domain/ai/CostEstimate.ts';

/** One call: the instructions (`system`), the request, the output limit and whether the answer must be JSON. */
export type TextRequest = Readonly<{ system: string; prompt: string; maxTokens?: number; json?: boolean }>;
/** The tokens the provider billed (thinking tokens count as output). */
export type TokenUsage = Readonly<{ inputTokens: number; outputTokens: number }>;
export type TextAnswer = Readonly<{ text: string; usage: TokenUsage }>;

/** A text AI (Claude, GPT, Gemini...): the answer to a request and, before calling, what it can cost. */
export interface TextProvider {
  generate(request: TextRequest): Promise<TextAnswer>;
  estimate(request: TextRequest): CostEstimate;
}
