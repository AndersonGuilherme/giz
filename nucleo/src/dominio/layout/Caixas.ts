import type { Caixa } from './Caixa.ts';

function paresDe(lista: readonly Caixa[]): Array<[Caixa, Caixa]> {
  return lista.flatMap((primeira, indice) => lista.slice(indice + 1).map((segunda): [Caixa, Caixa] => [primeira, segunda]));
}

/** As caixas que uma cena ocupa num quadro. */
export class Caixas {
  readonly #lista: readonly Caixa[];

  private constructor(lista: readonly Caixa[]) {
    this.#lista = lista;
  }

  static de(lista: readonly Caixa[]): Caixas {
    return new Caixas([...lista]);
  }

  static vazias(): Caixas {
    return new Caixas([]);
  }

  com(caixa: Caixa): Caixas {
    return new Caixas([...this.#lista, caixa]);
  }

  sobreposicoes(): Array<[Caixa, Caixa]> {
    return paresDe(this.#lista).filter(([primeira, segunda]) => primeira.sobrepoe(segunda));
  }

  foraDe(area: Caixa): Caixa[] {
    return this.#lista.filter((caixa) => !caixa.dentroDe(area));
  }

  textosQueNaoCabem(): Caixa[] {
    return this.#lista.filter((caixa) => !caixa.textoCabe());
  }
}
