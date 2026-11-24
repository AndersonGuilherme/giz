import type { Elenco } from '../elenco/Elenco.ts';
import type { Roteiro } from '../roteiro/Roteiro.ts';
import type { Idioma } from '../valores/Idioma.ts';
import type { Proporcao } from '../valores/Proporcao.ts';

export const FORMATOS = ['historia', 'aula'] as const;
export type Formato = (typeof FORMATOS)[number];

export const ESTILOS_DE_LEGENDA = ['palavras', 'blocos'] as const;
export type EstiloDeLegenda = (typeof ESTILOS_DE_LEGENDA)[number];

export const PROVEDORES_DE_VOZ = ['qwen', 'arquivo'] as const;
export const MODELOS_DE_VOZ = ['0.6b', '1.7b'] as const;
export type VozDoProjeto = Readonly<{
  provedor: (typeof PROVEDORES_DE_VOZ)[number];
  modelo?: (typeof MODELOS_DE_VOZ)[number];
}>;

export type FichaDoProjeto = Readonly<{
  titulo: string;
  formato: Formato;
  idioma: Idioma;
  proporcao: Proporcao;
  marca?: string;
  estiloDeLegenda: EstiloDeLegenda;
  voz: VozDoProjeto;
}>;

/** `avisos` são problemas que não impedem a carga (por exemplo, uma imagem de cenário ausente). */
export type ConteudoDoProjeto = Readonly<{ elenco: Elenco; roteiro: Roteiro; avisos: readonly string[] }>;

export class Projeto {
  readonly #ficha: FichaDoProjeto;
  readonly #conteudo: ConteudoDoProjeto;

  private constructor(ficha: FichaDoProjeto, conteudo: ConteudoDoProjeto) {
    this.#ficha = ficha;
    this.#conteudo = conteudo;
  }

  static de(ficha: FichaDoProjeto, conteudo: ConteudoDoProjeto): Projeto {
    return new Projeto(ficha, { ...conteudo, avisos: [...conteudo.avisos] });
  }

  titulo(): string {
    return this.#ficha.titulo;
  }

  idioma(): Idioma {
    return this.#ficha.idioma;
  }

  proporcao(): Proporcao {
    return this.#ficha.proporcao;
  }

  formato(): Formato {
    return this.#ficha.formato;
  }

  marca(): string | undefined {
    return this.#ficha.marca;
  }

  estiloDeLegenda(): EstiloDeLegenda {
    return this.#ficha.estiloDeLegenda;
  }

  voz(): VozDoProjeto {
    return this.#ficha.voz;
  }

  elenco(): Elenco {
    return this.#conteudo.elenco;
  }

  roteiro(): Roteiro {
    return this.#conteudo.roteiro;
  }

  avisos(): readonly string[] {
    return this.#conteudo.avisos;
  }
}
