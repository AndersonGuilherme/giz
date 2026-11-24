import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EffectLooks } from '../../../src/domain/scenario/EffectLooks.ts';
import { Flicker } from '../../../src/domain/scenario/Flicker.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const HORIZONTAL = AspectRatio.of('16:9');
const VERTICAL = AspectRatio.of('9:16');
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('vignette opacity is 1.25 × intensity, never above 1', () => {
  close(EffectLooks.vignette({ type: 'vignette', intensity: 0.4 }), 0.5);
  assert.equal(EffectLooks.vignette({ type: 'vignette', intensity: 3 }), 1);
});

test('tint opacity is its intensity', () => {
  assert.equal(EffectLooks.tint({ type: 'tint' }), 0.35);
});

test('glow breathes between 85% and 100% of its intensity, around its center', () => {
  const frame = Frame.of(12);
  const glow = EffectLooks.glow({ type: 'glow', intensity: 0.6 }, HORIZONTAL, frame);
  close(glow.opacity, 0.6 * (0.85 + 0.15 * Flicker.for('glow').at(frame)));
  assert.deepEqual(glow.center, { x: 960, y: 0.35 * 1080 });
  close(glow.radius, 620 * 1.08);
});

test('screen particles: count from the intensity, field bleeding past the frame so they enter from outside', () => {
  const rain = EffectLooks.screenParticles({ type: 'rain', intensity: 0.5 }, VERTICAL, Frame.of(3));
  assert.equal(rain.particles.length, 70);
  assert.ok(rain.particles.every((drop) => drop.y >= -0.1 * 1920 && drop.y <= 1.1 * 1920));
  close(rain.size, 60 * 1.08);
  assert.equal(EffectLooks.screenParticles({ type: 'snow' }, HORIZONTAL, Frame.of(3)).particles.length, 90);
  assert.equal(EffectLooks.screenParticles({ type: 'particles' }, HORIZONTAL, Frame.of(3)).particles.length, 50);
});

test('screen particles are deterministic per frame', () => {
  const at = () => EffectLooks.screenParticles({ type: 'snow' }, HORIZONTAL, Frame.of(40));
  assert.deepEqual(at(), at());
});
