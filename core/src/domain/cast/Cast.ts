import { DomainError } from '../DomainError.ts';
import type { CharacterId } from '../values/CharacterId.ts';
import type { Character } from './Character.ts';

function idText(character: Character): string {
  const id = character.id();
  return id.text();
}

export class Cast {
  readonly #characters: readonly Character[];

  private constructor(characters: readonly Character[]) {
    this.#characters = characters;
  }

  static of(characters: readonly Character[]): Cast {
    return new Cast([...characters]);
  }

  contains(id: CharacterId): boolean {
    return this.#characters.some((character) => character.hasId(id));
  }

  character(id: CharacterId): Character {
    const found = this.#characters.find((character) => character.hasId(id));
    if (!found) throw new DomainError(`"${id.text()}" não está no elenco (${this.ids().join(', ')})`);
    return found;
  }

  each(): readonly Character[] {
    return this.#characters;
  }

  ids(): string[] {
    return this.#characters.map(idText);
  }
}
