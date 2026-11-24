import { DomainError } from '../DomainError.ts';

export type AspectRatioText = '9:16' | '16:9';

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

  text(): AspectRatioText {
    return this.vertical() ? '9:16' : '16:9';
  }
}
