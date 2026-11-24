import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSOES } from '../../../src/dominio/elenco/PoseEExpressao.ts';
import { OLHARES } from '../../../src/dominio/roteiro/Fala.ts';
import { FaceGeometry } from '../../../src/dominio/personagem/FaceGeometry.ts';

test('the angry expression lowers the brows toward the center', () => {
  const { brows } = FaceGeometry.for('brava');
  assert.ok(brows.left.innerAngle > 0);
  assert.ok(brows.right.innerAngle > 0);
});

test('worried and scared raise the inner end of the brows', () => {
  for (const expression of ['preocupada', 'assustada'] as const) {
    assert.ok(FaceGeometry.for(expression).brows.left.innerAngle < 0, expression);
  }
});

test('surprise raises the brows above neutral and opens the mouth', () => {
  const surprised = FaceGeometry.for('surpresa');
  const neutral = FaceGeometry.for('neutra');
  assert.ok(surprised.brows.left.height < neutral.brows.left.height);
  assert.ok(surprised.mouth.opening > 0);
  assert.equal(neutral.mouth.opening, 0);
});

test('confused and skeptical are asymmetric', () => {
  for (const expression of ['confusa', 'cetica'] as const) {
    const { left, right } = FaceGeometry.for(expression).brows;
    assert.notDeepEqual(left, right, expression);
  }
});

test('happy smiles and worried does not', () => {
  assert.ok(FaceGeometry.for('feliz').mouth.curve > 0);
  assert.ok(FaceGeometry.for('preocupada').mouth.curve < 0);
});

test('all 10 expressions have a geometry and they are all different', () => {
  const faces = EXPRESSOES.map((expression) => JSON.stringify(FaceGeometry.for(expression)));
  assert.equal(new Set(faces).size, EXPRESSOES.length);
});

test('looking at the camera centers the pupil; looking at the other goes to the facing side', () => {
  assert.deepEqual(FaceGeometry.gaze('camera'), { x: 0, y: 0 });
  assert.ok(FaceGeometry.gaze('outro').x > 0);
  for (const gaze of OLHARES) {
    const { x, y } = FaceGeometry.gaze(gaze);
    assert.ok(Math.abs(x) <= 1 && Math.abs(y) <= 1, gaze);
  }
});

test('eyes: the gaze target adds the expression offset and is clamped to [-1, 1]', () => {
  const thinking = FaceGeometry.eyes('pensativa', 'outro', 0);
  assert.deepEqual([thinking.pupil.x, thinking.pupil.y], [1, -0.7]);
  const camera = FaceGeometry.eyes('confusa', 'camera', 0);
  assert.deepEqual([camera.pupil.x, camera.pupil.y], [0.3, -0.3]);
  assert.equal(FaceGeometry.eyes('surpresa', 'camera', 0).pupil.scale, 0.7);
});

test('eyes: a blink closes the upper lid over any expression, but never opens a sleepier lid', () => {
  assert.equal(FaceGeometry.eyes('neutra', 'camera', 1).left.upper, 1);
  assert.equal(FaceGeometry.eyes('cetica', 'camera', 0.2).left.upper, 0.42);
  assert.equal(FaceGeometry.eyes('feliz', 'camera', 0).left.lower, 0.3);
});

test('eyes: the upper lid tilts with the brow, at 60% of its inner angle, per side', () => {
  const angry = FaceGeometry.eyes('brava', 'camera', 0);
  assert.equal(angry.left.tilt, 22 * 0.6);
  const skeptical = FaceGeometry.eyes('cetica', 'camera', 0);
  assert.equal(skeptical.left.tilt, 14 * 0.6);
  assert.equal(skeptical.right.tilt, 4 * 0.6);
});

test('eyes: the catchlight scales with the pupil but never gets smaller than its minimum', () => {
  const neutral = FaceGeometry.eyes('neutra', 'camera', 0).pupil.catchlight;
  assert.deepEqual(neutral, { radius: 0.3, x: 0.35, y: -0.4 });
  const scared = FaceGeometry.eyes('assustada', 'camera', 0).pupil.catchlight;
  assert.equal(scared.radius, 0.18);
});
