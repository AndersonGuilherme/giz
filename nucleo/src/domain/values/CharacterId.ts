import { DomainError } from '../DomainError.ts';

const VALID_FORMAT = /^[a-z0-9-]{1,32}$/;

export class CharacterId {
  static readonly NARRATOR = new CharacterId('narrator');

  readonly #text: string;

  private constructor(text: string) {
    this.#text = text;
  }

  static of(text: string): CharacterId {
    if (!VALID_FORMAT.test(text)) {
      throw new DomainError(`id de personagem "${text}" inválido (use de 1 a 32 caracteres entre a-z, 0-9 e "-")`);
    }
    return new CharacterId(text);
  }

  isNarrator(): boolean {
    return this.equals(CharacterId.NARRATOR);
  }

  text(): string {
    return this.#text;
  }

  equals(other: CharacterId): boolean {
    return this.#text === other.#text;
  }
}
