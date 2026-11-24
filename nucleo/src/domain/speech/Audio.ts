import { ErroDeDominio } from '../ErroDeDominio.ts';
import { Segundos } from '../valores/Tempo.ts';

// Valores de trimSilence e normalizeLoudness do motor (scripts/tts.ts).
const LIMIAR_DE_SILENCIO = 0.012;
const MARGEM_EM_SEGUNDOS = 0.04;
const LIMIAR_DE_VOZ_NA_NORMALIZACAO = 0.01;
const VOLUME_ALVO = 0.085;
const PICO_MAXIMO = 0.95;

const audivel = (amostra: number) => Math.abs(amostra) >= LIMIAR_DE_SILENCIO;

// findLastIndex dos arrays tipados é ES2023; o alvo do pacote é ES2022.
function ultimaAudivel(amostras: Float32Array): number {
  let posicao = amostras.length - 1;
  while (posicao >= 0 && !audivel(amostras[posicao] ?? 0)) posicao--;
  return posicao;
}

function ganhoDeNormalizacao(amostras: Float32Array): number {
  const comVoz = amostras.filter((amostra) => Math.abs(amostra) > LIMIAR_DE_VOZ_NA_NORMALIZACAO);
  const energia = comVoz.reduce((soma, amostra) => soma + amostra * amostra, 0);
  const volume = Math.sqrt(energia / Math.max(1, comVoz.length));
  const pico = amostras.reduce((maior, amostra) => Math.max(maior, Math.abs(amostra)), 0);
  return Math.min(VOLUME_ALVO / volume, PICO_MAXIMO / Math.max(pico, 1e-6));
}

/** Som mono: amostras de -1 a 1 e a taxa (amostras por segundo). */
export class Audio {
  readonly #amostras: Float32Array;
  readonly #taxa: number;

  private constructor(amostras: Float32Array, taxa: number) {
    this.#amostras = amostras;
    this.#taxa = taxa;
  }

  static de(amostras: Float32Array, taxa: number): Audio {
    if (!Number.isInteger(taxa) || taxa <= 0) throw new ErroDeDominio(`taxa ${taxa} inválida (use um inteiro maior que 0)`);
    return new Audio(amostras, taxa);
  }

  duracao(): Segundos {
    return Segundos.de(this.#amostras.length / this.#taxa);
  }

  /** Corta o silêncio das pontas, deixando uma margem curta de cada lado. */
  aparado(): Audio {
    const ultimaPosicao = Math.max(0, this.#amostras.length - 1);
    const encontradaNoInicio = this.#amostras.findIndex(audivel);
    const inicio = encontradaNoInicio === -1 ? ultimaPosicao : encontradaNoInicio;
    const fim = Math.max(inicio, ultimaAudivel(this.#amostras));
    const margem = Math.round(MARGEM_EM_SEGUNDOS * this.#taxa);
    const recorte = this.#amostras.subarray(Math.max(0, inicio - margem), Math.min(this.#amostras.length, fim + margem + 1));
    return new Audio(recorte, this.#taxa);
  }

  /** Leva o volume das partes com voz ao alvo, sem deixar o pico estourar. */
  normalizado(): Audio {
    const ganho = ganhoDeNormalizacao(this.#amostras);
    return new Audio(this.#amostras.map((amostra) => amostra * ganho), this.#taxa);
  }

  amostras(): Float32Array {
    return this.#amostras;
  }

  taxa(): number {
    return this.#taxa;
  }
}
