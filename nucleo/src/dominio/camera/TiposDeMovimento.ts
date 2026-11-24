import type { Quadro } from '../valores/Tempo.ts';
import type { MovimentoDeCameraJson } from '../roteiro/ElementosDeCena.ts';
import { Enquadramento } from './Enquadramento.ts';

export interface TipoDeMovimento {
  /** `progresso` vai de 0 (início da cena) a 1 (fim). */
  enquadramentoEm(progresso: number, quadro: Quadro): Enquadramento;
}

export type ConstrutorDeMovimento = new (json: MovimentoDeCameraJson) => TipoDeMovimento;

const SUAVIZACOES: Readonly<Record<string, (fracao: number) => number>> = {
  linear: (fracao) => fracao,
  suave: (fracao) => fracao * fracao * (3 - 2 * fracao),
};

function suavizar(json: MovimentoDeCameraJson, progresso: number): number {
  const fracao = Math.max(0, Math.min(1, progresso));
  const curva = SUAVIZACOES[json.suavidade ?? 'suave'] ?? SUAVIZACOES['suave']!;
  return curva(fracao);
}

function enquadramentoOu(dado: MovimentoDeCameraJson['de'], padrao: Enquadramento): Enquadramento {
  return dado ? Enquadramento.doJson(dado) : padrao;
}

type Padroes = Readonly<{ inicio: Enquadramento; fim: Enquadramento }>;

function entreOsExtremos(json: MovimentoDeCameraJson, padroes: Padroes, progresso: number): Enquadramento {
  const de = enquadramentoOu(json.de, padroes.inicio);
  const para = enquadramentoOu(json.para, padroes.fim);
  return de.ate(para, suavizar(json, progresso));
}

function zoomFixo(zoom: number): Enquadramento {
  return Enquadramento.de({ zoom, x: 0, y: 0, rotacao: 0 });
}

export class Parada implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(): Enquadramento {
    return enquadramentoOu(this.#json.de ?? this.#json.para, Enquadramento.neutro());
  }
}

export class Aproximar implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(progresso: number): Enquadramento {
    return entreOsExtremos(this.#json, { inicio: Enquadramento.neutro(), fim: zoomFixo(1.3) }, progresso);
  }
}

export class Afastar implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(progresso: number): Enquadramento {
    return entreOsExtremos(this.#json, { inicio: zoomFixo(1.3), fim: Enquadramento.neutro() }, progresso);
  }
}

export class Deslizar implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(progresso: number): Enquadramento {
    const inicio = Enquadramento.de({ zoom: 1.1, x: -0.05, y: 0, rotacao: 0 });
    const fim = Enquadramento.de({ zoom: 1.1, x: 0.05, y: 0, rotacao: 0 });
    return entreOsExtremos(this.#json, { inicio, fim }, progresso);
  }
}

/** Vai em direção ao ponto `para` e desacelera ao chegar (a câmera "alcança" o alvo). */
export class Seguir implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(progresso: number): Enquadramento {
    const alvo = enquadramentoOu(this.#json.para, zoomFixo(1.15));
    const largada = enquadramentoOu(this.#json.de, zoomFixo(alvo.zoom));
    const restante = 1 - Math.max(0, Math.min(1, progresso));
    return largada.ate(alvo, 1 - restante * restante);
  }
}

const AMPLITUDE_DO_TREMOR = 0.004;
const GRAUS_DO_TREMOR = 0.25;

/** Treme em torno do enquadramento base; só depende do quadro (sem Math.random). */
export class Tremer implements TipoDeMovimento {
  readonly #json: MovimentoDeCameraJson;

  constructor(json: MovimentoDeCameraJson) {
    this.#json = json;
  }

  enquadramentoEm(_progresso: number, quadro: Quadro): Enquadramento {
    const base = enquadramentoOu(this.#json.para ?? this.#json.de, zoomFixo(1.04));
    const intensidade = this.#json.intensidade ?? 1;
    const numero = quadro.valor();
    return Enquadramento.de({
      zoom: Math.max(base.zoom, 1 + 4 * AMPLITUDE_DO_TREMOR * intensidade),
      x: base.x + Math.sin(numero * 2.3) * AMPLITUDE_DO_TREMOR * intensidade,
      y: base.y + Math.sin(numero * 3.1 + 1) * AMPLITUDE_DO_TREMOR * intensidade,
      rotacao: Math.sin(numero * 1.7 + 2) * GRAUS_DO_TREMOR * intensidade,
    });
  }
}

export const REGISTRO_DE_MOVIMENTOS: ReadonlyMap<string, ConstrutorDeMovimento> = new Map<string, ConstrutorDeMovimento>([
  ['parada', Parada],
  ['aproximar', Aproximar],
  ['afastar', Afastar],
  ['deslizar', Deslizar],
  ['seguir', Seguir],
  ['tremer', Tremer],
]);
