import type { Fps, Quadro } from '../valores/Tempo.ts';
import type { Audio } from './Audio.ts';

// Valores de rmsFrames/envelope do motor (scripts/tts.ts).
const PERCENTIL_DE_REFERENCIA = 0.92;
const ABERTURA_MINIMA = 0.12;
const CURVA = 0.8;

function energiaDoTrecho(amostras: Float32Array): number {
  const soma = amostras.reduce((total, amostra) => total + amostra * amostra, 0);
  return Math.sqrt(soma / Math.max(1, amostras.length));
}

// Volume (RMS) de cada quadro.
function volumesPorQuadro(audio: Audio, fps: Fps): number[] {
  const amostras = audio.amostras();
  const passo = audio.taxa() / fps.valor();
  const quadros = Math.ceil(amostras.length / passo);
  return [...Array(quadros).keys()].map((quadro) =>
    energiaDoTrecho(amostras.subarray(Math.floor(quadro * passo), Math.floor((quadro + 1) * passo))),
  );
}

// O volume de referência é o percentil 92: os picos raros não achatam o resto da fala.
function referencia(volumes: readonly number[]): number {
  const ordenados = [...volumes].sort((menor, maior) => menor - maior);
  return ordenados[Math.floor(ordenados.length * PERCENTIL_DE_REFERENCIA)] || 1;
}

// Suaviza com os vizinhos, normaliza pela referência e zera o que é baixo demais para mexer a boca.
function aberturas(volumes: readonly number[]): number[] {
  const volumeDeReferencia = referencia(volumes);
  return volumes.map((volume, quadro) => {
    const suavizado = ((volumes[quadro - 1] ?? volume) + 2 * volume + (volumes[quadro + 1] ?? volume)) / 4;
    const relativo = Math.min(1, suavizado / volumeDeReferencia);
    const abertura = relativo < ABERTURA_MINIMA ? 0 : Math.pow(relativo, CURVA);
    return Math.round(abertura * 100) / 100;
  });
}

/** Quanto a boca abre (de 0 a 1) em cada quadro da fala. */
export class Envelope {
  readonly #aberturas: readonly number[];

  private constructor(valores: readonly number[]) {
    this.#aberturas = valores;
  }

  static medir(audio: Audio, fps: Fps): Envelope {
    return new Envelope(aberturas(volumesPorQuadro(audio, fps)));
  }

  quadrosComVoz(): boolean[] {
    return this.#aberturas.map((abertura) => abertura > 0);
  }

  abertura(quadro: Quadro): number {
    return this.#aberturas[quadro.valor()] ?? 0;
  }

  paraJson(): number[] {
    return [...this.#aberturas];
  }
}
