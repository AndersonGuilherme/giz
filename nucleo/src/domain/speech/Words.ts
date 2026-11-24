import { ErroDeDominio } from '../ErroDeDominio.ts';
import { Segundos } from '../valores/Tempo.ts';
import type { PalavraJson } from './PalavraJson.ts';

export type { PalavraJson };

type Trecho = Readonly<{ inicio: Segundos; fim: Segundos }>;

const SEM_TEMPO: Trecho = { inicio: Segundos.de(0), fim: Segundos.de(0) };

/** Uma palavra do roteiro (com a pontuação junto) e o trecho da fala em que é dita. */
export class Palavra {
  readonly #texto: string;
  readonly #trecho: Trecho;

  private constructor(texto: string, trecho: Trecho) {
    this.#texto = texto;
    this.#trecho = trecho;
  }

  static de(texto: string, trecho: Trecho = SEM_TEMPO): Palavra {
    if (trecho.fim.valor() < trecho.inicio.valor()) {
      throw new ErroDeDominio(`palavra "${texto}" termina (${trecho.fim.valor()} s) antes de começar (${trecho.inicio.valor()} s)`);
    }
    return new Palavra(texto, trecho);
  }

  texto(): string {
    return this.#texto;
  }

  comecouAte(instante: Segundos): boolean {
    return this.#trecho.inicio.valor() <= instante.valor();
  }

  paraJson(): PalavraJson {
    return { texto: this.#texto, inicio: this.#trecho.inicio.valor(), fim: this.#trecho.fim.valor() };
  }
}

/** As palavras de uma fala, na ordem do roteiro. A legenda mostra sempre estes textos, nunca o que foi ouvido. */
export class Palavras {
  readonly #palavras: readonly Palavra[];

  private constructor(palavras: readonly Palavra[]) {
    this.#palavras = palavras;
  }

  /** Os colchetes das marcas `[trecho]` não fazem parte das palavras. */
  static doTexto(texto: string): Palavras {
    const textos = texto.replace(/[[\]]/g, '').split(/\s+/).filter(Boolean);
    return new Palavras(textos.map((palavra) => Palavra.de(palavra)));
  }

  comTempos(inicios: readonly Segundos[], fins: readonly Segundos[]): Palavras {
    const total = this.#palavras.length;
    if (inicios.length !== total || fins.length !== total) {
      throw new ErroDeDominio(`${total} palavra(s), mas ${inicios.length} início(s) e ${fins.length} fim(ns)`);
    }
    const comTempo = this.#palavras.map(
      (palavra, indice) => Palavra.de(palavra.texto(), { inicio: inicios[indice] ?? SEM_TEMPO.inicio, fim: fins[indice] ?? SEM_TEMPO.fim }),
    );
    return new Palavras(comTempo);
  }

  /** Índice da última palavra que já começou no instante `instante`; -1 antes da primeira. */
  ativaEm(instante: Segundos): number {
    return this.#palavras.reduce((ativa, palavra, indice) => (palavra.comecouAte(instante) ? indice : ativa), -1);
  }

  textos(): string[] {
    return this.#palavras.map((palavra) => palavra.texto());
  }

  paraJson(): PalavraJson[] {
    return this.#palavras.map((palavra) => palavra.paraJson());
  }
}
