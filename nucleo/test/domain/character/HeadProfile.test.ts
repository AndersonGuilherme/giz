import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeadProfile } from '../../../src/domain/character/HeadProfile.ts';
import { HEAD_SHAPES } from '../../../src/domain/character/HeadShape.ts';

const near = (actual: number, expected: number, tolerance = 0.8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('the round head is 100 units from its center in every direction', () => {
  const profile = HeadProfile.of('round');
  for (const angle of [-180, -135, -90, -30, 0, 45, 90, 170, 200]) near(profile.radiusAt(angle), 100);
});

test('the oval is taller than wide: top, chin and half width come from the shape', () => {
  const profile = HeadProfile.of('oval');
  near(profile.top(), -108);
  near(profile.chin(), 108);
  near(profile.halfWidthAt(0), 90);
  assert.ok(profile.halfWidthAt(-80) < 70, 'narrower near the top');
  assert.equal(profile.halfWidthAt(-120), 0, 'nothing above the top');
});

test('at() pushes the outline point outward by grow, inward when negative', () => {
  const profile = HeadProfile.of('soft-square');
  const [on, out, inner] = [profile.at(-90), profile.at(-90, 10), profile.at(-90, -10)];
  near(out.y, on.y - 10);
  near(inner.y, on.y + 10);
  near(on.x, 0, 1e-6);
});

test('an arc runs from one direction to the other, either way round, on the grown outline', () => {
  const profile = HeadProfile.of('round');
  const over = profile.arc(-170, -10, 5);
  near(over[0]!.x, -105 * Math.cos((10 * Math.PI) / 180));
  assert.ok(over.some(({ y }) => y < -104), 'passes over the top');
  const back = profile.arc(-10, -170, (angle) => (angle < -90 ? 0 : 20));
  near(Math.hypot(back[0]!.x, back[0]!.y), 120);
  near(Math.hypot(back.at(-1)!.x, back.at(-1)!.y), 100);
});

test('every head shape has a profile, cached', () => {
  for (const shape of HEAD_SHAPES) {
    assert.equal(HeadProfile.of(shape), HeadProfile.of(shape));
    assert.ok(HeadProfile.of(shape).top() < -90 && HeadProfile.of(shape).chin() > 90, shape);
  }
});
