import { DomainError } from '../DomainError.ts';

/** What a paid call costs, in US dollars (the currency of every provider's price list); it may be unknown. */
export class CostEstimate {
  static readonly ZERO = new CostEstimate(0);
  static readonly UNKNOWN = new CostEstimate(undefined);

  readonly #dollars: number | undefined;

  private constructor(dollars: number | undefined) {
    this.#dollars = dollars;
  }

  static ofDollars(dollars: number): CostEstimate {
    if (!Number.isFinite(dollars) || dollars < 0) throw new DomainError(`custo ${dollars} inválido (use um número de dólares maior ou igual a 0)`);
    return new CostEstimate(dollars);
  }

  /** The sum; unknown when either part is unknown (a total must never look cheaper than it is). */
  plus(other: CostEstimate): CostEstimate {
    if (this.#dollars === undefined || other.#dollars === undefined) return CostEstimate.UNKNOWN;
    return new CostEstimate(this.#dollars + other.#dollars);
  }

  isKnown(): boolean {
    return this.#dollars !== undefined;
  }

  /** The dollars, or undefined when the price is unknown. */
  dollars(): number | undefined {
    return this.#dollars;
  }
}
