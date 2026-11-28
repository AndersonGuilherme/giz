import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPaidVoice } from '../../src/renderer/media/money.ts';

test('ElevenLabs and Fish are paid voices (asked before they are called); the local voice and a recording are not', () => {
  assert.deepEqual(['elevenlabs', 'fish', 'qwen', 'recording'].map(isPaidVoice), [true, true, false, false]);
});
