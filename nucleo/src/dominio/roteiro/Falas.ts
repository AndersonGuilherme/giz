import type { Elenco } from '../elenco/Elenco.ts';
import type { Fala } from './Fala.ts';

function quemFalaEmTexto(fala: Fala): string {
  const quem = fala.quem();
  return quem.texto();
}

export class Falas {
  readonly #lista: readonly Fala[];

  private constructor(lista: readonly Fala[]) {
    this.#lista = lista;
  }

  static de(lista: readonly Fala[]): Falas {
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
