import type { Box } from './Box.ts';

function pairsOf(list: readonly Box[]): Array<[Box, Box]> {
  return list.flatMap((first, index) => list.slice(index + 1).map((second): [Box, Box] => [first, second]));
}

/** The boxes a scene takes in a frame. */
export class Boxes {
  readonly #list: readonly Box[];

  private constructor(list: readonly Box[]) {
    this.#list = list;
  }

  static of(list: readonly Box[]): Boxes {
    return new Boxes([...list]);
  }

  static empty(): Boxes {
    return new Boxes([]);
  }

  with(box: Box): Boxes {
    return new Boxes([...this.#list, box]);
  }

  overlappingPairs(): Array<[Box, Box]> {
    return pairsOf(this.#list).filter(([first, second]) => first.overlaps(second));
  }

  outsideOf(area: Box): Box[] {
    return this.#list.filter((box) => !box.isInside(area));
  }

  overflowingTexts(): Box[] {
    return this.#list.filter((box) => !box.textFits());
  }
}
