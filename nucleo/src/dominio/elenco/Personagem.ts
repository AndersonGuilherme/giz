import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import type { Expressao } from './PoseEExpressao.ts';

export type ValorDeParametro = string | number | boolean;

export type VozDoPersonagem = Readonly<{ id: string; estilo?: string }>;

/** `parametros` já validados pelo rig, com os padrões aplicados. Sem `rig`, só o narrador (voz sem corpo). */
export type FichaDoPersonagem = Readonly<{
  nome: string;
  rig?: string;
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
    if (ficha.rig === undefined && !id.eNarrador()) {
      throw new ErroDeDominio(`"${id.texto()}" precisa de um rig (só o narrador pode não ter corpo)`);
    }
    return new Personagem(id, { ...ficha, parametros: Object.freeze({ ...ficha.parametros }) });
  }

  temId(id: IdPersonagem): boolean {
    return this.#id.igual(id);
  }

  /** O narrador sem rig é só voz. */
  temCorpo(): boolean {
    return this.#ficha.rig !== undefined;
  }

  id(): IdPersonagem {
    return this.#id;
  }

  nome(): string {
    return this.#ficha.nome;
  }

  rig(): string | undefined {
    return this.#ficha.rig;
  }

  parametros(): Readonly<Record<string, ValorDeParametro>> {
    return this.#ficha.parametros;
  }

  voz(): VozDoPersonagem {
    return this.#ficha.voz;
  }

  personalidade(): string | undefined {
    return this.#ficha.personalidade;
  }

  expressaoPadrao(): Expressao {
    return this.#ficha.expressaoPadrao;
  }
}
