import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EffectStrength, MAXIMUM_INTENSITY } from '../../../src/domain/scenario/EffectStrength.ts';

test('each effect type has its own default intensity', () => {
  assert.equal(EffectStrength.of({ type: 'vignette' }).intensity(), 0.7);
  assert.equal(EffectStrength.of({ type: 'tint' }).intensity(), 0.35);
  assert.equal(EffectStrength.of({ type: 'glow' }).intensity(), 0.6);
  assert.equal(EffectStrength.of({ type: 'rain' }).intensity(), 1);
});

test('the intensity is clamped to 0–3, so a typo cannot ask for 14,000 drops', () => {
  assert.equal(MAXIMUM_INTENSITY, 3);
  assert.equal(EffectStrength.of({ type: 'rain', intensity: 100 }).intensity(), 3);
  assert.equal(EffectStrength.of({ type: 'rain', intensity: -1 }).intensity(), 0);
  assert.equal(EffectStrength.of({ type: 'rain', intensity: 100 }).count(140), 420);
});

test('count scales a base amount by the intensity and rounds it', () => {
  assert.equal(EffectStrength.of({ type: 'particles', intensity: 0.6 }).count(50), 30);
  assert.equal(EffectStrength.of({ type: 'snow' }).count(90), 90);
});
