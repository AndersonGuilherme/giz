import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_STYLES, DEFAULT_IMAGE_STYLE, stylePresetOf } from '../../../src/domain/scenario/ImageStyle.ts';
import { IMAGE_BLEED, ScenarioImageFrame } from '../../../src/domain/scenario/ScenarioImageFrame.ts';
import { scenarioImagePrompt } from '../../../src/domain/scenario/ScenarioImagePrompt.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

test('the scenario image is the frame plus the 6% camera bleed on each side, in multiples of 16, same aspect', () => {
  assert.equal(IMAGE_BLEED, 0.06);
  const vertical = ScenarioImageFrame.sizeFor(AspectRatio.VERTICAL);
  const horizontal = ScenarioImageFrame.sizeFor(AspectRatio.HORIZONTAL);
  assert.deepEqual(vertical, { width: 1216, height: 2160 });
  assert.deepEqual(horizontal, { width: 2160, height: 1216 });
  assert.ok(AspectRatio.VERTICAL.matches(vertical.width, vertical.height));
  assert.ok(AspectRatio.HORIZONTAL.matches(horizontal.width, horizontal.height));
  assert.ok(vertical.width >= 1080 * 1.12 && vertical.height >= 1920 * 1.12);
});

test('a frame position maps into the image: the frame edges sit 6/112 inside it', () => {
  assert.equal(ScenarioImageFrame.inImage(0.5), 0.5);
  assert.ok(Math.abs(ScenarioImageFrame.inImage(0) - 0.06 / 1.12) < 1e-12);
  assert.ok(Math.abs(ScenarioImageFrame.inImage(1) - 1.06 / 1.12) < 1e-12);
});

test('every style has its own preset text; the default is painted 2D', () => {
  assert.equal(DEFAULT_IMAGE_STYLE, 'painted-2d');
  const presets = IMAGE_STYLES.map(stylePresetOf);
  assert.equal(new Set(presets).size, IMAGE_STYLES.length);
  assert.match(stylePresetOf('watercolor'), /watercolor/);
  assert.match(stylePresetOf('chalk'), /chalk/);
});

test('the prompt: style preset first, then the scene, the composition from the backdrop, no text, originality', () => {
  const prompt = scenarioImagePrompt({ prompt: '  uma praça ao entardecer ', style: 'flat-vector', aspect: AspectRatio.VERTICAL });
  const parts = prompt.split('\n\n');
  assert.equal(parts.length, 5);
  assert.equal(parts[0], stylePresetOf('flat-vector'));
  assert.equal(parts[1], 'Scene: uma praça ao entardecer');
  assert.match(parts[2]!, /characters are added later/);
  assert.match(parts[3]!, /No text, letters, numbers, signs, logos/);
  assert.match(parts[3]!, /No real, recognizable landmarks/);
  assert.match(parts[4]!, /original scene/);
});

// 9:16 BackdropLayout: stage x 158–894 of 1080, heads at 682 and feet (ground) at 1450 of 1920, horizon 1288, focus (540, 609).
test('9:16 composition: the characters\' stage, horizon and focus, in percent of the image (with the bleed)', () => {
  const hint = scenarioImagePrompt({ prompt: 'p', style: 'painted-2d', aspect: AspectRatio.VERTICAL }).split('\n\n')[2]!;
  const inImage = (pixels: number, side: number) => Math.round(ScenarioImageFrame.inImage(pixels / side) * 100);
  assert.match(hint, new RegExp(`between ${inImage(158.304, 1080)}% to ${inImage(893.76, 1080)}% of the width`));
  assert.match(hint, new RegExp(`feet at ${inImage(1449.6, 1920)}% and heads at ${inImage(681.6, 1920)}% of the height`));
  assert.match(hint, new RegExp(`horizon line .* at about ${inImage(1287.6, 1920)}% from the top`));
  assert.match(hint, new RegExp(`around 50% across and ${inImage(609.2, 1920)}% down`));
  assert.match(hint, /no people, characters or animals/);
});

test('16:9 composition differs from 9:16 (another stage)', () => {
  const vertical = scenarioImagePrompt({ prompt: 'p', style: 'chalk', aspect: AspectRatio.VERTICAL });
  const horizontal = scenarioImagePrompt({ prompt: 'p', style: 'chalk', aspect: AspectRatio.HORIZONTAL });
  assert.notEqual(vertical, horizontal);
  assert.match(horizontal, /horizon line .* at about 74% from the top/);
});
