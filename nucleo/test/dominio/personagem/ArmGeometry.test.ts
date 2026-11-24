import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POSES } from '../../../src/dominio/elenco/PoseEExpressao.ts';
import { ArmGeometry } from '../../../src/dominio/personagem/ArmGeometry.ts';

test('all 10 poses have a geometry', () => {
  for (const p of POSES) assert.ok(ArmGeometry.for(p));
});

test('the 10 poses are all different', () => {
  const shapes = POSES.map((pose) => JSON.stringify(ArmGeometry.for(pose)));
  assert.equal(new Set(shapes).size, POSES.length);
});

test('pointing stretches the facing-side arm with the index finger', () => {
  const { right } = ArmGeometry.for('apontar');
  assert.equal(right.hand, 'index');
  assert.ok(right.shoulder > 70);
});

test('hands over the mouth bring both hands in front of the head', () => {
  const { left, right } = ArmGeometry.for('maos-na-boca');
  assert.equal(left.inFront, true);
  assert.equal(right.inFront, true);
});

test('celebrating raises both arms above the shoulder', () => {
  const { left, right } = ArmGeometry.for('comemorar');
  assert.ok(left.shoulder > 90 && right.shoulder > 90);
});

test('foreshortening stays in (0, 1] for every pose', () => {
  const arms = POSES.flatMap((pose) => [ArmGeometry.for(pose).left, ArmGeometry.for(pose).right]);
  for (const arm of arms) assert.ok(arm.foreshortening > 0 && arm.foreshortening <= 1);
});
