import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_TONES, SKIN_TONES, SkinTone } from '../../../src/domain/character/SkinTone.ts';

const luminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
};

test('the palette goes from light to deep', () => {
  assert.deepEqual([...SKIN_TONES], ['light', 'fair', 'medium', 'tan', 'brown', 'deep']);
  const bases = SKIN_TONES.map((tone) => luminance(SkinTone.colors(tone).base));
  bases.slice(1).forEach((base, index) => assert.ok(base < bases[index]!, `${SKIN_TONES[index + 1]} is darker`));
});

test('no tone is black: even the deepest base stays well above black', () => {
  for (const tone of SKIN_TONES) assert.ok(luminance(SkinTone.colors(tone).base) > 0.12, tone);
});

test('the default tone is a mid tone, never the extremes', () => {
  assert.equal(SkinTone.DEFAULT, 'medium');
});

test('shade and line are darker than the base; the line reads on the skin', () => {
  for (const tone of SKIN_TONES) {
    const { base, shade, line } = SkinTone.colors(tone);
    assert.ok(luminance(shade) < luminance(base), `${tone} shade`);
    assert.ok(luminance(base) - luminance(line) > 0.12, `${tone} line contrast`);
  }
});

test('every color is a #rrggbb', () => {
  const colors = SKIN_TONES.flatMap((tone) => Object.values(SkinTone.colors(tone)));
  colors.forEach((color) => assert.match(color, /^#[0-9a-f]{6}$/));
});

test('creature skins: one per species idea, never black, the line still reads on them', () => {
  assert.deepEqual([...CREATURE_TONES], ['grey-green', 'pale', 'fur', 'linen', 'mist', 'steel', 'green', 'lilac', 'lime', 'tangerine']);
  assert.deepEqual(SkinTone.ALL, [...SKIN_TONES, ...CREATURE_TONES]);
  for (const tone of CREATURE_TONES) {
    const { base, shade, line } = SkinTone.colors(tone);
    assert.ok(SkinTone.isCreature(tone) && luminance(base) > 0.3, tone);
    assert.ok(luminance(shade) < luminance(base) && luminance(base) - luminance(line) > 0.12, tone);
    Object.values(SkinTone.colors(tone)).forEach((color) => assert.match(color, /^#[0-9a-f]{6}$/));
  }
  SKIN_TONES.forEach((tone) => assert.equal(SkinTone.isCreature(tone), false, tone));
});
