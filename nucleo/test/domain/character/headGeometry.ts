import { HEAD_SHAPES, type HeadShapeName } from '../../../src/domain/character/HeadShape.ts';
import type { HeadPart } from '../../../src/domain/character/HeadPart.ts';
import type { Point } from '../../../src/domain/drawing/Silhouette.ts';

/** Ray casting over a sampled outline. */
export function inside(outline: readonly Point[], { x, y }: Point): boolean {
  let crossings = 0;
  outline.slice(1).forEach((to, index) => {
    const from = outline[index]!;
    if ((from.y > y) !== (to.y > y) && x < ((to.x - from.x) * (y - from.y)) / (to.y - from.y) + from.x) crossings += 1;
  });
  return crossings % 2 === 1;
}

export const covers = (parts: readonly HeadPart[], point: Point) => parts.some(({ outline }) => inside(outline.points(2), point));

export const pointsOf = (parts: readonly HeadPart[]) => parts.flatMap(({ outline }) => outline.points(3));

/**
 * Face units (head radius 100): the eye tops at (±39, -30), the outer eye corners at (±60, 2), the eye centers at
 * (±39, 2), the brows at (±41, -40) and the nose at (0, 35).
 */
export const EYES_AND_BROWS: readonly Point[] = [
  { x: -39, y: -30 }, { x: 39, y: -30 }, { x: -60, y: 2 }, { x: 60, y: 2 }, { x: -39, y: 2 }, { x: 39, y: 2 }, { x: -41, y: -40 }, { x: 41, y: -40 },
];
export const NOSE: Point = { x: 0, y: 35 };

/** Every item paired with every head shape. */
export const onEveryHead = <Item>(items: readonly Item[]): (readonly [Item, HeadShapeName])[] =>
  items.flatMap((item) => HEAD_SHAPES.map((shape) => [item, shape] as const));
