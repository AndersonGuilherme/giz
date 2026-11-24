import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { Fala } from './Fala.ts';
import type { Falas } from './Falas.ts';

function recusarCapituloInexistente(fala: Fala, total: number): void {
  const capitulo = fala.capitulo();
  if (capitulo.existeEm(total)) return;
  throw new ErroDeDominio(`fala ${fala.id()}: capítulo ${capitulo.numero()} não existe (há ${total})`);
}

export class Roteiro {
  readonly #capitulos: readonly string[];
  readonly #falas: Falas;

  private constructor(capitulos: readonly string[], falas: Falas) {
    this.#capitulos = capitulos;
    this.#falas = falas;
  }

  static de(capitulos: readonly string[], falas: Falas): Roteiro {
    if (capitulos.length === 0) throw new ErroDeDominio('o roteiro precisa de pelo menos um capítulo');
    falas.cadaUma().forEach((fala) => recusarCapituloInexistente(fala, capitulos.length));
    return new Roteiro([...capitulos], falas);
  }

  capitulos(): readonly string[] {
    return this.#capitulos;
  }

  falas(): Falas {
    return this.#falas;
  }
}
