import { CostEstimate } from './CostEstimate.ts';
import { estimatedTokens, ModelPrice } from './ModelPrice.ts';
import type { TextProviderName } from './TextProviderName.ts';

/** The output limit of a call that names none. */
export const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

type PriceList = Readonly<Record<string, ModelPrice>>;

// Standard prices in US$ per million tokens (input, output), short prompts, checked on 2026-11-27 on each
// provider's model and pricing pages. Thinking tokens are billed as output. A model missing here has an unknown cost.
const TEXT_PRICES: Readonly<Record<TextProviderName, PriceList>> = {
  anthropic: {
    'claude-sonnet-5-5': ModelPrice.perMillion(2, 10),
    'claude-opus-5-5': ModelPrice.perMillion(4, 20),
    'claude-haiku-5-5': ModelPrice.perMillion(0.1, 0.5),
  },
  openai: {
    'gpt-6.2-astra': ModelPrice.perMillion(8, 40),
    'gpt-5.5': ModelPrice.perMillion(5, 30),
    'gpt-5-mini': ModelPrice.perMillion(0.25, 2),
  },
  gemini: {
    // Introductory price until the end of 2026.
    'gemini-3.8-flash': ModelPrice.perMillion(0.75, 3.75),
    'gemini-3.1-flash-lite': ModelPrice.perMillion(0.25, 1.5),
  },
};

export type TextCall = Readonly<{ system: string; prompt: string; maxTokens?: number; stablePrefix?: number }>;

// Writing a prompt cache entry costs more than plain input (Anthropic: 1.25× for the 5-minute entry); a later read
// costs less, but the estimate is an upper bound, so the cached part is counted as a write every time.
const CACHE_WRITE_FACTOR: Readonly<Partial<Record<TextProviderName, number>>> = { anthropic: 1.25 };

function inputTokens(provider: TextProviderName, call: TextCall): number {
  const plain = estimatedTokens(call.system + call.prompt);
  const factor = CACHE_WRITE_FACTOR[provider];
  if (!factor || !call.stablePrefix) return plain;
  return plain + (factor - 1) * estimatedTokens(call.system + call.prompt.slice(0, call.stablePrefix));
}

function priceOf(provider: TextProviderName, model: string): ModelPrice | undefined {
  const prices = TEXT_PRICES[provider];
  return Object.hasOwn(prices, model) ? prices[model] : undefined;
}

/** The most a call can cost: its system and prompt tokens in (a cached prefix as a cache write), and the whole output limit out. */
export function textCostEstimate(provider: TextProviderName, model: string, call: TextCall): CostEstimate {
  const price = priceOf(provider, model);
  if (!price) return CostEstimate.UNKNOWN;
  return price.costOf(inputTokens(provider, call), call.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS);
}
