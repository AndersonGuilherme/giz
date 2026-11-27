import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placementOf } from '../../src/renderer/tour/placement.ts';

const view = { width: 1280, height: 860 };
const card = { width: 360, height: 220 };

test('with nothing to point at, the card is centred and there is no hole in the dim', () => {
  assert.deepEqual(placementOf(null, view, card), { hole: null, card: { top: 320, left: 460 }, side: 'centre' });
});

test('the card goes below a target near the top, aligned with it and kept inside the window', () => {
  const placed = placementOf({ top: 100, left: 1100, width: 120, height: 36 }, view, card);
  assert.deepEqual(placed.hole, { top: 92, left: 1092, width: 136, height: 52 });
  assert.equal(placed.side, 'below');
  assert.equal(placed.card.top, 92 + 52 + 14);
  assert.equal(placed.card.left, 1280 - 360 - 16, 'clamped to the right edge');
});

test('above a target near the bottom; beside a tall one (the left side when the right has no room)', () => {
  const low = placementOf({ top: 700, left: 40, width: 400, height: 60 }, view, card);
  assert.equal(low.side, 'above');
  assert.equal(low.card.top, 692 - 14 - 220);
  assert.equal(low.card.left, 32);
  const tall = placementOf({ top: 80, left: 930, width: 330, height: 740 }, view, card);
  assert.equal(tall.side, 'left');
  assert.equal(tall.card.left, 922 - 14 - 360);
  assert.ok(tall.card.top >= 16 && tall.card.top + 220 <= 860 - 16);
  const wide = placementOf({ top: 60, left: 20, width: 600, height: 760 }, view, card);
  assert.equal(wide.side, 'right');
});
