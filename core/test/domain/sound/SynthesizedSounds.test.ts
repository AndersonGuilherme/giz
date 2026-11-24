import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_RATE, synthesizedSounds } from '../../../src/domain/sound/SynthesizedSounds.ts';

test('the seven script sounds, with the motor durations', () => {
  const sounds = synthesizedSounds();
  const seconds = Object.fromEntries(Object.entries(sounds).map(([name, samples]) => [name, samples.length / SOUND_RATE]));
  assert.deepEqual(seconds, { pop: 0.18, whoosh: 0.4, ding: 0.6, dings: 2.6, error: 0.55, success: 0.7, tick: 0.08 });
});

test('the sounds are the same on every run (fixed noise seed)', () => {
  assert.deepEqual(synthesizedSounds().whoosh, synthesizedSounds().whoosh);
});
