import { ErroDeDominio } from '../ErroDeDominio.ts';

type TextoDeProporcao = '9:16' | '16:9';

export class Proporcao {
  static readonly VERTICAL = new Proporcao(1080, 1920);
  static readonly HORIZONTAL = new Proporcao(1920, 1080);

  readonly #largura: number;
  readonly #altura: number;

  private constructor(largura: number, altura: number) {
    this.#largura = largura;
    this.#altura = altura;
  }

  static de(texto: string): Proporcao {
    const suportadas = [Proporcao.VERTICAL, Proporcao.HORIZONTAL];
    const encontrada = suportadas.find((proporcao) => proporcao.texto() === texto);
    if (!encontrada) throw new ErroDeDominio(`proporção "${texto}" não suportada (use 9:16 ou 16:9)`);
    return encontrada;
  }

  largura(): number {
    return this.#largura;
  }

  altura(): number {
    return this.#altura;
  }

  vertical(): boolean {
    return this.#altura > this.#largura;
  }

  texto(): TextoDeProporcao {
    return this.vertical() ? '9:16' : '16:9';
  }
}
