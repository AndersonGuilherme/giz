import type { Fps, Quadro } from '../valores/Tempo.ts';

const MINIMO_EM_SEGUNDOS = 2.5;
const FAIXA_EM_SEGUNDOS = 3;
const FECHAMENTO_POR_QUADRO: readonly number[] = [0.7, 1, 1, 0.7];

function hashDaSemente(semente: string): number {
  let hash = 2166136261;
  for (const caractere of semente) {
    hash = Math.imul(hash ^ caractere.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

// mulberry32 de um passo: mistura semente e índice numa fração em [0, 1).
function fracaoDe(hash: number, indice: number): number {
  let valor = (hash + Math.imul(indice + 1, 0x6d2b79f5)) >>> 0;
  valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
  valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
  return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
}

/** Pisca a cada 2,5–5,5 s (intervalo fixo pela semente); cada piscada dura 4 quadros. */
export class Piscada {
  readonly #hash: number;

  private constructor(hash: number) {
    this.#hash = hash;
  }

  static para(semente: string): Piscada {
    return new Piscada(hashDaSemente(semente));
  }

  /** 0 = olhos abertos, 1 = fechados. */
  fechamentoEm(quadro: Quadro, fps: Fps): number {
    const atual = quadro.valor();
    let inicio = 0;
    let indice = 0;
    while (inicio + this.#intervalo(indice, fps) <= atual) {
      inicio += this.#intervalo(indice, fps);
      indice += 1;
    }
    return indice === 0 ? 0 : (FECHAMENTO_POR_QUADRO[atual - inicio] ?? 0);
  }

  #intervalo(indice: number, fps: Fps): number {
    const segundos = MINIMO_EM_SEGUNDOS + fracaoDe(this.#hash, indice) * FAIXA_EM_SEGUNDOS;
    return Math.round(segundos * fps.valor());
  }
}
