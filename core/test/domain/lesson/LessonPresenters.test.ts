import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box } from '../../../src/domain/layout/Box.ts';
import { BLOCK_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { LessonPresenters } from '../../../src/domain/lesson/LessonPresenters.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const ASPECTS = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
const DUO = ['lia', 'teo'];
// The drawn figure is narrower than the rig's SVG: about 0.35 of its height on each side of the feet is enough.
const HALF_WIDTH = 0.35;

test('the content area is inside the safe area and above the caption', () => {
  for (const aspect of ASPECTS) {
    const content = Box.of('conteúdo', LessonStage.for(aspect).content());
    assert.ok(content.isInside(SafeArea.for(aspect)), aspect.text());
    assert.equal(content.overlaps(BLOCK_CAPTIONS.box('Olá.', aspect, 'lesson')), false, aspect.text());
  }
});

test('in 16:9 the presenters stand at the left, beside the content, facing it', () => {
  const content = LessonStage.for(AspectRatio.HORIZONTAL).content();
  const spots = LessonPresenters.beside(DUO, AspectRatio.HORIZONTAL);
  assert.deepEqual(spots.map((spot) => spot.character), DUO);
  for (const spot of spots) {
    assert.ok(spot.x + HALF_WIDTH * spot.height <= content.x, spot.character);
    assert.equal(spot.side, 1);
  }
  assert.ok(spots[0].x < spots[1].x);
});

test('in 9:16 the presenters stand below the content, facing each other', () => {
  const content = LessonStage.for(AspectRatio.VERTICAL).content();
  const spots = LessonPresenters.beside(DUO, AspectRatio.VERTICAL);
  for (const spot of spots) assert.ok(spot.y - 0.85 * spot.height >= content.y + content.height, spot.character);
  assert.deepEqual(spots.map((spot) => spot.side), [1, -1]);
  assert.ok(spots[0].x < AspectRatio.VERTICAL.width() / 2 && spots[1].x > AspectRatio.VERTICAL.width() / 2);
});

test('on the talk stage they are larger, centered and facing each other', () => {
  for (const aspect of ASPECTS) {
    const beside = LessonPresenters.beside(DUO, aspect);
    const stage = LessonPresenters.onStage(DUO, aspect);
    assert.ok(stage[0].height > beside[0].height, aspect.text());
    assert.equal(Math.round(stage[0].x + stage[1].x), aspect.width(), aspect.text());
    assert.deepEqual(stage.map((spot) => spot.side), [1, -1]);
  }
});

test('a single presenter stands alone in the middle of its place; nobody is no spot', () => {
  const [alone] = LessonPresenters.onStage(['lia'], AspectRatio.HORIZONTAL);
  assert.equal(alone.x, AspectRatio.HORIZONTAL.width() / 2);
  assert.deepEqual(LessonPresenters.beside([], AspectRatio.VERTICAL), []);
});

test('more than two presenters is a readable error', () => {
  assert.throws(() => LessonPresenters.beside(['lia', 'teo', 'ana'], AspectRatio.HORIZONTAL), /no máximo 2 apresentadores/);
});

test('16:9 talk stage: the presenters stand above the lesson block caption, so it never covers their feet', () => {
  const caption = BLOCK_CAPTIONS.rectangle(AspectRatio.HORIZONTAL, 'lesson');
  for (const spot of LessonPresenters.onStage(DUO, AspectRatio.HORIZONTAL)) {
    assert.ok(spot.y <= caption.y, `feet at ${spot.y}, caption from ${caption.y}`);
    assert.ok(spot.y - spot.height >= 0, 'the whole presenter stays in the frame');
  }
});
