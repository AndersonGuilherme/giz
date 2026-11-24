import { DomainError } from '../DomainError.ts';

export type AspectRatioText = '9:16' | '16:9';

// How far (as a fraction) an image width-to-height ratio may be from the video's before it is a different aspect.
const TOLERANCE = 0.05;

export class AspectRatio {
  static readonly VERTICAL = new AspectRatio(1080, 1920);
  static readonly HORIZONTAL = new AspectRatio(1920, 1080);

  readonly #width: number;
  readonly #height: number;

  private constructor(width: number, height: number) {
    this.#width = width;
    this.#height = height;
  }

  static of(text: string): AspectRatio {
    const supported = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
    const found = supported.find((aspect) => aspect.text() === text);
    if (!found) throw new DomainError(`proporção "${text}" não suportada (use 9:16 ou 16:9)`);
    return found;
  }

  /** The aspect ratio of a video size (the video props carry the size, not the ratio). */
  static ofSize(width: number, height: number): AspectRatio {
    const supported = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
    const found = supported.find((aspect) => aspect.width() === width && aspect.height() === height);
    if (!found) throw new DomainError(`tamanho ${width}×${height} não suportado (use 1080×1920 ou 1920×1080)`);
    return found;
  }

  width(): number {
    return this.#width;
  }

  height(): number {
    return this.#height;
  }

  vertical(): boolean {
    return this.#height > this.#width;
  }

  /** Whether a size (a scenario image) has this aspect, within 5%: otherwise covering the frame crops it. */
  matches(width: number, height: number): boolean {
    const ratio = width / height / (this.#width / this.#height);
    return Math.abs(ratio - 1) <= TOLERANCE;
  }

  text(): AspectRatioText {
    return this.vertical() ? '9:16' : '16:9';
  }
}
