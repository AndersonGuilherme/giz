import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { Envelope } from '../../../src/domain/speech/Envelope.ts';
import { Fps, Frame } from '../../../src/domain/values/Time.ts';

const RATE = 24000;
const segment = (seconds: number, amplitude: number) =>
  Array.from({ length: Math.round(seconds * RATE) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / RATE));
const audio = (...parts: number[][]) => Audio.of(Float32Array.from(parts.flat()), RATE);

test('one value per frame, rounding the duration up', () => {
  const envelope = Envelope.measure(audio(segment(1.01, 0.5)), Fps.DEFAULT);
  assert.equal(envelope.toJson().length, 31);
});

test('silence is 0 and a loud voice gets close to 1', () => {
  const envelope = Envelope.measure(audio(segment(0.5, 0), segment(0.5, 0.5), segment(0.5, 0)), Fps.DEFAULT);
  assert.equal(envelope.opening(Frame.of(0)), 0);
  assert.ok(envelope.opening(Frame.of(22)) >= 0.95);
  assert.equal(envelope.opening(Frame.of(44)), 0);
});

test('the opening stays between 0 and 1 and is 0 outside the audio', () => {
  const envelope = Envelope.measure(audio(segment(0.3, 0.2), segment(0.3, 0.6)), Fps.DEFAULT);
  envelope.toJson().forEach((value) => assert.ok(value >= 0 && value <= 1));
  assert.equal(envelope.opening(Frame.of(1000)), 0);
});

test('voiced frames are those with an opening above 0; a very quiet voice counts as silence', () => {
  const envelope = Envelope.measure(audio(segment(0.2, 0.01), segment(0.2, 0.5)), Fps.DEFAULT);
  const voiced = envelope.voicedFrames();
  assert.equal(voiced.length, 12);
  assert.deepEqual(voiced.slice(0, 4), [false, false, false, false]);
  assert.deepEqual(voiced.slice(8), [true, true, true, true]);
});

test('toJson returns a copy', () => {
  const envelope = Envelope.measure(audio(segment(0.2, 0.5)), Fps.DEFAULT);
  envelope.toJson().fill(9);
  assert.ok(envelope.toJson().every((value) => value <= 1));
});
