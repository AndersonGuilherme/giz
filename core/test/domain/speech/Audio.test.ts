import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { DomainError } from '../../../src/domain/DomainError.ts';

const RATE = 24000;
const constant = (seconds: number, value: number) => Array.from({ length: Math.round(seconds * RATE) }, () => value);

test('the duration is the sample count divided by the rate', () => {
  assert.equal(Audio.of(new Float32Array(36000), RATE).duration().value(), 1.5);
});

test('an invalid rate is rejected', () => {
  assert.throws(() => Audio.of(new Float32Array(10), 0), DomainError);
});

test('trimmed cuts the silence at the ends and keeps 0.04 s on each side', () => {
  const audio = Audio.of(Float32Array.from([...constant(0.5, 0), ...constant(1, 0.3), ...constant(0.5, 0.005)]), RATE);
  const trimmed = audio.trimmed();
  assert.ok(Math.abs(trimmed.duration().value() - 1.08) < 1 / RATE * 2, `duração ${trimmed.duration().value()}`);
});

test('trimmed does not go past the ends when there is no silence', () => {
  const audio = Audio.of(Float32Array.from(constant(1, 0.3)), RATE);
  assert.equal(audio.trimmed().duration().value(), 1);
});

test('normalized brings the volume to the target without clipping the peak', () => {
  const low = Audio.of(Float32Array.from(constant(1, 0.02)), RATE).normalized();
  assert.ok(Math.abs(low.samples()[0]! - 0.085) < 1e-6);
  const peak = Audio.of(Float32Array.from([...constant(1, 0.02), 0.5]), RATE).normalized();
  assert.ok(Math.max(...peak.samples()) <= 0.95 + 1e-6);
});
