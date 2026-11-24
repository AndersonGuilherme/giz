import { DomainError } from '../DomainError.ts';

const FLOATING_POINT_TOLERANCE = 1e-9;

export class Fps {
  static readonly DEFAULT = new Fps(30);

  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  value(): number {
    return this.#value;
  }
}

export class Frame {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(number: number): Frame {
    if (!Number.isInteger(number) || number < 0) {
      throw new DomainError(`quadro ${number} inválido (use um inteiro maior ou igual a 0)`);
    }
    return new Frame(number);
  }

  plus(other: Frame): Frame {
    return new Frame(this.#value + other.#value);
  }

  minus(other: Frame): Frame {
    return new Frame(Math.max(0, this.#value - other.#value));
  }

  isBefore(other: Frame): boolean {
    return this.#value < other.#value;
  }

  /** The instant where the frame starts. */
  toSeconds(fps: Fps): Seconds {
    return Seconds.of(this.#value / fps.value());
  }

  value(): number {
    return this.#value;
  }
}

export class Seconds {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(number: number): Seconds {
    if (!Number.isFinite(number) || number < 0) {
      throw new DomainError(`segundos ${number} inválido (use um número maior ou igual a 0)`);
    }
    return new Seconds(number);
  }

  toFrames(fps: Fps): Frame {
    return Frame.of(Math.max(0, Math.ceil(this.#value * fps.value() - FLOATING_POINT_TOLERANCE)));
  }

  plus(other: Seconds): Seconds {
    return new Seconds(this.#value + other.#value);
  }

  value(): number {
    return this.#value;
  }
}
