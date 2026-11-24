import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endRise, pitchTrack } from '../../../src/domain/speech/Pitch.ts';

const RATE = 16000;
// A glide from `from` Hz to `to` Hz, with continuous phase.
function glide(seconds: number, from: number, to: number): Float32Array {
  const length = Math.round(seconds * RATE);
  const samples = new Float32Array(length);
  let phase = 0;
  for (let index = 0; index < length; index++) {
    phase += (2 * Math.PI * (from + ((to - from) * index) / length)) / RATE;
    samples[index] = 0.5 * Math.sin(phase);
  }
  return samples;
}

test('the pitch of a steady tone is its frequency; silence has no pitch', () => {
  const track = pitchTrack(Float32Array.from([...new Float32Array(RATE / 2), ...glide(0.5, 200, 200)]), RATE);
  assert.equal(track[0], null);
  const voiced = track.filter((value): value is number => value !== null);
  assert.ok(voiced.length > 10);
  voiced.forEach((value) => assert.ok(Math.abs(value - 200) < 4, String(value)));
});

test('a question that ends going up has a positive end rise, one that ends going down a negative one', () => {
  const rising = Float32Array.from([...glide(0.8, 180, 180), ...glide(0.3, 180, 260)]);
  const falling = Float32Array.from([...glide(0.8, 180, 180), ...glide(0.3, 180, 120)]);
  assert.ok((endRise(rising, RATE) ?? 0) > 2);
  assert.ok((endRise(falling, RATE) ?? 0) < -2);
});

test('too little voice gives no end rise', () => {
  assert.equal(endRise(new Float32Array(RATE), RATE), null);
});
