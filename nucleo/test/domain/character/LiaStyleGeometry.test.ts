import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS, POSES, type Expression, type Pose } from '../../../src/domain/cast/PoseAndExpression.ts';
import { LiaStyleGeometry } from '../../../src/domain/character/LiaStyleGeometry.ts';

// Copied from motor/src/Character.tsx: [left shoulder, left elbow, right shoulder, right elbow, head, body lean].
const MOTOR_POSES: Readonly<Record<string, number[]>> = {
  neutral: [4, -10, -4, 10, 0, 0],
  explain: [24, 62, -24, -62, 0, 0],
  point: [6, -12, -78, -18, 3, 1.5],
  wave: [4, -10, -100, -55, -3, 0],
  raise: [4, -10, -30, -100, -3, 0],
  think: [10, -14, 32, 122, 6, 0],
  shrug: [26, 50, -26, -50, 5, 0],
  celebrate: [58, 34, -58, -34, 0, 0],
};
const MOTOR_FRONT_RIGHT = ['wave', 'raise', 'think', 'celebrate'];
const MOTOR_FRONT_LEFT = ['celebrate'];

// Copied from motor/src/Character.tsx: brows [left y, left angle, right y, right angle], lids [upper, lower], eyeDy, mouth.
const MOTOR_EXPRESSIONS: Readonly<Record<string, { brows: number[]; lids: number[]; eyeDy: number; mouth: string }>> = {
  neutral: { brows: [0, 0, 0, 0], lids: [0.08, 0], eyeDy: 0, mouth: 'smile' },
  happy: { brows: [-5, 0, -5, 0], lids: [0, 0.22], eyeDy: 0, mouth: 'grin' },
  excited: { brows: [-8, 0, -8, 0], lids: [0, 0.18], eyeDy: 0, mouth: 'grin' },
  surprised: { brows: [-17, 0, -17, 0], lids: [0, 0], eyeDy: 0, mouth: 'o' },
  confused: { brows: [-12, 0, 3, -10], lids: [0.1, 0], eyeDy: 0, mouth: 'wavy' },
  thinking: { brows: [-6, 0, 2, -8], lids: [0.3, 0], eyeDy: -6, mouth: 'flat' },
  skeptical: { brows: [4, 7, -11, 6], lids: [0.38, 0.1], eyeDy: 0, mouth: 'smirk' },
  concerned: { brows: [-6, -12, -6, 12], lids: [0.1, 0], eyeDy: 0, mouth: 'frown' },
};
const MOTOR_TO_NUCLEO: Readonly<Record<string, Expression>> = { concerned: 'worried' };

const anglesOf = (pose: Pose) => {
  const { left, right, headTilt, lean } = LiaStyleGeometry.pose(pose);
  return [left.shoulder, left.elbow, right.shoulder, right.elbow, headTilt, lean];
};

test('the lia-style poses have the motor angles', () => {
  for (const [pose, angles] of Object.entries(MOTOR_POSES)) assert.deepEqual(anglesOf(pose as Pose), angles, pose);
});

test('the lia-style poses bring the same arms in front of the head as the motor', () => {
  for (const pose of Object.keys(MOTOR_POSES) as Pose[]) {
    const { left, right } = LiaStyleGeometry.pose(pose);
    assert.equal(left.inFront, MOTOR_FRONT_LEFT.includes(pose), `${pose} left`);
    assert.equal(right.inFront, MOTOR_FRONT_RIGHT.includes(pose), `${pose} right`);
  }
});

test('the new poses have their own geometry, different from every other pose', () => {
  const shapes = POSES.map((pose) => JSON.stringify(LiaStyleGeometry.pose(pose)));
  assert.equal(new Set(shapes).size, POSES.length);
});

test('hand on the head raises the facing-side arm past the shoulder line and draws it over the head', () => {
  const { left, right } = LiaStyleGeometry.pose('hand-on-head');
  assert.deepEqual(left, LiaStyleGeometry.pose('neutral').left);
  assert.ok(right.shoulder < -90, 'upper arm above the horizontal');
  assert.equal(right.inFront, true);
});

test('hands on the mouth fold both arms inward, mirrored, in front of the head', () => {
  const { left, right } = LiaStyleGeometry.pose('hands-on-mouth');
  assert.equal(left.shoulder, -right.shoulder);
  assert.equal(left.elbow, -right.elbow);
  assert.ok(left.shoulder < -45 && left.elbow < -45, 'the left arm turns inward (negative) at both joints');
  assert.equal(left.inFront && right.inFront, true);
});

test('the eight motor expressions keep their brows, lids, eye drop and mouth (concerned is worried)', () => {
  for (const [name, motor] of Object.entries(MOTOR_EXPRESSIONS)) {
    const face = LiaStyleGeometry.face(MOTOR_TO_NUCLEO[name] ?? (name as Expression));
    const { left, right } = face.brows;
    assert.deepEqual([left.y, left.angle, right.y, right.angle], motor.brows, name);
    assert.deepEqual([face.lids.upper, face.lids.lower], motor.lids, name);
    assert.equal(face.eyeDrop, motor.eyeDy, name);
    assert.equal(face.mouth, motor.mouth, name);
  }
});

test('angry lowers the inner end of the brows; scared raises it and opens the mouth', () => {
  const angry = LiaStyleGeometry.face('angry');
  assert.ok(angry.brows.left.angle > 0 && angry.brows.right.angle < 0);
  assert.ok(angry.brows.left.y > 0, 'brows come down');
  const scared = LiaStyleGeometry.face('scared');
  assert.ok(scared.brows.left.angle < 0 && scared.brows.right.angle > 0);
  assert.ok(scared.brows.left.y < LiaStyleGeometry.face('worried').brows.left.y, 'higher than worried');
  assert.equal(scared.mouth, 'gasp');
});

test('all 10 expressions are different', () => {
  const faces = EXPRESSIONS.map((expression) => JSON.stringify(LiaStyleGeometry.face(expression)));
  assert.equal(new Set(faces).size, EXPRESSIONS.length);
});

test('eyes: looking at the other moves the pupils 7 units to the facing side and turns the face 0.9 of that', () => {
  const eyes = LiaStyleGeometry.eyes('neutral', 'other', 0);
  assert.equal(eyes.pupil.x, 7);
  assert.equal(eyes.faceTurn, 7 * 0.9);
  assert.equal(LiaStyleGeometry.eyes('neutral', 'camera', 0).faceTurn, 0);
});

test('eyes: the ears move against the face turn, 0.4 of it', () => {
  const eyes = LiaStyleGeometry.eyes('neutral', 'other', 0);
  assert.equal(eyes.earShift, -(7 * 0.9) * 0.4);
  assert.ok(eyes.earShift < 0, 'opposite to the turn');
  assert.equal(Math.abs(LiaStyleGeometry.eyes('neutral', 'camera', 0).earShift), 0, 'no turn, no shift');
});

test('eyes: the expression eye drop moves the pupils vertically', () => {
  assert.equal(LiaStyleGeometry.eyes('thinking', 'camera', 0).pupil.y, -6);
});

test('eyes: a blink closes over the expression lid, never opening a sleepier one', () => {
  assert.equal(LiaStyleGeometry.eyes('neutral', 'camera', 1).upper, 1);
  assert.equal(LiaStyleGeometry.eyes('skeptical', 'camera', 0.2).upper, 0.38);
  assert.equal(LiaStyleGeometry.eyes('happy', 'camera', 0).lower, 0.22);
});

test('eyes: the lid line shows only when the upper lid passes 0.15', () => {
  assert.equal(LiaStyleGeometry.eyes('neutral', 'camera', 0).lidLine, false);
  assert.equal(LiaStyleGeometry.eyes('thinking', 'camera', 0).lidLine, true);
  assert.equal(LiaStyleGeometry.eyes('neutral', 'camera', 0.15).lidLine, false);
  assert.equal(LiaStyleGeometry.eyes('neutral', 'camera', 0.16).lidLine, true);
});

test('brow curve: the arch lifts the middle and drops the ends by 0.3 of it (the motor brow)', () => {
  assert.deepEqual(LiaStyleGeometry.browCurve(7), { peak: -7, ends: 7 * 0.3 });
  assert.deepEqual(LiaStyleGeometry.browCurve(2), { peak: -2, ends: 2 * 0.3 });
});
