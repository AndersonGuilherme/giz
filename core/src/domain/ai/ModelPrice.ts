import { DomainError } from '../DomainError.ts';
import { CostEstimate } from './CostEstimate.ts';

const TOKENS_PER_MILLION = 1_000_000;
/** The usual rule of thumb of the providers for text: about 4 characters per token. */
export const CHARACTERS_PER_TOKEN = 4;

/** How many tokens a text is expected to take (rounded up), before the provider counts them. */
export function estimatedTokens(text: string): number {
  return Math.ceil(text.length / CHARACTERS_PER_TOKEN);
}

function checkedPrice(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars < 0) throw new DomainError(`preço ${dollars} inválido (use dólares por milhão de tokens, maior ou igual a 0)`);
  return dollars;
}

/** The price list of one model: dollars per million input tokens and per million output tokens. */
export class ModelPrice {
  readonly #inputPerMillion: number;
  readonly #outputPerMillion: number;

  private constructor(inputPerMillion: number, outputPerMillion: number) {
    this.#inputPerMillion = inputPerMillion;
    this.#outputPerMillion = outputPerMillion;
  }

  static perMillion(input: number, output: number): ModelPrice {
    return new ModelPrice(checkedPrice(input), checkedPrice(output));
  }

  costOf(inputTokens: number, outputTokens: number): CostEstimate {
    const dollars = (inputTokens * this.#inputPerMillion + outputTokens * this.#outputPerMillion) / TOKENS_PER_MILLION;
    return CostEstimate.ofDollars(dollars);
  }
}
