import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MouthGeometry } from '../../../src/dominio/personagem/MouthGeometry.ts';
import type { Visema } from '../../../src/dominio/fala/Visemas.ts';
import { EstadoDoPersonagem } from '../../../src/dominio/personagem/EstadoDoPersonagem.ts';
import { FaceGeometry } from '../../../src/dominio/personagem/FaceGeometry.ts';

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

test('I is wide and flat with teeth; E is medium open; C is small and slightly open', () => {
  const [e, i, c] = (['E', 'I', 'C'] as const).map((viseme) => MouthGeometry.for(viseme, 0.85));
  assert.equal(i.outline, 'wide');
  assert.ok(i.width > e.width && i.height < e.height && i.teeth);
  assert.equal(e.outline, 'oval');
  assert.ok(c.width < e.width && c.height < e.height && c.height > 0);
});

test('F tucks the lower lip under the top teeth, and only F does', () => {
  const f = MouthGeometry.for('F', 0.85);
  assert.equal(f.lipTuck, true);
  assert.equal(f.teeth, true);
  const others = VISEMES.filter((viseme) => viseme !== 'F').map((viseme) => MouthGeometry.for(viseme, 0.85).lipTuck);
  assert.ok(others.every((tuck) => !tuck));
});

test('the tongue only shows when the mouth is open enough', () => {
  assert.equal(MouthGeometry.for('A', 1).tongue, true);
  assert.equal(MouthGeometry.for('O', 0).tongue, true);
  assert.equal(MouthGeometry.for('E', 1).tongue, false);
});

test('silent mouth: a closed one bends with the curve; an open one gets upper and lower edges', () => {
  const neutral = MouthGeometry.silent({ width: 26, curve: 5, opening: 0, tilt: 0, wave: 0 });
  assert.equal(neutral.open, false);
  assert.equal(neutral.upper, 8);
  const smile = MouthGeometry.silent({ width: 34, curve: 12, opening: 9, tilt: 0, wave: 0 });
  assert.equal(smile.open, true);
  assert.ok(Math.abs(smile.upper - (12 * 0.3 - 9 * 0.35)) < 1e-9);
  assert.ok(Math.abs(smile.lower - (12 * 1.2 + 9 * 1.4)) < 1e-9);
  const frown = MouthGeometry.silent({ width: 30, curve: -10, opening: 22, tilt: 0, wave: 0 });
  assert.ok(Math.abs(frown.upper - (-10 * 1.2 - 22 * 0.35)) < 1e-9);
  assert.ok(frown.lower > frown.upper);
});

test('silent mouth: teeth from width 24, tongue from opening 14', () => {
  assert.equal(MouthGeometry.silent({ width: 24, curve: 0, opening: 5, tilt: 0, wave: 0 }).teeth, true);
  assert.equal(MouthGeometry.silent({ width: 18, curve: 0, opening: 18, tilt: 0, wave: 0 }).teeth, false);
  assert.equal(MouthGeometry.silent({ width: 30, curve: 0, opening: 14, tilt: 0, wave: 0 }).tongue, true);
  assert.equal(MouthGeometry.silent({ width: 30, curve: 0, opening: 13, tilt: 0, wave: 0 }).tongue, false);
});

const state = (falando: boolean, visema: Visema) => EstadoDoPersonagem.de({
  pose: 'neutra', expressao: 'feliz', olhar: 'camera', falando, visema, abertura: 1, piscada: 0, corpo: { y: 0, rotacao: 0, escala: 1 },
});

test('the viseme replaces the expression mouth only while speaking and not at rest', () => {
  assert.equal(MouthGeometry.forState(state(true, 'A')).speaking, true);
  assert.equal(MouthGeometry.forState(state(true, 'X')).speaking, false);
  assert.equal(MouthGeometry.forState(state(false, 'A')).speaking, false);
  const silent = MouthGeometry.forState(state(false, 'A'));
  assert.deepEqual(silent.speaking ? undefined : silent.shape, MouthGeometry.silent(FaceGeometry.for('feliz').mouth));
});
