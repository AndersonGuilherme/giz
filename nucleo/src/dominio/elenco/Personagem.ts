import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import type { Expressao } from './PoseEExpressao.ts';

export type ValorDeParametro = string | number | boolean;

export type VozDoPersonagem = Readonly<{ id: string; estilo?: string }>;

export type FichaDoPersonagem = Readonly<{
  nome: string;
  rig: string;
  parametros: Readonly<Record<string, ValorDeParametro>>;
  voz: VozDoPersonagem;
  personalidade?: string;
  expressaoPadrao: Expressao;
}>;

export class Personagem {
  readonly #id: IdPersonagem;
  readonly #ficha: FichaDoPersonagem;

  private constructor(id: IdPersonagem, ficha: FichaDoPersonagem) {
    this.#id = id;
    this.#ficha = ficha;
  }

  static de(id: IdPersonagem, ficha: FichaDoPersonagem): Personagem {
    return new Personagem(id, ficha);
  }

  temId(id: IdPersonagem): boolean {
    return this.#id.igual(id);
  }

  id(): IdPersonagem {
    return this.#id;
  }

  ficha(): FichaDoPersonagem {
    return this.#ficha;
  }
}
