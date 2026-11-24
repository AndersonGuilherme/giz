import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SceneCamera } from '../../../src/domain/scenario/SceneCamera.ts';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const HORIZONTAL = AspectRatio.of('16:9');
const spots = Placement.for([{ character: 'ana', position: 'left' }, { character: 'bia', position: 'right' }], HORIZONTAL);
const end = (camera: SceneCamera) => camera.framingAt(1, Frame.of(90));

test('without a camera the scene stands still', () => {
  const framing = SceneCamera.of(undefined, spots, HORIZONTAL).framingAt(0.5, Frame.of(10));
  assert.deepEqual([framing.zoom, framing.x, framing.y], [1, 0, 0]);
});

test('follow with a target ends framed on that character', () => {
  const towardsAna = end(SceneCamera.of({ type: 'follow', target: 'ana' }, spots, HORIZONTAL));
  const towardsBia = end(SceneCamera.of({ type: 'follow', target: 'bia' }, spots, HORIZONTAL));
  assert.ok(towardsAna.zoom > 1);
  assert.ok(towardsAna.x > 0, 'Ana is on the left, so the picture slides right');
  assert.ok(towardsBia.x < 0, 'Bia is on the right, so the picture slides left');
});

test('the target keeps the zoom of `to` when one is given', () => {
  const framing = end(SceneCamera.of({ type: 'follow', target: 'ana', to: { zoom: 1.5, x: 0, y: 0 } }, spots, HORIZONTAL));
  assert.equal(framing.zoom, 1.5);
  assert.ok(framing.x > 0);
});

test('a target that is not in the scene is a readable error', () => {
  assert.throws(() => SceneCamera.of({ type: 'follow', target: 'zeca' }, spots, HORIZONTAL), /alvo da câmera "zeca" não está na cena/);
});

test('zoom-in without a target keeps its own path', () => {
  const framing = end(SceneCamera.of({ type: 'zoom-in' }, spots, HORIZONTAL));
  assert.deepEqual([framing.zoom, framing.x, framing.y], [1.3, 0, 0]);
});
