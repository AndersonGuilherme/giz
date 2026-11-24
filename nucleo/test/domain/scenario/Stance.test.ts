import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Stance } from '../../../src/domain/scenario/Stance.ts';

const spot = { character: 'ana', x: 500, y: 1000, height: 600, side: 1 as const };
const viewBox = { x: 0, y: 0, width: 100, height: 100 };

test('without a reach the box goes from the top of the view box down to the soles', () => {
  const box = Stance.of({ viewBox, feet: { x: 50, y: 100 } }).boxFor(spot);
  assert.deepEqual([box.x, box.y, box.width, box.height], [200, 400, 600, 600]);
  assert.equal(box.label, 'personagem ana');
});
test('a reach above the view box (a tall hat, a floating ghost) raises the top of the box', () => {
  const box = Stance.of({ viewBox, feet: { x: 50, y: 100 }, top: -20 }).boxFor(spot);
  assert.deepEqual([box.y, box.height], [400 - 120, 720]);
});
test('a reach below the view box top (a bald head) lowers it: the box is what is drawn', () => {
  const box = Stance.of({ viewBox, feet: { x: 50, y: 100 }, top: 10 }).boxFor(spot);
  assert.deepEqual([box.y, box.height], [460, 540]);
});
