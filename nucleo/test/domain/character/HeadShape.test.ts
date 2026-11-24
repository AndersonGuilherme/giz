import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEAD_SHAPES, HeadShape } from '../../../src/domain/character/HeadShape.ts';
import type { Point } from '../../../src/domain/drawing/Silhouette.ts';

// Ray casting over the sampled outline.
function inside(outline: readonly Point[], { x, y }: Point): boolean {
  let crossings = 0;
  outline.slice(1).forEach((to, index) => {
    const from = outline[index]!;
    if ((from.y > y) !== (to.y > y) && x < ((to.x - from.x) * (y - from.y)) / (to.y - from.y) + from.x) crossings += 1;
  });
  return crossings % 2 === 1;
}

// Face units (head radius 100): the eyes sit at x ±39 around y 2 (up to 31 high), the nose at y 35, the mouth at y 60
// and its widest silent smile spans x ±34.
const FEATURES: readonly Point[] = [
  { x: -39, y: -30 }, { x: 39, y: -30 }, { x: -60, y: 2 }, { x: 60, y: 2 }, { x: 0, y: 35 }, { x: -34, y: 60 }, { x: 34, y: 60 }, { x: 0, y: 78 },
];

test('the four head shapes, round first', () => {
  assert.deepEqual([...HEAD_SHAPES], ['round', 'oval', 'soft-square', 'bean']);
});

test('every head shape is closed and holds every face feature inside it', () => {
  for (const shape of HEAD_SHAPES) {
    const outline = HeadShape.outline(shape);
    assert.equal(outline.closed(), true, shape);
    const points = outline.points(3);
    FEATURES.forEach((feature) => assert.ok(inside(points, feature), `${shape}: (${feature.x}, ${feature.y})`));
  }
});

test('every head shape stays in the head frame (about the round head, radius 100)', () => {
  for (const shape of HEAD_SHAPES) {
    const points = HeadShape.outline(shape).points(3);
    assert.ok(points.every(({ x, y }) => Math.abs(x) <= 108 && Math.abs(y) <= 112), shape);
    assert.ok(Math.max(...points.map(({ y }) => y)) > 92, `${shape} reaches the chin`);
  }
});

test('the shapes are really different from each other', () => {
  const paths = HEAD_SHAPES.map((shape) => HeadShape.outline(shape).path());
  assert.equal(new Set(paths).size, HEAD_SHAPES.length);
});
