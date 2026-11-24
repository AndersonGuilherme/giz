import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { Falas } from './Falas.ts';

export class Roteiro {
  readonly #capitulos: readonly string[];
  readonly #falas: Falas;

  private constructor(capitulos: readonly string[], falas: Falas) {
    this.#capitulos = capitulos;
    this.#falas = falas;
  }

  static de(capitulos: readonly string[], falas: Falas): Roteiro {
    if (capitulos.length === 0) throw new ErroDeDominio('o roteiro precisa de pelo menos um capítulo');
    return new Roteiro([...capitulos], falas);
  }

  capitulos(): readonly string[] {
    return this.#capitulos;
  }

  falas(): Falas {
    return this.#falas;
  }
}
