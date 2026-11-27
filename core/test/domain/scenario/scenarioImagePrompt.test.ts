import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_STYLES, DEFAULT_IMAGE_STYLE, stylePresetOf } from '../../../src/domain/scenario/ImageStyle.ts';
import { IMAGE_BLEED, ScenarioImageFrame } from '../../../src/domain/scenario/ScenarioImageFrame.ts';
import { scenarioImagePrompt } from '../../../src/domain/scenario/ScenarioImagePrompt.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const STORY_WORDS = { format: 'story', style: 'words' } as const;

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
  const prompt = scenarioImagePrompt({ prompt: '  uma praça ao entardecer ', style: 'flat-vector', aspect: AspectRatio.VERTICAL, caption: STORY_WORDS });
  const parts = prompt.split('\n\n');
  assert.equal(parts.length, 5);
  assert.equal(parts[0], stylePresetOf('flat-vector'));
  assert.equal(parts[1], 'Scene: uma praça ao entardecer');
  assert.match(parts[2]!, /characters are added later/);
  assert.match(parts[3]!, /No text, letters, numbers, signs, logos/);
  assert.match(parts[3]!, /No real, recognizable landmarks/);
  assert.match(parts[4]!, /original scene/);
});

// 9:16, in percent of the 1216×2160 image: BackdropLayout's stage x 158–894 of 1080 → 18–79%, feet (ground 1450) → 73%,
// heads (681) → 37%, horizon 1288 → 65%, focus (540, 609) → 50%, 34%; the HUD panel ends at 404 → 24%; the story
// word caption (y 1330–1427) → 67–72%, the block caption (y 1138–1498) → 58–75%.
test('9:16 composition: the characters\' stage, horizon, focus and the calm text bands, hard-coded', () => {
  const hint = scenarioImagePrompt({ prompt: 'p', style: 'painted-2d', aspect: AspectRatio.VERTICAL, caption: STORY_WORDS }).split('\n\n')[2]!;
  assert.match(hint, /standing on the floor from 18% to 79% of the width, with their feet at 73% and heads at 37% of the height\./);
  assert.match(hint, /horizon line \(where the floor meets the back wall or the far scenery\) at about 65% from the top\./);
  assert.match(hint, /main feature of the place \(a window, a door, an archway\) around 50% across and 34% down\./);
  assert.match(hint, /no people, characters or animals/);
  assert.match(hint, /Keep the top of the image down to 24% \(behind titles and the HUD\) and the band from 67% to 72% of the height \(behind the captions\) calm and low in detail/);
  assert.doesNotMatch(hint, /monument/);
  const blocks = scenarioImagePrompt({ prompt: 'p', style: 'painted-2d', aspect: AspectRatio.VERTICAL, caption: { format: 'story', style: 'blocks' } });
  assert.match(blocks, /the band from 58% to 75% of the height \(behind the captions\)/);
});

test('16:9 composition differs from 9:16 (another stage)', () => {
  const vertical = scenarioImagePrompt({ prompt: 'p', style: 'chalk', aspect: AspectRatio.VERTICAL, caption: STORY_WORDS });
  const horizontal = scenarioImagePrompt({ prompt: 'p', style: 'chalk', aspect: AspectRatio.HORIZONTAL, caption: STORY_WORDS });
  assert.notEqual(vertical, horizontal);
  assert.match(horizontal, /horizon line .* at about 74% from the top/);
  assert.match(horizontal, /down to 21% \(behind titles and the HUD\) and the band from 70% to 78%/);
});
