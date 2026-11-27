import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageCostEstimate } from '../../../src/domain/ai/imagePrices.ts';
import { imageTierOf } from '../../../src/domain/ai/ImageTier.ts';
import { isImageProvider } from '../../../src/domain/ai/ImageProviderName.ts';

test('resolution class by the longest side: 1K up to 1024, 2K up to 2560 (a 2160 scenario), then 4K', () => {
  assert.equal(imageTierOf({ width: 1024, height: 768 }), '1K');
  assert.equal(imageTierOf({ width: 1216, height: 2160 }), '2K');
  assert.equal(imageTierOf({ width: 3840, height: 2160 }), '4K');
});

test('image prices: per class (Gemini), per started megapixel (Flux), per output token (GPT Image)', () => {
  assert.equal(imageCostEstimate('gemini', 'gemini-nano-banana-2.1', { width: 1024, height: 1024 }).dollars(), 0.0336);
  assert.equal(imageCostEstimate('gemini', 'gemini-nano-banana-2.1', { width: 2160, height: 1216 }).dollars(), 0.0504);
  assert.ok(Math.abs(imageCostEstimate('fal', 'fal-ai/flux-2-pro', { width: 1024, height: 1024 }).dollars()! - 0.055) < 1e-12);
  assert.ok(Math.abs(imageCostEstimate('fal', 'fal-ai/flux-2-pro', { width: 1025, height: 1024 }).dollars()! - 0.11) < 1e-12);
  const openai = imageCostEstimate('openai', 'gpt-image-2.6-sunburst', { width: 1024, height: 1024 }).dollars()!;
  assert.ok(Math.abs(openai - 1031 * 30 / 1e6) < 1e-12);
});

test('a model outside the table (or a prototype key) has an unknown cost, never a guess', () => {
  assert.equal(imageCostEstimate('openai', 'dall-e-2', { width: 1024, height: 1024 }).isKnown(), false);
  assert.equal(imageCostEstimate('fal', 'constructor', { width: 1024, height: 1024 }).isKnown(), false);
});

test('image provider names', () => {
  assert.ok(isImageProvider('fal'));
  assert.ok(!isImageProvider('anthropic'));
  assert.ok(!isImageProvider(undefined));
});
