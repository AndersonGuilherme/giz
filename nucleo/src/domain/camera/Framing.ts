import type { Enquadramento as EnquadramentoJson } from '../roteiro/ElementosDeCena.ts';

export type DadosDoEnquadramento = Readonly<{ zoom: number; x: number; y: number; rotacao: number }>;

const CENTESIMO = 100;

function limitar(valor: number, folga: number): number {
  return Math.max(-folga, Math.min(folga, valor));
}

/** Zoom nunca abaixo de 1 (a borda do fundo não aparece); x e y ficam dentro da folga que o zoom dá. */
export class Enquadramento {
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
  readonly rotacao: number;

  private constructor(dados: DadosDoEnquadramento) {
    this.zoom = Math.max(1, dados.zoom);
    const folga = (this.zoom - 1) / 2;
    this.x = limitar(dados.x, folga);
    this.y = limitar(dados.y, folga);
    this.rotacao = dados.rotacao;
  }

  static de(dados: DadosDoEnquadramento): Enquadramento {
    return new Enquadramento(dados);
  }

  static doJson(json: EnquadramentoJson): Enquadramento {
    return new Enquadramento({ ...json, rotacao: 0 });
  }

  static neutro(): Enquadramento {
    return new Enquadramento({ zoom: 1, x: 0, y: 0, rotacao: 0 });
  }

  /** `fracao` de 0 (este enquadramento) a 1 (o outro). */
  ate(outro: Enquadramento, fracao: number): Enquadramento {
    const mistura = (inicio: number, fim: number): number => inicio + (fim - inicio) * fracao;
    return new Enquadramento({
      zoom: mistura(this.zoom, outro.zoom),
      x: mistura(this.x, outro.x),
      y: mistura(this.y, outro.y),
      rotacao: mistura(this.rotacao, outro.rotacao),
    });
  }

  transformacaoCss(): string {
    const deslocamento = `translate(${this.x * CENTESIMO}%, ${this.y * CENTESIMO}%)`;
    return `${deslocamento} scale(${this.zoom}) rotate(${this.rotacao}deg)`;
  }
}
