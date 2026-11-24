import type { PalavraJson } from '../fala/PalavraJson.ts';
import { Fps, Segundos } from '../valores/Tempo.ts';
import type { PalavraEmQuadros } from './PropsDoVideo.ts';

/** O que a linha do tempo usa da voz gravada de uma fala. */
export type VozDaFala = Readonly<{
  arquivo: string;
  envelope: readonly number[];
  visemas: string;
  palavras?: readonly PalavraJson[];
}>;

// Os quadros com voz; sem nenhum, todos os quadros da fala.
function quadrosFalados(envelope: readonly number[]): number[] {
  const falados = envelope.flatMap((abertura, quadro) => (abertura > 0 ? [quadro] : []));
  return falados.length > 0 ? falados : [...envelope.keys()];
}

// Fração (de 0 a 1) do texto em que cada palavra começa, pelas letras.
function fracoesDeInicio(textos: readonly string[]): number[] {
  const tamanho = Math.max(1, textos.join(' ').length);
  return textos.map((_texto, indice) => textos.slice(0, indice).reduce((soma, anterior) => soma + anterior.length + 1, 0) / tamanho);
}

/** Converte os tempos da fala em quadros relativos; sem as palavras gravadas, interpola pelos quadros com voz. */
export class TemposDaFala {
  readonly #envelope: readonly number[];
  readonly #palavras: readonly PalavraJson[] | undefined;

  private constructor(envelope: readonly number[], palavras: readonly PalavraJson[] | undefined) {
    this.#envelope = envelope;
    this.#palavras = palavras;
  }

  /** As palavras gravadas só valem se forem tantas quanto as do roteiro (`textos`). */
  static de(voz: VozDaFala, textos: readonly string[]): TemposDaFala {
    const palavras = voz.palavras?.length === textos.length ? voz.palavras : undefined;
    return new TemposDaFala(voz.envelope, palavras);
  }

  /** A duração da fala em quadros: o tamanho do envelope (igual ao dos visemas). */
  quadros(): number {
    return this.#envelope.length;
  }

  /** O quadro em que a palavra começa; sem palavras gravadas, `undefined`. */
  inicioDaPalavra(indice: number): number | undefined {
    const palavra = this.#palavras?.[indice];
    return palavra && this.#emQuadros(palavra.inicio);
  }

  /** O quadro com voz em que cai a fração `fracao` (de 0 a 1) da fala. */
  quadroNaFracao(fracao: number): number {
    const quadros = quadrosFalados(this.#envelope);
    if (fracao >= 1) return this.quadros();
    return quadros[Math.floor(fracao * quadros.length)] ?? 0;
  }

  emQuadros(textos: readonly string[]): PalavraEmQuadros[] {
    const inicios = this.#palavras?.map((palavra) => this.#emQuadros(palavra.inicio)) ?? fracoesDeInicio(textos).map((fracao) => this.quadroNaFracao(fracao));
    const fins = this.#palavras?.map((palavra) => this.#emQuadros(palavra.fim)) ?? [...inicios.slice(1), this.quadros()];
    return textos.map((texto, indice) => ({ texto, inicio: inicios[indice] ?? 0, fim: fins[indice] ?? this.quadros() }));
  }

  #emQuadros(segundos: number): number {
    const quadro = Segundos.de(segundos).emQuadros(Fps.PADRAO);
    return Math.min(this.quadros(), quadro.valor());
  }
}
