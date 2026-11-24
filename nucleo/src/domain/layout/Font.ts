import { DomainError } from '../DomainError.ts';

/** `text` is the proportional family of captions and titles; `mono`, the one for code. */
export const FAMILIES = ['text', 'mono'] as const;
export type Family = (typeof FAMILIES)[number];

/** `lineHeight` is a multiple of the size (1.25 = 125%); `maximumLines` is how many fit in the box. */
export type FontMeasures = Readonly<{ size: number; lineHeight: number; maximumLines: number }>;
type FontData = FontMeasures & Readonly<{ family: Family }>;

function rejectInvalidMeasures(measures: FontMeasures): void {
  const positive = [measures.size, measures.lineHeight, measures.maximumLines].every((measurement) => measurement > 0);
  if (positive && Number.isInteger(measures.maximumLines)) return;
  throw new DomainError(`fonte inválida: ${JSON.stringify(measures)} (tamanho, altura da linha e linhas devem ser positivos)`);
}

export class Font {
  readonly #family: Family;
  readonly #measures: FontMeasures;

  private constructor(family: Family, measures: FontMeasures) {
    this.#family = family;
    this.#measures = measures;
  }

  static of({ family, ...measures }: FontData): Font {
    rejectInvalidMeasures(measures);
    return new Font(family, measures);
  }

  family(): Family {
    return this.#family;
  }

  baseSize(): number {
    return this.#measures.size;
  }

  maximumLines(): number {
    return this.#measures.maximumLines;
  }

  /** Height the text takes at the base size with every allowed line. */
  maximumHeight(): number {
    const { size, lineHeight, maximumLines } = this.#measures;
    return Math.round(size * lineHeight * maximumLines);
  }
}
