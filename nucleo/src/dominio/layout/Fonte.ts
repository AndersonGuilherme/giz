import { ErroDeDominio } from '../ErroDeDominio.ts';

/** `texto` é a família proporcional das legendas e títulos; `mono`, a do código. */
export const FAMILIAS = ['texto', 'mono'] as const;
export type Familia = (typeof FAMILIAS)[number];

/** `alturaDaLinha` é múltiplo do tamanho (1.25 = 125%); `maximoDeLinhas` é quanto cabe na caixa. */
export type MedidasDaFonte = Readonly<{ tamanho: number; alturaDaLinha: number; maximoDeLinhas: number }>;
type DadosDaFonte = MedidasDaFonte & Readonly<{ familia: Familia }>;

function recusarMedidaInvalida(medidas: MedidasDaFonte): void {
  const positivas = [medidas.tamanho, medidas.alturaDaLinha, medidas.maximoDeLinhas].every((medida) => medida > 0);
  if (positivas && Number.isInteger(medidas.maximoDeLinhas)) return;
  throw new ErroDeDominio(`fonte inválida: ${JSON.stringify(medidas)} (tamanho, altura da linha e linhas devem ser positivos)`);
}

export class Fonte {
  readonly #familia: Familia;
  readonly #medidas: MedidasDaFonte;

  private constructor(familia: Familia, medidas: MedidasDaFonte) {
    this.#familia = familia;
    this.#medidas = medidas;
  }

  static de({ familia, ...medidas }: DadosDaFonte): Fonte {
    recusarMedidaInvalida(medidas);
    return new Fonte(familia, medidas);
  }

  familia(): Familia {
    return this.#familia;
  }

  tamanhoBase(): number {
    return this.#medidas.tamanho;
  }

  maximoDeLinhas(): number {
    return this.#medidas.maximoDeLinhas;
  }

  /** Altura que o texto ocupa no tamanho base com todas as linhas permitidas. */
  alturaMaxima(): number {
    const { tamanho, alturaDaLinha, maximoDeLinhas } = this.#medidas;
    return Math.round(tamanho * alturaDaLinha * maximoDeLinhas);
  }
}
