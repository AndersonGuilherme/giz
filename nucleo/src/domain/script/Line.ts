import type { Expressao, Pose } from '../elenco/PoseEExpressao.ts';
import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import type { Capitulo } from './Capitulo.ts';
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

/** `pronuncia` é o texto para a voz (o antigo `say`). */
export type DadosDaFala = Readonly<{
  id: string;
  capitulo: Capitulo;
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

const SEM_MARCAS: readonly Marca[] = [];

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

  id(): string {
    return this.#dados.id;
  }

  capitulo(): Capitulo {
    return this.#dados.capitulo;
  }

  texto(): string {
    return this.#dados.texto;
  }

  /** O texto para a voz; sem pronúncia própria, é o texto da legenda. */
  pronuncia(): string {
    return this.#dados.pronuncia ?? this.#dados.texto;
  }

  pose(): Pose | undefined {
    return this.#dados.pose;
  }

  expressao(): Expressao | undefined {
    return this.#dados.expressao;
  }

  olhar(): Olhar | undefined {
    return this.#dados.olhar;
  }

  reacao(): Reacao | undefined {
    return this.#dados.reacao;
  }

  /** Ausente: a fala herda a cena anterior. */
  cena(): Cena | undefined {
    return this.#dados.cena;
  }

  marcas(): readonly Marca[] {
    return this.#dados.marcas ?? SEM_MARCAS;
  }

  pausaDepois(): PausaDepois | undefined {
    return this.#dados.pausaDepois;
  }

  efeitoSonoro(): EfeitoSonoro | undefined {
    return this.#dados.efeitoSonoro;
  }
}
