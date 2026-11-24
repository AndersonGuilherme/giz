import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FireLayout } from '../../../src/domain/scenario/FireLayout.ts';
import { Flame } from '../../../src/domain/scenario/Flame.ts';
import { EffectCenter } from '../../../src/domain/scenario/EffectCenter.ts';
import { Flicker } from '../../../src/domain/scenario/Flicker.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const HORIZONTAL = AspectRatio.of('16:9');
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('the fire scale is 0.85 units per fire unit times the intensity (clamped)', () => {
  close(FireLayout.for({ type: 'fire' }, HORIZONTAL, Frame.of(0)).scale, 1.08 * 0.85);
  close(FireLayout.for({ type: 'fire', intensity: 2 }, HORIZONTAL, Frame.of(0)).scale, 1.08 * 0.85 * 2);
  close(FireLayout.for({ type: 'fire', intensity: 50 }, HORIZONTAL, Frame.of(0)).scale, 1.08 * 0.85 * 3);
});

test('the embers rise in a column above the fire, 280 × 480 fire units', () => {
  const fire = FireLayout.for({ type: 'fire' }, HORIZONTAL, Frame.of(20));
  const center = EffectCenter.of({ type: 'fire' }, HORIZONTAL);
  assert.equal(fire.embers.length, 22);
  for (const ember of fire.embers) {
    assert.ok(ember.x >= center.x - 140 * fire.scale - 1e-9 && ember.x <= center.x + 140 * fire.scale + 1e-9);
    assert.ok(ember.y >= center.y - 560 * fire.scale - 1e-9 && ember.y <= center.y - 80 * fire.scale + 1e-9);
  }
});

test('the light follows the flicker: 0.6 × flicker, radius 950 fire units', () => {
  const frame = Frame.of(33);
  const fire = FireLayout.for({ type: 'fire' }, HORIZONTAL, frame);
  close(fire.light.opacity, 0.6 * Flicker.for('fire').at(frame));
  close(fire.light.radius, 950 * fire.scale);
});

test('the flame has three rings (outer to core), each smaller, with five tongues', () => {
  const rings = Flame.at(Frame.of(10));
  assert.equal(rings.length, 3);
  rings.forEach((ring) => assert.equal(ring.length, 5));
  assert.ok(rings[1]![2]!.height < rings[0]![2]!.height && rings[2]![2]!.height < rings[1]![2]!.height);
});

test('a tongue stretches with its flicker (÷ 0.85) and leans with (flicker − 0.82) × 2.5', () => {
  const frame = Frame.of(17);
  const [outer] = Flame.at(frame);
  close(outer![2]!.height, 235 * (Flicker.for('tongue-2').at(frame) / 0.85));
  close(outer![2]!.lean, (Flicker.for('lean-2').at(frame) - 0.82) * 2.5);
});

test('the flame moves from frame to frame and repeats for the same frame', () => {
  assert.deepEqual(Flame.at(Frame.of(5)), Flame.at(Frame.of(5)));
  assert.notDeepEqual(Flame.at(Frame.of(5)), Flame.at(Frame.of(6)));
});
