import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Parallax } from '../../../src/domain/scenario/Parallax.ts';
import { Framing } from '../../../src/domain/camera/Framing.ts';

const camera = Framing.of({ zoom: 1.3, x: 0.1, y: -0.05, rotation: 1 });

test('parallax: the back layer moves less than the front one', () => {
  const back = Parallax.offset(0, camera);
  const middle = Parallax.offset(1, camera);
  const front = Parallax.offset(2, camera);
  assert.ok(Math.abs(back.x) < Math.abs(middle.x) && Math.abs(middle.x) < Math.abs(front.x));
  assert.ok(Math.abs(back.y) < Math.abs(front.y));
  assert.ok(back.zoom < middle.zoom && middle.zoom < front.zoom);
});

test('the layers follow 0.3, 0.6 and 1.0 of the camera move', () => {
  const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
  close(Parallax.offset(0, camera).x, 0.03);
  close(Parallax.offset(1, camera).x, 0.06);
  close(Parallax.offset(0, camera).zoom, 1.09);
  assert.deepEqual(Parallax.offset(2, camera), camera);
});

test('a still camera moves no layer', () => {
  for (const layer of [0, 1, 2] as const) assert.deepEqual(Parallax.offset(layer, Framing.neutral()), Framing.neutral());
});
