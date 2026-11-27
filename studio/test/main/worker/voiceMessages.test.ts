import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromVoiceWorker, toVoiceWorker } from '../../../src/main/worker/voiceMessages.ts';

test('what the main process asks the voice worker: a project\'s lines, a sample, a cancel; nothing else', () => {
  const lines = { type: 'voices', id: 1, folder: '/p', only: '2', key: 'k', language: 'en' };
  assert.deepEqual(toVoiceWorker.parse(lines), lines);
  const sample = { type: 'sample', id: 2, voice: { provider: 'qwen', model: '0.6b' }, request: { id: 'vivian', text: 'Oi', language: 'pt-BR' }, language: 'pt-BR' };
  assert.deepEqual(toVoiceWorker.parse(sample), sample);
  assert.deepEqual(toVoiceWorker.parse({ type: 'cancel', id: 1 }), { type: 'cancel', id: 1 });
  assert.equal(toVoiceWorker.safeParse({ ...lines, extra: true }).success, false);
  assert.equal(toVoiceWorker.safeParse({ ...sample, voice: { provider: 'recording' } }).success, false);
  assert.equal(toVoiceWorker.safeParse({ type: 'render', id: 3 }).success, false);
});

test('what the voice worker answers: a line done, the end (with a sample\'s audio), a failure', () => {
  assert.equal(fromVoiceWorker.safeParse({ type: 'line', id: 1, done: 1, total: 2, lineId: '1' }).success, true);
  const sample = { wav: new Uint8Array([1, 2]), seconds: 0.5, envelope: [0, 1], visemes: 'XA' };
  assert.deepEqual(fromVoiceWorker.parse({ type: 'ended', id: 2, sample }), { type: 'ended', id: 2, sample });
  assert.equal(fromVoiceWorker.safeParse({ type: 'failed', id: 1, message: 'sem modelo' }).success, true);
  assert.equal(fromVoiceWorker.safeParse({ type: 'ended', id: 2, sample: { ...sample, wav: 'AAA' } }).success, false);
  assert.equal(fromVoiceWorker.safeParse({ type: 'line', id: 1 }).success, false);
});
