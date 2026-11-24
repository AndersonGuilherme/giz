import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { Elenco } from '../elenco/Elenco.ts';
import type { Fala } from './Fala.ts';

function quemFalaEmTexto(fala: Fala): string {
  const quem = fala.quem();
  return quem.texto();
}

function recusarIdsRepetidos(lista: readonly Fala[]): void {
  const ids = lista.map((fala) => fala.id());
  const repetido = ids.find((id, indice) => ids.indexOf(id) !== indice);
  if (repetido !== undefined) throw new ErroDeDominio(`id "${repetido}" repetido entre as falas`);
}

export class Falas {
  readonly #lista: readonly Fala[];

  private constructor(lista: readonly Fala[]) {
    this.#lista = lista;
  }

  static de(lista: readonly Fala[]): Falas {
    recusarIdsRepetidos(lista);
    return new Falas([...lista]);
  }

  cadaUma(): readonly Fala[] {
    return this.#lista;
  }

  quantidade(): number {
    return this.#lista.length;
  }

  idsDesconhecidos(elenco: Elenco): string[] {
    const foraDoElenco = this.#lista.filter((fala) => !elenco.contem(fala.quem()));
    const ids = foraDoElenco.map(quemFalaEmTexto);
    return [...new Set(ids)];
  }
}
