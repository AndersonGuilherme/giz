import { DomainError } from '../DomainError.ts';
import type { Cast } from '../cast/Cast.ts';
import type { Line } from './Line.ts';

function speakerText(line: Line): string {
  const speaker = line.speaker();
  return speaker.text();
}

function rejectRepeatedIds(list: readonly Line[]): void {
  const ids = list.map((line) => line.id());
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated !== undefined) throw new DomainError(`id "${repeated}" repetido entre as falas`);
}

export class Lines {
  readonly #list: readonly Line[];

  private constructor(list: readonly Line[]) {
    this.#list = list;
  }

  static of(list: readonly Line[]): Lines {
    rejectRepeatedIds(list);
    return new Lines([...list]);
  }

  each(): readonly Line[] {
    return this.#list;
  }

  count(): number {
    return this.#list.length;
  }

  unknownIds(cast: Cast): string[] {
    const notInCast = this.#list.filter((line) => !cast.contains(line.speaker()));
    const ids = notInCast.map(speakerText);
    return [...new Set(ids)];
  }
}
