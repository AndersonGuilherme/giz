import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MouthGeometry } from '../../../src/dominio/personagem/MouthGeometry.ts';
import type { Visema } from '../../../src/dominio/fala/Visemas.ts';

const VISEMES: readonly Visema[] = ['X', 'M', 'A', 'E', 'I', 'O', 'U', 'F', 'C'];

test('viseme M closes the mouth; A opens in proportion to the opening', () => {
  assert.equal(MouthGeometry.for('M', 1).height, 0);
  assert.ok(MouthGeometry.for('A', 1).height > MouthGeometry.for('A', 0.3).height);
});

test('rest (X) has no speech shape: the expression mouth takes over', () => {
  assert.equal(MouthGeometry.for('X', 1).height, 0);
  assert.equal(MouthGeometry.for('X', 1).width, 0);
});

test('a vowel still reads as open when the volume is almost silent', () => {
  assert.ok(MouthGeometry.for('A', 0).height > 0);
});

test('an opening outside 0..1 is clamped', () => {
  assert.deepEqual(MouthGeometry.for('O', 7), MouthGeometry.for('O', 1));
});

test('every spoken viseme has a distinct shape', () => {
  const shapes = VISEMES.filter((viseme) => viseme !== 'X').map((viseme) => JSON.stringify(MouthGeometry.for(viseme, 0.8)));
  assert.equal(new Set(shapes).size, shapes.length);
});

test('O and U are narrow and round; I is wide and shows teeth', () => {
  const o = MouthGeometry.for('O', 1);
  const u = MouthGeometry.for('U', 1);
  const i = MouthGeometry.for('I', 1);
  assert.ok(u.width < o.width && o.width < i.width);
  assert.ok(o.height > i.height);
  assert.equal(i.teeth, true);
});
