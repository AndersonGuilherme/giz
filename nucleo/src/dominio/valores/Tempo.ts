import { ErroDeDominio } from '../ErroDeDominio.ts';

const TOLERANCIA_DE_PONTO_FLUTUANTE = 1e-9;

export class Fps {
  static readonly PADRAO = new Fps(30);

  readonly #valor: number;

  private constructor(valor: number) {
    this.#valor = valor;
  }

  valor(): number {
    return this.#valor;
  }
}

export class Quadro {
  readonly #valor: number;

  private constructor(valor: number) {
    this.#valor = valor;
  }

  static de(numero: number): Quadro {
    if (!Number.isInteger(numero) || numero < 0) {
      throw new ErroDeDominio(`quadro ${numero} inválido (use um inteiro maior ou igual a 0)`);
    }
    return new Quadro(numero);
  }

  mais(outro: Quadro): Quadro {
    return new Quadro(this.#valor + outro.#valor);
  }

  menos(outro: Quadro): Quadro {
    return new Quadro(Math.max(0, this.#valor - outro.#valor));
  }

  antesDe(outro: Quadro): boolean {
    return this.#valor < outro.#valor;
  }

  valor(): number {
    return this.#valor;
  }
}

export class Segundos {
  readonly #valor: number;

  private constructor(valor: number) {
    this.#valor = valor;
  }

  static de(numero: number): Segundos {
    if (!Number.isFinite(numero) || numero < 0) {
      throw new ErroDeDominio(`segundos ${numero} inválido (use um número maior ou igual a 0)`);
    }
    return new Segundos(numero);
  }

  emQuadros(fps: Fps): Quadro {
    return Quadro.de(Math.ceil(this.#valor * fps.valor() - TOLERANCIA_DE_PONTO_FLUTUANTE));
  }

  mais(outro: Segundos): Segundos {
    return new Segundos(this.#valor + outro.#valor);
  }

  valor(): number {
    return this.#valor;
  }
}
