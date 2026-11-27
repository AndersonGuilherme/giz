import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CostEstimate } from '../../../src/domain/ai/CostEstimate.ts';
import { pendingCosts } from '../../../src/domain/stages/PendingCosts.ts';
import { voiceCostEstimate } from '../../../src/domain/ai/voicePrices.ts';

const cents = (value: number) => CostEstimate.ofDollars(value / 100);

test('the total sums the text, the pending images and the pending voices', () => {
  const costs = pendingCosts({ text: { cost: cents(5) }, images: [cents(10), cents(10)], voices: [cents(1)] });
  assert.equal(costs.images.count, 2);
  assert.equal(costs.voices.count, 1);
  assert.ok(Math.abs(costs.total.dollars()! - 0.26) < 1e-9);
});

test('no text step and nothing pending costs zero', () => {
  const costs = pendingCosts({ images: [], voices: [] });
  assert.equal(costs.text, undefined);
  assert.equal(costs.total.dollars(), 0);
});

test('an unknown part makes the total unknown (never a guess)', () => {
  assert.equal(pendingCosts({ images: [cents(10), CostEstimate.UNKNOWN], voices: [] }).total.isKnown(), false);
  assert.equal(pendingCosts({ text: { cost: CostEstimate.UNKNOWN, problem: 'sem idea.json' }, images: [], voices: [] }).total.isKnown(), false);
  const unloaded = pendingCosts({ images: undefined, voices: undefined });
  assert.equal(unloaded.images.count, undefined);
  assert.equal(unloaded.images.cost.isKnown(), false);
  assert.equal(unloaded.total.isKnown(), false);
});

test('voice prices: Qwen and recording are free; ElevenLabs per character; Fish per UTF-8 byte', () => {
  assert.equal(voiceCostEstimate('qwen', undefined, 'Olá, mundo.').dollars(), 0);
  assert.equal(voiceCostEstimate('recording', undefined, 'Olá, mundo.').dollars(), 0);
  // 1000 characters of Multilingual v2: US$ 0.08.
  assert.ok(Math.abs(voiceCostEstimate('elevenlabs', 'eleven_multilingual_v2', 'a'.repeat(1000)).dollars()! - 0.08) < 1e-12);
  assert.ok(Math.abs(voiceCostEstimate('elevenlabs', 'eleven_flash_v2_5', 'ã'.repeat(1000)).dollars()! - 0.04) < 1e-12);
  // "ã" is 2 UTF-8 bytes: 1000 of them are 2000 bytes, at US$ 15 per million bytes.
  assert.ok(Math.abs(voiceCostEstimate('fish', 's1', 'ã'.repeat(1000)).dollars()! - 0.03) < 1e-12);
  assert.ok(Math.abs(voiceCostEstimate('fish', 's2-pro', '😀').dollars()! - 0.00006) < 1e-12);
  assert.equal(voiceCostEstimate('fish', 's2.1-pro-free', 'abc').dollars(), 0);
});

test('a paid voice model outside the table, or without a model, has an unknown cost', () => {
  assert.equal(voiceCostEstimate('elevenlabs', 'eleven_v9', 'abc').isKnown(), false);
  assert.equal(voiceCostEstimate('fish', undefined, 'abc').isKnown(), false);
});
