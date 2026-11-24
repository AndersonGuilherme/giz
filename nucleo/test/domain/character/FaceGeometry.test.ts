import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS } from '../../../src/domain/cast/PoseAndExpression.ts';
import { GAZES } from '../../../src/domain/script/Line.ts';
import { FaceGeometry } from '../../../src/domain/character/FaceGeometry.ts';

test('the angry expression lowers the brows toward the center', () => {
  const { brows } = FaceGeometry.for('angry');
  assert.ok(brows.left.innerAngle > 0);
  assert.ok(brows.right.innerAngle > 0);
});

test('worried and scared raise the inner end of the brows', () => {
  for (const expression of ['worried', 'scared'] as const) {
    assert.ok(FaceGeometry.for(expression).brows.left.innerAngle < 0, expression);
  }
});

test('surprise raises the brows above neutral and opens the mouth', () => {
  const surprised = FaceGeometry.for('surprised');
  const neutral = FaceGeometry.for('neutral');
  assert.ok(surprised.brows.left.height < neutral.brows.left.height);
  assert.ok(surprised.mouth.opening > 0);
  assert.equal(neutral.mouth.opening, 0);
});

test('confused and skeptical are asymmetric', () => {
  for (const expression of ['confused', 'skeptical'] as const) {
    const { left, right } = FaceGeometry.for(expression).brows;
    assert.notDeepEqual(left, right, expression);
  }
});

test('happy smiles and worried does not', () => {
  assert.ok(FaceGeometry.for('happy').mouth.curve > 0);
  assert.ok(FaceGeometry.for('worried').mouth.curve < 0);
});

test('all 10 expressions have a geometry and they are all different', () => {
  const faces = EXPRESSIONS.map((expression) => JSON.stringify(FaceGeometry.for(expression)));
  assert.equal(new Set(faces).size, EXPRESSIONS.length);
});

test('looking at the camera centers the pupil; looking at the other goes to the facing side', () => {
  assert.deepEqual(FaceGeometry.gaze('camera'), { x: 0, y: 0 });
  assert.ok(FaceGeometry.gaze('other').x > 0);
  for (const gaze of GAZES) {
    const { x, y } = FaceGeometry.gaze(gaze);
    assert.ok(Math.abs(x) <= 1 && Math.abs(y) <= 1, gaze);
  }
});

test('eyes: the gaze target adds the expression offset and is clamped to [-1, 1]', () => {
  const thinking = FaceGeometry.eyes('thinking', 'other', 0);
  assert.deepEqual([thinking.pupil.x, thinking.pupil.y], [1, -0.7]);
  const camera = FaceGeometry.eyes('confused', 'camera', 0);
  assert.deepEqual([camera.pupil.x, camera.pupil.y], [0.3, -0.3]);
  assert.equal(FaceGeometry.eyes('surprised', 'camera', 0).pupil.scale, 0.7);
});

test('eyes: a blink closes the upper lid over any expression, but never opens a sleepier lid', () => {
  assert.equal(FaceGeometry.eyes('neutral', 'camera', 1).left.upper, 1);
  assert.equal(FaceGeometry.eyes('skeptical', 'camera', 0.2).left.upper, 0.42);
  assert.equal(FaceGeometry.eyes('happy', 'camera', 0).left.lower, 0.3);
});

test('eyes: the upper lid tilts with the brow, at 60% of its inner angle, per side', () => {
  const angry = FaceGeometry.eyes('angry', 'camera', 0);
  assert.equal(angry.left.tilt, 22 * 0.6);
  const skeptical = FaceGeometry.eyes('skeptical', 'camera', 0);
  assert.equal(skeptical.left.tilt, 14 * 0.6);
  assert.equal(skeptical.right.tilt, 4 * 0.6);
});

test('eyes: the catchlight sits on the upper right of the iris and scales with the pupil, never below its minimum', () => {
  const neutral = FaceGeometry.eyes('neutral', 'camera', 0).pupil.catchlight;
  assert.deepEqual(neutral, { radius: 0.23, x: 0.42, y: -0.42 });
  const excited = FaceGeometry.eyes('excited', 'camera', 0).pupil.catchlight;
  assert.ok(excited.radius > neutral.radius, 'a bigger pupil gets a bigger highlight');
  const scared = FaceGeometry.eyes('scared', 'camera', 0).pupil.catchlight;
  assert.equal(scared.radius, 0.16);
  assert.deepEqual([scared.x, scared.y], [0.42, -0.42], 'the position does not follow the pupil size');
  assert.ok(Math.hypot(scared.x, scared.y) + scared.radius < 1, 'the highlight stays inside the iris');
});
