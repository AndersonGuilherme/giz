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
