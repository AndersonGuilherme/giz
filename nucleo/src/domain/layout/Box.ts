import { EncaixeDeTexto } from './EncaixeDeTexto.ts';
import type { Fonte } from './Fonte.ts';

/** Retângulo em pixels do vídeo (origem no canto superior esquerdo). */
export type Retangulo = Readonly<{ x: number; y: number; largura: number; altura: number }>;
export type TextoDaCaixa = Readonly<{ texto: string; fonte: Fonte }>;
type Conteudo = Readonly<{ rotulo: string; texto?: TextoDaCaixa }>;

/** Região que um elemento ocupa na tela; o rótulo aparece nas mensagens do `check`. */
export class Caixa {
  readonly #retangulo: Retangulo;
  readonly #conteudo: Conteudo;

  private constructor(retangulo: Retangulo, conteudo: Conteudo) {
    this.#retangulo = retangulo;
    this.#conteudo = conteudo;
  }

  static de(rotulo: string, retangulo: Retangulo): Caixa {
    return new Caixa({ ...retangulo }, { rotulo });
  }

  static comTexto(rotulo: string, retangulo: Retangulo, texto: TextoDaCaixa): Caixa {
    return new Caixa({ ...retangulo }, { rotulo, texto });
  }

  get x(): number {
    return this.#retangulo.x;
  }

  get y(): number {
    return this.#retangulo.y;
  }

  get largura(): number {
    return this.#retangulo.largura;
  }

  get altura(): number {
    return this.#retangulo.altura;
  }

  get rotulo(): string {
    return this.#conteudo.rotulo;
  }

  /** Encostar na borda não é sobrepor. */
  sobrepoe(outra: Caixa): boolean {
    const separadasNaHorizontal = this.#direita() <= outra.x || outra.#direita() <= this.x;
    const separadasNaVertical = this.#base() <= outra.y || outra.#base() <= this.y;
    return !separadasNaHorizontal && !separadasNaVertical;
  }

  dentroDe(outra: Caixa): boolean {
    const naHorizontal = this.x >= outra.x && this.#direita() <= outra.#direita();
    return naHorizontal && this.y >= outra.y && this.#base() <= outra.#base();
  }

  /** Sem texto, não há o que encaixar. */
  textoCabe(): boolean {
    const conteudo = this.#conteudo.texto;
    if (!conteudo) return true;
    const encaixe = EncaixeDeTexto.medir(conteudo.texto, conteudo.fonte, this.largura);
    return encaixe.cabe;
  }

  #direita(): number {
    return this.x + this.largura;
  }

  #base(): number {
    return this.y + this.altura;
  }
}
