import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLayoutRegistry } from '../../../src/domain/layout/defaultLayoutRegistry.ts';
import { BLOCK_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { CATALOG_SAMPLES } from '../../../src/presentation/remotion/catalogSamples.ts';

test('the scene catalog shows every lesson scene once', () => {
  const types = CATALOG_SAMPLES.map((sample) => sample.scene.type);
  assert.deepEqual(types, ['title', 'card', 'quote', 'chart', 'symptoms', 'code', 'terminal', 'graph', 'versus', 'table', 'talk', 'house', 'inbox']);
});

test('every catalog sample passes the layout check in both aspect ratios and both languages', () => {
  const layouts = createLayoutRegistry();
  const cases = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL].flatMap((aspect) => CATALOG_SAMPLES.map(({ scene }) => ({ scene, aspect })));
  for (const { scene, aspect } of cases) {
    const where = `${scene.type} ${aspect.text()}`;
    const boxes = [Language.PORTUGUESE, Language.ENGLISH].map((language) => layouts.boxesOf(scene, aspect, language)!.with(BLOCK_CAPTIONS.box('Uma fala.', aspect, 'lesson')));
    assert.deepEqual(boxes.flatMap((all) => all.overflowingTexts().map((box) => box.label)), [], where);
    assert.deepEqual(boxes.flatMap((all) => all.overlappingPairs().map(([a, b]) => `${a.label} × ${b.label}`)), [], where);
    assert.deepEqual(boxes.flatMap((all) => all.outsideOf(SafeArea.for(aspect)).map((box) => box.label)), [], where);
  }
});
