import { ErroDeDominio } from '../ErroDeDominio.ts';

/** Posição (a partir de 1) da fala na lista de capítulos do roteiro. */
export class Capitulo {
  readonly #numero: number;

  private constructor(numero: number) {
    this.#numero = numero;
  }

  static de(numero: number): Capitulo {
    if (!Number.isInteger(numero) || numero < 1) {
      throw new ErroDeDominio(`capítulo ${numero} inválido (use um inteiro a partir de 1)`);
    }
    return new Capitulo(numero);
  }

  existeEm(total: number): boolean {
    return this.#numero <= total;
  }

  numero(): number {
    return this.#numero;
  }
}
