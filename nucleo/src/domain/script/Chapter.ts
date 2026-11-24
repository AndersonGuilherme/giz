import { DomainError } from '../DomainError.ts';

/** Position (from 1) of the line in the script chapter list. */
export class Chapter {
  readonly #number: number;

  private constructor(number: number) {
    this.#number = number;
  }

  static of(number: number): Chapter {
    if (!Number.isInteger(number) || number < 1) {
      throw new DomainError(`capítulo ${number} inválido (use um inteiro a partir de 1)`);
    }
    return new Chapter(number);
  }

  existsIn(total: number): boolean {
    return this.#number <= total;
  }

  number(): number {
    return this.#number;
  }
}
