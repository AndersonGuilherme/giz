import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROP_LIMITS } from '../../../core/src/domain/scenario/ImageCrop.ts';
import { dragged, zoomed, NO_CROP } from '../../src/renderer/scenarios/cropDrag.ts';

// A square 800×800 picture in a 9:16 box 180×320: it covers by height (320×320 shown), 140 px to spare sideways.
const SHAPE = { box: { width: 180, height: 320 }, picture: { width: 800, height: 800 }, limits: CROP_LIMITS };

test('dragging the picture right shows more of its left side; the focus stays within 0..1', () => {
  const right = dragged(NO_CROP, { dx: 70, dy: 0 }, SHAPE);
  assert.equal(right.x, 0);
  assert.equal(dragged(NO_CROP, { dx: -35, dy: 0 }, SHAPE).x, 0.75);
  assert.equal(dragged(NO_CROP, { dx: -1000, dy: 0 }, SHAPE).x, 1);
});

test('without spare picture in a direction (zoom 1, covered by height), a vertical drag changes nothing', () => {
  assert.equal(dragged(NO_CROP, { dx: 0, dy: 50 }, SHAPE).y, 0.5);
  const zoomedIn = { zoom: 2, x: 0.5, y: 0.5 };
  assert.ok(dragged(zoomedIn, { dx: 0, dy: 80 }, SHAPE).y < 0.5, 'zoomed in, there is spare picture above and below');
});

test('the zoom stays from 1 to 4, rounded to hundredths', () => {
  assert.equal(zoomed(NO_CROP, 0.3, CROP_LIMITS).zoom, 1);
  assert.equal(zoomed(NO_CROP, 9, CROP_LIMITS).zoom, 4);
  assert.equal(zoomed(NO_CROP, 1.234, CROP_LIMITS).zoom, 1.23);
});
