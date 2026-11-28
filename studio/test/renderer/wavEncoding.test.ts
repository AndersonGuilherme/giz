import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromWav } from 'gizzycera-core/src/infrastructure/voice/wav.ts';
import { mixedDown, wavOf } from '../../src/renderer/media/wavEncoding.ts';

test('a take becomes a 16-bit mono WAV that core reads back with the same samples and rate', () => {
  const samples = Float32Array.from([0, 0.5, -0.5, 1, -1, 1.7]);
  const audio = fromWav(Buffer.from(wavOf(samples, 48000)));
  assert.equal(audio.rate(), 48000);
  const read = [...audio.samples()].map((value) => Math.round(value * 100) / 100);
  assert.deepEqual(read, [0, 0.5, -0.5, 1, -1, 1]);
});

test('a stereo take is averaged into one channel', () => {
  assert.deepEqual([...mixedDown([Float32Array.from([1, 0.5]), Float32Array.from([0, -0.5])])], [0.5, 0]);
  assert.deepEqual([...mixedDown([])], []);
});
