import type { Expressao, Pose } from '../elenco/PoseEExpressao.ts';
import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import type { Cena } from './Cena.ts';

export const OLHARES = ['camera', 'outro', 'conteudo'] as const;
export type Olhar = (typeof OLHARES)[number];

export const EFEITOS_SONOROS = ['pop', 'whoosh', 'ding', 'dings', 'erro', 'sucesso', 'tique'] as const;
export type EfeitoSonoro = (typeof EFEITOS_SONOROS)[number];

/** Como reage quem escuta, durante a fala. */
export type Reacao = Readonly<{ expressao?: Expressao; pose?: Pose; olhar?: Olhar }>;

/** Marca (o antigo beat): aplicada quando a narração chega ao k-ésimo `[trecho]`; aceita campos de cena. */
export type Marca = Readonly<Record<string, unknown>> &
  Readonly<{ expressao?: Expressao; pose?: Pose; efeitoSonoro?: EfeitoSonoro }>;

export type PausaDepois = Readonly<{ segundos: number; rotulo: string }>;

/** `capitulo` é a posição (a partir de 1) em `Roteiro.capitulos()`; `pronuncia` é o texto para a voz. */
export type DadosDaFala = Readonly<{
  id: string;
  capitulo: number;
  texto: string;
  pronuncia?: string;
  pose?: Pose;
  expressao?: Expressao;
  olhar?: Olhar;
  reacao?: Reacao;
  cena?: Cena;
  marcas?: readonly Marca[];
  pausaDepois?: PausaDepois;
  efeitoSonoro?: EfeitoSonoro;
}>;

export class Fala {
  readonly #quem: IdPersonagem;
  readonly #dados: DadosDaFala;

  private constructor(quem: IdPersonagem, dados: DadosDaFala) {
    this.#quem = quem;
    this.#dados = dados;
  }

  static de(quem: IdPersonagem, dados: DadosDaFala): Fala {
    return new Fala(quem, dados);
  }

  quem(): IdPersonagem {
    return this.#quem;
  }

  dados(): DadosDaFala {
    return this.#dados;
  }
}
