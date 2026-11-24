import { DomainError } from '../DomainError.ts';
import type { CharacterInScene, NAMED_POSITIONS } from '../script/Scene.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';

/** Feet at (`x`, `y`) in video pixels; `height` of the rig's whole SVG; `side` 1 faces the right of the screen. */
export type Spot = Readonly<{ character: string; x: number; y: number; height: number; side: -1 | 1 }>;

type Named = (typeof NAMED_POSITIONS)[number];
// Fractions of the frame: `height` and `ground` of the frame height, `x` of its width.
type Size = Readonly<{ height: number; x: Readonly<Record<Named, number>> }>;
type Arrangement = Readonly<{ limit: number; ground: number; sizes: readonly Size[]; behind: Readonly<{ scale: number; lift: number }> }>;

// 9:16: one character large in the middle, or two with the second smaller and behind (the narrow frame has no room side by side).
const VERTICAL: Arrangement = {
  limit: 2,
  ground: 0.755,
  sizes: [
    { height: 0.4, x: { left: 0.4, center: 0.5, right: 0.6 } },
    { height: 0.34, x: { left: 0.34, center: 0.5, right: 0.66 } },
  ],
  behind: { scale: 0.8, lift: 0.035 },
};
// 16:9: up to three side by side, the same size, a little smaller as more come in.
const HORIZONTAL: Arrangement = {
  limit: 3,
  ground: 0.915,
  sizes: [
    { height: 0.7, x: { left: 0.3, center: 0.5, right: 0.7 } },
    { height: 0.66, x: { left: 0.28, center: 0.5, right: 0.72 } },
    { height: 0.6, x: { left: 0.22, center: 0.5, right: 0.78 } },
  ],
  behind: { scale: 1, lift: 0 },
};
const DIRECTION_SIDES: Readonly<Record<string, -1 | 1>> = { left: -1, right: 1 };

const arrangementOf = (aspect: AspectRatio): Arrangement => (aspect.vertical() ? VERTICAL : HORIZONTAL);

function rejectCrowd(count: number, aspect: AspectRatio): void {
  const { limit } = arrangementOf(aspect);
  if (count <= limit) return;
  throw new DomainError(`no máximo ${limit} personagens em ${aspect.text()} (a cena tem ${count}); divida a cena ou use 16:9`);
}

function feetOf(character: CharacterInScene, size: Size, aspect: AspectRatio): { x: number; y: number } {
  const ground = Placement.groundOf(aspect);
  if (typeof character.position === 'string') return { x: size.x[character.position] * aspect.width(), y: ground };
  return { x: character.position.x * aspect.width(), y: character.position.y * aspect.height() };
}

function sideOf(character: CharacterInScene, x: number, aspect: AspectRatio): -1 | 1 {
  const told = DIRECTION_SIDES[character.direction ?? 'front'];
  if (told) return told;
  return x <= aspect.width() / 2 ? 1 : -1;
}

/** Where each character stands, by aspect ratio; the list goes from back to front (drawing order). */
export class Placement {
  static for(characters: readonly CharacterInScene[], aspect: AspectRatio): Spot[] {
    rejectCrowd(characters.length, aspect);
    const spots = characters.map((character, index) => Placement.#spot(character, { index, count: characters.length }, aspect));
    return spots.sort((first, second) => first.y - second.y);
  }

  /** The floor line, in video pixels, where the feet rest and the backgrounds draw their floor. */
  static groundOf(aspect: AspectRatio): number {
    return arrangementOf(aspect).ground * aspect.height();
  }

  static #spot(character: CharacterInScene, order: { index: number; count: number }, aspect: AspectRatio): Spot {
    const { sizes, behind } = arrangementOf(aspect);
    const size = sizes[order.count - 1] ?? sizes[0]!;
    const back = order.index > 0 ? behind : { scale: 1, lift: 0 };
    const feet = feetOf(character, size, aspect);
    const height = size.height * aspect.height() * back.scale * (character.scale ?? 1);
    const y = feet.y - back.lift * aspect.height();
    return { character: character.character, x: feet.x, y, height, side: sideOf(character, feet.x, aspect) };
  }
}
