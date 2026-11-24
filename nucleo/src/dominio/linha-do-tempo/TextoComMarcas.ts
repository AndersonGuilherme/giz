const MARCA = /\[[^\]]+\]/g;
const COLCHETES = /[[\]]/g;
const COLCHETES_POR_MARCA = 2;

const palavrasEm = (texto: string): number => texto.split(/\s+/).filter(Boolean).length;

/** Um texto com marcas `[trecho]`: onde cada marca abre, no texto sem os colchetes. */
export class TextoComMarcas {
  readonly #bruto: string;

  private constructor(bruto: string) {
    this.#bruto = bruto;
  }

  static de(texto: string): TextoComMarcas {
    return new TextoComMarcas(texto);
  }

  static temMarcas(texto: string): boolean {
    return new RegExp(MARCA.source).test(texto);
  }

  limpo(): string {
    return this.#bruto.replace(COLCHETES, '');
  }

  quantidade(): number {
    return this.#posicoes().length;
  }

  /** Índice (nas palavras do texto limpo) da palavra que abre cada marca. */
  palavrasQueAbrem(): number[] {
    const limpo = this.limpo();
    return this.#posicoes().map((posicao) => {
      const antes = limpo.slice(0, posicao);
      const noMeioDaPalavra = posicao > 0 && !/\s$/.test(antes);
      return palavrasEm(antes) - (noMeioDaPalavra ? 1 : 0);
    });
  }

  /** Onde cada marca abre, como fração (de 0 a 1) do texto limpo. */
  fracoes(): number[] {
    const tamanho = Math.max(1, this.limpo().length);
    return this.#posicoes().map((posicao) => posicao / tamanho);
  }

  // Posição de cada marca no texto limpo: cada marca anterior tirou dois colchetes.
  #posicoes(): number[] {
    const encontradas = [...this.#bruto.matchAll(MARCA)];
    return encontradas.map((marca, ordem) => (marca.index ?? 0) - ordem * COLCHETES_POR_MARCA);
  }
}
