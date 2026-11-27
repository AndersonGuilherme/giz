import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CostEstimate } from '../../../src/domain/ai/CostEstimate.ts';
import { ModelPrice, estimatedTokens } from '../../../src/domain/ai/ModelPrice.ts';
import { DEFAULT_MAX_OUTPUT_TOKENS, textCostEstimate } from '../../../src/domain/ai/textPrices.ts';
import { isTextProvider, TEXT_PROVIDERS } from '../../../src/domain/ai/TextProviderName.ts';

const close = (actual: number | undefined, expected: number) => assert.ok(Math.abs((actual ?? NaN) - expected) < 1e-12, `${actual} ≠ ${expected}`);

test('a cost estimate is in US dollars, adds up, and an unknown part makes the sum unknown', () => {
  const sum = CostEstimate.ofDollars(0.25).plus(CostEstimate.ofDollars(0.5));
  assert.equal(sum.dollars(), 0.75);
  assert.ok(sum.isKnown());
  assert.equal(CostEstimate.ZERO.dollars(), 0);
  const unknown = sum.plus(CostEstimate.UNKNOWN);
  assert.equal(unknown.isKnown(), false);
  assert.equal(unknown.dollars(), undefined);
});

test('a cost cannot be negative or not a number', () => {
  assert.throws(() => CostEstimate.ofDollars(-1), { name: 'DomainError', message: /custo -1 inválido/ });
  assert.throws(() => CostEstimate.ofDollars(Number.NaN), { name: 'DomainError' });
  assert.throws(() => ModelPrice.perMillion(-2, 10), { name: 'DomainError', message: /preço/ });
});

test('a model price turns tokens into dollars (per million tokens)', () => {
  const price = ModelPrice.perMillion(2, 10);
  close(price.costOf(1_000_000, 0).dollars(), 2);
  close(price.costOf(1000, 500).dollars(), 0.002 + 0.005);
});

test('tokens are estimated at about 4 characters each, rounded up', () => {
  assert.equal(estimatedTokens(''), 0);
  assert.equal(estimatedTokens('abcd'), 1);
  assert.equal(estimatedTokens('abcde'), 2);
});

test('the estimate of a call: the system and prompt tokens in, the maximum output tokens out (an upper bound)', () => {
  const request = { system: 'a'.repeat(400), prompt: 'b'.repeat(400), maxTokens: 1000 };
  // claude-sonnet-5-5: $2 in / $10 out per million → 200 tokens in, 1000 out.
  close(textCostEstimate('anthropic', 'claude-sonnet-5-5', request).dollars(), 200 * 2e-6 + 1000 * 10e-6);
  // gpt-6.2-astra: $8 / $40.
  close(textCostEstimate('openai', 'gpt-6.2-astra', request).dollars(), 200 * 8e-6 + 1000 * 40e-6);
  // gemini-3.8-flash: $0.75 / $3.75.
  close(textCostEstimate('gemini', 'gemini-3.8-flash', request).dollars(), 200 * 0.75e-6 + 1000 * 3.75e-6);
});

test('without maxTokens the estimate uses the default output limit', () => {
  const estimate = textCostEstimate('anthropic', 'claude-haiku-5-5', { system: '', prompt: '' });
  close(estimate.dollars(), DEFAULT_MAX_OUTPUT_TOKENS * 0.5e-6);
});

test('a model missing from the price table gives an unknown cost, never a made-up one', () => {
  assert.equal(textCostEstimate('openai', 'gpt-futuro', { system: '', prompt: 'x' }).isKnown(), false);
  assert.equal(textCostEstimate('openai', 'constructor', { system: '', prompt: 'x' }).isKnown(), false);
});

test('the text providers are anthropic, openai and gemini', () => {
  assert.deepEqual([...TEXT_PROVIDERS], ['anthropic', 'openai', 'gemini']);
  assert.ok(isTextProvider('gemini'));
  assert.equal(isTextProvider('fish'), false);
  assert.equal(isTextProvider(undefined), false);
});

test('a cached prefix is priced as an Anthropic cache write (1.25×), an upper bound; other providers are unchanged', () => {
  const call = { system: 'a'.repeat(400), prompt: 'b'.repeat(800), maxTokens: 0 };
  const plain = textCostEstimate('anthropic', 'claude-sonnet-5-5', call).dollars() ?? 0;
  const cached = textCostEstimate('anthropic', 'claude-sonnet-5-5', { ...call, stablePrefix: 400 }).dollars() ?? 0;
  // 300 tokens plain; the system and the first 400 prompt characters (200 tokens) cost a quarter more.
  close(cached, plain + 0.25 * 200 * 2 / 1_000_000);
  assert.equal(textCostEstimate('openai', 'gpt-5.5', { ...call, stablePrefix: 400 }).dollars(), textCostEstimate('openai', 'gpt-5.5', call).dollars());
});
