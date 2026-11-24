import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BigTextLayout, Entrance } from '../../../src/domain/scenario/BigTextLayout.ts';
import { HudLayout } from '../../../src/domain/scenario/HudLayout.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { captionBox } from '../../../src/domain/layout/lessonLayouts.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const ASPECTS = ['9:16', '16:9'].map((text) => AspectRatio.of(text));
const HUD = { fields: [{ label: 'ANO', value: '1347' }], bar: { label: 'CHANCE', value: 50 } };

test('the big text stays in the safe area and clear of the HUD and the caption', () => {
  for (const aspect of ASPECTS) {
    const big = Box.of('destaque', BigTextLayout.for({ text: 'A PESTE CHEGOU' }, aspect).rectangle);
    assert.ok(big.isInside(SafeArea.for(aspect)), aspect.text());
    assert.equal(big.overlaps(Box.of('hud', HudLayout.for(HUD, aspect).panel)), false, aspect.text());
    assert.equal(big.overlaps(captionBox('legenda', aspect)), false, aspect.text());
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
