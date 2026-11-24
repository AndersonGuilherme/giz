import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACIAL_HAIRS, FacialHair } from '../../../../src/domain/character/hair/FacialHair.ts';
import { HeadProfile } from '../../../../src/domain/character/HeadProfile.ts';
import { HEAD_SHAPES } from '../../../../src/domain/character/HeadShape.ts';
import { covers, onEveryHead, EYES_AND_BROWS, NOSE, pointsOf } from '../headGeometry.ts';

test('the facial hair options, none by default', () => {
  assert.deepEqual(FACIAL_HAIRS, ['none', 'beard', 'mustache', 'goatee', 'stubble']);
  assert.equal(FacialHair.DEFAULT, 'none');
  assert.deepEqual(FacialHair.parts('none', 'round'), []);
});

test('beards stay on the jaw: the eyes, brows and nose stay free', () => {
  for (const [facialHair, shape] of onEveryHead(FACIAL_HAIRS)) {
    const parts = FacialHair.parts(facialHair, shape);
    [...EYES_AND_BROWS, NOSE].forEach((point) => assert.ok(!covers(parts, point), `${facialHair} on ${shape} covers (${point.x}, ${point.y})`));
    assert.ok(pointsOf(parts).every(({ y }) => y > -25), `${facialHair} on ${shape} climbs above the cheeks`);
  }
});

test('the mustache sits between the nose and the mouth', () => {
  const mustache = pointsOf(FacialHair.parts('mustache', 'round'));
  assert.ok(mustache.every(({ y }) => y > 37 && y < 56));
  assert.ok(Math.max(...mustache.map(({ x }) => x)) > 30, 'as wide as the mouth');
});

test('the beard and goatee follow the chin of each head shape', () => {
  const lowest = (facialHair: 'beard' | 'goatee', shape: (typeof HEAD_SHAPES)[number]) => Math.max(...pointsOf(FacialHair.parts(facialHair, shape)).map(({ y }) => y));
  for (const shape of HEAD_SHAPES) {
    const chin = HeadProfile.of(shape).chin();
    assert.ok(Math.abs(lowest('beard', shape) - (chin + 7)) < 3, `beard on ${shape}`);
    assert.ok(Math.abs(lowest('goatee', shape) - (chin + 5)) < 3, `goatee on ${shape}`);
  }
});

test('stubble is a faint shadow, not hair', () => {
  assert.ok(FacialHair.parts('stubble', 'oval').every(({ role }) => role === 'shadow'));
});
