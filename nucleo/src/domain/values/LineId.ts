import { DomainError } from '../DomainError.ts';

// The id names the line files (voice/<id>.wav, recordings/<id>.wav): no "/", "." or anything that could leave a folder.
const VALID_FORMAT = /^[A-Za-z0-9_-]{1,32}$/;

/** The id of a script line, safe to use as a file name. */
export class LineId {
  readonly #text: string;

  private constructor(text: string) {
    this.#text = text;
  }

  static of(text: string): LineId {
    if (!VALID_FORMAT.test(text)) {
      throw new DomainError(`id de fala "${text}" inválido (use de 1 a 32 caracteres entre A-Z, a-z, 0-9, "_" e "-")`);
    }
    return new LineId(text);
  }

  text(): string {
    return this.#text;
  }
}
