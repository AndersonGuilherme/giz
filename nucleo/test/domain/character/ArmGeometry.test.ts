import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POSES } from '../../../src/domain/cast/PoseAndExpression.ts';
import { ArmGeometry } from '../../../src/domain/character/ArmGeometry.ts';

test('all 10 poses have a geometry', () => {
  for (const p of POSES) assert.ok(ArmGeometry.for(p));
});

test('the 10 poses are all different', () => {
  const shapes = POSES.map((pose) => JSON.stringify(ArmGeometry.for(pose)));
  assert.equal(new Set(shapes).size, POSES.length);
});

test('pointing stretches the facing-side arm with the index finger', () => {
  const { right } = ArmGeometry.for('point');
  assert.equal(right.hand, 'index');
  assert.ok(right.shoulder > 70);
});

test('hands over the mouth bring both hands in front of the head', () => {
  const { left, right } = ArmGeometry.for('hands-on-mouth');
  assert.equal(left.inFront, true);
  assert.equal(right.inFront, true);
});

test('celebrating raises both arms above the shoulder', () => {
  const { left, right } = ArmGeometry.for('celebrate');
  assert.ok(left.shoulder > 90 && right.shoulder > 90);
});

test('foreshortening stays in (0, 1] for every pose', () => {
  const arms = POSES.flatMap((pose) => [ArmGeometry.for(pose).left, ArmGeometry.for(pose).right]);
  for (const arm of arms) assert.ok(arm.foreshortening > 0 && arm.foreshortening <= 1);
});

test('waving lifts the forearm with an open hand angled outward at the wrist', () => {
  const { right } = ArmGeometry.for('wave');
  assert.equal(right.hand, 'open');
  assert.ok(right.wrist > 0);
  assert.ok(right.shoulder > 80, 'upper arm raised to the side, so the hand is at head height');
  assert.ok(right.shoulder + right.elbow > 120, 'forearm points up');
});

test('"wait a moment" keeps the upper arm down and raises the open palm only to the chest', () => {
  const { right } = ArmGeometry.for('raise');
  assert.equal(right.hand, 'open');
  assert.ok(right.shoulder < 45, 'upper arm stays low, so the hand stays below the head');
  assert.ok(right.shoulder + right.elbow > 150, 'forearm stands up');
  assert.equal(right.inFront, false);
});

test('only the wave angles the wrist', () => {
  const angled = POSES.filter((pose) => ArmGeometry.for(pose).right.wrist !== 0 || ArmGeometry.for(pose).left.wrist !== 0);
  assert.deepEqual(angled, ['wave']);
});
