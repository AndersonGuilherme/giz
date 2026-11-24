import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isQwenVoice, QWEN_VOICES } from '../../../src/infrastructure/voice/qwenVoices.ts';

test('the nine Qwen voices, and only them', () => {
  assert.deepEqual([...QWEN_VOICES], ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan']);
  assert.equal(isQwenVoice('vivian'), true);
  assert.equal(isQwenVoice('Vivian'), false);
  assert.equal(isQwenVoice('roberto'), false);
});

// Reads the motor file as text (importing it would load onnxruntime): the copy must match QWEN_SPEAKERS.
test('the list mirrors QWEN_SPEAKERS in motor/scripts/qwen3-tts.ts', async () => {
  const source = await readFile(new URL('../../../../motor/scripts/qwen3-tts.ts', import.meta.url), 'utf8');
  const declared = /QWEN_SPEAKERS = \[([^\]]*)\]/.exec(source)?.[1] ?? '';
  assert.deepEqual([...declared.matchAll(/'([^']+)'/g)].map((match) => match[1]), [...QWEN_VOICES]);
});
