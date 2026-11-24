import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SceneRuns } from '../../../src/domain/video/SceneRuns.ts';
import { VideoClock } from '../../../src/domain/video/VideoClock.ts';
import type { Scene } from '../../../src/domain/script/Scene.ts';
import { props, segment } from './videoFixtures.ts';

const card: Scene = { type: 'card', variant: 'summary', title: 'Resumo', items: ['a', 'b', 'c'], shown: 1 };
const title: Scene = { type: 'title', overline: 'Aula 1', title: 'Olá' };

// Two lines on the card (one scene) and a third that opens the title scene.
const three = props([
  segment({ lineId: '1', start: 0, totalDuration: 50, scene: card, sceneKey: 0, beats: [{ frame: 20, changes: { shown: 2 } }] }),
  segment({ lineId: '2', start: 50, totalDuration: 60, scene: { ...card, shown: 2 }, sceneKey: 0, beats: [{ frame: 10, changes: { expression: 'happy' } }, { frame: 30, changes: { shown: 3 } }] }),
  segment({ lineId: '3', start: 110, totalDuration: 40, scene: title, sceneKey: 1 }),
]);
const runs = () => SceneRuns.of(three, VideoClock.of(three.totalFrames));

test('consecutive segments with the same scene key are one run; the first takes the lead-in, the last the tail', () => {
  assert.deepEqual(runs().each().map(({ key, from, duration }) => ({ key, from, duration })), [
    { key: 0, from: 0, duration: 15 + 110 },
    { key: 1, from: 125, duration: 40 + 30 },
  ]);
});
test('the scene on screen gets the beats of the current segment up to the frame', () => {
  const [first] = runs().each();
  assert.deepEqual(runs().sceneAt(first!, 15 + 19).scene, card);
  assert.deepEqual(runs().sceneAt(first!, 15 + 20).scene, { ...card, shown: 2 });
  assert.deepEqual(runs().sceneAt(first!, 15 + 50 + 29).scene, { ...card, shown: 2 });
  assert.deepEqual(runs().sceneAt(first!, 15 + 50 + 30).scene, { ...card, shown: 3 });
});
test('changedAt is the frame (from the run start) of the last beat that changed a scene field', () => {
  const [first, second] = runs().each();
  assert.equal(runs().sceneAt(first!, 10).changedAt, 0);
  assert.equal(runs().sceneAt(first!, 15 + 25).changedAt, 15 + 20);
  // a beat that only changes the expression is not a scene change
  assert.equal(runs().sceneAt(first!, 15 + 50 + 15).changedAt, 15 + 20);
  assert.equal(runs().sceneAt(first!, 15 + 50 + 40).changedAt, 15 + 50 + 30);
  assert.equal(runs().sceneAt(second!, 5).changedAt, 0);
});
test('progress goes from 0 at the run start to 1 at its last frame', () => {
  const [, second] = runs().each();
  assert.equal(runs().sceneAt(second!, 0).progress, 0);
  assert.equal(runs().sceneAt(second!, 69).progress, 1);
  assert.equal(runs().sceneAt(second!, 23).progress, 1 / 3);
});
test('a run frame gives the timeline frame, for the character states', () => {
  const [, second] = runs().each();
  assert.equal(runs().sceneAt(second!, 69).timelineFrame, 110 + 69);
});
