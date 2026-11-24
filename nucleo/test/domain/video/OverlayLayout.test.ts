import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OverlayLayout } from '../../../src/domain/video/OverlayLayout.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { SceneRuns } from '../../../src/domain/video/SceneRuns.ts';
import { VideoClock } from '../../../src/domain/video/VideoClock.ts';
import { props, segment } from './videoFixtures.ts';

const wide = AspectRatio.of('16:9');
const tall = AspectRatio.of('9:16');

test('a 16:9 lesson shows the brand and the chapter at the top of the left column, inside the safe area', () => {
  const overlay = OverlayLayout.for(wide, 'lesson', { brand: 'giz', chapter: 'O problema', sceneType: 'card' });
  const boxes = overlay.boxes();
  assert.ok(overlay.brand && overlay.chapter);
  assert.deepEqual([overlay.brand.box().label, overlay.chapter.box().label], ['marca', 'capítulo']);
  assert.ok(overlay.chapter.rectangle.y >= overlay.brand.bottom());
  assert.deepEqual(boxes.outsideOf(SafeArea.for(wide)), []);
  assert.deepEqual(boxes.overflowingTexts(), []);
  assert.deepEqual(boxes.with(Box.of('conteúdo', LessonStage.for(wide).content())).overlappingPairs(), []);
});
test('without a declared brand only the chapter shows, at the top', () => {
  const overlay = OverlayLayout.for(wide, 'lesson', { chapter: 'O problema', sceneType: 'card' });
  assert.equal(overlay.brand, undefined);
  assert.equal(overlay.chapter?.rectangle.y, SafeArea.for(wide).y);
});
test('on the talk stage the chapter hides (the presenters take the stage), the brand stays', () => {
  const overlay = OverlayLayout.for(wide, 'lesson', { brand: 'giz', chapter: 'O problema', sceneType: 'talk' });
  assert.ok(overlay.brand);
  assert.equal(overlay.chapter, undefined);
});
test('a chapter name too long for the column is reported by its box, not cut', () => {
  const overlay = OverlayLayout.for(wide, 'lesson', { chapter: 'Capítulo '.repeat(20), sceneType: 'card' });
  assert.equal(overlay.boxes().overflowingTexts().length, 1);
});
test('9:16 and the story format have no frame: the content and the scene take the safe area', () => {
  for (const overlay of [
    OverlayLayout.for(tall, 'lesson', { brand: 'giz', chapter: 'A', sceneType: 'card' }),
    OverlayLayout.for(wide, 'story', { brand: 'giz', chapter: 'A', sceneType: 'scenario' }),
  ]) {
    assert.equal(overlay.brand, undefined);
    assert.equal(overlay.chapter, undefined);
    assert.deepEqual(overlay.boxes().outsideOf(Box.of('nada', { x: 0, y: 0, width: 0, height: 0 })), []);
  }
});
test('in the video the frame follows the segment on screen: its chapter name and its scene type', () => {
  const video = props([segment({ chapter: 1, scene: { type: 'quote', text: 'x' } }), segment({ lineId: '2', chapter: 2, start: 50, sceneKey: 1 })], { brand: 'giz' });
  const runs = SceneRuns.of(video, VideoClock.of(video.totalFrames));
  const [first, second] = runs.each();
  const onQuote = OverlayLayout.forVideo(video, runs.sceneAt(first!, 20));
  assert.deepEqual(onQuote.chapter?.fit.lines, ['Abertura']);
  assert.deepEqual(onQuote.brand?.fit.lines, ['giz']);
  const onStage = OverlayLayout.forVideo(video, runs.sceneAt(second!, 5));
  assert.equal(onStage.chapter, undefined);
});
