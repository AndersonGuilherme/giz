import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BigTextLayout, Entrance } from '../../../src/domain/scenario/BigTextLayout.ts';
import { HudLayout } from '../../../src/domain/scenario/HudLayout.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { CAPTION_LAYOUTS } from '../../../src/domain/caption/captionLayouts.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const ASPECTS = ['9:16', '16:9'].map((text) => AspectRatio.of(text));
const HUD = { fields: [{ label: 'ANO', value: '1347' }], bar: { label: 'CHANCE', value: 50 } };

test('the big text stays in the safe area and clear of the HUD and the caption', () => {
  for (const aspect of ASPECTS) {
    const big = Box.of('destaque', BigTextLayout.for({ text: 'A PESTE CHEGOU' }, aspect).rectangle);
    assert.ok(big.isInside(SafeArea.for(aspect)), aspect.text());
    assert.equal(big.overlaps(Box.of('hud', HudLayout.for(HUD, aspect).panel)), false, aspect.text());
    const captions = Object.values(CAPTION_LAYOUTS).map((layout) => layout.box('legenda', aspect, 'story'));
    assert.ok(captions.every((caption) => !big.overlaps(caption)), aspect.text());
  }
});

test('the big text is fitted by TextFit: a long text wraps and shrinks', () => {
  const short = BigTextLayout.for({ text: 'EU SEI' }, AspectRatio.of('9:16'));
  const long = BigTextLayout.for({ text: 'UMA FRASE BEM MAIS LONGA QUE O NORMAL' }, AspectRatio.of('9:16'));
  assert.deepEqual(short.fit.lines, ['EU SEI']);
  assert.ok(long.fit.lines.length > 1);
  assert.ok(long.fit.size <= short.fit.size);
  assert.equal(BigTextLayout.for({ text: 'A'.repeat(200) }, AspectRatio.of('9:16')).boxes().overflowingTexts().length, 1);
});

test('pop grows from small to full size; rise comes up from below; both end still', () => {
  const pop = Entrance.of('pop');
  const rise = Entrance.of('rise');
  assert.ok(pop.at(Frame.of(0)).scale < 1);
  assert.ok(rise.at(Frame.of(0)).y > 0);
  for (const entrance of [pop, rise]) {
    assert.deepEqual(entrance.at(Frame.of(60)), { scale: 1, y: 0, opacity: 1 });
    assert.equal(entrance.at(Frame.of(0)).opacity, 0);
  }
});

test('without an entrance the text pops', () => {
  assert.deepEqual(Entrance.of(undefined).at(Frame.of(3)), Entrance.of('pop').at(Frame.of(3)));
});

// Heavy caps (Nunito 900 with an outline) are about 0.70 em wide, not the 0.58 em of the caption text.
const HEAVY_CAPS_EM = 0.7;

test('a long uppercase word in 9:16 shrinks whole instead of passing the frame edge, even at the pop peak', () => {
  const aspect = AspectRatio.of('9:16');
  const { rectangle, fit, font } = BigTextLayout.for({ text: 'INACREDITÁVEL' }, aspect);
  assert.equal(font.family(), 'display');
  assert.deepEqual(fit.lines, ['INACREDITÁVEL'], 'the word is not broken');
  assert.ok(fit.size < 120, 'it shrank');
  const peakWidth = 'INACREDITÁVEL'.length * fit.size * HEAVY_CAPS_EM * Entrance.peakScale();
  assert.ok(peakWidth <= rectangle.width, `${peakWidth} > ${rectangle.width}`);
  assert.ok(rectangle.x + peakWidth <= aspect.width());
});

test('every line of a long uppercase sentence fits its box at the pop peak, in both aspects', () => {
  for (const aspect of ASPECTS) {
    const { rectangle, fit } = BigTextLayout.for({ text: 'O INACREDITÁVEL ACONTECEU NA ALDEIA' }, aspect);
    const widest = Math.max(...fit.lines.map((line) => line.length));
    assert.ok(widest * fit.size * HEAVY_CAPS_EM * Entrance.peakScale() <= rectangle.width, aspect.text());
  }
});

test('the pop peak is the largest scale of any entrance, a little above 1', () => {
  assert.ok(Entrance.peakScale() > 1 && Entrance.peakScale() < 1.1);
  for (const frame of [0, 3, 5, 6, 7, 8, 10, 20]) assert.ok(Entrance.of('pop').at(Frame.of(frame)).scale <= Entrance.peakScale());
});
